import {PDFDocument} from 'pdf-lib';
import {
  PROCESSING_LIMITS,
  validateJobLimits,
} from '../../../../config/processingLimits';
import {buildOutputFileName} from '../../../../services/file/downloadManager';
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

export const pdfMergeEngine: PdfEngine = {
  id: 'pdf-merge',
  supportedToolIds: ['merge-pdf'],

  async run(
    input: PdfEngineInputFile[],
    _options: Record<string, unknown>,
    ctx: PdfEngineContext
  ): Promise<ProcessingResult> {
    const startedAt = Date.now();
    throwIfAborted(ctx.signal);

    if (input.length < 2) {
      throw createProcessingError(
        'INVALID_FILE',
        `Merge requires at least 2 PDF files; received ${input.length}.`
      );
    }

    const limitFailure = validateJobLimits(input, {
      maxFileSizeBytes: PROCESSING_LIMITS.maxFileSizeBytes,
      maxTotalSizeBytes: PROCESSING_LIMITS.maxTotalSizeBytes,
      maxFilesCount: PROCESSING_LIMITS.maxFilesCount,
    });
    if (limitFailure) {
      throw createProcessingError(limitFailure.code, limitFailure.developerDetail);
    }

    const totalInputBytes = input.reduce((sum, file) => sum + file.size, 0);
    let mergedDoc: PDFDocument | null = await PDFDocument.create();
    let expectedTotalPages = 0;
    let interactiveFeaturesDetected = false;

    ctx.onProgress({
      mode: 'determinate',
      percent: 5,
      stageLabel: 'Preparing PDF merge',
    });

    for (let fileIndex = 0; fileIndex < input.length; fileIndex += 1) {
      throwIfAborted(ctx.signal);
      const currentFile = input[fileIndex];

      let srcDoc: PDFDocument | null = await loadUnencryptedPdf(
        currentFile,
        ctx.signal
      );

      let pageCount: number;
      try {
        pageCount = srcDoc.getPageCount();
      } catch (err) {
        srcDoc = null;
        mergedDoc = null;
        throw mapPdfLibError(err);
      }

      if (!interactiveFeaturesDetected && detectInteractiveFeatures(srcDoc)) {
        interactiveFeaturesDetected = true;
      }

      const indices = Array.from({length: pageCount}, (_, idx) => idx);
      expectedTotalPages += pageCount;

      const fileBaseProgress = 5 + Math.round((fileIndex / input.length) * 80);
      const fileSpanProgress = Math.max(1, Math.round(80 / input.length));

      try {
        await copyPagesInChunks(
          mergedDoc,
          srcDoc,
          indices,
          ctx.signal,
          (copied, total) => {
            const fraction = total > 0 ? copied / total : 1;
            const percent = Math.min(
              88,
              fileBaseProgress + Math.round(fraction * fileSpanProgress)
            );
            ctx.onProgress({
              mode: 'determinate',
              percent,
              stageLabel: `Merging file ${fileIndex + 1} of ${input.length}`,
            });
          }
        );
      } catch (err) {
        srcDoc = null;
        mergedDoc = null;
        throw mapPdfLibError(err);
      }

      // Drop reference immediately so source document memory can be reclaimed between files
      srcDoc = null;
    }

    throwIfAborted(ctx.signal);
    assertExpectedPageCount(mergedDoc, expectedTotalPages, 'Merge PDF');

    ctx.onProgress({
      mode: 'determinate',
      percent: 92,
      stageLabel: 'Saving merged PDF',
    });

    let mergedBytes: Uint8Array;
    try {
      mergedBytes = await mergedDoc.save({useObjectStreams: true});
    } catch (err) {
      mergedDoc = null;
      throw mapPdfLibError(err);
    }

    mergedDoc = null;

    ctx.onProgress({
      mode: 'determinate',
      percent: 96,
      stageLabel: 'Verifying merged PDF',
    });

    await verifySavedPdfOutput(
      mergedBytes,
      expectedTotalPages,
      'Merge PDF output',
      ctx.signal
    );

    ctx.onProgress({
      mode: 'determinate',
      percent: 100,
      stageLabel: 'Merge complete',
    });

    const outputName = buildOutputFileName('merged', '', '.pdf');

    return {
      outputs: [
        {
          name: outputName,
          mimeType: 'application/pdf',
          bytes: mergedBytes,
          size: mergedBytes.byteLength,
        },
      ],
      warnings: [],
      stats: {
        durationMs: Math.max(0, Date.now() - startedAt),
        inputFileCount: input.length,
        inputTotalBytes: totalInputBytes,
        outputFileCount: 1,
        outputTotalBytes: mergedBytes.byteLength,
        pageCount: expectedTotalPages,
        isEncrypted: false,
        interactiveFeaturesDetected,
      },
    };
  },
};
