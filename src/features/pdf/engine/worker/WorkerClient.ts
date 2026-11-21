import {PROCESSING_LIMITS} from '../../../../config/processingLimits';
import {createProcessingError} from '../errorTaxonomy';
import type {
  PdfEngineInputFile,
  ProcessingError,
  ProcessingProgress,
  ProcessingResult,
} from '../types';
import type {WorkerRequestMessage, WorkerResponseMessage} from './protocol';

export interface RunWorkerJobParams {
  jobId: string;
  toolId: string;
  files: PdfEngineInputFile[];
  options?: Record<string, unknown>;
  timeoutMs?: number;
  signal?: AbortSignal;
  onStart?: () => void;
  onProgress?: (progress: ProcessingProgress) => void;
}

interface QueuedTask {
  params: RunWorkerJobParams;
  resolve: (result: ProcessingResult) => void;
  reject: (error: ProcessingError) => void;
}

export class PdfWorkerClient {
  private worker: Worker | null = null;
  private activeTask: QueuedTask | null = null;
  private readonly queue: QueuedTask[] = [];
  private activeTimer: number | null = null;
  private activeAbortCleanup: (() => void) | null = null;
  private boundOnMessage: ((event: MessageEvent<WorkerResponseMessage>) => void) | null =
    null;
  private boundOnError: ((event: ErrorEvent) => void) | null = null;
  private boundOnMessageError: (() => void) | null = null;

  public getQueueLength(): number {
    return this.queue.length;
  }

  public isBusy(): boolean {
    return this.activeTask !== null;
  }

  public runJob(params: RunWorkerJobParams): Promise<ProcessingResult> {
    if (params.signal?.aborted) {
      return Promise.reject(
        createProcessingError('CANCELLED', 'Aborted before queueing.')
      );
    }

    return new Promise<ProcessingResult>((resolve, reject) => {
      const task: QueuedTask = {
        params,
        resolve,
        reject,
      };

      if (params.signal) {
        const onAbortBeforeStart = () => {
          const queueIdx = this.queue.indexOf(task);
          if (queueIdx !== -1) {
            this.queue.splice(queueIdx, 1);
            reject(createProcessingError('CANCELLED', 'Cancelled while queued.'));
          }
        };
        params.signal.addEventListener('abort', onAbortBeforeStart, {once: true});
      }

      this.queue.push(task);
      this.pumpQueue();
    });
  }

  public dispose(): void {
    const cancelErr = createProcessingError(
      'CANCELLED',
      'WorkerClient disposed.'
    );

    if (this.activeTask) {
      const task = this.activeTask;
      this.clearActiveTimersAndListeners();
      this.activeTask = null;
      task.reject(cancelErr);
    }

    while (this.queue.length > 0) {
      const queued = this.queue.shift();
      queued?.reject(cancelErr);
    }

    this.terminateWorker();
  }

  private ensureWorker(): Worker {
    if (this.worker) {
      return this.worker;
    }

    const worker = new Worker(new URL('./pdfWorker.ts', import.meta.url), {
      type: 'module',
    });

    this.boundOnMessage = (event: MessageEvent<WorkerResponseMessage>) => {
      this.handleWorkerMessage(event.data);
    };
    this.boundOnError = (event: ErrorEvent) => {
      const message = event.message || 'Unhandled worker runtime error.';
      const code = message.toLowerCase().includes('memory')
        ? 'OUT_OF_MEMORY'
        : 'WORKER_CRASHED';
      this.failActiveAndResetWorker(createProcessingError(code, message));
    };
    this.boundOnMessageError = () => {
      this.failActiveAndResetWorker(
        createProcessingError(
          'WORKER_CRASHED',
          'Worker message serialization failed.'
        )
      );
    };

    worker.addEventListener('message', this.boundOnMessage);
    worker.addEventListener('error', this.boundOnError);
    worker.addEventListener('messageerror', this.boundOnMessageError);

    this.worker = worker;
    return worker;
  }

  private terminateWorker(): void {
    if (!this.worker) {
      return;
    }
    if (this.boundOnMessage) {
      this.worker.removeEventListener('message', this.boundOnMessage);
    }
    if (this.boundOnError) {
      this.worker.removeEventListener('error', this.boundOnError);
    }
    if (this.boundOnMessageError) {
      this.worker.removeEventListener('messageerror', this.boundOnMessageError);
    }
    this.worker.terminate();
    this.worker = null;
    this.boundOnMessage = null;
    this.boundOnError = null;
    this.boundOnMessageError = null;
  }

  private clearActiveTimersAndListeners(): void {
    if (this.activeTimer !== null && typeof window !== 'undefined') {
      window.clearTimeout(this.activeTimer);
      this.activeTimer = null;
    }
    if (this.activeAbortCleanup) {
      this.activeAbortCleanup();
      this.activeAbortCleanup = null;
    }
  }

  private failActiveAndResetWorker(error: ProcessingError): void {
    const task = this.activeTask;
    this.clearActiveTimersAndListeners();
    this.activeTask = null;
    this.terminateWorker();
    task?.reject(error);
    this.pumpQueue();
  }

  private handleWorkerMessage(message: WorkerResponseMessage): void {
    const task = this.activeTask;
    if (!task || message.jobId !== task.params.jobId) {
      return;
    }

    if (message.type === 'progress') {
      task.params.onProgress?.(message.progress);
      return;
    }

    if (message.type === 'result') {
      this.clearActiveTimersAndListeners();
      this.activeTask = null;
      task.resolve(message.result);
      this.pumpQueue();
      return;
    }

    if (message.type === 'error') {
      this.clearActiveTimersAndListeners();
      this.activeTask = null;
      task.reject(message.error);
      this.pumpQueue();
    }
  }

  private pumpQueue(): void {
    if (this.activeTask || this.queue.length === 0) {
      return;
    }

    const nextTask = this.queue.shift();
    if (!nextTask) {
      return;
    }

    if (nextTask.params.signal?.aborted) {
      nextTask.reject(
        createProcessingError('CANCELLED', 'Cancelled before worker dispatch.')
      );
      this.pumpQueue();
      return;
    }

    this.activeTask = nextTask;
    nextTask.params.onStart?.();

    let worker: Worker;
    try {
      worker = this.ensureWorker();
    } catch (err) {
      this.failActiveAndResetWorker(
        createProcessingError(
          'WORKER_CRASHED',
          err instanceof Error ? err.message : 'Failed to spawn Web Worker.'
        )
      );
      return;
    }

    if (nextTask.params.signal) {
      const signal = nextTask.params.signal;
      const onAbort = () => {
        const cancelMsg: WorkerRequestMessage = {
          type: 'cancel',
          jobId: nextTask.params.jobId,
        };
        try {
          worker.postMessage(cancelMsg);
        } catch {
          // Ignore postMessage failure prior to termination
        }
        this.failActiveAndResetWorker(
          createProcessingError('CANCELLED', 'Cancelled by user.')
        );
      };
      signal.addEventListener('abort', onAbort, {once: true});
      this.activeAbortCleanup = () => signal.removeEventListener('abort', onAbort);
    }

    const timeoutMs =
      nextTask.params.timeoutMs ?? PROCESSING_LIMITS.jobTimeoutMs;
    if (timeoutMs > 0 && typeof window !== 'undefined') {
      this.activeTimer = window.setTimeout(() => {
        this.failActiveAndResetWorker(
          createProcessingError(
            'WORKER_CRASHED',
            `Job watchdog timeout exceeded (${timeoutMs}ms).`
          )
        );
      }, timeoutMs);
    }

    const transferBuffers: ArrayBuffer[] = [];
    for (const file of nextTask.params.files) {
      if (file.bytes instanceof ArrayBuffer) {
        transferBuffers.push(file.bytes);
      }
    }

    const startMsg: WorkerRequestMessage = {
      type: 'start',
      jobId: nextTask.params.jobId,
      toolId: nextTask.params.toolId,
      files: nextTask.params.files,
      options: nextTask.params.options ?? {},
    };

    try {
      worker.postMessage(startMsg, transferBuffers);
    } catch (err) {
      this.failActiveAndResetWorker(
        createProcessingError(
          'WORKER_CRASHED',
          err instanceof Error ? err.message : 'Failed to transfer job payload to worker.'
        )
      );
    }
  }
}
