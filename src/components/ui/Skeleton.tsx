import {cn} from '../../lib/cn';

export interface SkeletonProps {
  variant?: 'text' | 'rect' | 'circle';
  className?: string;
}

export function Skeleton({variant = 'text', className}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse bg-slate-200 motion-reduce:animate-none',
        variant === 'text' && 'h-4 w-full rounded',
        variant === 'rect' && 'h-24 w-full rounded-xl',
        variant === 'circle' && 'h-10 w-10 rounded-full',
        className
      )}
    />
  );
}
