import {PDFDocument, degrees} from 'pdf-lib';
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

export type OrganizeRotationDelta = 0 | 90 | 180 | 270;

export interface OrganizePageOperation {
  sourcePageIndex: number;
  rotationDelta: OrganizeRotationDelta;
}

const VALID_ROTATION_DELTAS = new Set<number>([0, 90, 180, 270]);

function normalizeAngleDegrees(angle: number): number {
  const mod = angle % 360;
  return mod < 0 ? mod + 360 : mod;
}

export function validateOrganizeOperations(
  rawOperations: unknown,
  sourcePageCount: number,
  maxOperations = PROCESSING_LIMITS.maxOrganizePages
): OrganizePageOperation[] {
  if (!Array.isArray(rawOperations)) {
    throw createProcessingError(
      'INVALID_OPTIONS',
      'Organize PDF requires an operations array.'
    );
  }

  if (rawOperations.length === 0) {
    throw createProcessingError(
      'NO_PAGES_REMAINING',
      'Organize PDF received an empty page list; at least one page must remain.'
    );
  }

  if (rawOperations.length > maxOperations) {
    throw createProcessingError(
      'INVALID_OPTIONS',
      `Organize PDF page count (${rawOperations.length}) exceeds cap (${maxOperations}).`
    );
  }

  const seenIndices = new Set<number>();
  const validated: OrganizePageOperation[] = [];

  for (let i = 0; i < rawOperations.length; i += 1) {
    const entry = rawOperations[i];
    if (typeof entry !== 'object' || entry === null) {
      throw createProcessingError(
        'INVALID_OPTIONS',
        `Operation at index ${i} must be an object.`
      );
    }

    const candidate = entry as {
      sourcePageIndex?: unknown;
      rotationDelta?: unknown;
    };

    const pageIndex = candidate.sourcePageIndex;
    if (
      typeof pageIndex !== 'number' ||
      !Number.isInteger(pageIndex) ||
      pageIndex < 0 ||
      pageIndex >= sourcePageCount
    ) {
      throw createProcessingError(
        'INVALID_OPTIONS',
        `Invalid sourcePageIndex (${String(pageIndex)}) for ${sourcePageCount}-page document.`
      );
    }

    if (seenIndices.has(pageIndex)) {
      throw createProcessingError(
        'INVALID_OPTIONS',
        `Duplicate sourcePageIndex (${pageIndex}) is not supported by Organize PDF.`
      );
    }
    seenIndices.add(pageIndex);

    const rotationDelta = candidate.rotationDelta;
    if (
      typeof rotationDelta !== 'number' ||
      !Number.isInteger(rotationDelta) ||
      !VALID_ROTATION_DELTAS.has(rotationDelta)
    ) {
      throw createProcessingError(
        'INVALID_OPTIONS',
        `Invalid rotationDelta (${String(rotationDelta)}); expected 0, 90, 180, or 270.`
      );
    }

    validated.push({
      sourcePageIndex: pageIndex,
      rotationDelta: rotationDelta as OrganizeRotationDelta,
    });
  }

  return validated;
}

export const pdfOrganizeEngine: PdfEngine = {
  id: 'pdf-organize',
  supportedToolIds: ['organize-pdf'],

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
        `Organize PDF expects 1 PDF file; received ${input.length}.`
      );
    }

    const limitFailure = validateJobLimits(input, {
      maxFileSizeBytes: PROCESSING_LIMITS.maxFileSizeBytes,
      maxTotalSizeBytes: PROCESSING_LIMITS.maxTotalSizeBytes,
      maxFilesCount: 1,
    });
    if (limitFailure) {
      throw createProcessingError(
        limitFailure.code,
        limitFailure.developerDetail
      );
    }

    const file = input[0];

    ctx.onProgress({
      mode: 'determinate',
      percent: 8,
      stageLabel: 'Loading PDF document',
    });

    const loaded = await loadUnencryptedPdf(file, ctx.signal);
    let srcDoc: PDFDocument | null = loaded.doc;
    const sourcePageCount = loaded.pageCount;
    const warnings = [...loaded.warnings];

    let operations: OrganizePageOperation[];
    try {
      operations = validateOrganizeOperations(
        options.operations,
        sourcePageCount,
        PROCESSING_LIMITS.maxOrganizePages
      );
    } catch (err) {
      srcDoc = null;
      throw err;
    }

    const zeroBasedIndices = operations.map((op) => op.sourcePageIndex);
    const existingRotations = zeroBasedIndices.map((idx) =>
      normalizeAngleDegrees(srcDoc!.getPage(idx).getRotation().angle)
    );
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
          const percent = 15 + Math.round((copied / Math.max(1, total)) * 70);
          ctx.onProgress({
            mode: 'determinate',
            percent,
            stageLabel: `Organizing page ${copied} of ${total}`,
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

    // Apply per-page rotation normalized modulo 360 (honoring existing & inherited /Rotate).
    for (let i = 0; i < operations.length; i += 1) {
      if (i % 50 === 0) {
        throwIfAborted(ctx.signal);
      }
      const delta = operations[i].rotationDelta;
      const existing = existingRotations[i];
      if (delta !== 0 || existing !== 0) {
        const finalAngle = normalizeAngleDegrees(existing + delta);
        outDoc.getPage(i).setRotation(degrees(finalAngle));
      }
    }

    assertExpectedPageCount(outDoc, operations.length, 'Organize PDF');

    ctx.onProgress({
      mode: 'determinate',
      percent: 92,
      stageLabel: 'Saving organized PDF',
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
      operations.length,
      'Organize PDF output',
      ctx.signal
    );

    ctx.onProgress({
      mode: 'determinate',
      percent: 100,
      stageLabel: 'Organization complete',
    });

    const outputName = buildOutputFileName(file.name, 'organized', '.pdf');

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
        pageCount: operations.length,
        isEncrypted: false,
        interactiveFeaturesDetected,
      },
    };
  },
};
