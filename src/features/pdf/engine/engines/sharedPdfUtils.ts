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
import {isPdfSignatureValid} from '../../../../services/file/fileValidation';
import {createProcessingError, mapPdfLibError} from '../errorTaxonomy';
import type {PdfEngineInputFile} from '../types';

const TAIL_EOF_WINDOW_BYTES = 1024;
const TAIL_STARTXREF_WINDOW_BYTES = 2048;

export function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) {
    throw createProcessingError('CANCELLED', 'Aborted via AbortSignal.');
  }
}

function decodeTailAsciiSlice(bytes: Uint8Array, windowBytes: number): string {
  const start = Math.max(0, bytes.byteLength - windowBytes);
  let out = '';
  for (let i = start; i < bytes.byteLength; i += 1) {
    out += String.fromCharCode(bytes[i]);
  }
  return out;
}

/**
 * Heuristic tail integrity check for PDF files:
 * - Requires "%%EOF" within the trailing ~1024 bytes (allowing trailing whitespace/garbage).
 * - Requires a "startxref" marker near the end before the final "%%EOF".
 * Throws CORRUPT_PDF if either structural trailer marker is missing or out of order.
 */
export function checkPdfTailHeuristic(
  bytes: Uint8Array,
  fileLabel = 'document'
): void {
  if (bytes.byteLength === 0) {
    throw createProcessingError('INVALID_FILE', `File "${fileLabel}" is empty.`);
  }

  const eofWindowStart = Math.max(0, bytes.byteLength - TAIL_EOF_WINDOW_BYTES);
  const eofTail = decodeTailAsciiSlice(bytes, TAIL_EOF_WINDOW_BYTES);
  const localEofIdx = eofTail.lastIndexOf('%%EOF');
  if (localEofIdx === -1) {
    throw createProcessingError(
      'CORRUPT_PDF',
      `Tail integrity heuristic failed for "${fileLabel}": missing %%EOF in final ${TAIL_EOF_WINDOW_BYTES} bytes.`
    );
  }

  const startxrefWindowStart = Math.max(
    0,
    bytes.byteLength - TAIL_STARTXREF_WINDOW_BYTES
  );
  const startxrefTail = decodeTailAsciiSlice(bytes, TAIL_STARTXREF_WINDOW_BYTES);
  const localStartxrefIdx = startxrefTail.lastIndexOf('startxref');
  if (localStartxrefIdx === -1) {
    throw createProcessingError(
      'CORRUPT_PDF',
      `Tail integrity heuristic failed for "${fileLabel}": missing startxref near end of file.`
    );
  }

  const globalEofPos = eofWindowStart + localEofIdx;
  const globalStartxrefPos = startxrefWindowStart + localStartxrefIdx;
  if (globalEofPos <= globalStartxrefPos) {
    throw createProcessingError(
      'CORRUPT_PDF',
      `Tail integrity heuristic failed for "${fileLabel}": startxref appears after %%EOF.`
    );
  }
}

function verifyPageTreeIntegrity(
  doc: PDFDocument,
  signal: AbortSignal,
  fileLabel: string
): number {
  const catalogPagesRef = doc.catalog.get(PDFName.of('Pages'));
  const rootPages =
    catalogPagesRef instanceof PDFRef
      ? doc.context.lookup(catalogPagesRef)
      : catalogPagesRef;

  if (!(rootPages instanceof PDFDict)) {
    throw createProcessingError(
      'CORRUPT_PDF',
      `Integrity check failed in "${fileLabel}": root /Pages dictionary is missing or invalid.`
    );
  }

  const visitedNodes = new Set<PDFDict>();
  let visitedCount = 0;

  function countAndVerifyNode(node: PDFDict): number {
    if (visitedNodes.has(node)) {
      throw createProcessingError(
        'CORRUPT_PDF',
        `Integrity check failed in "${fileLabel}": cycle detected in /Pages tree.`
      );
    }
    visitedNodes.add(node);

    visitedCount += 1;
    if (visitedCount % 50 === 0) {
      throwIfAborted(signal);
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
        `Integrity check failed in "${fileLabel}": /Pages node is missing a valid /Kids array.`
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
          `Integrity check failed in "${fileLabel}": /Pages /Kids[${i}] reference is missing or invalid.`
        );
      }
      subtreeLeafCount += countAndVerifyNode(kidResolved);
    }

    const declaredCountObj = node.lookup(PDFName.of('Count'));
    if (declaredCountObj !== undefined) {
      if (!(declaredCountObj instanceof PDFNumber)) {
        throw createProcessingError(
          'CORRUPT_PDF',
          `Integrity check failed in "${fileLabel}": /Pages node has an invalid /Count entry.`
        );
      }
      const declaredCount = declaredCountObj.asNumber();
      if (declaredCount !== subtreeLeafCount) {
        throw createProcessingError(
          'CORRUPT_PDF',
          `Integrity check failed in "${fileLabel}": /Pages /Count (${declaredCount}) does not match resolved pages (${subtreeLeafCount}).`
        );
      }
    }

    return subtreeLeafCount;
  }

  return countAndVerifyNode(rootPages);
}

/**
 * O(pages) structural integrity verification using pdf-lib context lookup:
 * - Verifies /Pages tree /Kids references and /Count consistency so pdf-lib's
 *   silent skipping of broken page refs cannot hide corrupt/missing pages.
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
): void {
  const verifiedTreePageCount = verifyPageTreeIntegrity(doc, signal, fileLabel);
  const pages = doc.getPages();
  if (pages.length !== verifiedTreePageCount) {
    throw createProcessingError(
      'CORRUPT_PDF',
      `Integrity check failed in "${fileLabel}": resolved page count (${pages.length}) differs from page tree (${verifiedTreePageCount}).`
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
              `Integrity check failed in "${fileLabel}": page ${i + 1} /Contents[${j}] is missing or not a stream.`
            );
          }
        }
      } else {
        throw createProcessingError(
          'CORRUPT_PDF',
          `Integrity check failed in "${fileLabel}": page ${i + 1} /Contents is missing or invalid.`
        );
      }
    }

    const rawResources = page.node.get(resourcesKey);
    if (rawResources instanceof PDFRef) {
      const resolvedResources = doc.context.lookup(rawResources);
      if (!(resolvedResources instanceof PDFDict)) {
        throw createProcessingError(
          'CORRUPT_PDF',
          `Integrity check failed in "${fileLabel}": page ${i + 1} /Resources reference does not resolve to a dictionary.`
        );
      }
    }
  }

  throwIfAborted(signal);
}

export async function loadUnencryptedPdf(
  file: PdfEngineInputFile,
  signal: AbortSignal
): Promise<PDFDocument> {
  throwIfAborted(signal);

  const bytes = new Uint8Array(file.bytes);
  if (bytes.byteLength === 0) {
    throw createProcessingError('INVALID_FILE', `File "${file.name}" is empty.`);
  }

  if (bytes.byteLength > PROCESSING_LIMITS.maxFileSizeBytes) {
    throw createProcessingError(
      'FILE_TOO_LARGE',
      `File "${file.name}" (${bytes.byteLength} bytes) exceeds limit (${PROCESSING_LIMITS.maxFileSizeBytes}).`
    );
  }

  if (!isPdfSignatureValid(bytes)) {
    throw createProcessingError(
      'NOT_A_PDF',
      `File "${file.name}" does not start with a valid %PDF-x.y header.`
    );
  }

  checkPdfTailHeuristic(bytes, file.name);

  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(bytes, {
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

  try {
    verifyPdfPageIntegrity(doc, signal, file.name);
  } catch (err) {
    throw mapPdfLibError(err);
  }

  return doc;
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
    assertExpectedPageCount(reloadedDoc, expectedPageCount, operationLabel);
    verifyPdfPageIntegrity(reloadedDoc, signal, operationLabel);
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
      `${operationLabel} page count assertion failed: expected ${expectedCount}, got ${actualCount}.`
    );
  }
}
