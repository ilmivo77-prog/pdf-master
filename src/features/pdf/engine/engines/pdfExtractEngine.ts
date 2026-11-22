import {PDFDocument} from 'pdf-lib';
import {
  PROCESSING_LIMITS,
  validateJobLimits,
} from '../../../../config/processingLimits';
import {buildOutputFileName} from '../../../../services/file/downloadManager';
import {parsePageRanges} from '../../utils/pageRanges';
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
} from './sharedPdfUtils';

export const pdfExtractEngine: PdfEngine = {
  id: 'pdf-extract',
  supportedToolIds: ['extract-pages'],

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
        `Extract Pages expects 1 PDF file; received ${input.length}.`
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

    let srcDoc: PDFDocument | null = await loadUnencryptedPdf(file, ctx.signal);
    let sourcePageCount: number;
    try {
      sourcePageCount = srcDoc.getPageCount();
    } catch (err) {
      srcDoc = null;
      throw mapPdfLibError(err);
    }

    const parsed = parsePageRanges(rangesText, sourcePageCount);
    if (!parsed.ok) {
      srcDoc = null;
      throw createProcessingError(
        'INVALID_OPTIONS',
        `Invalid extract range (${parsed.error.code} at ${parsed.error.position}).`
      );
    }

    const orderedPages = parsed.value.orderedPages;
    const zeroBasedIndices = orderedPages.map((page) => page - 1);
    const interactiveFeaturesDetected = detectInteractiveFeatures(
      srcDoc,
      zeroBasedIndices
    );

    const outDoc = await PDFDocument.create();
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
            stageLabel: `Extracting page ${copied} of ${total}`,
          });
        }
      );
    } catch (err) {
      srcDoc = null;
      throw mapPdfLibError(err);
    }

    srcDoc = null;
    throwIfAborted(ctx.signal);
    assertExpectedPageCount(outDoc, orderedPages.length, 'Extract Pages');

    ctx.onProgress({
      mode: 'determinate',
      percent: 94,
      stageLabel: 'Saving extracted PDF',
    });

    let outBytes: Uint8Array;
    try {
      outBytes = await outDoc.save({useObjectStreams: true});
    } catch (err) {
      throw mapPdfLibError(err);
    }

    throwIfAborted(ctx.signal);

    ctx.onProgress({
      mode: 'determinate',
      percent: 100,
      stageLabel: 'Extraction complete',
    });

    const outputName = buildOutputFileName(file.name, 'extracted', '.pdf');

    return {
      outputs: [
        {
          name: outputName,
          mimeType: 'application/pdf',
          bytes: outBytes,
          size: outBytes.byteLength,
        },
      ],
      warnings: [],
      stats: {
        durationMs: Math.max(0, Date.now() - startedAt),
        inputFileCount: 1,
        inputTotalBytes: file.size,
        outputFileCount: 1,
        outputTotalBytes: outBytes.byteLength,
        pageCount: orderedPages.length,
        isEncrypted: false,
        interactiveFeaturesDetected,
      },
    };
  },
};
