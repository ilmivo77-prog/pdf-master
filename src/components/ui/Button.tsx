import React, {forwardRef} from 'react';
import {cn} from '../../lib/cn';
import {Spinner} from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-blue-700 text-white hover:bg-blue-800 active:bg-blue-900 focus-visible:outline-blue-700',
  secondary:
    'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100 focus-visible:outline-slate-900',
  ghost:
    'bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 focus-visible:outline-slate-900',
  danger:
    'bg-red-700 text-white hover:bg-red-800 active:bg-red-900 focus-visible:outline-red-700',
  link:
    'bg-transparent text-blue-700 underline-offset-4 hover:underline hover:text-blue-800 active:text-blue-900 focus-visible:outline-blue-700 px-1',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'min-h-[44px] min-w-[44px] px-3.5 py-2 text-xs',
  md: 'min-h-[44px] min-w-[44px] px-5 py-2.5 text-sm',
  lg: 'min-h-[48px] min-w-[48px] px-6 py-3 text-base',
};

/**
 * Interactive states:
 * - hover/active: <=150ms color transition
 * - disabled/loading: opacity-50, pointer-events blocked via native disabled
 * - focus-visible: high-contrast 2px ring
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      type = 'button',
      className,
      children,
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
          'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap shrink-0',
          VARIANT_CLASSES[variant],
          variant === 'link' ? 'min-h-[44px] min-w-[44px]' : SIZE_CLASSES[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Spinner size={size === 'lg' ? 'md' : 'sm'} label={loadingText ?? 'Loading'} />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{isLoading && loadingText ? loadingText : children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
