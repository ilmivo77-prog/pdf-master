import React, {forwardRef, useId} from 'react';
import {cn} from '../../lib/cn';

export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  hasError?: boolean;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      id,
      label,
      description,
      hasError = false,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const resolvedId = id ?? generatedId;

    return (
      <label
        htmlFor={resolvedId}
        className={cn(
          'inline-flex min-h-[44px] cursor-pointer items-start gap-3 py-2 select-none',
          disabled && 'cursor-not-allowed opacity-60',
          className
        )}
      >
        <span className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
          <input
            ref={ref}
            id={resolvedId}
            type="radio"
            disabled={disabled}
            aria-invalid={hasError || props['aria-invalid']}
            className={cn(
              'peer h-5 w-5 appearance-none rounded-full border bg-white transition-colors duration-150 checked:border-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed',
              hasError ? 'border-red-600' : 'border-slate-300'
            )}
            {...props}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute h-2.5 w-2.5 rounded-full bg-blue-700 opacity-0 transition-opacity duration-100 peer-checked:opacity-100"
          />
        </span>

        {(label || description) && (
          <span className="text-sm leading-snug">
            {label && (
              <span className="block font-medium text-slate-900">{label}</span>
            )}
            {description && (
              <span className="mt-0.5 block text-xs text-slate-600">
                {description}
              </span>
            )}
          </span>
        )}
      </label>
    );
  }
);

Radio.displayName = 'Radio';

export interface RadioGroupProps {
  label?: string;
  children: React.ReactNode;
  className?: string;
}

export function RadioGroup({label, children, className}: RadioGroupProps) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('space-y-1', className)}>
      {children}
    </div>
  );
}
