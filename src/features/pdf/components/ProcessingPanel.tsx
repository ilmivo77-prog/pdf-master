import {Badge, Button, Card, ProgressBar} from '../../../components/ui';
import {useTranslation} from '../../../services/localization/i18nService';
import type {ProcessingJob} from '../engine';

export interface ProcessingPanelProps {
  job: ProcessingJob;
  elapsedMs: number;
  onCancel?: () => void;
  className?: string;
}

function formatElapsedSeconds(ms: number): string {
  const seconds = Math.max(0, ms) / 1000;
  return `${seconds.toFixed(1)}s`;
}

export function ProcessingPanel({
  job,
  elapsedMs,
  onCancel,
  className,
}: ProcessingPanelProps) {
  const {t} = useTranslation();

  if (job.status === 'idle') {
    return null;
  }

  const isActive =
    job.status === 'validating' ||
    job.status === 'queued' ||
    job.status === 'processing';

  const statusLabel = t.processing.statusLabels[job.status];
  const badgeVariant =
    job.status === 'succeeded'
      ? 'success'
      : job.status === 'failed'
        ? 'danger'
        : job.status === 'cancelled'
          ? 'warning'
          : 'info';

  const progressVariant =
    job.status === 'succeeded'
      ? 'success'
      : job.status === 'failed'
        ? 'danger'
        : 'primary';

  const isIndeterminate =
    isActive && job.progress.mode === 'indeterminate';

  return (
    <Card padding="md" className={className}>
      <div className="space-y-4">
        <div
          aria-live="polite"
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5">
            <Badge variant={badgeVariant} size="sm">
              {statusLabel}
            </Badge>
            <span className="text-sm font-medium text-slate-800">
              {job.progress.stageLabel ?? t.processing.stageDefaultLabel}
            </span>
          </div>

          <span className="font-mono text-xs tabular-nums text-slate-500">
            {t.processing.elapsedLabel}: {formatElapsedSeconds(elapsedMs)}
          </span>
        </div>

        <ProgressBar
          value={job.progress.percent}
          indeterminate={isIndeterminate}
          showValue={!isIndeterminate}
          variant={progressVariant}
          label={statusLabel}
        />

        {isActive && onCancel && (
          <div className="flex justify-end">
            <Button variant="secondary" size="sm" onClick={onCancel}>
              {t.processing.cancelButton}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
