export interface ProcessingLimitsConfig {
  maxFileSizeBytes: number;
  maxTotalSizeBytes: number;
  maxFilesCount: number;
  jobTimeoutMs: number;
  devTestMaxFileSizeBytes: number;
}

// Conservative defaults for mobile browser Web Worker memory budgets.
// To be validated by real-device testing in upcoming milestones.
export const PROCESSING_LIMITS: ProcessingLimitsConfig = {
  maxFileSizeBytes: 25 * 1024 * 1024, // 25 MB per file
  maxTotalSizeBytes: 50 * 1024 * 1024, // 50 MB total job payload
  maxFilesCount: 10, // 10 files per job
  jobTimeoutMs: 60_000, // 60s watchdog timeout per job
  devTestMaxFileSizeBytes: 50 * 1024 * 1024, // 50 MB ceiling for dev pipeline inspection
};

export interface LimitValidationFailure {
  code: 'INVALID_FILE' | 'FILE_TOO_LARGE' | 'TOO_MANY_FILES';
  fileName?: string;
  developerDetail: string;
}

export function validateJobLimits(
  files: ReadonlyArray<{name: string; size: number}>,
  overrides: Partial<ProcessingLimitsConfig> = {}
): LimitValidationFailure | null {
  const maxFileSizeBytes =
    overrides.maxFileSizeBytes ?? PROCESSING_LIMITS.maxFileSizeBytes;
  const maxTotalSizeBytes =
    overrides.maxTotalSizeBytes ?? PROCESSING_LIMITS.maxTotalSizeBytes;
  const maxFilesCount =
    overrides.maxFilesCount ?? PROCESSING_LIMITS.maxFilesCount;

  if (files.length === 0) {
    return {
      code: 'INVALID_FILE',
      developerDetail: 'No files were supplied for processing.',
    };
  }

  if (files.length > maxFilesCount) {
    return {
      code: 'TOO_MANY_FILES',
      developerDetail: `Received ${files.length} files, exceeding maxFilesCount=${maxFilesCount}.`,
    };
  }

  let totalBytes = 0;

  for (const file of files) {
    if (!Number.isFinite(file.size) || file.size <= 0) {
      return {
        code: 'INVALID_FILE',
        fileName: file.name,
        developerDetail: `File "${file.name}" is empty (0 bytes).`,
      };
    }

    if (file.size > maxFileSizeBytes) {
      return {
        code: 'FILE_TOO_LARGE',
        fileName: file.name,
        developerDetail: `File "${file.name}" (${file.size} bytes) exceeds maxFileSizeBytes (${maxFileSizeBytes}).`,
      };
    }

    totalBytes += file.size;
  }

  if (totalBytes > maxTotalSizeBytes) {
    return {
      code: 'FILE_TOO_LARGE',
      developerDetail: `Combined payload (${totalBytes} bytes) exceeds maxTotalSizeBytes (${maxTotalSizeBytes}).`,
    };
  }

  return null;
}
