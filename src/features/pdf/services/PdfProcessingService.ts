import type {
  PdfOperationType,
  PdfProcessingError,
  PdfProcessingOptions,
  PdfProcessingProgress,
  PdfProcessingResult,
  PdfProcessorEngine,
} from '../../../types/pdf';

export class PdfProcessingException extends Error {
  public readonly code: PdfProcessingError['code'];
  public readonly recoverable: boolean;

  constructor(error: PdfProcessingError) {
    super(error.message);
    this.name = 'PdfProcessingException';
    this.code = error.code;
    this.recoverable = error.recoverable;
  }
}

/**
 * Engine-agnostic coordinator for PDF Master operations.
 * Future milestones register browser-based engines (e.g. pdf-lib, PDF.js)
 * or remote worker adapters without changing UI components.
 */
export class PdfProcessingService {
  private readonly engines: Map<string, PdfProcessorEngine> = new Map();

  public registerEngine(engine: PdfProcessorEngine): void {
    this.engines.set(engine.id, engine);
  }

  public unregisterEngine(engineId: string): void {
    this.engines.delete(engineId);
  }

  public getEngineForOperation(
    operation: PdfOperationType
  ): PdfProcessorEngine | undefined {
    for (const engine of this.engines.values()) {
      if (engine.supportsOperation(operation)) {
        return engine;
      }
    }
    return undefined;
  }

  public isOperationAvailable(operation: PdfOperationType): boolean {
    return Boolean(this.getEngineForOperation(operation));
  }

  public listRegisteredEngines(): PdfProcessorEngine[] {
    return Array.from(this.engines.values());
  }

  public async processFiles(
    files: File[],
    options: PdfProcessingOptions,
    onProgress?: (progress: PdfProcessingProgress) => void,
    signal?: AbortSignal
  ): Promise<PdfProcessingResult> {
    const startedAt = performance.now();

    if (files.length === 0) {
      return {
        success: false,
        operation: options.operation,
        artifacts: [],
        durationMs: 0,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'At least one validated file is required before processing.',
          recoverable: true,
        },
      };
    }

    if (signal?.aborted) {
      return {
        success: false,
        operation: options.operation,
        artifacts: [],
        durationMs: 0,
        error: {
          code: 'CANCELLED',
          message: 'Processing was cancelled before starting.',
          recoverable: true,
        },
      };
    }

    const engine = this.getEngineForOperation(options.operation);

    if (!engine) {
      return {
        success: false,
        operation: options.operation,
        artifacts: [],
        durationMs: Math.round(performance.now() - startedAt),
        error: {
          code: 'NOT_IMPLEMENTED',
          message: `The "${options.operation}" processing engine is not yet enabled in Milestone 1.`,
          recoverable: false,
        },
      };
    }

    try {
      onProgress?.({
        status: 'validating',
        percentage: 0,
        stageLabel: 'Preparing files',
        processedFilesCount: 0,
        totalFilesCount: files.length,
      });

      return await engine.execute(files, options, onProgress, signal);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred during PDF processing.';
      return {
        success: false,
        operation: options.operation,
        artifacts: [],
        durationMs: Math.round(performance.now() - startedAt),
        error: {
          code: 'PROCESSING_FAILED',
          message,
          recoverable: true,
        },
      };
    }
  }
}

export const pdfProcessingService = new PdfProcessingService();
