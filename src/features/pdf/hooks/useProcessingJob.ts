import {useCallback, useEffect, useReducer, useRef, useState} from 'react';
import {
  PROCESSING_LIMITS,
  type ProcessingLimitsConfig,
  validateJobLimits,
} from '../../../config/processingLimits';
import {revokeAllTrackedObjectUrls} from '../../../services/file/downloadManager';
import {
  buildSafeFileMetadata,
  sniffFileSignature,
} from '../../../services/file/fileValidation';
import {
  PdfWorkerClient,
  createProcessingError,
  createProcessingJob,
  isOutOfMemoryError,
  jobReducer,
  type PdfEngineInputFile,
  type ProcessingError,
  type ProcessingJob,
} from '../engine';

export interface StartJobParams {
  toolId: string;
  files: File[];
  options?: Record<string, unknown>;
  limits?: Partial<ProcessingLimitsConfig>;
  requirePdfMagicBytes?: boolean;
  /** Optional pre-read buffers; sliced before worker transfer so caller copies are not detached. */
  preloadedBuffers?: ArrayBuffer[];
}

function generateJobId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `job-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

export function useProcessingJob() {
  const [job, dispatch] = useReducer(
    jobReducer,
    undefined,
    () =>
      createProcessingJob({
        id: generateJobId(),
        toolId: '',
        inputFiles: [],
        options: {},
      })
  );

  const [elapsedMs, setElapsedMs] = useState(0);
  const workerClientRef = useRef<PdfWorkerClient | null>(null);
  const activeAbortRef = useRef<AbortController | null>(null);

  const isRunning =
    job.status === 'validating' ||
    job.status === 'queued' ||
    job.status === 'processing';

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }
    const anchor = job.startedAt ?? job.createdAt;
    setElapsedMs(Math.max(0, Date.now() - anchor));

    const interval = window.setInterval(() => {
      setElapsedMs(Math.max(0, Date.now() - anchor));
    }, 250);

    return () => {
      window.clearInterval(interval);
    };
  }, [isRunning, job.startedAt, job.createdAt]);

  useEffect(() => {
    return () => {
      activeAbortRef.current?.abort();
      activeAbortRef.current = null;
      workerClientRef.current?.dispose();
      workerClientRef.current = null;
      revokeAllTrackedObjectUrls();
    };
  }, []);

  const cancelJob = useCallback(() => {
    if (activeAbortRef.current) {
      activeAbortRef.current.abort();
      activeAbortRef.current = null;
    }
  }, []);

  const discardResults = useCallback(() => {
    activeAbortRef.current?.abort();
    activeAbortRef.current = null;
    revokeAllTrackedObjectUrls();
    setElapsedMs(0);
    dispatch({
      type: 'RESET',
      nextJob: createProcessingJob({
        id: generateJobId(),
        toolId: '',
        inputFiles: [],
        options: {},
      }),
    });
  }, []);

  const startJob = useCallback(async (params: StartJobParams) => {
    activeAbortRef.current?.abort();
    revokeAllTrackedObjectUrls();

    const jobId = generateJobId();
    const inputFiles = params.files.map((file) => {
      const meta = buildSafeFileMetadata(file);
      return {
        id: meta.id,
        name: meta.sanitizedName,
        size: meta.sizeBytes,
        mimeType: meta.mimeType,
      };
    });

    const freshJob = createProcessingJob({
      id: jobId,
      toolId: params.toolId,
      inputFiles,
      options: params.options ?? {},
    });

    dispatch({type: 'RESET', nextJob: freshJob});
    setElapsedMs(0);

    const abortController = new AbortController();
    activeAbortRef.current = abortController;

    try {
      dispatch({type: 'START_VALIDATING'});

      const limitFailure = validateJobLimits(params.files, params.limits);
      if (limitFailure) {
        dispatch({
          type: 'FAIL',
          error: createProcessingError(
            limitFailure.code,
            limitFailure.developerDetail
          ),
        });
        return;
      }

      if (params.requirePdfMagicBytes !== false) {
        for (const file of params.files) {
          if (abortController.signal.aborted) {
            dispatch({
              type: 'CANCEL',
              error: createProcessingError('CANCELLED', 'Cancelled during validation.'),
            });
            return;
          }
          const kind = await sniffFileSignature(file);
          if (kind !== 'pdf') {
            dispatch({
              type: 'FAIL',
              error: createProcessingError(
                'NOT_A_PDF',
                `Magic-byte check returned "${kind}" for "${file.name}".`
              ),
            });
            return;
          }
        }
      }

      dispatch({type: 'QUEUE'});

      // Read full file bytes lazily unless caller supplied a preloaded buffer (copy sliced before transfer)
      const engineInputs: PdfEngineInputFile[] = [];
      for (let idx = 0; idx < params.files.length; idx += 1) {
        const file = params.files[idx];
        if (abortController.signal.aborted) {
          dispatch({
            type: 'CANCEL',
            error: createProcessingError('CANCELLED', 'Cancelled before file read.'),
          });
          return;
        }
        const meta = buildSafeFileMetadata(file);
        const preloaded = params.preloadedBuffers?.[idx];
        const bytes = preloaded
          ? preloaded.slice(0)
          : await file.arrayBuffer();
        engineInputs.push({
          name: meta.sanitizedName,
          mimeType: meta.mimeType,
          size: file.size,
          bytes,
        });
      }

      if (!workerClientRef.current) {
        workerClientRef.current = new PdfWorkerClient();
      }

      const result = await workerClientRef.current.runJob({
        jobId,
        toolId: params.toolId,
        files: engineInputs,
        options: params.options ?? {},
        timeoutMs: params.limits?.jobTimeoutMs ?? PROCESSING_LIMITS.jobTimeoutMs,
        signal: abortController.signal,
        onStart: () => {
          dispatch({type: 'START_PROCESSING'});
        },
        onProgress: (progress) => {
          dispatch({type: 'PROGRESS', progress});
        },
      });

      if (abortController.signal.aborted) {
        dispatch({
          type: 'CANCEL',
          error: createProcessingError('CANCELLED', 'Cancelled on completion.'),
        });
        return;
      }

      setElapsedMs(result.stats.durationMs);
      dispatch({type: 'SUCCEED', result});
    } catch (err) {
      if (
        abortController.signal.aborted ||
        (isProcessingError(err) && err.code === 'CANCELLED')
      ) {
        dispatch({
          type: 'CANCEL',
          error: isProcessingError(err)
            ? err
            : createProcessingError('CANCELLED', 'Job cancelled.'),
        });
        return;
      }

      if (isProcessingError(err)) {
        dispatch({type: 'FAIL', error: err});
        return;
      }

      if (isOutOfMemoryError(err)) {
        dispatch({
          type: 'FAIL',
          error: createProcessingError(
            'OUT_OF_MEMORY',
            err instanceof Error ? err.message : 'Out of memory in main pipeline'
          ),
        });
        return;
      }

      dispatch({
        type: 'FAIL',
        error: createProcessingError(
          'UNKNOWN',
          err instanceof Error ? `${err.name}: ${err.message}` : String(err)
        ),
      });
    } finally {
      if (activeAbortRef.current === abortController) {
        activeAbortRef.current = null;
      }
    }
  }, []);

  return {
    job,
    elapsedMs,
    isRunning,
    startJob,
    cancelJob,
    discardResults,
  };
}

export type UseProcessingJobReturn = ReturnType<typeof useProcessingJob>;
export type {ProcessingJob};
