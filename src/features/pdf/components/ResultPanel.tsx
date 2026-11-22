import {Archive, Download, FileText, Trash2} from 'lucide-react';
import {Alert, Button, Card} from '../../../components/ui';
import {triggerOutputDownload} from '../../../services/file/downloadManager';
import {formatBytes} from '../../../services/file/fileValidation';
import {useTranslation} from '../../../services/localization/i18nService';
import type {OutputFile, ProcessingResult} from '../engine';

export interface ResultPanelProps {
  result: ProcessingResult;
  onDiscard: () => void;
  onDownload?: (output: OutputFile) => void;
  discardLabel?: string;
  className?: string;
}

export function ResultPanel({
  result,
  onDiscard,
  onDownload,
  discardLabel,
  className,
}: ResultPanelProps) {
  const {t} = useTranslation();

  const handleDownload = (output: OutputFile) => {
    if (onDownload) {
      onDownload(output);
    } else {
      triggerOutputDownload(output);
    }
  };

  const showMetadata = !result.stats.isEncrypted;
  const archive = result.archive;

  return (
    <Card padding="md" className={className}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {t.processing.statsHeading}
            </h2>
            <p className="mt-0.5 font-mono text-xs tabular-nums text-slate-500">
              {result.stats.durationMs} ms ·{' '}
              {formatBytes(result.stats.inputTotalBytes)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {archive && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Archive className="h-4 w-4" aria-hidden="true" />}
                onClick={() => handleDownload(archive)}
              >
                {t.processing.downloadAllZipButton}
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
              onClick={onDiscard}
            >
              {discardLabel ?? t.processing.discardResultsButton}
            </Button>
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {typeof result.stats.pageCount === 'number' && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5">
              <dt className="text-xs text-slate-500">
                {t.processing.pagesLabel}
              </dt>
              <dd className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-slate-900">
                {result.stats.pageCount}
              </dd>
            </div>
          )}

          {result.outputs.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5">
              <dt className="text-xs text-slate-500">
                {t.processing.outputCountLabel}
              </dt>
              <dd className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-slate-900">
                {result.outputs.length}
              </dd>
            </div>
          )}

          {typeof result.stats.isEncrypted === 'boolean' && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5">
              <dt className="text-xs text-slate-500">
                {t.processing.protectedLabel}
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-900">
                {result.stats.isEncrypted
                  ? t.processing.protectedYes
                  : t.processing.protectedNo}
              </dd>
            </div>
          )}

          {showMetadata && result.stats.metadata?.title && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5">
              <dt className="text-xs text-slate-500">
                {t.processing.metadataTitleLabel}
              </dt>
              <dd className="mt-0.5 truncate text-sm font-medium text-slate-900">
                {result.stats.metadata.title}
              </dd>
            </div>
          )}

          {showMetadata && result.stats.metadata?.producer && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5">
              <dt className="text-xs text-slate-500">
                {t.processing.metadataProducerLabel}
              </dt>
              <dd className="mt-0.5 truncate text-sm font-medium text-slate-900">
                {result.stats.metadata.producer}
              </dd>
            </div>
          )}
        </dl>

        {result.stats.interactiveFeaturesDetected && (
          <Alert variant="warning" title={t.processing.warningsHeading}>
            <p>{t.processing.interactiveFeaturesNote}</p>
          </Alert>
        )}

        {result.warnings.length > 0 && (
          <Alert variant="warning" title={t.processing.warningsHeading}>
            <ul className="list-disc space-y-1 ps-4">
              {result.warnings.map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
          </Alert>
        )}

        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            {t.processing.outputsHeading}
          </h3>

          {result.outputs.length > 0 ? (
            <ul className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
              {result.outputs.map((output, index) => (
                <li
                  key={`${output.name}-${index}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                      <FileText className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {output.name}
                      </p>
                      <p className="font-mono text-xs tabular-nums text-slate-500">
                        {formatBytes(output.size)} · {output.mimeType}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant={archive ? 'secondary' : 'primary'}
                    size="sm"
                    leftIcon={<Download className="h-4 w-4" aria-hidden="true" />}
                    onClick={() => handleDownload(output)}
                  >
                    {t.processing.downloadButton}
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-600">
              {t.processing.noOutputsNotice}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
