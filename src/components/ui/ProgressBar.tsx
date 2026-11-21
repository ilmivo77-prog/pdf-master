import {cn} from '../../lib/cn';

export interface ProgressBarProps {
  value?: number;
  max?: number;
  indeterminate?: boolean;
  label?: string;
  showValue?: boolean;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}

const BAR_COLORS: Record<NonNullable<ProgressBarProps['variant']>, string> = {
  primary: 'bg-blue-700',
  success: 'bg-emerald-700',
  warning: 'bg-amber-600',
  danger: 'bg-red-700',
};

export function ProgressBar({
  value = 0,
  max = 100,
  indeterminate = false,
  label,
  showValue = false,
  variant = 'primary',
  className,
}: ProgressBarProps) {
  const safeMax = max > 0 ? max : 100;
  const clamped = Math.min(Math.max(value, 0), safeMax);
  const percentage = Math.round((clamped / safeMax) * 100);

  return (
    <div className={cn('w-full', className)}>
      {(label || (showValue && !indeterminate)) && (
        <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
          {label ? (
            <span className="font-medium text-slate-700">{label}</span>
          ) : (
            <span />
          )}
          {showValue && !indeterminate && (
            <span className="font-mono tabular-nums text-slate-600">
              {percentage}%
            </span>
          )}
        </div>
      )}

      <div
        role="progressbar"
        aria-label={label ?? 'Progress'}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={indeterminate ? undefined : clamped}
        className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200"
      >
        {indeterminate ? (
          <div
            className={cn(
              'h-full w-1/3 rounded-full pm-progress-indeterminate',
              BAR_COLORS[variant]
            )}
          />
        ) : (
          <div
            className={cn(
              'h-full rounded-full transition-[width] duration-150',
              BAR_COLORS[variant]
            )}
            style={{width: `${percentage}%`}}
          />
        )}
      </div>
    </div>
  );
}
