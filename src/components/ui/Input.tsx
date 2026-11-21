import React, {forwardRef} from 'react';
import {cn} from '../../lib/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      hasError = false,
      leftElement,
      rightElement,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <div className="relative flex items-center">
        {leftElement && (
          <span className="pointer-events-none absolute start-3.5 flex items-center text-slate-400">
            {leftElement}
          </span>
        )}
        <input
          ref={ref}
          disabled={disabled}
          aria-invalid={hasError || props['aria-invalid']}
          className={cn(
            'w-full rounded-lg border bg-white py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors duration-150 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 min-h-[44px]',
            leftElement ? 'ps-10' : 'ps-3.5',
            rightElement ? 'pe-10' : 'pe-3.5',
            hasError
              ? 'border-red-600 focus:border-red-700 focus:ring-red-600/15'
              : 'border-slate-300 focus:border-blue-700 focus:ring-blue-700/15',
            className
          )}
          {...props}
        />
        {rightElement && (
          <span className="absolute end-3.5 flex items-center text-slate-500">
            {rightElement}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
