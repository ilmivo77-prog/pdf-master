import React, {forwardRef} from 'react';
import {cn} from '../../lib/cn';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({hasError = false, className, disabled, rows = 4, ...props}, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        disabled={disabled}
        aria-invalid={hasError || props['aria-invalid']}
        className={cn(
          'w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors duration-150 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500',
          hasError
            ? 'border-red-600 focus:border-red-700 focus:ring-red-600/15'
            : 'border-slate-300 focus:border-blue-700 focus:ring-blue-700/15',
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
