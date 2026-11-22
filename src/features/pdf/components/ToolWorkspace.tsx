import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  FileText,
  Play,
  Trash2,
} from 'lucide-react';
import {useCallback, useEffect, useId, useMemo, useRef, useState} from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  FieldError,
  HelpText,
  IconButton,
  Input,
  Label,
  Radio,
  RadioGroup,
  Spinner,
} from '../../../components/ui';
import {
  PROCESSING_LIMITS,
  validateJobLimits,
} from '../../../config/processingLimits';
import {sniffFileSignature} from '../../../services/file/fileValidation';
import {useTranslation} from '../../../services/localization/i18nService';
import type {FileValidationRule, ManagedFileItem} from '../../../types/file';
import type {PdfToolDefinition} from '../../../types/tool';
import {
  PdfWorkerClient,
  type ProcessingError,
  type ProcessingErrorMessageKey,
} from '../engine';
import type {SplitMode} from '../engine/engines/pdfSplitEngine';
import {useProcessingJob} from '../hooks/useProcessingJob';
import {
  chunkPagesBySize,
  invertPageSelection,
  parsePageRanges,
  splitEveryPage,
} from '../utils/pageRanges';
import {ErrorPanel} from './ErrorPanel';
import {FileDropzone} from './FileDropzone';
import {ProcessingPanel} from './ProcessingPanel';
import {ResultPanel} from './ResultPanel';

export interface ToolWorkspaceProps {
  tool: PdfToolDefinition;
  validationRule: FileValidationRule;
}

interface WorkspaceFileItem {
  managed: ManagedFileItem;
  inspectState: 'pending' | 'inspecting' | 'ready' | 'error';
  pageCount?: number;
  errorMessageKey?: ProcessingErrorMessageKey;
}

function isProcessingError(value: unknown): value is ProcessingError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'messageKey' in value &&
    'recoverable' in value
  );
}

export function ToolWorkspace({tool, validationRule}: ToolWorkspaceProps) {
  const {t} = useTranslation();
  const splitRangesId = useId();
  const splitEveryNId = useId();
  const extractRangesId = useId();
  const removeRangesId = useId();

  const [items, setItems] = useState<WorkspaceFileItem[]>([]);
  const [splitMode, setSplitMode] = useState<SplitMode>('ranges');
  const [rangesText, setRangesText] = useState('1');
  const [everyNText, setEveryNText] = useState('1');

  const {job, elapsedMs, isRunning, startJob, cancelJob, discardResults} =
    useProcessingJob();

  const inspectClientRef = useRef<PdfWorkerClient | null>(null);
  const inspectAbortRef = useRef<AbortController | null>(null);
  const isInspectingLoopRef = useRef(false);

  const dropzoneSelectButtonRef = useRef<HTMLButtonElement>(null);
  const runButtonRef = useRef<HTMLButtonElement>(null);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  const errorPanelRef = useRef<HTMLDivElement>(null);
  const userInitiatedJobRef = useRef(false);
  const prevJobStatusRef = useRef(job.status);

  useEffect(() => {
    return () => {
      inspectAbortRef.current?.abort();
      inspectAbortRef.current = null;
      inspectClientRef.current?.dispose();
      inspectClientRef.current = null;
    };
  }, []);

  useEffect(() => {
    const prevStatus = prevJobStatusRef.current;
    prevJobStatusRef.current = job.status;

    if (!userInitiatedJobRef.current) {
      return;
    }

    if (prevStatus !== 'succeeded' && job.status === 'succeeded') {
      requestAnimationFrame(() => {
        resultHeadingRef.current?.focus();
      });
    } else if (
      prevStatus !== job.status &&
      (job.status === 'failed' || job.status === 'cancelled')
    ) {
      requestAnimationFrame(() => {
        errorPanelRef.current?.focus();
      });
    }
  }, [job.status]);

  const inspectNextPending = useCallback(async (currentItems: WorkspaceFileItem[]) => {
    if (isInspectingLoopRef.current) {
      return;
    }

    const pending = currentItems.find((item) => item.inspectState === 'pending');
    if (!pending) {
      return;
    }

    isInspectingLoopRef.current = true;
    const targetId = pending.managed.id;
    const targetFile = pending.managed.file;

    setItems((prev) =>
      prev.map((item) =>
        item.managed.id === targetId
          ? {...item, inspectState: 'inspecting'}
          : item
      )
    );

    const abortController = new AbortController();
    inspectAbortRef.current = abortController;

    try {
      const signature = await sniffFileSignature(targetFile);
      if (abortController.signal.aborted) {
        return;
      }

      if (signature !== 'pdf') {
        setItems((prev) =>
          prev.map((item) =>
            item.managed.id === targetId
              ? {...item, inspectState: 'error', errorMessageKey: 'notAPdf'}
              : item
          )
        );
        return;
      }

      if (targetFile.size > PROCESSING_LIMITS.maxFileSizeBytes) {
        setItems((prev) =>
          prev.map((item) =>
            item.managed.id === targetId
              ? {...item, inspectState: 'error', errorMessageKey: 'fileTooLarge'}
              : item
          )
        );
        return;
      }

      const bytes = await targetFile.arrayBuffer();
      if (abortController.signal.aborted) {
        return;
      }

      if (!inspectClientRef.current) {
        inspectClientRef.current = new PdfWorkerClient();
      }

      const result = await inspectClientRef.current.runJob({
        jobId: `inspect-${targetId}`,
        toolId: 'internal:pdf-inspect',
        files: [
          {
            name: pending.managed.metadata.sanitizedName,
            mimeType: pending.managed.metadata.mimeType,
            size: targetFile.size,
            bytes,
          },
        ],
        options: {mode: 'inspect'},
        timeoutMs: PROCESSING_LIMITS.jobTimeoutMs,
        signal: abortController.signal,
      });

      if (abortController.signal.aborted) {
        return;
      }

      if (result.stats.isEncrypted) {
        setItems((prev) =>
          prev.map((item) =>
            item.managed.id === targetId
              ? {
                  ...item,
                  inspectState: 'error',
                  errorMessageKey: 'passwordProtectedPdf',
                }
              : item
          )
        );
        return;
      }

      const pageCount = result.stats.pageCount ?? 0;
      setItems((prev) =>
        prev.map((item) =>
          item.managed.id === targetId
            ? {...item, inspectState: 'ready', pageCount}
            : item
        )
      );
    } catch (err) {
      if (abortController.signal.aborted) {
        return;
      }
      const messageKey: ProcessingErrorMessageKey = isProcessingError(err)
        ? err.messageKey
        : 'corruptPdf';
      setItems((prev) =>
        prev.map((item) =>
          item.managed.id === targetId
            ? {...item, inspectState: 'error', errorMessageKey: messageKey}
            : item
        )
      );
    } finally {
      if (inspectAbortRef.current === abortController) {
        inspectAbortRef.current = null;
      }
      isInspectingLoopRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (items.some((item) => item.inspectState === 'pending')) {
      void inspectNextPending(items);
    }
  }, [items, inspectNextPending]);

  const managedFiles = useMemo(
    () => items.map((item) => item.managed),
    [items]
  );

  const handleDropzoneFilesChange = (nextManaged: ManagedFileItem[]) => {
    discardResults();
    setItems((prev) => {
      const existingById = new Map(prev.map((entry) => [entry.managed.id, entry]));
      const nextItems = nextManaged.map((managed) => {
        const found = existingById.get(managed.id);
        return found
          ? found
          : {
              managed,
              inspectState: 'pending' as const,
            };
      });
      return nextItems;
    });
  };

  const handleRemoveItem = (id: string) => {
    discardResults();
    setItems((prev) => prev.filter((item) => item.managed.id !== id));
  };

  const handleMoveItem = (index: number, delta: -1 | 1) => {
    const targetIndex = index + delta;
    if (targetIndex < 0 || targetIndex >= items.length) {
      return;
    }
    discardResults();
    setItems((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(index, 1);
      copy.splice(targetIndex, 0, moved);
      return copy;
    });
  };

  const handleStartOver = () => {
    userInitiatedJobRef.current = false;
    inspectAbortRef.current?.abort();
    discardResults();
    setItems([]);
    requestAnimationFrame(() => {
      dropzoneSelectButtonRef.current?.focus();
    });
  };

  const isInspectingAny = items.some(
    (item) => item.inspectState === 'pending' || item.inspectState === 'inspecting'
  );
  const hasAnyInspectError = items.some((item) => item.inspectState === 'error');
  const readyItems = items.filter((item) => item.inspectState === 'ready');
  const totalPages = readyItems.reduce(
    (sum, item) => sum + (item.pageCount ?? 0),
    0
  );

  const batchLimitError = useMemo(() => {
    if (items.length === 0) {
      return null;
    }
    return validateJobLimits(
      items.map((item) => item.managed.file),
      {
        maxFileSizeBytes: PROCESSING_LIMITS.maxFileSizeBytes,
        maxTotalSizeBytes: PROCESSING_LIMITS.maxTotalSizeBytes,
        maxFilesCount:
          tool.id === 'merge-pdf' ? PROCESSING_LIMITS.maxFilesCount : 1,
      }
    );
  }, [items, tool.id]);

  const singlePageCount =
    readyItems.length === 1 ? (readyItems[0].pageCount ?? 0) : 0;

  const parsedRangeState = useMemo(() => {
    if (tool.id === 'merge-pdf' || singlePageCount < 1) {
      return null;
    }
    return parsePageRanges(rangesText, singlePageCount);
  }, [tool.id, singlePageCount, rangesText]);

  const everyNParsed = useMemo(() => {
    if (!/^[0-9]+$/.test(everyNText.trim())) {
      return null;
    }
    const parsed = Number(everyNText.trim());
    return Number.isInteger(parsed) && parsed >= 1 ? parsed : null;
  }, [everyNText]);

  const splitSummary = useMemo(() => {
    if (tool.id !== 'split-pdf' || singlePageCount < 1) {
      return {valid: false, outputCount: 0, errorMessage: undefined as string | undefined};
    }

    if (splitMode === 'ranges') {
      if (!parsedRangeState || !parsedRangeState.ok) {
        const errCode = parsedRangeState?.error.code ?? 'EMPTY_INPUT';
        return {
          valid: false,
          outputCount: 0,
          errorMessage: t.workspace.pageRangeErrors[errCode],
        };
      }
      const outputCount = parsedRangeState.value.segments.length;
      if (outputCount > PROCESSING_LIMITS.maxSplitOutputs) {
        return {
          valid: false,
          outputCount,
          errorMessage: `${t.workspace.split.tooManyOutputsPrefix} ${PROCESSING_LIMITS.maxSplitOutputs}${t.workspace.split.tooManyOutputsSuffix}`,
        };
      }
      return {valid: outputCount >= 1, outputCount, errorMessage: undefined};
    }

    if (splitMode === 'every-n') {
      if (!everyNParsed) {
        return {
          valid: false,
          outputCount: 0,
          errorMessage: t.workspace.split.everyNInvalid,
        };
      }
      const outputCount = chunkPagesBySize(singlePageCount, everyNParsed).length;
      if (outputCount > PROCESSING_LIMITS.maxSplitOutputs) {
        return {
          valid: false,
          outputCount,
          errorMessage: `${t.workspace.split.tooManyOutputsPrefix} ${PROCESSING_LIMITS.maxSplitOutputs}${t.workspace.split.tooManyOutputsSuffix}`,
        };
      }
      return {valid: true, outputCount, errorMessage: undefined};
    }

    const outputCount = splitEveryPage(singlePageCount).length;
    if (outputCount > PROCESSING_LIMITS.maxSplitOutputs) {
      return {
        valid: false,
        outputCount,
        errorMessage: `${t.workspace.split.tooManyOutputsPrefix} ${PROCESSING_LIMITS.maxSplitOutputs}${t.workspace.split.tooManyOutputsSuffix}`,
      };
    }
    return {valid: true, outputCount, errorMessage: undefined};
  }, [tool.id, singlePageCount, splitMode, parsedRangeState, everyNParsed, t]);

  const extractSummary = useMemo(() => {
    if (tool.id !== 'extract-pages' || singlePageCount < 1) {
      return {valid: false, pageCount: 0, errorMessage: undefined as string | undefined};
    }
    if (!parsedRangeState || !parsedRangeState.ok) {
      const errCode = parsedRangeState?.error.code ?? 'EMPTY_INPUT';
      return {
        valid: false,
        pageCount: 0,
        errorMessage: t.workspace.pageRangeErrors[errCode],
      };
    }
    return {
      valid: parsedRangeState.value.orderedPages.length > 0,
      pageCount: parsedRangeState.value.orderedPages.length,
      errorMessage: undefined,
    };
  }, [tool.id, singlePageCount, parsedRangeState, t]);

  const removeSummary = useMemo(() => {
    if (tool.id !== 'remove-pages' || singlePageCount < 1) {
      return {
        valid: false,
        removeCount: 0,
        keepCount: 0,
        errorMessage: undefined as string | undefined,
      };
    }
    if (!parsedRangeState || !parsedRangeState.ok) {
      const errCode = parsedRangeState?.error.code ?? 'EMPTY_INPUT';
      return {
        valid: false,
        removeCount: 0,
        keepCount: 0,
        errorMessage: t.workspace.pageRangeErrors[errCode],
      };
    }
    const keepPages = invertPageSelection(
      parsedRangeState.value.sortedPages,
      singlePageCount
    );
    if (keepPages.length === 0) {
      return {
        valid: false,
        removeCount: parsedRangeState.value.sortedPages.length,
        keepCount: 0,
        errorMessage: t.workspace.remove.removeAllError,
      };
    }
    return {
      valid: true,
      removeCount: parsedRangeState.value.sortedPages.length,
      keepCount: keepPages.length,
      errorMessage: undefined,
    };
  }, [tool.id, singlePageCount, parsedRangeState, t]);

  const canRun = useMemo(() => {
    if (isRunning || isInspectingAny || hasAnyInspectError || batchLimitError) {
      return false;
    }
    if (tool.id === 'merge-pdf') {
      return readyItems.length >= 2;
    }
    if (readyItems.length !== 1 || singlePageCount < 1) {
      return false;
    }
    if (tool.id === 'split-pdf') {
      return splitSummary.valid;
    }
    if (tool.id === 'extract-pages') {
      return extractSummary.valid;
    }
    if (tool.id === 'remove-pages') {
      return removeSummary.valid;
    }
    return false;
  }, [
    isRunning,
    isInspectingAny,
    hasAnyInspectError,
    batchLimitError,
    tool.id,
    readyItems.length,
    singlePageCount,
    splitSummary.valid,
    extractSummary.valid,
    removeSummary.valid,
  ]);

  const handleRun = () => {
    if (!canRun) {
      return;
    }

    userInitiatedJobRef.current = true;
    const files = items.map((item) => item.managed.file);
    let options: Record<string, unknown> = {};

    if (tool.id === 'split-pdf') {
      options = {
        mode: splitMode,
        rangesText,
        everyN: everyNParsed ?? 1,
      };
    } else if (tool.id === 'extract-pages' || tool.id === 'remove-pages') {
      options = {rangesText};
    }

    void startJob({
      toolId: tool.id,
      files,
      options,
      limits: {
        maxFileSizeBytes: PROCESSING_LIMITS.maxFileSizeBytes,
        maxTotalSizeBytes: PROCESSING_LIMITS.maxTotalSizeBytes,
        maxFilesCount:
          tool.id === 'merge-pdf' ? PROCESSING_LIMITS.maxFilesCount : 1,
        maxSplitOutputs: PROCESSING_LIMITS.maxSplitOutputs,
        jobTimeoutMs: PROCESSING_LIMITS.jobTimeoutMs,
      },
      requirePdfMagicBytes: true,
    });
  };

  const handleRetry = () => {
    userInitiatedJobRef.current = false;
    discardResults();
    requestAnimationFrame(() => {
      if (readyItems.length > 0 && runButtonRef.current && !runButtonRef.current.disabled) {
        runButtonRef.current.focus();
      } else {
        dropzoneSelectButtonRef.current?.focus();
      }
    });
  };

  const formatPagesBadge = (count: number) =>
    `${count} ${
      count === 1 ? t.workspace.pagesUnitSingular : t.workspace.pagesUnitPlural
    }`;

  return (
    <div className="space-y-6">
      <FileDropzone
        toolName={tool.name}
        validationRule={validationRule}
        controlledFiles={managedFiles}
        onFilesChange={handleDropzoneFilesChange}
        disabled={isRunning}
        hideQueue
        isLiveTool
        selectButtonRef={dropzoneSelectButtonRef}
      />

      <p className="text-xs text-slate-500">
        {t.toolLanding.livePrivacyNotice} {t.workspace.memoryNotice}
      </p>

      {batchLimitError && (
        <Alert variant="danger">
          {
            t.processingErrors[
              batchLimitError.code === 'TOO_MANY_FILES'
                ? 'tooManyFiles'
                : batchLimitError.code === 'FILE_TOO_LARGE'
                  ? 'fileTooLarge'
                  : 'invalidFile'
            ]
          }
        </Alert>
      )}

      {items.length > 0 && (
        <Card padding="none" className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3.5 sm:px-5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-sm font-semibold text-slate-900">
                {t.workspace.queueHeading} ({items.length})
              </h2>
              {totalPages > 0 && (
                <Badge variant="info" size="sm">
                  {t.workspace.totalPagesLabel}: {totalPages}
                </Badge>
              )}
            </div>

            {items.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                disabled={isRunning}
                onClick={handleStartOver}
              >
                {t.fileManager.clearAllButton}
              </Button>
            )}
          </div>

          <ul className="divide-y divide-slate-100">
            {items.map((item, index) => {
              const isMerge = tool.id === 'merge-pdf';
              return (
                <li
                  key={item.managed.id}
                  className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                >
                  <div className="flex min-w-0 items-start gap-3 sm:items-center">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <FileText className="h-4 w-4" aria-hidden="true" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {item.managed.metadata.sanitizedName}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 font-mono text-xs tabular-nums text-slate-500">
                        <span>{item.managed.metadata.formattedSize}</span>
                        {(item.inspectState === 'pending' ||
                          item.inspectState === 'inspecting') && (
                          <span className="inline-flex items-center gap-1.5 text-blue-700">
                            <Spinner size="sm" label={t.workspace.inspectingLabel} />
                            <span>{t.workspace.inspectingLabel}</span>
                          </span>
                        )}
                        {item.inspectState === 'ready' &&
                          typeof item.pageCount === 'number' && (
                            <Badge variant="success" size="sm">
                              {formatPagesBadge(item.pageCount)}
                            </Badge>
                          )}
                      </div>

                      {item.inspectState === 'error' && (
                        <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-red-700">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span>
                            {item.errorMessageKey
                              ? t.processingErrors[item.errorMessageKey]
                              : t.workspace.inspectErrorFallback}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 shrink-0">
                    {isMerge && (
                      <>
                        <IconButton
                          variant="secondary"
                          size="md"
                          disabled={isRunning || index === 0}
                          onClick={() => handleMoveItem(index, -1)}
                          aria-label={`${t.workspace.moveUpLabel} ${item.managed.metadata.sanitizedName}`}
                          icon={<ArrowUp className="h-4 w-4" aria-hidden="true" />}
                        />
                        <IconButton
                          variant="secondary"
                          size="md"
                          disabled={isRunning || index === items.length - 1}
                          onClick={() => handleMoveItem(index, 1)}
                          aria-label={`${t.workspace.moveDownLabel} ${item.managed.metadata.sanitizedName}`}
                          icon={<ArrowDown className="h-4 w-4" aria-hidden="true" />}
                        />
                      </>
                    )}
                    <IconButton
                      variant="danger"
                      size="md"
                      disabled={isRunning}
                      onClick={() => handleRemoveItem(item.managed.id)}
                      aria-label={`${t.fileManager.removeFileLabel} ${item.managed.metadata.sanitizedName}`}
                      icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {items.length > 0 && (
        <Card padding="md" className="space-y-5">
          {tool.id === 'merge-pdf' && (
            <>
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {t.workspace.merge.heading}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {t.workspace.merge.helperText}
                </p>
              </div>

              {readyItems.length < 2 && !isInspectingAny && (
                <Alert variant="warning">{t.workspace.merge.minFilesWarning}</Alert>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <Button
                  ref={runButtonRef}
                  variant="primary"
                  size="lg"
                  disabled={!canRun}
                  leftIcon={<Play className="h-4 w-4" aria-hidden="true" />}
                  onClick={handleRun}
                >
                  {t.workspace.merge.runButton}
                </Button>
              </div>
            </>
          )}

          {tool.id === 'split-pdf' && (
            <>
              <h2 className="text-base font-semibold text-slate-900">
                {t.workspace.split.heading}
              </h2>

              <RadioGroup label={t.workspace.split.modeLabel}>
                <Radio
                  name="split-mode"
                  value="ranges"
                  checked={splitMode === 'ranges'}
                  onChange={() => setSplitMode('ranges')}
                  disabled={isRunning}
                  label={t.workspace.split.modeRangesLabel}
                  description={t.workspace.split.modeRangesDesc}
                />
                <Radio
                  name="split-mode"
                  value="every-n"
                  checked={splitMode === 'every-n'}
                  onChange={() => setSplitMode('every-n')}
                  disabled={isRunning}
                  label={t.workspace.split.modeEveryNLabel}
                  description={t.workspace.split.modeEveryNDesc}
                />
                <Radio
                  name="split-mode"
                  value="every-page"
                  checked={splitMode === 'every-page'}
                  onChange={() => setSplitMode('every-page')}
                  disabled={isRunning}
                  label={t.workspace.split.modeEveryPageLabel}
                  description={t.workspace.split.modeEveryPageDesc}
                />
              </RadioGroup>

              {splitMode === 'ranges' && (
                <div>
                  <Label htmlFor={splitRangesId} required>
                    {t.workspace.split.rangesInputLabel}
                  </Label>
                  <Input
                    id={splitRangesId}
                    type="text"
                    value={rangesText}
                    onChange={(e) => setRangesText(e.target.value)}
                    disabled={isRunning}
                    hasError={Boolean(singlePageCount > 0 && splitSummary.errorMessage)}
                    placeholder={t.workspace.split.rangesPlaceholder}
                    className="mt-1.5 font-mono"
                  />
                  <HelpText>{t.workspace.split.rangesExamples}</HelpText>
                  {singlePageCount > 0 && splitSummary.errorMessage && (
                    <FieldError>{splitSummary.errorMessage}</FieldError>
                  )}
                </div>
              )}

              {splitMode === 'every-n' && (
                <div>
                  <Label htmlFor={splitEveryNId} required>
                    {t.workspace.split.everyNInputLabel}
                  </Label>
                  <Input
                    id={splitEveryNId}
                    type="number"
                    min={1}
                    max={Math.max(1, singlePageCount || 1000)}
                    value={everyNText}
                    onChange={(e) => setEveryNText(e.target.value)}
                    disabled={isRunning}
                    hasError={Boolean(singlePageCount > 0 && splitSummary.errorMessage)}
                    className="mt-1.5 max-w-[160px] font-mono"
                  />
                  {singlePageCount > 0 && splitSummary.errorMessage && (
                    <FieldError>{splitSummary.errorMessage}</FieldError>
                  )}
                </div>
              )}

              {splitMode === 'every-page' &&
                singlePageCount > 0 &&
                splitSummary.errorMessage && (
                  <Alert variant="danger">{splitSummary.errorMessage}</Alert>
                )}

              {singlePageCount > 0 && splitSummary.valid && (
                <p aria-live="polite" className="text-sm font-medium text-slate-700">
                  {splitSummary.outputCount === 1
                    ? t.workspace.split.summaryOneOutput
                    : `${t.workspace.split.summaryManyPrefix} ${splitSummary.outputCount} ${t.workspace.split.summaryManySuffix}`}
                </p>
              )}

              <Button
                ref={runButtonRef}
                variant="primary"
                size="lg"
                disabled={!canRun}
                leftIcon={<Play className="h-4 w-4" aria-hidden="true" />}
                onClick={handleRun}
              >
                {t.workspace.split.runButton}
              </Button>
            </>
          )}

          {tool.id === 'extract-pages' && (
            <>
              <h2 className="text-base font-semibold text-slate-900">
                {t.workspace.extract.heading}
              </h2>

              <div>
                <Label htmlFor={extractRangesId} required>
                  {t.workspace.extract.rangesInputLabel}
                </Label>
                <Input
                  id={extractRangesId}
                  type="text"
                  value={rangesText}
                  onChange={(e) => setRangesText(e.target.value)}
                  disabled={isRunning}
                  hasError={Boolean(singlePageCount > 0 && extractSummary.errorMessage)}
                  placeholder={t.workspace.extract.rangesPlaceholder}
                  className="mt-1.5 font-mono"
                />
                <HelpText>{t.workspace.extract.rangesExamples}</HelpText>
                {singlePageCount > 0 && extractSummary.errorMessage && (
                  <FieldError>{extractSummary.errorMessage}</FieldError>
                )}
              </div>

              {singlePageCount > 0 && extractSummary.valid && (
                <p aria-live="polite" className="text-sm font-medium text-slate-700">
                  {t.workspace.extract.summaryPrefix}{' '}
                  {formatPagesBadge(extractSummary.pageCount)}{' '}
                  {t.workspace.extract.summarySuffix}
                </p>
              )}

              <Button
                ref={runButtonRef}
                variant="primary"
                size="lg"
                disabled={!canRun}
                leftIcon={<Play className="h-4 w-4" aria-hidden="true" />}
                onClick={handleRun}
              >
                {t.workspace.extract.runButton}
              </Button>
            </>
          )}

          {tool.id === 'remove-pages' && (
            <>
              <h2 className="text-base font-semibold text-slate-900">
                {t.workspace.remove.heading}
              </h2>

              <div>
                <Label htmlFor={removeRangesId} required>
                  {t.workspace.remove.rangesInputLabel}
                </Label>
                <Input
                  id={removeRangesId}
                  type="text"
                  value={rangesText}
                  onChange={(e) => setRangesText(e.target.value)}
                  disabled={isRunning}
                  hasError={Boolean(singlePageCount > 0 && removeSummary.errorMessage)}
                  placeholder={t.workspace.remove.rangesPlaceholder}
                  className="mt-1.5 font-mono"
                />
                <HelpText>{t.workspace.remove.rangesExamples}</HelpText>
                {singlePageCount > 0 && removeSummary.errorMessage && (
                  <FieldError>{removeSummary.errorMessage}</FieldError>
                )}
              </div>

              {singlePageCount > 0 && removeSummary.valid && (
                <p aria-live="polite" className="text-sm font-medium text-slate-700">
                  {t.workspace.remove.summaryPrefix}{' '}
                  {formatPagesBadge(removeSummary.removeCount)}{' '}
                  {t.workspace.remove.summaryMiddle}{' '}
                  {formatPagesBadge(removeSummary.keepCount)}{' '}
                  {t.workspace.remove.summarySuffix}
                </p>
              )}

              <Button
                ref={runButtonRef}
                variant="primary"
                size="lg"
                disabled={!canRun}
                leftIcon={<Play className="h-4 w-4" aria-hidden="true" />}
                onClick={handleRun}
              >
                {t.workspace.remove.runButton}
              </Button>
            </>
          )}
        </Card>
      )}

      <ProcessingPanel
        job={job}
        elapsedMs={elapsedMs}
        onCancel={cancelJob}
      />

      {job.status === 'succeeded' && job.result && (
        <ResultPanel
          result={job.result}
          headingRef={resultHeadingRef}
          onDiscard={handleStartOver}
          discardLabel={t.processing.startOverButton}
        />
      )}

      {(job.status === 'failed' || job.status === 'cancelled') && job.error && (
        <ErrorPanel
          error={job.error}
          panelRef={errorPanelRef}
          onRetry={handleRetry}
        />
      )}
    </div>
  );
}
