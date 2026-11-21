import React, {useId, useRef, useState} from 'react';
import {CheckCircle2, FileText, Trash2, Upload} from 'lucide-react';
import {Alert, Badge, Button, IconButton} from '../../../components/ui';
import {cn} from '../../../lib/cn';
import {formatBytes, validateSelectedFiles} from '../../../services/file/fileValidation';
import {useTranslation} from '../../../services/localization/i18nService';
import type {
  FileValidationError,
  FileValidationRule,
  ManagedFileItem,
} from '../../../types/file';

export type DropzoneVisualState =
  | 'idle'
  | 'drag-over'
  | 'files-selected'
  | 'error'
  | 'disabled';

interface FileDropzoneProps {
  toolName: string;
  validationRule: FileValidationRule;
  disabled?: boolean;
  initialErrors?: FileValidationError[];
  onFilesChange?: (files: ManagedFileItem[]) => void;
}

export function FileDropzone({
  toolName,
  validationRule,
  disabled = false,
  initialErrors = [],
  onFilesChange,
}: FileDropzoneProps) {
  const {t} = useTranslation();
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<ManagedFileItem[]>([]);
  const [errors, setErrors] = useState<FileValidationError[]>(initialErrors);
  const [isDragging, setIsDragging] = useState(false);

  const visualState: DropzoneVisualState = disabled
    ? 'disabled'
    : isDragging
      ? 'drag-over'
      : errors.length > 0
        ? 'error'
        : files.length > 0
          ? 'files-selected'
          : 'idle';

  const acceptAttribute = [
    ...validationRule.allowedExtensions,
    ...validationRule.allowedMimeTypes,
  ].join(',');

  const handleIncomingFiles = (incoming: FileList | null) => {
    if (disabled || !incoming || incoming.length === 0) {
      return;
    }

    const result = validateSelectedFiles(incoming, validationRule, files);
    const updatedFiles = [...files, ...result.acceptedFiles];

    setFiles(updatedFiles);
    setErrors(result.errors);
    onFilesChange?.(updatedFiles);
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleIncomingFiles(event.target.files);
    event.target.value = '';
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled && !isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (!disabled) {
      handleIncomingFiles(event.dataTransfer.files);
    }
  };

  const handleRemoveFile = (fileId: string) => {
    const updated = files.filter((item) => item.id !== fileId);
    setFiles(updated);
    setErrors([]);
    onFilesChange?.(updated);
  };

  const handleClearAll = () => {
    setFiles([]);
    setErrors([]);
    onFilesChange?.([]);
  };

  const openFilePicker = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-4" data-dropzone-state={visualState}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        aria-disabled={disabled || undefined}
        className={cn(
          'rounded-2xl border-2 border-dashed p-6 sm:p-10 text-center transition-colors duration-150',
          visualState === 'disabled' &&
            'cursor-not-allowed border-slate-200 bg-slate-100/70 opacity-75',
          visualState === 'drag-over' &&
            'border-blue-700 bg-blue-50/70',
          visualState === 'error' &&
            'border-red-300 bg-red-50/30',
          visualState === 'files-selected' &&
            'border-blue-300 bg-white',
          visualState === 'idle' &&
            'border-slate-300 bg-white hover:border-slate-400'
        )}
      >
        <input
          ref={fileInputRef}
          id={inputId}
          type="file"
          disabled={disabled}
          accept={acceptAttribute}
          multiple={validationRule.allowMultiple}
          onChange={handleFileInputChange}
          className="sr-only"
          aria-label={`${t.fileManager.selectFilesButton} for ${toolName}`}
        />

        <div
          className={cn(
            'mx-auto flex h-12 w-12 items-center justify-center rounded-xl',
            visualState === 'disabled'
              ? 'bg-slate-200 text-slate-500'
              : visualState === 'error'
                ? 'bg-red-100 text-red-700'
                : 'bg-blue-50 text-blue-700'
          )}
        >
          <Upload className="h-6 w-6" aria-hidden="true" />
        </div>

        <h2 className="mt-4 text-lg font-semibold text-slate-900">
          {t.fileManager.dropzoneTitle}
        </h2>
        <p className="mx-auto mt-1.5 max-w-lg text-sm text-slate-600">
          {t.fileManager.dropzoneSubtitle}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="primary"
            disabled={disabled}
            onClick={openFilePicker}
          >
            {files.length > 0 && validationRule.allowMultiple
              ? t.fileManager.addMoreButton
              : t.fileManager.selectFilesButton}
          </Button>
          {files.length > 0 && (
            <Button
              variant="secondary"
              disabled={disabled}
              onClick={handleClearAll}
            >
              {t.fileManager.clearAllButton}
            </Button>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-500">
          <span>
            {t.fileManager.acceptedFormatsPrefix}{' '}
            <strong className="font-mono font-medium text-slate-700">
              {validationRule.allowedExtensions.join(', ').toUpperCase()}
            </strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {t.fileManager.maxFileSizePrefix}{' '}
            <strong className="font-mono tabular-nums font-medium text-slate-700">
              {formatBytes(validationRule.maxFileSizeBytes)}
            </strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {t.fileManager.maxFilesPrefix}{' '}
            <strong className="font-mono tabular-nums font-medium text-slate-700">
              {validationRule.maxFilesCount}
            </strong>
          </span>
        </div>
      </div>

      {errors.length > 0 && (
        <Alert
          variant="danger"
          title="File validation error"
          onDismiss={() => setErrors([])}
        >
          <ul className="list-disc space-y-1 ps-4">
            {errors.map((err, idx) => (
              <li key={`${err.code}-${idx}`}>{err.message}</li>
            ))}
          </ul>
        </Alert>
      )}

      {files.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 sm:px-5">
            <h3 className="text-sm font-semibold text-slate-900">
              {t.fileManager.selectedFilesHeading} ({files.length})
            </h3>
            <Badge variant="success" size="sm">
              <CheckCircle2 className="me-1.5 h-3.5 w-3.5" aria-hidden="true" />
              {t.fileManager.validationSuccessText}
            </Badge>
          </div>

          <ul className="divide-y divide-slate-100">
            {files.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <FileText className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {item.metadata.sanitizedName}
                    </p>
                    <p className="font-mono text-xs tabular-nums text-slate-500">
                      {item.metadata.extension.toUpperCase()} · {item.metadata.formattedSize}
                    </p>
                  </div>
                </div>

                <IconButton
                  variant="danger"
                  size="md"
                  onClick={() => handleRemoveFile(item.id)}
                  aria-label={`${t.fileManager.removeFileLabel} ${item.metadata.sanitizedName}`}
                  icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
                />
              </li>
            ))}
          </ul>

          <div className="rounded-b-xl border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 sm:px-5">
            {t.fileManager.processUnavailableNotice}
          </div>
        </div>
      )}
    </div>
  );
}
