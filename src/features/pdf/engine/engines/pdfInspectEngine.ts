import {PDFDocument} from 'pdf-lib';
import {buildOutputFileName} from '../../../../services/file/downloadManager';
import {createProcessingError, mapPdfLibError} from '../errorTaxonomy';
import type {
  PdfEngine,
  PdfEngineContext,
  PdfEngineInputFile,
  PdfInspectionMetadata,
  ProcessingResult,
} from '../types';
import {
  checkPdfTailHeuristic,
  preparePdfBytes,
  throwIfAborted,
  verifyPdfPageIntegrity,
  verifySavedPdfOutput,
} from './sharedPdfUtils';

export interface PdfInspectOptions {
  mode?: 'inspect' | 'roundtrip';
}

function readCleanMetadata(doc: PDFDocument): PdfInspectionMetadata {
  const title = doc.getTitle()?.trim() || undefined;
  const author = doc.getAuthor()?.trim() || undefined;
  const subject = doc.getSubject()?.trim() || undefined;
  const creator = doc.getCreator()?.trim() || undefined;
  const producer = doc.getProducer()?.trim() || undefined;

  return {
    ...(title ? {title} : {}),
    ...(author ? {author} : {}),
    ...(subject ? {subject} : {}),
    ...(creator ? {creator} : {}),
    ...(producer ? {producer} : {}),
  };
}

export const pdfInspectEngine: PdfEngine = {
  id: 'pdf-inspect',
  // Internal self-test tool IDs only — never registered for public tools.
  supportedToolIds: ['internal:pdf-inspect', 'internal:pdf-roundtrip'],

  async run(
    input: PdfEngineInputFile[],
    options: Record<string, unknown>,
    ctx: PdfEngineContext
  ): Promise<ProcessingResult> {
    const startedAt = Date.now();
    const mode =
      options.mode === 'roundtrip' ? 'roundtrip' : 'inspect';

    throwIfAborted(ctx.signal);

    if (input.length === 0) {
      throw createProcessingError('INVALID_FILE', 'Expected 1 PDF file, received 0.');
    }
    if (input.length > 1) {
      throw createProcessingError(
        'TOO_MANY_FILES',
        `Expected 1 PDF file, received ${input.length}.`
      );
    }

    const file = input[0];
    const rawBytes = new Uint8Array(file.bytes);

    if (rawBytes.byteLength === 0) {
      throw createProcessingError('INVALID_FILE', `File "${file.name}" is empty.`);
    }

    ctx.onProgress({
      mode: 'determinate',
      percent: 15,
      stageLabel: 'Verifying PDF header',
    });

    const {pdfBytes, warnings: headerWarnings} = preparePdfBytes(
      rawBytes,
      file.name
    );

    checkPdfTailHeuristic(pdfBytes, file.name);
    throwIfAborted(ctx.signal);

    ctx.onProgress({
      mode: 'determinate',
      percent: 45,
      stageLabel: 'Loading PDF structure',
    });

    let pdfDoc: PDFDocument;
    let isEncrypted = false;
    const warnings: string[] = [...headerWarnings];

    try {
      pdfDoc = await PDFDocument.load(pdfBytes, {
        ignoreEncryption: false,
        updateMetadata: false,
      });
    } catch (err) {
      const mapped = mapPdfLibError(err);
      if (mapped.code === 'ENCRYPTED_PDF') {
        isEncrypted = true;
        if (mode === 'roundtrip') {
          throw mapped;
        }
        try {
          pdfDoc = await PDFDocument.load(pdfBytes, {
            ignoreEncryption: true,
            updateMetadata: false,
          });
          warnings.push(
            'This PDF uses encryption or permission restrictions; inspection details are read-only and roundtrip re-saving is disabled.'
          );
        } catch (encryptedFallbackErr) {
          throw mapPdfLibError(encryptedFallbackErr);
        }
      } else {
        throw mapped;
      }
    }

    throwIfAborted(ctx.signal);

    ctx.onProgress({
      mode: 'determinate',
      percent: 75,
      stageLabel:
        mode === 'roundtrip' ? 'Re-saving PDF document' : 'Verifying page integrity',
    });

    let pageCount: number;
    let metadata: PdfInspectionMetadata = {};
    try {
      const integrity = verifyPdfPageIntegrity(pdfDoc, ctx.signal, file.name);
      pageCount = integrity.pageCount;
      warnings.push(...integrity.warnings);
      if (!isEncrypted) {
        metadata = readCleanMetadata(pdfDoc);
      }
    } catch (err) {
      throw mapPdfLibError(err);
    }

    if (mode === 'inspect') {
      ctx.onProgress({
        mode: 'determinate',
        percent: 100,
        stageLabel: 'Inspection complete',
      });

      return {
        outputs: [],
        warnings,
        stats: {
          durationMs: Math.max(0, Date.now() - startedAt),
          inputFileCount: 1,
          inputTotalBytes: rawBytes.byteLength,
          outputFileCount: 0,
          outputTotalBytes: 0,
          pageCount,
          isEncrypted,
          metadata,
        },
      };
    }

    let savedBytes: Uint8Array;
    try {
      savedBytes = await pdfDoc.save({useObjectStreams: true});
    } catch (err) {
      throw mapPdfLibError(err);
    }

    await verifySavedPdfOutput(savedBytes, pageCount, 'Roundtrip PDF', ctx.signal);

    ctx.onProgress({
      mode: 'determinate',
      percent: 100,
      stageLabel: 'Roundtrip complete',
    });

    const outputName = buildOutputFileName(file.name, 'roundtrip', '.pdf');

    return {
      outputs: [
        {
          name: outputName,
          mimeType: 'application/pdf',
          bytes: savedBytes,
          size: savedBytes.byteLength,
        },
      ],
      warnings,
      stats: {
        durationMs: Math.max(0, Date.now() - startedAt),
        inputFileCount: 1,
        inputTotalBytes: rawBytes.byteLength,
        outputFileCount: 1,
        outputTotalBytes: savedBytes.byteLength,
        pageCount,
        isEncrypted,
        metadata,
      },
    };
  },
};
