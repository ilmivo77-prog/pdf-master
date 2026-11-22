import {PDFArray, PDFDocument, PDFName} from 'pdf-lib';
import {PROCESSING_LIMITS} from '../../../../config/processingLimits';
import {isPdfSignatureValid} from '../../../../services/file/fileValidation';
import {createProcessingError, mapPdfLibError} from '../errorTaxonomy';
import type {PdfEngineInputFile} from '../types';

export function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) {
    throw createProcessingError('CANCELLED', 'Aborted via AbortSignal.');
  }
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
      `File "${file.name}" is password-protected.`
    );
  }

  return doc;
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
