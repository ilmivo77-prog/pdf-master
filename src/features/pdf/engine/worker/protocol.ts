import type {
  PdfEngineInputFile,
  ProcessingError,
  ProcessingProgress,
  ProcessingResult,
} from '../types';

export type WorkerRequestMessage =
  | {
      type: 'start';
      jobId: string;
      toolId: string;
      files: PdfEngineInputFile[];
      options: Record<string, unknown>;
    }
  | {
      type: 'cancel';
      jobId: string;
    };

export type WorkerResponseMessage =
  | {
      type: 'progress';
      jobId: string;
      progress: ProcessingProgress;
    }
  | {
      type: 'result';
      jobId: string;
      result: ProcessingResult;
    }
  | {
      type: 'error';
      jobId: string;
      error: ProcessingError;
    };
