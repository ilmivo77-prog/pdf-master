import React, {useId, useRef} from 'react';
import {X} from 'lucide-react';
import {cn} from '../../lib/cn';
import {IconButton} from './IconButton';
import {useOverlayFocus} from './useOverlayFocus';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  placement?: 'start' | 'end';
  children: React.ReactNode;
  closeLabel?: string;
  className?: string;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  placement = 'end',
  children,
  closeLabel = 'Close drawer',
  className,
}: DrawerProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useOverlayFocus(isOpen, onClose, panelRef);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex" role="presentation">
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
        tabIndex={-1}
        className={cn(
          'fixed top-0 bottom-0 z-10 flex w-full max-w-xs flex-col bg-white shadow-xl focus:outline-none',
          placement === 'end'
            ? 'end-0 border-s border-slate-200'
            : 'start-0 border-e border-slate-200',
          className
        )}
      >
        <div className="flex h-16 items-center justify-between gap-3 border-b border-slate-200 px-5">
          <h2 id={titleId} className="text-base font-semibold text-slate-900">
            {title}
          </h2>
          <IconButton
            aria-label={closeLabel}
            variant="ghost"
            size="sm"
            onClick={onClose}
            icon={<X className="h-5 w-5" aria-hidden="true" />}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
