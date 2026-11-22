export type ProcessingJobStatus =
  | 'idle'
  | 'validating'
  | 'queued'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export type ProcessingErrorCode =
  | 'INVALID_FILE'
  | 'NOT_A_PDF'
  | 'ENCRYPTED_PDF'
  | 'CORRUPT_PDF'
  | 'FILE_TOO_LARGE'
  | 'TOO_MANY_FILES'
  | 'TOO_MANY_OUTPUTS'
  | 'NO_PAGES_REMAINING'
  | 'INVALID_OPTIONS'
  | 'OUT_OF_MEMORY'
  | 'WORKER_CRASHED'
  | 'CANCELLED'
  | 'ENGINE_NOT_FOUND'
  | 'NOT_IMPLEMENTED'
  | 'UNKNOWN';

export type ProcessingErrorMessageKey =
  | 'invalidFile'
  | 'notAPdf'
  | 'passwordProtectedPdf'
  | 'corruptPdf'
  | 'fileTooLarge'
  | 'tooManyFiles'
  | 'tooManyOutputs'
  | 'noPagesRemaining'
  | 'invalidOptions'
  | 'outOfMemory'
  | 'workerCrashed'
  | 'cancelled'
  | 'engineNotFound'
  | 'notImplemented'
  | 'unknown';

export interface ProcessingError {
  code: ProcessingErrorCode;
  messageKey: ProcessingErrorMessageKey;
  /** Internal diagnostic message for logs/dev inspection only — never shown raw to end users. */
  developerDetail?: string;
  recoverable: boolean;
}

export interface OutputFile {
  name: string;
  mimeType: string;
  bytes: Uint8Array;
  size: number;
}

export interface PdfInspectionMetadata {
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
}

export interface ProcessingStats {
  durationMs: number;
  inputFileCount: number;
  inputTotalBytes: number;
  outputFileCount: number;
  outputTotalBytes: number;
  pageCount?: number;
  isEncrypted?: boolean;
  metadata?: PdfInspectionMetadata;
  interactiveFeaturesDetected?: boolean;
}

export interface ProcessingResult {
  outputs: OutputFile[];
  /** Optional ZIP archive produced when an operation creates multiple PDF outputs. */
  archive?: OutputFile;
  warnings: string[];
  stats: ProcessingStats;
}

export interface ProcessingProgress {
  mode: 'determinate' | 'indeterminate';
  percent: number;
  stageLabel?: string;
}

export interface ProcessingJobInputFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
}

export interface ProcessingJob<TOptions = Record<string, unknown>> {
  id: string;
  toolId: string;
  inputFiles: ProcessingJobInputFile[];
  options: TOptions;
  status: ProcessingJobStatus;
  progress: ProcessingProgress;
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
  result?: ProcessingResult;
  error?: ProcessingError;
}

export interface PdfEngineInputFile {
  name: string;
  mimeType: string;
  size: number;
  bytes: ArrayBuffer;
}

export interface PdfEngineContext {
  onProgress: (progress: ProcessingProgress) => void;
  signal: AbortSignal;
}

export interface PdfEngine {
  readonly id: string;
  readonly supportedToolIds: readonly string[];
  run(
    input: PdfEngineInputFile[],
    options: Record<string, unknown>,
    ctx: PdfEngineContext
  ): Promise<ProcessingResult>;
}
