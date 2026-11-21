import React, {forwardRef} from 'react';
import {cn} from '../../lib/cn';
import {Spinner} from './Spinner';

export type IconButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  isLoading?: boolean;
  icon: React.ReactNode;
}

const VARIANT_CLASSES: Record<IconButtonVariant, string> = {
  primary:
    'bg-blue-700 text-white hover:bg-blue-800 active:bg-blue-900 focus-visible:outline-blue-700',
  secondary:
    'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 focus-visible:outline-slate-900',
  ghost:
    'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 focus-visible:outline-slate-900',
  danger:
    'bg-transparent text-red-700 hover:bg-red-50 active:bg-red-100 focus-visible:outline-red-700',
};

const SIZE_CLASSES: Record<IconButtonSize, string> = {
  sm: 'min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px]',
  md: 'min-h-[44px] min-w-[44px]',
  lg: 'min-h-[48px] min-w-[48px]',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      variant = 'ghost',
      size = 'md',
      isLoading = false,
      disabled,
      type = 'button',
      icon,
      className,
      ...props
    },
    ref
  ) => {
    const isDisabled = Boolean(disabled || isLoading);

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading || undefined}
        className={cn(
          'inline-flex items-center justify-center rounded-lg transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 shrink-0',
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className
        )}
        {...props}
      >
        {isLoading ? <Spinner size="sm" label={props['aria-label']} /> : icon}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
