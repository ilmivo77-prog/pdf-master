import React from 'react';
import {cn} from '../../lib/cn';
import {Container} from '../ui/Container';

export interface ContentSectionProps {
  id?: string;
  'aria-labelledby'?: string;
  children: React.ReactNode;
  surface?: 'canvas' | 'white';
  bordered?: boolean;
  spacing?: 'compact' | 'standard';
  containerSize?: 'narrow' | 'standard' | 'wide';
  className?: string;
}

export function ContentSection({
  id,
  'aria-labelledby': ariaLabelledBy,
  children,
  surface = 'canvas',
  bordered = false,
  spacing = 'standard',
  containerSize = 'standard',
  className,
}: ContentSectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={ariaLabelledBy}
      className={cn(
        surface === 'white' ? 'bg-white' : 'bg-slate-50',
        bordered && 'border-y border-slate-200',
        spacing === 'compact' ? 'py-10 sm:py-12' : 'py-12 sm:py-16 lg:py-20',
        className
      )}
    >
      <Container size={containerSize}>{children}</Container>
    </section>
  );
}
