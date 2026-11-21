import {Alert, Button} from '../../../components/ui';
import {useTranslation} from '../../../services/localization/i18nService';
import type {ProcessingError} from '../engine';

export interface ErrorPanelProps {
  error: ProcessingError;
  onRetry?: () => void;
  className?: string;
}

export function ErrorPanel({error, onRetry, className}: ErrorPanelProps) {
  const {t} = useTranslation();

  // Never render developerDetail to end users; map via the i18n error taxonomy.
  const userMessage = t.processingErrors[error.messageKey] ?? t.processingErrors.unknown;

  return (
    <Alert
      variant={error.code === 'CANCELLED' ? 'warning' : 'danger'}
      title={t.processing.statusLabels[error.code === 'CANCELLED' ? 'cancelled' : 'failed']}
      className={className}
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
  );
}
