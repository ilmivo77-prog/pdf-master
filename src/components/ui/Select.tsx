import React, {forwardRef} from 'react';
import {ChevronDown} from 'lucide-react';
import {cn} from '../../lib/cn';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
  options?: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({hasError = false, options, children, className, disabled, ...props}, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          disabled={disabled}
          aria-invalid={hasError || props['aria-invalid']}
          className={cn(
            'w-full appearance-none rounded-lg border bg-white py-2.5 ps-3.5 pe-10 text-sm text-slate-900 transition-colors duration-150 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 min-h-[44px]',
            hasError
              ? 'border-red-600 focus:border-red-700 focus:ring-red-600/15'
              : 'border-slate-300 focus:border-blue-700 focus:ring-blue-700/15',
            className
          )}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
        />
      </div>
    );
  }
);

Select.displayName = 'Select';
