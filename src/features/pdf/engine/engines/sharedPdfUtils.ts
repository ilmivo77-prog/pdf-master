import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFName,
  PDFNumber,
  PDFRef,
  PDFStream,
} from 'pdf-lib';
import {PROCESSING_LIMITS} from '../../../../config/processingLimits';
import {findPdfHeaderOffset} from '../../../../services/file/fileValidation';
import {createProcessingError, mapPdfLibError} from '../errorTaxonomy';
import type {PdfEngineInputFile} from '../types';

const STARTXREF_ASCII = [
  0x73, 0x74, 0x61, 0x72, 0x74, 0x78, 0x72, 0x65, 0x66,
] as const; // "startxref"
const EOF_ASCII = [0x25, 0x25, 0x45, 0x4f, 0x46] as const; // "%%EOF"

export interface PdfIntegrityResult {
  pageCount: number;
  warnings: string[];
}

export interface LoadedPdfResult {
  doc: PDFDocument;
  pageCount: number;
  warnings: string[];
}

export interface PreparedPdfBytesResult {
  pdfBytes: Uint8Array;
  warnings: string[];
}

export function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) {
    throw createProcessingError('CANCELLED', 'Aborted via AbortSignal.');
  }
}

function isPdfWhitespaceByte(byte: number): boolean {
  return (
    byte === 0x20 ||
    byte === 0x09 ||
    byte === 0x0a ||
    byte === 0x0d ||
    byte === 0x0c ||
    byte === 0x00
  );
}

/**
 * Zero-allocation backward typed-array search for an ASCII byte pattern.
 */
function lastIndexOfAsciiPattern(
  bytes: Uint8Array,
  pattern: readonly number[],
  endExclusive = bytes.byteLength,
  minStart = 0
): number {
  const patLen = pattern.length;
  if (patLen === 0 || endExclusive - minStart < patLen) {
    return -1;
  }

  const lastIdx = patLen - 1;
  const lastByte = pattern[lastIdx];
  const firstStart = Math.max(0, minStart);
  const maxStart = Math.min(bytes.byteLength - patLen, endExclusive - patLen);

  for (let i = maxStart; i >= firstStart; i -= 1) {
    if (bytes[i + lastIdx] !== lastByte) {
      continue;
    }
    let matched = true;
    for (let j = 0; j < lastIdx; j += 1) {
      if (bytes[i + j] !== pattern[j]) {
        matched = false;
        break;
      }
    }
    if (matched) {
      return i;
    }
  }

  return -1;
}

/**
 * Validates and normalizes leading bytes before "%PDF-" (accepted within first 1024 bytes).
 */
export function preparePdfBytes(
  bytes: Uint8Array,
  fileLabel = 'document'
): PreparedPdfBytesResult {
  const headerOffset = findPdfHeaderOffset(bytes);
  if (headerOffset === -1) {
    throw createProcessingError(
      'NOT_A_PDF',
      `[reason:header] File "${fileLabel}" has no %PDF-x.y header within the first 1024 bytes.`
    );
  }

  if (headerOffset > 0) {
    return {
      pdfBytes: bytes.subarray(headerOffset),
      warnings: [
        `Skipped ${headerOffset} leading byte(s) before the %PDF- header in "${fileLabel}".`,
      ],
    };
  }

  return {
    pdfBytes: bytes,
    warnings: [],
  };
}

/**
 * Whole-buffer typed-array tail integrity check:
 * - Searches backwards through the entire buffer for the LAST occurrence of "startxref".
 * - Requires whitespace + numeric xref offset digits immediately following "startxref".
 * - Requires "%%EOF" anywhere after that numeric offset (allowing arbitrary trailing bytes after %%EOF).
 */
export function checkPdfTailHeuristic(
  bytes: Uint8Array,
  fileLabel = 'document'
): void {
  if (bytes.byteLength === 0) {
    throw createProcessingError(
      'INVALID_FILE',
      `[reason:tail] File "${fileLabel}" is empty.`
    );
  }

  const startxrefPos = lastIndexOfAsciiPattern(bytes, STARTXREF_ASCII);
  if (startxrefPos === -1) {
    throw createProcessingError(
      'CORRUPT_PDF',
      `[reason:tail] Tail check failed for "${fileLabel}": missing startxref marker.`
    );
  }

  let cursor = startxrefPos + STARTXREF_ASCII.length;
  while (cursor < bytes.byteLength && isPdfWhitespaceByte(bytes[cursor])) {
    cursor += 1;
  }

  let digitCount = 0;
  while (
    cursor < bytes.byteLength &&
    bytes[cursor] >= 0x30 &&
    bytes[cursor] <= 0x39
  ) {
    digitCount += 1;
    cursor += 1;
  }

  if (digitCount === 0) {
    throw createProcessingError(
      'CORRUPT_PDF',
      `[reason:tail] Tail check failed for "${fileLabel}": missing numeric offset after final startxref.`
    );
  }

  const eofPos = lastIndexOfAsciiPattern(
    bytes,
    EOF_ASCII,
    bytes.byteLength,
    cursor
  );
  if (eofPos === -1) {
    throw createProcessingError(
      'CORRUPT_PDF',
      `[reason:tail] Tail check failed for "${fileLabel}": missing %%EOF after final startxref.`
    );
  }
}

function verifyPageTreeIntegrity(
  doc: PDFDocument,
  signal: AbortSignal,
  fileLabel: string
): PdfIntegrityResult {
  const catalogPagesRef = doc.catalog.get(PDFName.of('Pages'));
  const rootPages =
    catalogPagesRef instanceof PDFRef
      ? doc.context.lookup(catalogPagesRef)
      : catalogPagesRef;

  if (!(rootPages instanceof PDFDict)) {
    throw createProcessingError(
      'CORRUPT_PDF',
      `[reason:page-tree] Integrity check failed in "${fileLabel}": root /Pages dictionary is missing or invalid.`
    );
  }

  const visitedNodes = new Set<PDFDict>();
  const warnings: string[] = [];
  let visitedCount = 0;
  const resourcesKey = PDFName.of('Resources');

  function countAndVerifyNode(node: PDFDict): number {
    if (visitedNodes.has(node)) {
      throw createProcessingError(
        'CORRUPT_PDF',
        `[reason:page-tree] Integrity check failed in "${fileLabel}": cycle detected in /Pages tree.`
      );
    }
    visitedNodes.add(node);

    visitedCount += 1;
    if (visitedCount % 50 === 0) {
      throwIfAborted(signal);
    }

    const rawNodeResources = node.get(resourcesKey);
    if (rawNodeResources instanceof PDFRef) {
      const resolvedNodeResources = doc.context.lookup(rawNodeResources);
      if (!(resolvedNodeResources instanceof PDFDict)) {
        throw createProcessingError(
          'CORRUPT_PDF',
          `[reason:resources] Integrity check failed in "${fileLabel}": /Pages /Resources reference does not resolve to a dictionary.`
        );
      }
    }

    const typeObj = node.lookup(PDFName.of('Type'));
    const kidsRaw = node.get(PDFName.of('Kids'));
    const isPagesNode =
      kidsRaw !== undefined || typeObj === PDFName.of('Pages');

    if (!isPagesNode) {
      return 1;
    }

    const kidsResolved =
      kidsRaw instanceof PDFRef ? doc.context.lookup(kidsRaw) : kidsRaw;
    if (!(kidsResolved instanceof PDFArray)) {
      throw createProcessingError(
        'CORRUPT_PDF',
        `[reason:page-tree] Integrity check failed in "${fileLabel}": /Pages node is missing a valid /Kids array.`
      );
    }

    let subtreeLeafCount = 0;
    const kidsSize = kidsResolved.size();
    for (let i = 0; i < kidsSize; i += 1) {
      const kidEntry = kidsResolved.get(i);
      const kidResolved =
        kidEntry instanceof PDFRef ? doc.context.lookup(kidEntry) : kidEntry;
      if (!(kidResolved instanceof PDFDict)) {
        throw createProcessingError(
          'CORRUPT_PDF',
          `[reason:page-tree] Integrity check failed in "${fileLabel}": /Pages /Kids[${i}] reference is dangling or not a dictionary.`
        );
      }
      subtreeLeafCount += countAndVerifyNode(kidResolved);
    }

    const declaredCountObj = node.lookup(PDFName.of('Count'));
    if (declaredCountObj instanceof PDFNumber) {
      const declaredCount = declaredCountObj.asNumber();
      if (declaredCount > 0 && subtreeLeafCount === 0) {
        throw createProcessingError(
          'CORRUPT_PDF',
          `[reason:page-tree] Integrity check failed in "${fileLabel}": /Pages /Count declared ${declaredCount} page(s) but 0 reachable pages were found.`
        );
      }
      if (node === rootPages && declaredCount !== subtreeLeafCount) {
        warnings.push(
          `Document /Pages /Count reported ${declaredCount} page(s), while ${subtreeLeafCount} reachable page(s) were found; using ${subtreeLeafCount}.`
        );
      }
    }

    return subtreeLeafCount;
  }

  const pageCount = countAndVerifyNode(rootPages);
  return {pageCount, warnings};
}

/**
 * O(pages) structural integrity verification using pdf-lib context lookup:
 * - Walks /Pages tree /Kids references (cycle-guarded) and counts actual reachable pages.
 * - Accepts /Count mismatches with a non-blocking warning unless 0 pages are reachable when /Count > 0.
 * - Blank pages (no /Contents entry) are legal and accepted.
 * - When /Contents is present, resolves single stream ref or array of stream refs
 *   and requires every entry to exist and be a PDFStream.
 * - When /Resources is present as a PDFRef, requires it to resolve to a PDFDict.
 * Checkpoints AbortSignal every 50 pages so large PDFs remain cancellable.
 */
export function verifyPdfPageIntegrity(
  doc: PDFDocument,
  signal: AbortSignal,
  fileLabel = 'document'
): PdfIntegrityResult {
  const {pageCount: verifiedTreePageCount, warnings} = verifyPageTreeIntegrity(
    doc,
    signal,
    fileLabel
  );
  const pages = doc.getPages();
  if (pages.length !== verifiedTreePageCount) {
    throw createProcessingError(
      'CORRUPT_PDF',
      `[reason:page-tree] Integrity check failed in "${fileLabel}": resolved page count (${pages.length}) differs from reachable page tree (${verifiedTreePageCount}).`
    );
  }

  const contentsKey = PDFName.of('Contents');
  const resourcesKey = PDFName.of('Resources');

  for (let i = 0; i < pages.length; i += 1) {
    if (i % 50 === 0) {
      throwIfAborted(signal);
    }

    const page = pages[i];
    const rawContents = page.node.get(contentsKey);

    if (rawContents !== undefined) {
      const resolvedContents =
        rawContents instanceof PDFRef
          ? doc.context.lookup(rawContents)
          : rawContents;

      if (resolvedContents instanceof PDFStream) {
        // Valid single content stream.
      } else if (resolvedContents instanceof PDFArray) {
        const count = resolvedContents.size();
        for (let j = 0; j < count; j += 1) {
          const item = resolvedContents.get(j);
          const resolvedItem =
            item instanceof PDFRef ? doc.context.lookup(item) : item;
          if (!(resolvedItem instanceof PDFStream)) {
            throw createProcessingError(
              'CORRUPT_PDF',
              `[reason:contents] Integrity check failed in "${fileLabel}": page ${i + 1} /Contents[${j}] is missing or not a stream.`
            );
          }
        }
      } else {
        throw createProcessingError(
          'CORRUPT_PDF',
          `[reason:contents] Integrity check failed in "${fileLabel}": page ${i + 1} /Contents is dangling or invalid.`
        );
      }
    }

    const rawResources = page.node.get(resourcesKey);
    if (rawResources instanceof PDFRef) {
      const resolvedResources = doc.context.lookup(rawResources);
      if (!(resolvedResources instanceof PDFDict)) {
        throw createProcessingError(
          'CORRUPT_PDF',
          `[reason:resources] Integrity check failed in "${fileLabel}": page ${i + 1} /Resources reference does not resolve to a dictionary.`
        );
      }
    }
  }

  throwIfAborted(signal);
  return {pageCount: verifiedTreePageCount, warnings};
}

export async function loadUnencryptedPdf(
  file: PdfEngineInputFile,
  signal: AbortSignal
): Promise<LoadedPdfResult> {
  throwIfAborted(signal);

  const rawBytes = new Uint8Array(file.bytes);
  if (rawBytes.byteLength === 0) {
    throw createProcessingError('INVALID_FILE', `File "${file.name}" is empty.`);
  }

  if (rawBytes.byteLength > PROCESSING_LIMITS.maxFileSizeBytes) {
    throw createProcessingError(
      'FILE_TOO_LARGE',
      `File "${file.name}" (${rawBytes.byteLength} bytes) exceeds limit (${PROCESSING_LIMITS.maxFileSizeBytes}).`
    );
  }

  const {pdfBytes, warnings: headerWarnings} = preparePdfBytes(
    rawBytes,
    file.name
  );

  checkPdfTailHeuristic(pdfBytes, file.name);

  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(pdfBytes, {
      ignoreEncryption: false,
      updateMetadata: false,
    });
  } catch (err) {
    throw mapPdfLibError(err);
  }

  if (doc.isEncrypted) {
    throw createProcessingError(
      'ENCRYPTED_PDF',
      `File "${file.name}" is encrypted or carries permission restrictions.`
    );
  }

  let integrity: PdfIntegrityResult;
  try {
    integrity = verifyPdfPageIntegrity(doc, signal, file.name);
  } catch (err) {
    throw mapPdfLibError(err);
  }

  return {
    doc,
    pageCount: integrity.pageCount,
    warnings: [...headerWarnings, ...integrity.warnings],
  };
}

/**
 * Reloads saved output PDF bytes and verifies tail markers, expected page count,
 * and /Contents + /Resources structural integrity before returning bytes to the caller.
 */
export async function verifySavedPdfOutput(
  bytes: Uint8Array,
  expectedPageCount: number,
  operationLabel: string,
  signal: AbortSignal
): Promise<void> {
  throwIfAborted(signal);
  checkPdfTailHeuristic(bytes, operationLabel);

  let reloadedDoc: PDFDocument | null = null;
  try {
    reloadedDoc = await PDFDocument.load(bytes, {
      ignoreEncryption: false,
      updateMetadata: false,
    });
    const {pageCount: actualReachableCount} = verifyPdfPageIntegrity(
      reloadedDoc,
      signal,
      operationLabel
    );
    if (actualReachableCount !== expectedPageCount) {
      throw createProcessingError(
        'CORRUPT_PDF',
        `[reason:page-tree] ${operationLabel} page count assertion failed: expected ${expectedPageCount}, got ${actualReachableCount}.`
      );
    }
  } catch (err) {
    throw mapPdfLibError(err);
  } finally {
    reloadedDoc = null;
  }
}

/**
 * Cheaply inspects catalog and selected pages for interactive features
 * (form fields, bookmarks/outlines, tagged structure, or page annotations)
 * that pdf-lib page copying may not preserve completely.
 */
export function detectInteractiveFeatures(
  doc: PDFDocument,
  zeroBasedPageIndices?: readonly number[]
): boolean {
  try {
    const catalog = doc.catalog;
    if (
      catalog.has(PDFName.of('AcroForm')) ||
      catalog.has(PDFName.of('Outlines')) ||
      catalog.has(PDFName.of('StructTreeRoot'))
    ) {
      return true;
    }

    const pages = doc.getPages();
    const indicesToCheck =
      zeroBasedPageIndices ?? pages.map((_, idx) => idx);

    for (const idx of indicesToCheck) {
      const page = pages[idx];
      if (!page) {
        continue;
      }
      const annots = page.node.lookupMaybe(PDFName.of('Annots'), PDFArray);
      if (annots && annots.size() > 0) {
        return true;
      }
    }
  } catch {
    return false;
  }

  return false;
}

/**
 * Copies pages from `sourceDoc` into `targetDoc` in small batches so
 * cancellation via AbortSignal and progress updates work at page granularity.
 */
export async function copyPagesInChunks(
  targetDoc: PDFDocument,
  sourceDoc: PDFDocument,
  zeroBasedIndices: readonly number[],
  signal: AbortSignal,
  onBatchCopied?: (copiedSoFar: number, totalToCopy: number) => void,
  chunkSize = 15
): Promise<void> {
  const total = zeroBasedIndices.length;
  for (let offset = 0; offset < total; offset += chunkSize) {
    throwIfAborted(signal);
    const slice = zeroBasedIndices.slice(offset, offset + chunkSize);
    const copied = await targetDoc.copyPages(sourceDoc, slice);
    for (const page of copied) {
      targetDoc.addPage(page);
    }
    throwIfAborted(signal);
    onBatchCopied?.(Math.min(total, offset + slice.length), total);
  }
}

export function assertExpectedPageCount(
  doc: PDFDocument,
  expectedCount: number,
  operationLabel: string
): void {
  let actualCount: number;
  try {
    actualCount = doc.getPageCount();
  } catch (err) {
    throw mapPdfLibError(err);
  }

  if (actualCount !== expectedCount) {
    throw createProcessingError(
      'CORRUPT_PDF',
      `[reason:page-tree] ${operationLabel} page count assertion failed: expected ${expectedCount}, got ${actualCount}.`
    );
  }
}
