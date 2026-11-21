import React from 'react';
import {cn} from '../../lib/cn';
import {Container} from '../ui/Container';

export interface PageHeroProps {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  aside?: React.ReactNode;
  containerSize?: 'narrow' | 'standard' | 'wide';
  className?: string;
}

export function PageHero({
  title,
  description,
  eyebrow,
  actions,
  aside,
  containerSize = 'standard',
  className,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        'border-b border-slate-200 bg-white py-10 sm:py-14',
        className
      )}
    >
      <Container size={containerSize}>
        <div
          className={cn(
            Boolean(aside) &&
              'grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12'
          )}
        >
          <div className={cn(aside ? 'lg:col-span-7' : 'max-w-3xl')}>
            {eyebrow && (
              <p className="text-xs font-semibold text-blue-700">{eyebrow}</p>
            )}
            <h1
              className={cn(
                'text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-[1.15] text-balance',
                eyebrow && 'mt-2'
              )}
            >
              {title}
            </h1>
            {description && (
              <p className="mt-3 text-base sm:text-lg leading-relaxed text-slate-600">
                {description}
              </p>
            )}
            {actions && (
              <div className="mt-6 flex flex-wrap items-center gap-3">{actions}</div>
            )}
          </div>

          {aside && <div className="lg:col-span-5">{aside}</div>}
        </div>
      </Container>
    </section>
  );
}
