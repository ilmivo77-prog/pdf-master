/// <reference lib="webworker" />

import {EngineRegistry} from '../engineRegistry';
import {pdfExtractEngine} from '../engines/pdfExtractEngine';
import {pdfInspectEngine} from '../engines/pdfInspectEngine';
import {pdfMergeEngine} from '../engines/pdfMergeEngine';
import {pdfOrganizeEngine} from '../engines/pdfOrganizeEngine';
import {pdfRemoveEngine} from '../engines/pdfRemoveEngine';
import {pdfSplitEngine} from '../engines/pdfSplitEngine';
import {createProcessingError, isOutOfMemoryError} from '../errorTaxonomy';
import type {ProcessingError, ProcessingProgress} from '../types';
import type {WorkerRequestMessage, WorkerResponseMessage} from './protocol';

const PROGRESS_THROTTLE_MS = 100; // ~10 updates/sec max

const workerEngineRegistry = new EngineRegistry();
workerEngineRegistry.registerEngine(pdfInspectEngine);
workerEngineRegistry.registerEngine(pdfMergeEngine);
workerEngineRegistry.registerEngine(pdfSplitEngine);
workerEngineRegistry.registerEngine(pdfExtractEngine);
workerEngineRegistry.registerEngine(pdfRemoveEngine);
workerEngineRegistry.registerEngine(pdfOrganizeEngine);

const activeControllers = new Map<string, AbortController>();

function postWorkerMessage(
  message: WorkerResponseMessage,
  transfer: Transferable[] = []
): void {
  self.postMessage(message, transfer);
}

function isProcessingError(value: unknown): value is ProcessingError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'messageKey' in value &&
    'recoverable' in value
  );
}

self.onmessage = async (event: MessageEvent<WorkerRequestMessage>) => {
  const message = event.data;

  if (message.type === 'cancel') {
    const controller = activeControllers.get(message.jobId);
    if (controller) {
      controller.abort();
    }
    return;
  }

  if (message.type !== 'start') {
    return;
  }

  const {jobId, toolId, files, options} = message;
  const resolved = workerEngineRegistry.resolveEngineForTool(toolId);

  if (!resolved.engine) {
    postWorkerMessage({
      type: 'error',
      jobId,
      error: resolved.error,
    });
    return;
  }

  const controller = new AbortController();
  activeControllers.set(jobId, controller);

  let lastSentAt = 0;
  let lastPercent = 0;

  const emitProgress = (incoming: ProcessingProgress) => {
    const now = Date.now();
    const monotonicPercent =
      incoming.mode === 'determinate'
        ? Math.max(lastPercent, Math.min(100, Math.max(0, Math.round(incoming.percent))))
        : lastPercent;

    const isBoundary = monotonicPercent === 0 || monotonicPercent === 100;
    if (!isBoundary && now - lastSentAt < PROGRESS_THROTTLE_MS) {
      return;
    }

    lastSentAt = now;
    lastPercent = monotonicPercent;

    postWorkerMessage({
      type: 'progress',
      jobId,
      progress: {
        mode: incoming.mode,
        percent: monotonicPercent,
        stageLabel: incoming.stageLabel,
      },
    });
  };

  try {
    const result = await resolved.engine.run(files, options, {
      onProgress: emitProgress,
      signal: controller.signal,
    });

    if (controller.signal.aborted) {
      postWorkerMessage({
        type: 'error',
        jobId,
        error: createProcessingError('CANCELLED', 'Job cancelled before completion.'),
      });
      return;
    }

    const transferSet = new Set<ArrayBuffer>();
    for (const output of result.outputs) {
      if (
        output.bytes.buffer instanceof ArrayBuffer &&
        output.bytes.byteOffset === 0 &&
        output.bytes.byteLength === output.bytes.buffer.byteLength
      ) {
        transferSet.add(output.bytes.buffer);
      }
    }
    if (
      result.archive &&
      result.archive.bytes.buffer instanceof ArrayBuffer &&
      result.archive.bytes.byteOffset === 0 &&
      result.archive.bytes.byteLength === result.archive.bytes.buffer.byteLength
    ) {
      transferSet.add(result.archive.bytes.buffer);
    }

    postWorkerMessage(
      {
        type: 'result',
        jobId,
        result,
      },
      Array.from(transferSet)
    );
  } catch (err) {
    if (controller.signal.aborted) {
      postWorkerMessage({
        type: 'error',
        jobId,
        error: createProcessingError('CANCELLED', 'Job cancelled via AbortController.'),
      });
      return;
    }

    if (isProcessingError(err)) {
      postWorkerMessage({
        type: 'error',
        jobId,
        error: err,
      });
      return;
    }

    if (isOutOfMemoryError(err)) {
      postWorkerMessage({
        type: 'error',
        jobId,
        error: createProcessingError(
          'OUT_OF_MEMORY',
          err instanceof Error ? err.message : 'Worker out of memory'
        ),
      });
      return;
    }

    postWorkerMessage({
      type: 'error',
      jobId,
      error: createProcessingError(
        'UNKNOWN',
        err instanceof Error ? `${err.name}: ${err.message}` : String(err)
      ),
    });
  } finally {
    activeControllers.delete(jobId);
  }
};
