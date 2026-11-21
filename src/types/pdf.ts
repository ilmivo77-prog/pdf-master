export type PdfOperationType =
  | 'merge'
  | 'split'
  | 'compress'
  | 'rotate'
  | 'convert'
  | 'protect'
  | 'unlock'
  | 'watermark'
  | 'ocr'
  | 'extract_text';

export type PdfProcessingStatus =
  | 'idle'
  | 'queued'
  | 'validating'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface PdfProcessingProgress {
  status: PdfProcessingStatus;
  percentage: number;
  stageLabel: string;
  processedFilesCount: number;
  totalFilesCount: number;
}

export interface PdfProcessingOptions {
  operation: PdfOperationType;
  targetFormat?: string;
  rotationDegrees?: 90 | 180 | 270;
  compressionLevel?: 'low' | 'recommended' | 'extreme';
  pageRange?: string;
  outputFileNamePrefix?: string;
}

export interface PdfOutputArtifact {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  blob: Blob;
}

export type PdfProcessingErrorCode =
  | 'NOT_IMPLEMENTED'
  | 'VALIDATION_FAILED'
  | 'UNSUPPORTED_OPERATION'
  | 'ENGINE_UNAVAILABLE'
  | 'PROCESSING_FAILED'
  | 'CANCELLED';

export interface PdfProcessingError {
  code: PdfProcessingErrorCode;
  message: string;
  recoverable: boolean;
}

export interface PdfProcessingResult {
  success: boolean;
  operation: PdfOperationType;
  artifacts: PdfOutputArtifact[];
  durationMs: number;
  error?: PdfProcessingError;
}

export interface PdfProcessorCapabilities {
  supportedOperations: PdfOperationType[];
  runsInBrowser: boolean;
  requiresServer: boolean;
  engineName: string;
}

export interface PdfProcessorEngine {
  readonly id: string;
  readonly capabilities: PdfProcessorCapabilities;
  supportsOperation(operation: PdfOperationType): boolean;
  execute(
    files: File[],
    options: PdfProcessingOptions,
    onProgress?: (progress: PdfProcessingProgress) => void,
    signal?: AbortSignal
  ): Promise<PdfProcessingResult>;
}
