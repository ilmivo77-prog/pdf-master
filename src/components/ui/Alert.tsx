import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from 'lucide-react';
import {cn} from '../../lib/cn';

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  dismissLabel?: string;
  className?: string;
}

const VARIANT_STYLES: Record<
  AlertVariant,
  {container: string; iconClass: string; Icon: React.ComponentType<{className?: string}>}
> = {
  info: {
    container: 'border-sky-200 bg-sky-50 text-slate-900',
    iconClass: 'text-sky-700',
    Icon: Info,
  },
  success: {
    container: 'border-emerald-200 bg-emerald-50 text-slate-900',
    iconClass: 'text-emerald-700',
    Icon: CheckCircle2,
  },
  warning: {
    container: 'border-amber-200 bg-amber-50 text-slate-900',
    iconClass: 'text-amber-800',
    Icon: AlertTriangle,
  },
  danger: {
    container: 'border-red-200 bg-red-50 text-slate-900',
    iconClass: 'text-red-700',
    Icon: AlertCircle,
  },
};

export function Alert({
  variant = 'info',
  title,
  children,
  onDismiss,
  dismissLabel = 'Dismiss alert',
  className,
}: AlertProps) {
  const {container, iconClass, Icon} = VARIANT_STYLES[variant];
  const role = variant === 'danger' || variant === 'warning' ? 'alert' : 'status';

  return (
    <div
      role={role}
      className={cn(
        'rounded-xl border p-4 text-sm',
        container,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', iconClass)} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          {title && (
            <p className="font-semibold text-slate-900">{title}</p>
          )}
          <div className={cn('text-slate-700 leading-relaxed', title && 'mt-1')}>
            {children}
          </div>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label={dismissLabel}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-black/5 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 shrink-0"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
