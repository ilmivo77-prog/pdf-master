import {PDFDocument} from 'pdf-lib';
import {
  PROCESSING_LIMITS,
  validateJobLimits,
} from '../../../../config/processingLimits';
import {buildOutputFileName} from '../../../../services/file/downloadManager';
import {invertPageSelection, parsePageRanges} from '../../utils/pageRanges';
import {createProcessingError, mapPdfLibError} from '../errorTaxonomy';
import type {
  PdfEngine,
  PdfEngineContext,
  PdfEngineInputFile,
  ProcessingResult,
} from '../types';
import {
  assertExpectedPageCount,
  copyPagesInChunks,
  detectInteractiveFeatures,
  loadUnencryptedPdf,
  throwIfAborted,
  verifySavedPdfOutput,
} from './sharedPdfUtils';

export const pdfRemoveEngine: PdfEngine = {
  id: 'pdf-remove',
  supportedToolIds: ['remove-pages'],

  async run(
    input: PdfEngineInputFile[],
    options: Record<string, unknown>,
    ctx: PdfEngineContext
  ): Promise<ProcessingResult> {
    const startedAt = Date.now();
    throwIfAborted(ctx.signal);

    if (input.length !== 1) {
      throw createProcessingError(
        input.length === 0 ? 'INVALID_FILE' : 'TOO_MANY_FILES',
        `Remove Pages expects 1 PDF file; received ${input.length}.`
      );
    }

    const limitFailure = validateJobLimits(input, {
      maxFileSizeBytes: PROCESSING_LIMITS.maxFileSizeBytes,
      maxTotalSizeBytes: PROCESSING_LIMITS.maxTotalSizeBytes,
      maxFilesCount: 1,
    });
    if (limitFailure) {
      throw createProcessingError(limitFailure.code, limitFailure.developerDetail);
    }

    const file = input[0];
    const rangesText =
      typeof options.rangesText === 'string' ? options.rangesText : '';

    ctx.onProgress({
      mode: 'determinate',
      percent: 8,
      stageLabel: 'Loading PDF document',
    });

    const loaded = await loadUnencryptedPdf(file, ctx.signal);
    let srcDoc: PDFDocument | null = loaded.doc;
    const sourcePageCount = loaded.pageCount;
    const warnings = [...loaded.warnings];

    const parsed = parsePageRanges(rangesText, sourcePageCount);
    if (!parsed.ok) {
      srcDoc = null;
      throw createProcessingError(
        'INVALID_OPTIONS',
        `Invalid remove range (${parsed.error.code} at ${parsed.error.position}).`
      );
    }

    const remainingPages = invertPageSelection(
      parsed.value.sortedPages,
      sourcePageCount
    );
    if (remainingPages.length === 0) {
      srcDoc = null;
      throw createProcessingError(
        'NO_PAGES_REMAINING',
        'Removing all pages would leave an empty PDF.'
      );
    }

    const zeroBasedIndices = remainingPages.map((page) => page - 1);
    const interactiveFeaturesDetected = detectInteractiveFeatures(
      srcDoc,
      zeroBasedIndices
    );

    let outDoc: PDFDocument | null = await PDFDocument.create();
    try {
      await copyPagesInChunks(
        outDoc,
        srcDoc,
        zeroBasedIndices,
        ctx.signal,
        (copied, total) => {
          const percent = 15 + Math.round((copied / Math.max(1, total)) * 75);
          ctx.onProgress({
            mode: 'determinate',
            percent,
            stageLabel: `Keeping page ${copied} of ${total}`,
          });
        }
      );
    } catch (err) {
      srcDoc = null;
      outDoc = null;
      throw mapPdfLibError(err);
    }

    srcDoc = null;
    throwIfAborted(ctx.signal);
    assertExpectedPageCount(outDoc, remainingPages.length, 'Remove Pages');

    ctx.onProgress({
      mode: 'determinate',
      percent: 94,
      stageLabel: 'Saving updated PDF',
    });

    let outBytes: Uint8Array;
    try {
      outBytes = await outDoc.save({useObjectStreams: true});
    } catch (err) {
      outDoc = null;
      throw mapPdfLibError(err);
    }

    outDoc = null;

    await verifySavedPdfOutput(
      outBytes,
      remainingPages.length,
      'Remove Pages output',
      ctx.signal
    );

    ctx.onProgress({
      mode: 'determinate',
      percent: 100,
      stageLabel: 'Pages removed',
    });

    const outputName = buildOutputFileName(file.name, 'trimmed', '.pdf');

    return {
      outputs: [
        {
          name: outputName,
          mimeType: 'application/pdf',
          bytes: outBytes,
          size: outBytes.byteLength,
        },
      ],
      warnings,
      stats: {
        durationMs: Math.max(0, Date.now() - startedAt),
        inputFileCount: 1,
        inputTotalBytes: file.size,
        outputFileCount: 1,
        outputTotalBytes: outBytes.byteLength,
        pageCount: remainingPages.length,
        isEncrypted: false,
        interactiveFeaturesDetected,
      },
    };
  },
};
