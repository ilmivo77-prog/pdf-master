import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  RotateCcw,
  RotateCw,
  Trash2,
} from 'lucide-react';
import {Badge, Checkbox, IconButton, Spinner} from '../../../components/ui';
import {cn} from '../../../lib/cn';
import {useTranslation} from '../../../services/localization/i18nService';
import type {OrganizeRotationDelta} from '../engine/engines/pdfOrganizeEngine';
import type {OrganizePageItem} from './organizeReducer';
import type {ThumbnailEntry} from './usePdfThumbnails';

export interface OrganizePageCardProps {
  item: OrganizePageItem;
  positionIndex: number;
  totalItems: number;
  thumbnail?: ThumbnailEntry;
  disabled?: boolean;
  isDragSource?: boolean;
  isDropTarget?: boolean;
  onRegisterElement?: (pageNumber: number, el: HTMLElement | null) => void;
  onMoveStep: (sourcePageIndex: number, delta: -1 | 1) => void;
  onRotate: (sourcePageIndex: number, step: -90 | 90) => void;
  onToggleDelete: (sourcePageIndex: number) => void;
  onToggleSelect: (sourcePageIndex: number) => void;
  onDragStart?: (index: number, event: React.DragEvent<HTMLLIElement>) => void;
  onDragOver?: (index: number, event: React.DragEvent<HTMLLIElement>) => void;
  onDrop?: (index: number, event: React.DragEvent<HTMLLIElement>) => void;
  onDragEnd?: () => void;
}

const ROTATION_CLASS: Record<OrganizeRotationDelta, string> = {
  0: 'rotate-0',
  90: 'rotate-90',
  180: 'rotate-180',
  270: '-rotate-90',
};

export function OrganizePageCard({
  item,
  positionIndex,
  totalItems,
  thumbnail,
  disabled = false,
  isDragSource = false,
  isDropTarget = false,
  onRegisterElement,
  onMoveStep,
  onRotate,
  onToggleDelete,
  onToggleSelect,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: OrganizePageCardProps) {
  const {t} = useTranslation();
  const org = t.workspace.organize;

  const canMoveEarlier = !disabled && positionIndex > 0;
  const canMoveLater = !disabled && positionIndex < totalItems - 1;
  const canDrag = !disabled && !item.deleted && Boolean(onDragStart);

  return (
    <li
      ref={(el) => {
        onRegisterElement?.(item.originalPageNumber, el);
      }}
      draggable={canDrag}
      onDragStart={
        onDragStart ? (event) => onDragStart(positionIndex, event) : undefined
      }
      onDragOver={
        onDragOver ? (event) => onDragOver(positionIndex, event) : undefined
      }
      onDrop={onDrop ? (event) => onDrop(positionIndex, event) : undefined}
      onDragEnd={onDragEnd}
      className={cn(
        'flex min-w-0 flex-col justify-between rounded-xl border p-3 transition-colors duration-150',
        item.deleted
          ? 'border-dashed border-slate-300 bg-slate-50 opacity-65'
          : item.selected
            ? 'border-blue-700 bg-blue-50/40'
            : 'border-slate-200 bg-white',
        isDragSource && 'opacity-50',
        isDropTarget && !item.deleted && 'ring-2 ring-blue-700 ring-offset-1'
      )}
    >
      <div className="flex items-center justify-between gap-2 pb-2">
        <Checkbox
          checked={item.selected}
          disabled={disabled || item.deleted}
          aria-label={`${org.selectPageLabel} ${item.originalPageNumber}`}
          onChange={() => onToggleSelect(item.sourcePageIndex)}
          className="py-0"
        />

        <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5">
          <span className="font-mono text-xs font-semibold tabular-nums text-slate-900">
            {org.pageLabel} {item.originalPageNumber}
          </span>
          {item.rotationDelta !== 0 && !item.deleted && (
            <Badge variant="info" size="sm">
              +{item.rotationDelta}°
            </Badge>
          )}
          {item.deleted && (
            <Badge variant="danger" size="sm">
              {org.removedBadge}
            </Badge>
          )}
        </div>
      </div>

      <div
        role="img"
        aria-label={`${org.pageLabel} ${item.originalPageNumber} preview`}
        className="relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100 p-2"
      >
        {thumbnail?.status === 'ready' && thumbnail.url ? (
          <img
            src={thumbnail.url}
            alt={`${org.pageLabel} ${item.originalPageNumber}`}
            draggable={false}
            className={cn(
              'max-h-full max-w-full rounded-xs object-contain shadow-xs transition-transform duration-150',
              ROTATION_CLASS[item.rotationDelta]
            )}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-center text-slate-500">
            {thumbnail?.status === 'loading' ? (
              <Spinner
                size="sm"
                label={`${org.pageLabel} ${item.originalPageNumber}`}
              />
            ) : (
              <FileText
                className={cn(
                  'h-8 w-8 text-slate-400 transition-transform duration-150',
                  ROTATION_CLASS[item.rotationDelta]
                )}
                aria-hidden="true"
              />
            )}
            <span className="font-mono text-xs font-semibold tabular-nums text-slate-700">
              {org.pageLabel} {item.originalPageNumber}
            </span>
          </div>
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1 pt-1">
        <div className="flex items-center gap-1">
          <IconButton
            variant="secondary"
            size="md"
            disabled={!canMoveEarlier}
            aria-label={`Move ${org.pageLabel.toLowerCase()} ${item.originalPageNumber} ${org.moveEarlierLabel}`}
            onClick={() => onMoveStep(item.sourcePageIndex, -1)}
            icon={
              <ChevronLeft
                className="h-4 w-4 rtl:rotate-180"
                aria-hidden="true"
              />
            }
          />
          <IconButton
            variant="secondary"
            size="md"
            disabled={!canMoveLater}
            aria-label={`Move ${org.pageLabel.toLowerCase()} ${item.originalPageNumber} ${org.moveLaterLabel}`}
            onClick={() => onMoveStep(item.sourcePageIndex, 1)}
            icon={
              <ChevronRight
                className="h-4 w-4 rtl:rotate-180"
                aria-hidden="true"
              />
            }
          />
        </div>

        <div className="flex items-center gap-1">
          <IconButton
            variant="secondary"
            size="md"
            disabled={disabled || item.deleted}
            aria-label={`Rotate ${org.pageLabel.toLowerCase()} ${item.originalPageNumber} ${org.rotateLeftLabel}`}
            onClick={() => onRotate(item.sourcePageIndex, -90)}
            icon={<RotateCcw className="h-4 w-4" aria-hidden="true" />}
          />
          <IconButton
            variant="secondary"
            size="md"
            disabled={disabled || item.deleted}
            aria-label={`Rotate ${org.pageLabel.toLowerCase()} ${item.originalPageNumber} ${org.rotateRightLabel}`}
            onClick={() => onRotate(item.sourcePageIndex, 90)}
            icon={<RotateCw className="h-4 w-4" aria-hidden="true" />}
          />
          <IconButton
            variant={item.deleted ? 'secondary' : 'danger'}
            size="md"
            disabled={disabled}
            aria-label={
              item.deleted
                ? `${org.restorePageLabel} ${item.originalPageNumber}`
                : `${org.deletePageLabel} ${item.originalPageNumber}`
            }
            onClick={() => onToggleDelete(item.sourcePageIndex)}
            icon={
              item.deleted ? (
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              )
            }
          />
        </div>
      </div>
    </li>
  );
}
