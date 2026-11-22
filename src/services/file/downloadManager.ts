import type {OutputFile} from '../../features/pdf/engine/types';
import type {PdfOutputArtifact} from '../../types/pdf';
import {sanitizeFileName} from './fileValidation';

const trackedObjectUrls = new Set<string>();
const MAX_OUTPUT_FILENAME_LENGTH = 180;

export function buildOutputFileName(
  originalName: string,
  suffix = 'processed',
  targetExtension = '.pdf'
): string {
  const sanitized = sanitizeFileName(originalName);
  const lastDot = sanitized.lastIndexOf('.');
  const rawBase = lastDot > 0 ? sanitized.slice(0, lastDot) : sanitized;
  const cleanSuffix =
    suffix === '' ? '' : suffix.replace(/[^a-zA-Z0-9_-]/g, '') || 'processed';
  const normalizedExt = targetExtension.startsWith('.')
    ? targetExtension.toLowerCase()
    : `.${targetExtension.toLowerCase()}`;

  const reservedLength =
    (cleanSuffix ? cleanSuffix.length + 1 : 0) + normalizedExt.length;
  const maxBaseLength = Math.max(8, MAX_OUTPUT_FILENAME_LENGTH - reservedLength);
  const trimmedBase =
    (rawBase || 'document').slice(0, maxBaseLength).trim() || 'document';

  return cleanSuffix
    ? `${trimmedBase}-${cleanSuffix}${normalizedExt}`
    : `${trimmedBase}${normalizedExt}`;
}

export function createTrackedObjectUrl(blob: Blob): string {
  const objectUrl = URL.createObjectURL(blob);
  trackedObjectUrls.add(objectUrl);
  return objectUrl;
}

export function revokeTrackedObjectUrl(objectUrl: string): void {
  if (trackedObjectUrls.has(objectUrl)) {
    trackedObjectUrls.delete(objectUrl);
  }
  URL.revokeObjectURL(objectUrl);
}

export function revokeAllTrackedObjectUrls(): number {
  const count = trackedObjectUrls.size;
  for (const url of trackedObjectUrls) {
    URL.revokeObjectURL(url);
  }
  trackedObjectUrls.clear();
  return count;
}

export function getTrackedObjectUrlCount(): number {
  return trackedObjectUrls.size;
}

export function triggerOutputDownload(
  output: OutputFile,
  revokeDelayMs = 1000
): string {
  const safeName = sanitizeFileName(output.name);
  // Copy into a standard ArrayBuffer-backed Uint8Array so BlobPart typing is exact
  const bytesCopy = new Uint8Array(output.bytes.byteLength);
  bytesCopy.set(output.bytes);
  const blob = new Blob([bytesCopy], {
    type: output.mimeType || 'application/octet-stream',
  });
  const objectUrl = createTrackedObjectUrl(blob);

  try {
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = safeName;
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } finally {
    if (revokeDelayMs <= 0) {
      revokeTrackedObjectUrl(objectUrl);
    } else if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        revokeTrackedObjectUrl(objectUrl);
      }, revokeDelayMs);
    } else {
      revokeTrackedObjectUrl(objectUrl);
    }
  }

  return objectUrl;
}

export function triggerBlobDownload(artifact: PdfOutputArtifact): void {
  const safeName = sanitizeFileName(artifact.fileName);
  const objectUrl = createTrackedObjectUrl(artifact.blob);

  try {
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = safeName;
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } finally {
    window.setTimeout(() => {
      revokeTrackedObjectUrl(objectUrl);
    }, 1000);
  }
}
