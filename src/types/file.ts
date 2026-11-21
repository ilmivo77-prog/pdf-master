export type FileProcessingState =
  | 'idle'
  | 'validating'
  | 'ready'
  | 'processing'
  | 'completed'
  | 'error';

export type FileValidationErrorCode =
  | 'INVALID_EXTENSION'
  | 'INVALID_MIME_TYPE'
  | 'FILE_TOO_LARGE'
  | 'EMPTY_FILE'
  | 'TOO_MANY_FILES'
  | 'DUPLICATE_FILE'
  | 'UNSAFE_FILENAME';

export interface FileValidationRule {
  allowedExtensions: string[];
  allowedMimeTypes: string[];
  maxFileSizeBytes: number;
  maxFilesCount: number;
  allowMultiple: boolean;
  allowEmptyFile?: boolean;
}

export interface FileValidationError {
  code: FileValidationErrorCode;
  message: string;
  fileName: string;
}

export interface SafeFileMetadata {
  id: string;
  sanitizedName: string;
  extension: string;
  mimeType: string;
  sizeBytes: number;
  formattedSize: string;
  lastModified: number;
}

export interface FileValidationResult {
  valid: boolean;
  errors: FileValidationError[];
  acceptedFiles: ManagedFileItem[];
}

export interface ManagedFileItem {
  id: string;
  file: File;
  metadata: SafeFileMetadata;
  status: FileProcessingState;
  errorMessage?: string;
}
