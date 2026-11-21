import {forwardRef, useId} from 'react';
import {cn} from '../../lib/cn';

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      checked,
      onCheckedChange,
      label,
      description,
      disabled = false,
      id,
      className,
    },
    ref
  ) => {
    const generatedId = useId();
    const resolvedId = id ?? generatedId;

    return (
      <div className={cn('flex items-center justify-between gap-4 py-1', className)}>
        {(label || description) && (
          <label
            htmlFor={resolvedId}
            className={cn(
              'min-w-0 flex-1 cursor-pointer select-none',
              disabled && 'cursor-not-allowed opacity-60'
            )}
          >
            {label && (
              <span className="block text-sm font-medium text-slate-900">
                {label}
              </span>
            )}
            {description && (
              <span className="mt-0.5 block text-xs text-slate-600">
                {description}
              </span>
            )}
          </label>
        )}

        <button
          ref={ref}
          id={resolvedId}
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onCheckedChange(!checked)}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-50',
            checked ? 'bg-blue-700' : 'bg-slate-300'
          )}
        >
          <span className="sr-only">{label ?? 'Toggle switch'}</span>
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-xs transition-transform duration-150',
              checked
                ? 'translate-x-5 rtl:-translate-x-5'
                : 'translate-x-0'
            )}
          />
        </button>
      </div>
    );
  }
);

Switch.displayName = 'Switch';
