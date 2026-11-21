import React, {forwardRef} from 'react';
import {cn} from '../../lib/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

const PADDING_CLASSES: Record<NonNullable<CardProps['padding']>, string> = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({padding = 'md', interactive = false, className, children, ...props}, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl border border-slate-200 bg-white transition-colors duration-150',
          interactive && 'hover:border-slate-300 hover:bg-slate-50/60',
          PADDING_CLASSES[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export function CardHeader({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn('space-y-1', className)}>{children}</div>;
}

export function CardTitle({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <h3 className={cn('text-base font-semibold text-slate-900', className)}>
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p className={cn('text-sm leading-relaxed text-slate-600', className)}>
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn('mt-4', className)}>{children}</div>;
}

export function CardFooter({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-3.5',
        className
      )}
    >
      {children}
    </div>
  );
}
