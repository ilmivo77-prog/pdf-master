import React from 'react';
import {cn} from '../../lib/cn';

export interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  action,
  as: HeadingTag = 'h2',
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        className
      )}
    >
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="text-xs font-semibold text-blue-700">{eyebrow}</p>
        )}
        <HeadingTag
          className={cn(
            'font-bold tracking-tight text-slate-900 text-balance',
            eyebrow && 'mt-1.5',
            HeadingTag === 'h1'
              ? 'text-3xl sm:text-4xl'
              : HeadingTag === 'h3'
                ? 'text-xl sm:text-2xl'
                : 'text-2xl sm:text-3xl'
          )}
        >
          {title}
        </HeadingTag>
        {subtitle && (
          <p className="mt-2 text-sm sm:text-base leading-relaxed text-slate-600">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
