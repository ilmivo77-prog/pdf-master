import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from 'lucide-react';
import {cn} from '../../lib/cn';

export type ToastVariant = 'info' | 'success' | 'warning' | 'danger';

export interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
}

export interface ToastRecord extends ToastInput {
  id: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toasts: ToastRecord[];
  showToast: (input: ToastInput) => string;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_META: Record<
  ToastVariant,
  {border: string; iconColor: string; Icon: React.ComponentType<{className?: string}>}
> = {
  info: {border: 'border-sky-200', iconColor: 'text-sky-700', Icon: Info},
  success: {
    border: 'border-emerald-200',
    iconColor: 'text-emerald-700',
    Icon: CheckCircle2,
  },
  warning: {
    border: 'border-amber-200',
    iconColor: 'text-amber-800',
    Icon: AlertTriangle,
  },
  danger: {
    border: 'border-red-200',
    iconColor: 'text-red-700',
    Icon: AlertCircle,
  },
};

export function ToastProvider({children}: {children: React.ReactNode}) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    ({title, description, variant = 'info', durationMs = 4500}: ToastInput) => {
      const id =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      setToasts((prev) => [...prev, {id, title, description, variant, durationMs}]);

      if (durationMs > 0) {
        window.setTimeout(() => {
          dismissToast(id);
        }, durationMs);
      }

      return id;
    },
    [dismissToast]
  );

  const value = useMemo(
    () => ({toasts, showToast, dismissToast}),
    [toasts, showToast, dismissToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed bottom-4 end-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2.5"
      >
        {toasts.map((toast) => {
          const {border, iconColor, Icon} = VARIANT_META[toast.variant];
          return (
            <div
              key={toast.id}
              role="status"
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-xl border bg-white p-4 shadow-lg shadow-slate-900/10',
                border
              )}
            >
              <Icon
                aria-hidden="true"
                className={cn('mt-0.5 h-5 w-5 shrink-0', iconColor)}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
                {toast.description && (
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                    {toast.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label={`Dismiss notification: ${toast.title}`}
                className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 shrink-0"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
