import type {
  FileValidationError,
  FileValidationResult,
  FileValidationRule,
  ManagedFileItem,
  SafeFileMetadata,
} from '../../types/file';

const CONTROL_CHARS_REGEX = /[\u0000-\u001F\u007F]/g;
const PATH_SEPARATORS_REGEX = /[/\\]+/g;
const UNSAFE_CHARS_REGEX = /[<>:"|?*]/g;

/**
 * Strips path traversal segments, control characters, and unsafe symbols
 * so client-supplied filenames are never trusted verbatim in UI or future file pipelines.
 */
export function sanitizeFileName(rawName: string): string {
  const baseName = rawName
    .replace(CONTROL_CHARS_REGEX, '')
    .split(PATH_SEPARATORS_REGEX)
    .pop() ?? '';

  const cleaned = baseName.replace(UNSAFE_CHARS_REGEX, '_').trim();
  if (!cleaned || cleaned === '.' || cleaned === '..') {
    return 'untitled-document';
  }

  return cleaned.slice(0, 180);
}

export function extractFileExtension(fileName: string): string {
  const sanitized = sanitizeFileName(fileName);
  const lastDotIndex = sanitized.lastIndexOf('.');
  if (lastDotIndex <= 0 || lastDotIndex === sanitized.length - 1) {
    return '';
  }
  return sanitized.slice(lastDotIndex).toLowerCase();
}

export type MagicByteFileKind = 'pdf' | 'jpeg' | 'png' | 'unknown';

const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46, 0x2d] as const; // %PDF-
const JPEG_MAGIC = [0xff, 0xd8, 0xff] as const;
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;

function matchesBytesAt(
  bytes: Uint8Array,
  signature: readonly number[],
  offset = 0
): boolean {
  if (bytes.length < offset + signature.length) {
    return false;
  }
  for (let i = 0; i < signature.length; i += 1) {
    if (bytes[offset + i] !== signature[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Inspects file header bytes rather than trusting extension or MIME type.
 * For PDF, requires at least 8 bytes (%PDF-x.y header) so truncated headers fail.
 */
export function detectMagicByteKind(bytes: Uint8Array): MagicByteFileKind {
  if (bytes.length >= 8 && matchesBytesAt(bytes, PDF_MAGIC, 0)) {
    return 'pdf';
  }
  if (matchesBytesAt(bytes, JPEG_MAGIC, 0)) {
    return 'jpeg';
  }
  if (matchesBytesAt(bytes, PNG_MAGIC, 0)) {
    return 'png';
  }
  return 'unknown';
}

export function isPdfSignatureValid(bytes: Uint8Array): boolean {
  return detectMagicByteKind(bytes) === 'pdf';
}

/**
 * Reads only the leading 16 bytes lazily so whole files are not loaded at selection time.
 */
export async function sniffFileSignature(
  file: File
): Promise<MagicByteFileKind> {
  if (file.size === 0) {
    return 'unknown';
  }
  const headerSlice = file.slice(0, 16);
  const buffer = await headerSlice.arrayBuffer();
  return detectMagicByteKind(new Uint8Array(buffer));
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '0 B';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const units = ['KB', 'MB', 'GB'];
  let size = bytes / 1024;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 ? 1 : 2)} ${units[unitIndex]}`;
}

export function buildSafeFileMetadata(file: File): SafeFileMetadata {
  const sanitizedName = sanitizeFileName(file.name);
  const extension = extractFileExtension(sanitizedName);
  const uniqueSuffix =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

  return {
    id: `${file.lastModified}-${file.size}-${uniqueSuffix}`,
    sanitizedName,
    extension,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
    formattedSize: formatBytes(file.size),
    lastModified: file.lastModified,
  };
}

export function validateSelectedFiles(
  incomingFiles: FileList | File[],
  rules: FileValidationRule,
  existingFiles: ManagedFileItem[] = []
): FileValidationResult {
  const filesArray = Array.from(incomingFiles);
  const errors: FileValidationError[] = [];
  const acceptedFiles: ManagedFileItem[] = [];

  const normalizedAllowedExtensions = rules.allowedExtensions.map((ext) =>
    ext.toLowerCase().startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`
  );
  const normalizedAllowedMimeTypes = rules.allowedMimeTypes.map((mime) =>
    mime.toLowerCase()
  );

  let projectedCount = existingFiles.length;

  for (const file of filesArray) {
    const metadata = buildSafeFileMetadata(file);

    if (!rules.allowMultiple && (projectedCount >= 1 || acceptedFiles.length >= 1)) {
      errors.push({
        code: 'TOO_MANY_FILES',
        fileName: metadata.sanitizedName,
        message: `"${metadata.sanitizedName}" was skipped because this tool accepts a single file at a time.`,
      });
      continue;
    }

    if (projectedCount >= rules.maxFilesCount) {
      errors.push({
        code: 'TOO_MANY_FILES',
        fileName: metadata.sanitizedName,
        message: `"${metadata.sanitizedName}" exceeds the maximum queue limit of ${rules.maxFilesCount} files.`,
      });
      continue;
    }

    if (!metadata.extension || !normalizedAllowedExtensions.includes(metadata.extension)) {
      errors.push({
        code: 'INVALID_EXTENSION',
        fileName: metadata.sanitizedName,
        message: `"${metadata.sanitizedName}" has an unsupported file extension. Allowed: ${normalizedAllowedExtensions.join(', ')}.`,
      });
      continue;
    }

    // Some browsers omit MIME type on certain office extensions; enforce strict MIME match when provided.
    const rawMime = file.type.trim().toLowerCase();
    if (
      rawMime !== '' &&
      normalizedAllowedMimeTypes.length > 0 &&
      !normalizedAllowedMimeTypes.includes(rawMime)
    ) {
      errors.push({
        code: 'INVALID_MIME_TYPE',
        fileName: metadata.sanitizedName,
        message: `"${metadata.sanitizedName}" reported MIME type "${rawMime}", which does not match accepted formats.`,
      });
      continue;
    }

    if (!rules.allowEmptyFile && file.size === 0) {
      errors.push({
        code: 'EMPTY_FILE',
        fileName: metadata.sanitizedName,
        message: `"${metadata.sanitizedName}" is empty (0 bytes) and cannot be processed.`,
      });
      continue;
    }

    if (file.size > rules.maxFileSizeBytes) {
      errors.push({
        code: 'FILE_TOO_LARGE',
        fileName: metadata.sanitizedName,
        message: `"${metadata.sanitizedName}" (${metadata.formattedSize}) exceeds the ${formatBytes(rules.maxFileSizeBytes)} limit per file.`,
      });
      continue;
    }

    const isDuplicate =
      existingFiles.some(
        (existing) =>
          existing.metadata.sanitizedName === metadata.sanitizedName &&
          existing.metadata.sizeBytes === metadata.sizeBytes
      ) ||
      acceptedFiles.some(
        (accepted) =>
          accepted.metadata.sanitizedName === metadata.sanitizedName &&
          accepted.metadata.sizeBytes === metadata.sizeBytes
      );

    if (isDuplicate) {
      errors.push({
        code: 'DUPLICATE_FILE',
        fileName: metadata.sanitizedName,
        message: `"${metadata.sanitizedName}" is already in the file queue.`,
      });
      continue;
    }

    acceptedFiles.push({
      id: metadata.id,
      file,
      metadata,
      status: 'ready',
    });
    projectedCount += 1;
  }

  return {
    valid: errors.length === 0,
    errors,
    acceptedFiles,
  };
}
