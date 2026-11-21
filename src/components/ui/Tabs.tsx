import React, {useId, useRef, useState} from 'react';
import {cn} from '../../lib/cn';

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  defaultTabId?: string;
  activeTabId?: string;
  onTabChange?: (tabId: string) => void;
  ariaLabel?: string;
  className?: string;
}

export function Tabs({
  items,
  defaultTabId,
  activeTabId,
  onTabChange,
  ariaLabel = 'Tabs',
  className,
}: TabsProps) {
  const baseId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const firstEnabledId = items.find((item) => !item.disabled)?.id ?? items[0]?.id ?? '';
  const [internalTabId, setInternalTabId] = useState(defaultTabId ?? firstEnabledId);

  const currentTabId = activeTabId ?? internalTabId;

  const selectTab = (nextId: string) => {
    if (activeTabId === undefined) {
      setInternalTabId(nextId);
    }
    onTabChange?.(nextId);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const enabledIndices = items
      .map((item, idx) => (item.disabled ? -1 : idx))
      .filter((idx) => idx !== -1);

    if (enabledIndices.length === 0) {
      return;
    }

    const isRtl =
      typeof document !== 'undefined' &&
      document.documentElement.dir === 'rtl';

    const nextKey = isRtl ? 'ArrowLeft' : 'ArrowRight';
    const prevKey = isRtl ? 'ArrowRight' : 'ArrowLeft';

    let targetIndex: number | null = null;
    const currentPos = enabledIndices.indexOf(index);

    if (event.key === nextKey) {
      targetIndex = enabledIndices[(currentPos + 1) % enabledIndices.length];
    } else if (event.key === prevKey) {
      targetIndex =
        enabledIndices[(currentPos - 1 + enabledIndices.length) % enabledIndices.length];
    } else if (event.key === 'Home') {
      targetIndex = enabledIndices[0];
    } else if (event.key === 'End') {
      targetIndex = enabledIndices[enabledIndices.length - 1];
    }

    if (targetIndex !== null) {
      event.preventDefault();
      const targetItem = items[targetIndex];
      selectTab(targetItem.id);
      tabRefs.current[targetIndex]?.focus();
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1"
      >
        {items.map((item, index) => {
          const isSelected = item.id === currentTabId;
          const tabId = `${baseId}-tab-${item.id}`;
          const panelId = `${baseId}-panel-${item.id}`;

          return (
            <button
              key={item.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              id={tabId}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={panelId}
              tabIndex={isSelected ? 0 : -1}
              disabled={item.disabled}
              onClick={() => selectTab(item.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn(
                'min-h-[40px] rounded-lg px-3.5 py-2 text-xs sm:text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap shrink-0',
                isSelected
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {items.map((item) => {
        const isSelected = item.id === currentTabId;
        const tabId = `${baseId}-tab-${item.id}`;
        const panelId = `${baseId}-panel-${item.id}`;

        return (
          <div
            key={item.id}
            id={panelId}
            role="tabpanel"
            aria-labelledby={tabId}
            hidden={!isSelected}
            tabIndex={0}
            className="mt-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          >
            {isSelected && item.content}
          </div>
        );
      })}
    </div>
  );
}
