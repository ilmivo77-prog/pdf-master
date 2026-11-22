import {PDFDocument} from 'pdf-lib';
import {
  PROCESSING_LIMITS,
  validateJobLimits,
} from '../../../../config/processingLimits';
import {buildOutputFileName} from '../../../../services/file/downloadManager';
import {chunkPagesBySize, parsePageRanges, splitEveryPage} from '../../utils/pageRanges';
import {createProcessingError, mapPdfLibError} from '../errorTaxonomy';
import type {
  OutputFile,
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

export type SplitMode = 'ranges' | 'every-n' | 'every-page';

interface SplitGroup {
  label: string;
  pages: number[];
}

function buildSplitGroups(
  mode: SplitMode,
  pageCount: number,
  options: Record<string, unknown>
): SplitGroup[] {
  if (mode === 'ranges') {
    const rangesText =
      typeof options.rangesText === 'string' ? options.rangesText : '';
    const parsed = parsePageRanges(rangesText, pageCount);
    if (!parsed.ok) {
      throw createProcessingError(
        'INVALID_OPTIONS',
        `Invalid split ranges (${parsed.error.code} at ${parsed.error.position}).`
      );
    }
    return parsed.value.segments.map((seg) => ({
      label:
        seg.start === seg.end
          ? `page-${seg.start}`
          : `pages-${seg.start}-${seg.end}`,
      pages: seg.pages,
    }));
  }

  if (mode === 'every-n') {
    const rawN = options.everyN;
    const everyN = typeof rawN === 'number' ? rawN : Number(rawN);
    if (!Number.isInteger(everyN) || everyN < 1) {
      throw createProcessingError(
        'INVALID_OPTIONS',
        `everyN must be a positive integer; received "${String(rawN)}".`
      );
    }
    return chunkPagesBySize(pageCount, everyN).map((group) => ({
      label:
        group.length === 1
          ? `page-${group[0]}`
          : `pages-${group[0]}-${group[group.length - 1]}`,
      pages: group,
    }));
  }

  if (mode === 'every-page') {
    return splitEveryPage(pageCount).map((group) => ({
      label: `page-${group[0]}`,
      pages: group,
    }));
  }

  throw createProcessingError(
    'INVALID_OPTIONS',
    `Unsupported split mode "${String(mode)}".`
  );
}

function buildUniquePdfNames(
  baseFileName: string,
  groups: SplitGroup[]
): string[] {
  const used = new Set<string>();
  return groups.map((group, idx) => {
    let candidate = buildOutputFileName(baseFileName, group.label, '.pdf');
    if (used.has(candidate)) {
      candidate = buildOutputFileName(
        baseFileName,
        `part-${idx + 1}-${group.label}`,
        '.pdf'
      );
    }
    used.add(candidate);
    return candidate;
  });
}

export const pdfSplitEngine: PdfEngine = {
  id: 'pdf-split',
  supportedToolIds: ['split-pdf'],

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
        `Split expects 1 PDF file; received ${input.length}.`
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
    const modeRaw = options.mode;
    const mode: SplitMode =
      modeRaw === 'every-n' || modeRaw === 'every-page' ? modeRaw : 'ranges';

    ctx.onProgress({
      mode: 'determinate',
      percent: 5,
      stageLabel: 'Inspecting PDF structure',
    });

    let srcDoc: PDFDocument | null = await loadUnencryptedPdf(file, ctx.signal);
    let sourcePageCount: number;
    try {
      sourcePageCount = srcDoc.getPageCount();
    } catch (err) {
      srcDoc = null;
      throw mapPdfLibError(err);
    }

    const groups = buildSplitGroups(mode, sourcePageCount, options);
    if (groups.length === 0) {
      srcDoc = null;
      throw createProcessingError(
        'INVALID_OPTIONS',
        'Split configuration produced 0 output groups.'
      );
    }

    if (groups.length > PROCESSING_LIMITS.maxSplitOutputs) {
      srcDoc = null;
      throw createProcessingError(
        'TOO_MANY_OUTPUTS',
        `Split would produce ${groups.length} files, exceeding maxSplitOutputs=${PROCESSING_LIMITS.maxSplitOutputs}.`
      );
    }

    const interactiveFeaturesDetected = detectInteractiveFeatures(srcDoc);
    const outputNames = buildUniquePdfNames(file.name, groups);
    const outputs: OutputFile[] = [];
    let totalOutputPages = 0;

    for (let i = 0; i < groups.length; i += 1) {
      throwIfAborted(ctx.signal);
      const group = groups[i];
      const zeroBasedIndices = group.pages.map((p) => p - 1);
      totalOutputPages += group.pages.length;

      let outDoc: PDFDocument | null = await PDFDocument.create();
      const groupBase = 10 + Math.round((i / groups.length) * 72);
      const groupSpan = Math.max(1, Math.round(72 / groups.length));

      try {
        await copyPagesInChunks(
          outDoc,
          srcDoc,
          zeroBasedIndices,
          ctx.signal,
          (copied, total) => {
            const fraction = total > 0 ? copied / total : 1;
            const percent = Math.min(
              84,
              groupBase + Math.round(fraction * groupSpan)
            );
            ctx.onProgress({
              mode: 'determinate',
              percent,
              stageLabel: `Creating file ${i + 1} of ${groups.length}`,
            });
          }
        );

        assertExpectedPageCount(outDoc, group.pages.length, `Split part ${i + 1}`);
        const outBytes = await outDoc.save({useObjectStreams: true});
        outputs.push({
          name: outputNames[i],
          mimeType: 'application/pdf',
          bytes: outBytes,
          size: outBytes.byteLength,
        });
      } catch (err) {
        outDoc = null;
        srcDoc = null;
        throw mapPdfLibError(err);
      }

      outDoc = null;
    }

    // Release source PDF before optional ZIP compression
    srcDoc = null;
    throwIfAborted(ctx.signal);

    let archive: OutputFile | undefined;
    if (outputs.length > 1) {
      ctx.onProgress({
        mode: 'determinate',
        percent: 88,
        stageLabel: 'Packaging ZIP archive',
      });

      const jszipModule = await import('jszip');
      const JSZip = jszipModule.default ?? jszipModule;
      const zip = new JSZip();

      for (const outFile of outputs) {
        throwIfAborted(ctx.signal);
        zip.file(outFile.name, outFile.bytes);
      }

      const zipBytes = await zip.generateAsync({
        type: 'uint8array',
        compression: 'DEFLATE',
        compressionOptions: {level: 6},
      });
      throwIfAborted(ctx.signal);

      archive = {
        name: buildOutputFileName(file.name, 'split', '.zip'),
        mimeType: 'application/zip',
        bytes: zipBytes,
        size: zipBytes.byteLength,
      };
    }

    ctx.onProgress({
      mode: 'determinate',
      percent: 100,
      stageLabel: 'Split complete',
    });

    const outputTotalBytes = outputs.reduce((sum, item) => sum + item.size, 0);

    return {
      outputs,
      ...(archive ? {archive} : {}),
      warnings: [],
      stats: {
        durationMs: Math.max(0, Date.now() - startedAt),
        inputFileCount: 1,
        inputTotalBytes: file.size,
        outputFileCount: outputs.length,
        outputTotalBytes,
        pageCount: totalOutputPages,
        isEncrypted: false,
        interactiveFeaturesDetected,
      },
    };
  },
};
