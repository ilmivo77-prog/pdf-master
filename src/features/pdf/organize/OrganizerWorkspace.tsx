import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import {
  AlertCircle,
  ArrowLeftRight,
  CheckSquare,
  FileText,
  Play,
  RotateCcw,
  RotateCw,
  Trash2,
} from 'lucide-react';
import {Alert, Badge, Button, Card, Spinner} from '../../../components/ui';
import {PROCESSING_LIMITS} from '../../../config/processingLimits';
import {sniffFileSignature} from '../../../services/file/fileValidation';
import {useTranslation} from '../../../services/localization/i18nService';
import type {FileValidationRule, ManagedFileItem} from '../../../types/file';
import type {PdfToolDefinition} from '../../../types/tool';
import {ErrorPanel} from '../components/ErrorPanel';
import {FileDropzone} from '../components/FileDropzone';
import {ProcessingPanel} from '../components/ProcessingPanel';
import {ResultPanel} from '../components/ResultPanel';
import {
  PdfWorkerClient,
  createProcessingError,
  type ProcessingError,
  type ProcessingErrorMessageKey,
} from '../engine';
import {useProcessingJob} from '../hooks/useProcessingJob';
import {OrganizePageCard} from './OrganizePageCard';
import {
  type OrganizeAction,
  type OrganizeState,
  buildOrganizeOperations,
  createInitialOrganizeState,
  getOrganizeCounts,
  organizeReducer,
} from './organizeReducer';
import {
  type ThumbnailEntry,
  type ThumbnailNoticeMode,
  usePdfThumbnails,
} from './usePdfThumbnails';

export interface OrganizerWorkspaceProps {
  tool: PdfToolDefinition;
  validationRule: FileValidationRule;
}

interface InspectedFileState {
  managed: ManagedFileItem;
  inspectState: 'pending' | 'inspecting' | 'ready' | 'error';
  pageCount?: number;
  inspectWarnings?: string[];
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

export interface OrganizeGridSectionProps {
  state: OrganizeState;
  thumbnails: Record<number, ThumbnailEntry>;
  noticeMode: ThumbnailNoticeMode;
  isLibraryLoading: boolean;
  isRunning: boolean;
  onDispatch: React.Dispatch<OrganizeAction>;
  onRegisterCardElement?: (pageNumber: number, el: HTMLElement | null) => void;
  onRun: () => void;
  runButtonRef?: React.Ref<HTMLButtonElement>;
}

export function OrganizeGridSection({
  state,
  thumbnails,
  noticeMode,
  isLibraryLoading,
  isRunning,
  onDispatch,
  onRegisterCardElement,
  onRun,
  runButtonRef,
}: OrganizeGridSectionProps) {
  const {t} = useTranslation();
  const org = t.workspace.organize;

  const [dragSourceIndex, setDragSourceIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  const counts = useMemo(() => getOrganizeCounts(state), [state]);
  const allActiveSelected =
    counts.keptCount > 0 && counts.selectedCount === counts.keptCount;
  const canRun = !isRunning && counts.keptCount > 0;

  const handleDragStart = (
    index: number,
    event: React.DragEvent<HTMLLIElement>
  ) => {
    setDragSourceIndex(index);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (
    index: number,
    event: React.DragEvent<HTMLLIElement>
  ) => {
    if (dragSourceIndex === null) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (dropTargetIndex !== index) {
      setDropTargetIndex(index);
    }
  };

  const handleDrop = (
    index: number,
    event: React.DragEvent<HTMLLIElement>
  ) => {
    event.preventDefault();
    const from = dragSourceIndex;
    setDragSourceIndex(null);
    setDropTargetIndex(null);
    if (from !== null && from !== index) {
      onDispatch({type: 'MOVE_TO_INDEX', fromIndex: from, toIndex: index});
    }
  };

  const handleDragEnd = () => {
    setDragSourceIndex(null);
    setDropTargetIndex(null);
  };

  return (
    <Card padding="md" className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-slate-900">
          {org.heading}
        </h2>
        <p className="mt-1 text-sm text-slate-600">{org.helperText}</p>
      </div>

      {isLibraryLoading && noticeMode === 'none' && (
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Spinner size="sm" label={org.thumbnailsLoadingNotice} />
          <span>{org.thumbnailsLoadingNotice}</span>
        </div>
      )}

      {noticeMode === 'lazy-large' && (
        <Alert variant="info">{org.largeDocNotice}</Alert>
      )}

      {noticeMode === 'hard-cap' && (
        <Alert variant="warning">{org.hardCapNotice}</Alert>
      )}

      {noticeMode === 'load-failed' && (
        <Alert variant="warning">{org.libraryFailedNotice}</Alert>
      )}

      <div className="flex flex-wrap items-center gap-2 border-y border-slate-200 py-3">
        <Button
          variant="secondary"
          size="sm"
          disabled={isRunning || counts.keptCount === 0}
          leftIcon={<CheckSquare className="h-4 w-4" aria-hidden="true" />}
          onClick={() =>
            onDispatch({
              type: allActiveSelected ? 'CLEAR_SELECTION' : 'SELECT_ALL_ACTIVE',
            })
          }
        >
          {allActiveSelected ? org.clearSelectionButton : org.selectAllButton}
        </Button>

        <Button
          variant="secondary"
          size="sm"
          disabled={isRunning || counts.selectedCount === 0}
          leftIcon={<RotateCcw className="h-4 w-4" aria-hidden="true" />}
          onClick={() => onDispatch({type: 'ROTATE_SELECTED', step: -90})}
        >
          {org.rotateSelectedLeftButton}
        </Button>

        <Button
          variant="secondary"
          size="sm"
          disabled={isRunning || counts.selectedCount === 0}
          leftIcon={<RotateCw className="h-4 w-4" aria-hidden="true" />}
          onClick={() => onDispatch({type: 'ROTATE_SELECTED', step: 90})}
        >
          {org.rotateSelectedRightButton}
        </Button>

        <Button
          variant="danger"
          size="sm"
          disabled={isRunning || counts.selectedCount === 0}
          leftIcon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
          onClick={() => onDispatch({type: 'DELETE_SELECTED'})}
        >
          {org.deleteSelectedButton}
        </Button>

        <Button
          variant="secondary"
          size="sm"
          disabled={isRunning || counts.deletedCount === 0}
          leftIcon={<RotateCcw className="h-4 w-4" aria-hidden="true" />}
          onClick={() => onDispatch({type: 'RESTORE_ALL'})}
        >
          {org.restoreAllButton}
        </Button>

        <Button
          variant="secondary"
          size="sm"
          disabled={isRunning || counts.totalCount <= 1}
          leftIcon={<ArrowLeftRight className="h-4 w-4" aria-hidden="true" />}
          onClick={() => onDispatch({type: 'REVERSE_ORDER'})}
        >
          {org.reverseOrderButton}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          disabled={isRunning || counts.totalCount === 0}
          onClick={() => onDispatch({type: 'RESET_ORDER'})}
        >
          {org.resetOrderButton}
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p
          aria-live="polite"
          className="text-sm font-medium text-slate-700"
        >
          <span className="font-mono tabular-nums">{counts.keptCount}</span>{' '}
          {counts.keptCount === 1
            ? org.summaryKeptSingular
            : org.summaryKeptPlural}
          ,{' '}
          <span className="font-mono tabular-nums">{counts.deletedCount}</span>{' '}
          {org.summaryRemovedLabel}
          {counts.selectedCount > 0 && (
            <>
              {' '}
              ·{' '}
              <span className="font-mono tabular-nums">
                {counts.selectedCount}
              </span>{' '}
              {org.summarySelectedLabel}
            </>
          )}
        </p>

        <Button
          ref={runButtonRef}
          variant="primary"
          size="lg"
          disabled={!canRun}
          leftIcon={<Play className="h-4 w-4" aria-hidden="true" />}
          onClick={onRun}
        >
          {org.runButton}
        </Button>
      </div>

      {counts.keptCount === 0 && counts.totalCount > 0 && (
        <Alert variant="danger">{org.emptyResultError}</Alert>
      )}

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {state.lastAnnouncement}
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {state.items.map((item, positionIndex) => (
          <OrganizePageCard
            key={item.sourcePageIndex}
            item={item}
            positionIndex={positionIndex}
            totalItems={state.items.length}
            thumbnail={thumbnails[item.originalPageNumber]}
            disabled={isRunning}
            isDragSource={dragSourceIndex === positionIndex}
            isDropTarget={
              dropTargetIndex === positionIndex &&
              dragSourceIndex !== positionIndex
            }
            onRegisterElement={onRegisterCardElement}
            onMoveStep={(sourcePageIndex, delta) =>
              onDispatch({type: 'MOVE_STEP', sourcePageIndex, delta})
            }
            onRotate={(sourcePageIndex, step) =>
              onDispatch({type: 'ROTATE_PAGE', sourcePageIndex, step})
            }
            onToggleDelete={(sourcePageIndex) =>
              onDispatch({type: 'TOGGLE_DELETE_PAGE', sourcePageIndex})
            }
            onToggleSelect={(sourcePageIndex) =>
              onDispatch({type: 'TOGGLE_SELECT_PAGE', sourcePageIndex})
            }
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
          />
        ))}
      </ul>
    </Card>
  );
}

export function OrganizerWorkspace({
  tool,
  validationRule,
}: OrganizerWorkspaceProps) {
  const {t} = useTranslation();

  const [fileItem, setFileItem] = useState<InspectedFileState | null>(null);
  const [sourceBuffer, setSourceBuffer] = useState<ArrayBuffer | null>(null);
  const [organizeState, dispatchOrganize] = useReducer(
    organizeReducer,
    0,
    createInitialOrganizeState
  );

  const {job, elapsedMs, isRunning, startJob, cancelJob, discardResults} =
    useProcessingJob();

  const inspectClientRef = useRef<PdfWorkerClient | null>(null);
  const inspectAbortRef = useRef<AbortController | null>(null);
  const cachedBufferRef = useRef<ArrayBuffer | null>(null);

  const dropzoneSelectButtonRef = useRef<HTMLButtonElement>(null);
  const runButtonRef = useRef<HTMLButtonElement>(null);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  const errorPanelRef = useRef<HTMLDivElement>(null);
  const inspectErrorRef = useRef<HTMLParagraphElement>(null);

  const userInitiatedJobRef = useRef(false);
  const prevJobStatusRef = useRef(job.status);

  useEffect(() => {
    return () => {
      inspectAbortRef.current?.abort();
      inspectAbortRef.current = null;
      inspectClientRef.current?.dispose();
      inspectClientRef.current = null;
      cachedBufferRef.current = null;
    };
  }, []);

  useEffect(() => {
    const prevStatus = prevJobStatusRef.current;
    prevJobStatusRef.current = job.status;

    if (!userInitiatedJobRef.current) {
      return;
    }

    if (prevStatus !== 'succeeded' && job.status === 'succeeded') {
      resultHeadingRef.current?.focus();
    } else if (
      prevStatus !== job.status &&
      (job.status === 'failed' || job.status === 'cancelled')
    ) {
      errorPanelRef.current?.focus();
    }
  }, [job.status]);

  useEffect(() => {
    if (fileItem?.inspectState === 'error') {
      inspectErrorRef.current?.focus();
    }
  }, [fileItem?.inspectState]);

  const inspectFile = useCallback(async (managed: ManagedFileItem) => {
    inspectAbortRef.current?.abort();
    const abortController = new AbortController();
    inspectAbortRef.current = abortController;

    cachedBufferRef.current = null;
    setSourceBuffer(null);
    dispatchOrganize({type: 'INIT', pageCount: 0});
    setFileItem({
      managed,
      inspectState: 'inspecting',
    });

    try {
      const signature = await sniffFileSignature(managed.file);
      if (abortController.signal.aborted) {
        return;
      }

      if (signature !== 'pdf') {
        setFileItem({
          managed,
          inspectState: 'error',
          errorMessageKey: 'notAPdf',
        });
        return;
      }

      if (managed.file.size > PROCESSING_LIMITS.maxFileSizeBytes) {
        setFileItem({
          managed,
          inspectState: 'error',
          errorMessageKey: 'fileTooLarge',
        });
        return;
      }

      // Read file bytes once; transfer a copy to inspect worker and keep raw buffer
      // so pdf.js and final pdf-lib organization reuse slices without reading disk twice.
      const rawBuffer = await managed.file.arrayBuffer();
      if (abortController.signal.aborted) {
        return;
      }

      if (!inspectClientRef.current) {
        inspectClientRef.current = new PdfWorkerClient();
      }

      const result = await inspectClientRef.current.runJob({
        jobId: `inspect-${managed.id}`,
        toolId: 'internal:pdf-inspect',
        files: [
          {
            name: managed.metadata.sanitizedName,
            mimeType: managed.metadata.mimeType,
            size: managed.file.size,
            bytes: rawBuffer.slice(0),
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
        setFileItem({
          managed,
          inspectState: 'error',
          errorMessageKey: 'passwordProtectedPdf',
        });
        return;
      }

      const pageCount = result.stats.pageCount ?? 0;
      if (pageCount <= 0) {
        setFileItem({
          managed,
          inspectState: 'error',
          errorMessageKey: 'corruptPdf',
        });
        return;
      }

      cachedBufferRef.current = rawBuffer;
      setSourceBuffer(rawBuffer);
      dispatchOrganize({type: 'INIT', pageCount});
      setFileItem({
        managed,
        inspectState: 'ready',
        pageCount,
        inspectWarnings: result.warnings,
      });
    } catch (err) {
      if (abortController.signal.aborted) {
        return;
      }
      const messageKey: ProcessingErrorMessageKey = isProcessingError(err)
        ? err.messageKey
        : 'corruptPdf';
      setFileItem({
        managed,
        inspectState: 'error',
        errorMessageKey: messageKey,
      });
    } finally {
      if (inspectAbortRef.current === abortController) {
        inspectAbortRef.current = null;
      }
    }
  }, []);

  const handleDropzoneFilesChange = (nextManaged: ManagedFileItem[]) => {
    userInitiatedJobRef.current = false;
    discardResults();
    if (nextManaged.length === 0) {
      inspectAbortRef.current?.abort();
      cachedBufferRef.current = null;
      setSourceBuffer(null);
      setFileItem(null);
      dispatchOrganize({type: 'INIT', pageCount: 0});
      return;
    }

    const picked = nextManaged[0];
    if (fileItem?.managed.id === picked.id) {
      return;
    }
    void inspectFile(picked);
  };

  const handleStartOver = () => {
    userInitiatedJobRef.current = false;
    inspectAbortRef.current?.abort();
    discardResults();
    cachedBufferRef.current = null;
    setSourceBuffer(null);
    setFileItem(null);
    dispatchOrganize({type: 'INIT', pageCount: 0});
    requestAnimationFrame(() => {
      dropzoneSelectButtonRef.current?.focus();
    });
  };

  const {
    thumbnails,
    noticeMode,
    isLibraryLoading,
    registerCardElement,
  } = usePdfThumbnails({
    sourceBuffer,
    fileKey: fileItem?.managed.id ?? '',
    pageCount: fileItem?.pageCount ?? 0,
    enabled: Boolean(
      fileItem?.inspectState === 'ready' &&
        sourceBuffer &&
        (fileItem.pageCount ?? 0) > 0
    ),
  });

  const handleRun = () => {
    if (!fileItem || fileItem.inspectState !== 'ready') {
      return;
    }
    const operations = buildOrganizeOperations(organizeState);
    if (operations.length === 0) {
      return;
    }

    userInitiatedJobRef.current = true;
    void startJob({
      toolId: tool.id,
      files: [fileItem.managed.file],
      options: {operations},
      limits: {
        maxFileSizeBytes: PROCESSING_LIMITS.maxFileSizeBytes,
        maxTotalSizeBytes: PROCESSING_LIMITS.maxTotalSizeBytes,
        maxFilesCount: 1,
        jobTimeoutMs: PROCESSING_LIMITS.jobTimeoutMs,
      },
      requirePdfMagicBytes: true,
      preloadedBuffers: cachedBufferRef.current
        ? [cachedBufferRef.current]
        : undefined,
    });
  };

  const handleRetry = () => {
    userInitiatedJobRef.current = false;
    discardResults();
    requestAnimationFrame(() => {
      if (runButtonRef.current && !runButtonRef.current.disabled) {
        runButtonRef.current.focus();
      } else {
        dropzoneSelectButtonRef.current?.focus();
      }
    });
  };

  const managedFiles = useMemo(
    () => (fileItem ? [fileItem.managed] : []),
    [fileItem]
  );

  const pageBadgeText =
    fileItem?.inspectState === 'ready' && typeof fileItem.pageCount === 'number'
      ? `${fileItem.pageCount} ${
          fileItem.pageCount === 1
            ? t.workspace.pagesUnitSingular
            : t.workspace.pagesUnitPlural
        }`
      : null;

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

      {fileItem && (
        <Card padding="none" className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <FileText className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">
                  {fileItem.managed.metadata.sanitizedName}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 font-mono text-xs tabular-nums text-slate-500">
                  <span>{fileItem.managed.metadata.formattedSize}</span>
                  {(fileItem.inspectState === 'pending' ||
                    fileItem.inspectState === 'inspecting') && (
                    <span className="inline-flex items-center gap-1.5 text-blue-700">
                      <Spinner size="sm" label={t.workspace.inspectingLabel} />
                      <span>{t.workspace.inspectingLabel}</span>
                    </span>
                  )}
                  {pageBadgeText && (
                    <Badge variant="success" size="sm">
                      {pageBadgeText}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              disabled={isRunning}
              onClick={handleStartOver}
            >
              {t.fileManager.clearAllButton}
            </Button>
          </div>

          {fileItem.inspectState === 'error' && (
            <div className="border-t border-slate-200 px-4 py-3 sm:px-5">
              <p
                ref={inspectErrorRef}
                tabIndex={-1}
                className="flex items-center gap-1.5 rounded-sm text-xs font-medium text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
              >
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  {fileItem.errorMessageKey
                    ? t.processingErrors[fileItem.errorMessageKey]
                    : t.workspace.inspectErrorFallback}
                </span>
              </p>
            </div>
          )}

          {fileItem.inspectWarnings && fileItem.inspectWarnings.length > 0 && (
            <div className="border-t border-slate-200 px-4 py-3 sm:px-5">
              <Alert variant="warning">
                <ul className="list-disc space-y-1 ps-4">
                  {fileItem.inspectWarnings.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </Alert>
            </div>
          )}
        </Card>
      )}

      {fileItem?.inspectState === 'ready' && organizeState.items.length > 0 && (
        <OrganizeGridSection
          state={organizeState}
          thumbnails={thumbnails}
          noticeMode={noticeMode}
          isLibraryLoading={isLibraryLoading}
          isRunning={isRunning}
          onDispatch={dispatchOrganize}
          onRegisterCardElement={registerCardElement}
          onRun={handleRun}
          runButtonRef={runButtonRef}
        />
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

      {(job.status === 'failed' || job.status === 'cancelled') && (
        <ErrorPanel
          error={
            job.error ??
            createProcessingError(
              job.status === 'cancelled' ? 'CANCELLED' : 'UNKNOWN',
              'Job ended without an error payload.'
            )
          }
          panelRef={errorPanelRef}
          onRetry={handleRetry}
        />
      )}
    </div>
  );
}
