import type {
  ProcessingError,
  ProcessingErrorCode,
  ProcessingErrorMessageKey,
} from './types';

interface ErrorDescriptor {
  messageKey: ProcessingErrorMessageKey;
  recoverable: boolean;
}

const ERROR_TAXONOMY: Record<ProcessingErrorCode, ErrorDescriptor> = {
  INVALID_FILE: {messageKey: 'invalidFile', recoverable: true},
  NOT_A_PDF: {messageKey: 'notAPdf', recoverable: true},
  ENCRYPTED_PDF: {messageKey: 'passwordProtectedPdf', recoverable: true},
  CORRUPT_PDF: {messageKey: 'corruptPdf', recoverable: true},
  FILE_TOO_LARGE: {messageKey: 'fileTooLarge', recoverable: true},
  TOO_MANY_FILES: {messageKey: 'tooManyFiles', recoverable: true},
  TOO_MANY_OUTPUTS: {messageKey: 'tooManyOutputs', recoverable: true},
  NO_PAGES_REMAINING: {messageKey: 'noPagesRemaining', recoverable: true},
  INVALID_OPTIONS: {messageKey: 'invalidOptions', recoverable: true},
  OUT_OF_MEMORY: {messageKey: 'outOfMemory', recoverable: true},
  WORKER_CRASHED: {messageKey: 'workerCrashed', recoverable: true},
  CANCELLED: {messageKey: 'cancelled', recoverable: true},
  ENGINE_NOT_FOUND: {messageKey: 'engineNotFound', recoverable: false},
  NOT_IMPLEMENTED: {messageKey: 'notImplemented', recoverable: false},
  UNKNOWN: {messageKey: 'unknown', recoverable: true},
};

export function createProcessingError(
  code: ProcessingErrorCode,
  developerDetail?: string
): ProcessingError {
  const descriptor = ERROR_TAXONOMY[code] ?? ERROR_TAXONOMY.UNKNOWN;
  return {
    code,
    messageKey: descriptor.messageKey,
    developerDetail,
    recoverable: descriptor.recoverable,
  };
}

export function isOutOfMemoryError(err: unknown): boolean {
  if (!(err instanceof Error)) {
    return false;
  }
  const combined = `${err.name} ${err.message}`.toLowerCase();
  return (
    err instanceof RangeError ||
    combined.includes('out of memory') ||
    combined.includes('allocation failed') ||
    combined.includes('memory limit') ||
    combined.includes('oom')
  );
}

export function mapPdfLibError(err: unknown): ProcessingError {
  if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    'messageKey' in err
  ) {
    return err as ProcessingError;
  }

  if (err instanceof Error && err.name === 'AbortError') {
    return createProcessingError('CANCELLED', err.message);
  }

  if (isOutOfMemoryError(err)) {
    return createProcessingError(
      'OUT_OF_MEMORY',
      err instanceof Error ? err.message : 'Memory allocation failure'
    );
  }

  const rawDetail = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  const lower = rawDetail.toLowerCase();

  if (lower.includes('encrypted') || lower.includes('password')) {
    return createProcessingError('ENCRYPTED_PDF', rawDetail);
  }

  if (lower.includes('no pdf header') || lower.includes('invalid pdf header')) {
    return createProcessingError('NOT_A_PDF', rawDetail);
  }

  if (
    lower.includes('parse') ||
    lower.includes('xref') ||
    lower.includes('trailer') ||
    lower.includes('startxref') ||
    lower.includes('expected') ||
    lower.includes('failed to parse') ||
    lower.includes('corrupt')
  ) {
    return createProcessingError('CORRUPT_PDF', rawDetail);
  }

  return createProcessingError('CORRUPT_PDF', rawDetail);
}
