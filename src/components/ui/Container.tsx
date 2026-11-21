import React from 'react';
import {cn} from '../../lib/cn';

export interface ContainerProps {
  children: React.ReactNode;
  size?: 'narrow' | 'standard' | 'wide';
  className?: string;
}

const WIDTH_CLASSES: Record<NonNullable<ContainerProps['size']>, string> = {
  narrow: 'max-w-3xl',
  standard: 'max-w-6xl',
  wide: 'max-w-7xl',
};

export function Container({
  children,
  size = 'standard',
  className,
}: ContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-4 sm:px-6 lg:px-8',
        WIDTH_CLASSES[size],
        className
      )}
    >
      {children}
    </div>
  );
}
