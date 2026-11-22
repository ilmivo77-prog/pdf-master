import React from 'react';
import {Alert, Button} from '../../../components/ui';
import {cn} from '../../../lib/cn';
import {useTranslation} from '../../../services/localization/i18nService';
import type {ProcessingError} from '../engine';

export interface ErrorPanelProps {
  error: ProcessingError;
  onRetry?: () => void;
  panelRef?: React.Ref<HTMLDivElement>;
  className?: string;
}

export function ErrorPanel({
  error,
  onRetry,
  panelRef,
  className,
}: ErrorPanelProps) {
  const {t} = useTranslation();

  // Never render developerDetail to end users; map via the i18n error taxonomy.
  const userMessage = t.processingErrors[error.messageKey] ?? t.processingErrors.unknown;

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      className={cn(
        'rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700',
        className
      )}
    >
      <Alert
        variant={error.code === 'CANCELLED' ? 'warning' : 'danger'}
        title={t.processing.statusLabels[error.code === 'CANCELLED' ? 'cancelled' : 'failed']}
      >
        <div className="space-y-3">
          <p>{userMessage}</p>
          {onRetry && (
            <div>
              <Button variant="secondary" size="sm" onClick={onRetry}>
                {t.processing.retryButton}
              </Button>
            </div>
          )}
        </div>
      </Alert>
    </div>
  );
}
