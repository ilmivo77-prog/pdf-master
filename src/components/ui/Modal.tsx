import React, {useId, useRef} from 'react';
import {X} from 'lucide-react';
import {cn} from '../../lib/cn';
import {IconButton} from './IconButton';
import {useOverlayFocus} from './useOverlayFocus';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  closeLabel?: string;
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeLabel = 'Close dialog',
  className,
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useOverlayFocus(isOpen, onClose, panelRef);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-[1px]"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'relative z-10 w-full rounded-2xl border border-slate-200 bg-white shadow-xl focus:outline-none',
          SIZE_CLASSES[size],
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-slate-900">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-sm text-slate-600">
                {description}
              </p>
            )}
          </div>
          <IconButton
            aria-label={closeLabel}
            variant="ghost"
            size="sm"
            onClick={onClose}
            icon={<X className="h-4 w-4" aria-hidden="true" />}
          />
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4 sm:px-6">
          {children}
        </div>

        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3.5 sm:px-6 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
