import {cn} from '../../lib/cn';

export interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<SpinnerProps['size']>, string> = {
  xs: 'h-3.5 w-3.5',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-7 w-7',
};

export function Spinner({
  size = 'md',
  label = 'Loading',
  className,
}: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn('inline-flex items-center justify-center', className)}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className={cn(
          SIZE_CLASSES[size],
          'animate-spin motion-reduce:animate-none'
        )}
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeWidth="2.5"
          className="opacity-25"
        />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="opacity-90"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}
