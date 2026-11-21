import type {
  ProcessingError,
  ProcessingJob,
  ProcessingJobInputFile,
  ProcessingJobStatus,
  ProcessingProgress,
  ProcessingResult,
} from './types';

export const ALLOWED_JOB_TRANSITIONS: Record<
  ProcessingJobStatus,
  readonly ProcessingJobStatus[]
> = {
  idle: ['validating', 'cancelled'],
  validating: ['queued', 'failed', 'cancelled'],
  queued: ['processing', 'failed', 'cancelled'],
  processing: ['succeeded', 'failed', 'cancelled'],
  succeeded: [],
  failed: [],
  cancelled: [],
};

export class IllegalJobTransitionError extends Error {
  public readonly from: ProcessingJobStatus;
  public readonly to: ProcessingJobStatus;

  constructor(from: ProcessingJobStatus, to: ProcessingJobStatus) {
    super(`Illegal job status transition: "${from}" -> "${to}".`);
    this.name = 'IllegalJobTransitionError';
    this.from = from;
    this.to = to;
  }
}

export function canTransitionJobStatus(
  from: ProcessingJobStatus,
  to: ProcessingJobStatus
): boolean {
  return ALLOWED_JOB_TRANSITIONS[from].includes(to);
}

export function assertValidJobTransition(
  from: ProcessingJobStatus,
  to: ProcessingJobStatus
): void {
  if (!canTransitionJobStatus(from, to)) {
    throw new IllegalJobTransitionError(from, to);
  }
}

export function createProcessingJob<TOptions = Record<string, unknown>>(params: {
  id: string;
  toolId: string;
  inputFiles: ProcessingJobInputFile[];
  options: TOptions;
  createdAt?: number;
}): ProcessingJob<TOptions> {
  return {
    id: params.id,
    toolId: params.toolId,
    inputFiles: params.inputFiles,
    options: params.options,
    status: 'idle',
    progress: {
      mode: 'determinate',
      percent: 0,
    },
    createdAt: params.createdAt ?? Date.now(),
  };
}

export type ProcessingJobAction<TOptions = Record<string, unknown>> =
  | {type: 'START_VALIDATING'}
  | {type: 'QUEUE'}
  | {type: 'START_PROCESSING'; startedAt?: number}
  | {type: 'PROGRESS'; progress: ProcessingProgress}
  | {type: 'SUCCEED'; result: ProcessingResult; finishedAt?: number}
  | {type: 'FAIL'; error: ProcessingError; finishedAt?: number}
  | {type: 'CANCEL'; error?: ProcessingError; finishedAt?: number}
  | {
      type: 'RESET';
      nextJob: ProcessingJob<TOptions>;
    };

function clampMonotonicPercent(current: number, incoming: number): number {
  if (!Number.isFinite(incoming)) {
    return current;
  }
  const bounded = Math.min(100, Math.max(0, Math.round(incoming)));
  return Math.max(current, bounded);
}

export function jobReducer<TOptions = Record<string, unknown>>(
  state: ProcessingJob<TOptions>,
  action: ProcessingJobAction<TOptions>
): ProcessingJob<TOptions> {
  switch (action.type) {
    case 'RESET':
      return action.nextJob;

    case 'START_VALIDATING': {
      assertValidJobTransition(state.status, 'validating');
      return {
        ...state,
        status: 'validating',
        progress: {
          mode: 'determinate',
          percent: 0,
          stageLabel: state.progress.stageLabel,
        },
      };
    }

    case 'QUEUE': {
      assertValidJobTransition(state.status, 'queued');
      return {
        ...state,
        status: 'queued',
      };
    }

    case 'START_PROCESSING': {
      assertValidJobTransition(state.status, 'processing');
      return {
        ...state,
        status: 'processing',
        startedAt: action.startedAt ?? Date.now(),
      };
    }

    case 'PROGRESS': {
      if (state.status !== 'processing' && state.status !== 'validating') {
        return state;
      }
      return {
        ...state,
        progress: {
          mode: action.progress.mode,
          percent:
            action.progress.mode === 'determinate'
              ? clampMonotonicPercent(state.progress.percent, action.progress.percent)
              : state.progress.percent,
          stageLabel: action.progress.stageLabel ?? state.progress.stageLabel,
        },
      };
    }

    case 'SUCCEED': {
      assertValidJobTransition(state.status, 'succeeded');
      return {
        ...state,
        status: 'succeeded',
        finishedAt: action.finishedAt ?? Date.now(),
        progress: {
          mode: 'determinate',
          percent: 100,
          stageLabel: state.progress.stageLabel,
        },
        result: action.result,
        error: undefined,
      };
    }

    case 'FAIL': {
      assertValidJobTransition(state.status, 'failed');
      return {
        ...state,
        status: 'failed',
        finishedAt: action.finishedAt ?? Date.now(),
        error: action.error,
      };
    }

    case 'CANCEL': {
      assertValidJobTransition(state.status, 'cancelled');
      return {
        ...state,
        status: 'cancelled',
        finishedAt: action.finishedAt ?? Date.now(),
        error: action.error,
      };
    }
  }
}
