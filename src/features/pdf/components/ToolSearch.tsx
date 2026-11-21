import {ArrowRight, Search, X} from 'lucide-react';
import React, {useEffect, useId, useMemo, useRef, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {Badge, EmptyState, Input} from '../../../components/ui';
import {DESIGN_TOKENS} from '../../../config/designTokens';
import {STATIC_ROUTES} from '../../../config/site';
import {
  getCategoryById,
  getPopularTools,
  normalizeSearchText,
  searchTools,
} from '../../../config/toolsRegistry';
import {cn} from '../../../lib/cn';
import {useTranslation} from '../../../services/localization/i18nService';
import type {PdfToolDefinition, ToolCategoryId} from '../../../types/tool';
import {ToolIcon} from './ToolIcon';

// Search text is filtered client-side only and never sent to any server.

export interface ToolSearchProps {
  value?: string;
  onQueryChange?: (query: string) => void;
  onDebouncedQueryChange?: (query: string) => void;
  onSelectTool?: (tool: PdfToolDefinition) => void;
  categoryFilter?: ToolCategoryId | 'all';
  placeholder?: string;
  ariaLabel?: string;
  maxResults?: number;
  showPopularOnEmptyFocus?: boolean;
  className?: string;
}

function renderHighlightedText(text: string, query: string): React.ReactNode {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return text;
  }

  // Map normalized characters back to original string indices so diacritics match safely
  let normalizedText = '';
  const origIndexMap: number[] = [];

  for (let i = 0; i < text.length; i += 1) {
    const stripped = text[i]
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    for (let j = 0; j < stripped.length; j += 1) {
      normalizedText += stripped[j];
      origIndexMap.push(i);
    }
  }

  const matchStart = normalizedText.indexOf(normalizedQuery);
  if (matchStart !== -1) {
    const startOrig = origIndexMap[matchStart];
    const endNormIdx = matchStart + normalizedQuery.length - 1;
    const endOrig = (origIndexMap[endNormIdx] ?? text.length - 1) + 1;

    return (
      <>
        {text.slice(0, startOrig)}
        <mark className="rounded-xs bg-blue-100 px-0.5 font-semibold text-blue-900">
          {text.slice(startOrig, endOrig)}
        </mark>
        {text.slice(endOrig)}
      </>
    );
  }

  // Token-level fallback highlight if exact phrase wasn't contiguous
  const tokens = normalizedQuery.split(' ').filter((token) => token.length >= 2);
  if (tokens.length === 0) {
    return text;
  }

  for (const token of tokens) {
    const idx = normalizedText.indexOf(token);
    if (idx !== -1) {
      const startOrig = origIndexMap[idx];
      const endOrig = (origIndexMap[idx + token.length - 1] ?? text.length - 1) + 1;
      return (
        <>
          {text.slice(0, startOrig)}
          <mark className="rounded-xs bg-blue-100 px-0.5 font-semibold text-blue-900">
            {text.slice(startOrig, endOrig)}
          </mark>
          {text.slice(endOrig)}
        </>
      );
    }
  }

  return text;
}

export function ToolSearch({
  value,
  onQueryChange,
  onDebouncedQueryChange,
  onSelectTool,
  categoryFilter = 'all',
  placeholder,
  ariaLabel,
  maxResults = 8,
  showPopularOnEmptyFocus = true,
  className,
}: ToolSearchProps) {
  const {t, buildPath} = useTranslation();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const baseOptionId = useId();

  const isControlled = typeof value === 'string';
  const [uncontrolledQuery, setUncontrolledQuery] = useState('');
  const inputQuery = isControlled ? value : uncontrolledQuery;

  const [debouncedQuery, setDebouncedQuery] = useState(inputQuery);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Debounce client-side filtering (120ms) without external dependencies
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(inputQuery);
      onDebouncedQueryChange?.(inputQuery);
    }, 120);

    return () => {
      window.clearTimeout(timer);
    };
  }, [inputQuery, onDebouncedQueryChange]);

  const trimmedQuery = debouncedQuery.trim();

  const results = useMemo(() => {
    if (!trimmedQuery) {
      return showPopularOnEmptyFocus ? getPopularTools(Math.min(maxResults, 5)) : [];
    }
    return searchTools(trimmedQuery, categoryFilter).slice(0, maxResults);
  }, [trimmedQuery, categoryFilter, maxResults, showPopularOnEmptyFocus]);

  // Reset active highlight when result list changes
  useEffect(() => {
    setActiveIndex(-1);
  }, [trimmedQuery, categoryFilter]);

  useEffect(() => {
    const handleOutsidePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleOutsidePointerDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsidePointerDown);
    };
  }, []);

  const updateQuery = (nextQuery: string) => {
    if (!isControlled) {
      setUncontrolledQuery(nextQuery);
    }
    onQueryChange?.(nextQuery);
  };

  const handleSelectTool = (tool: PdfToolDefinition) => {
    setIsOpen(false);
    setActiveIndex(-1);
    if (onSelectTool) {
      onSelectTool(tool);
    } else {
      navigate(buildPath(tool.route));
    }
  };

  const handleClear = () => {
    updateQuery('');
    setDebouncedQuery('');
    onDebouncedQueryChange?.('');
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const shouldRenderPopup =
    isOpen && (trimmedQuery.length > 0 || (showPopularOnEmptyFocus && results.length > 0));

  const activeOptionId =
    shouldRenderPopup && activeIndex >= 0 && results[activeIndex]
      ? `${baseOptionId}-${results[activeIndex].id}`
      : undefined;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setActiveIndex(results.length > 0 ? 0 : -1);
        return;
      }
      if (results.length > 0) {
        setActiveIndex((prev) => (prev + 1) % results.length);
      }
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setActiveIndex(results.length > 0 ? results.length - 1 : -1);
        return;
      }
      if (results.length > 0) {
        setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
      }
      return;
    }

    if (event.key === 'Home' && isOpen && results.length > 0) {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }

    if (event.key === 'End' && isOpen && results.length > 0) {
      event.preventDefault();
      setActiveIndex(results.length - 1);
      return;
    }

    if (event.key === 'Escape') {
      if (isOpen) {
        event.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
      }
      return;
    }

    if (event.key === 'Enter' && isOpen && results.length > 0) {
      const targetTool =
        activeIndex >= 0 ? results[activeIndex] : trimmedQuery.length > 0 ? results[0] : undefined;
      if (targetTool) {
        event.preventDefault();
        handleSelectTool(targetTool);
      }
    }
  };

  const resolvedPlaceholder = placeholder ?? t.search.placeholder;
  const resolvedAriaLabel = ariaLabel ?? t.search.ariaLabel;

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <Input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={shouldRenderPopup}
        aria-controls={listboxId}
        aria-activedescendant={activeOptionId}
        aria-label={resolvedAriaLabel}
        value={inputQuery}
        onFocus={() => setIsOpen(true)}
        onChange={(event) => {
          updateQuery(event.target.value);
          if (!isOpen) {
            setIsOpen(true);
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder={resolvedPlaceholder}
        leftElement={<Search className="h-4 w-4" aria-hidden="true" />}
        rightElement={
          inputQuery.length > 0 ? (
            <button
              type="button"
              onClick={handleClear}
              aria-label={t.toolsDirectory.clearFiltersCta}
              className="-me-2 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-slate-500 transition-colors duration-150 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-700"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : undefined
        }
        className="pe-12"
      />

      {shouldRenderPopup && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={resolvedAriaLabel}
          className={cn(
            'absolute start-0 end-0 top-full mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white',
            DESIGN_TOKENS.zIndex.dropdown,
            DESIGN_TOKENS.shadows.dropdown
          )}
        >
          {results.length > 0 ? (
            <>
              <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto p-1.5">
                {results.map((tool, index) => {
                  const isSelected = index === activeIndex;
                  const category = getCategoryById(tool.category);
                  const accent = DESIGN_TOKENS.colors.categories[tool.category];
                  const optionId = `${baseOptionId}-${tool.id}`;

                  return (
                    <li
                      key={tool.id}
                      id={optionId}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <button
                        type="button"
                        tabIndex={-1}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => handleSelectTool(tool)}
                        className={cn(
                          'flex min-h-[48px] w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-start transition-colors duration-150',
                          isSelected
                            ? 'bg-blue-50 text-slate-900'
                            : 'text-slate-800 hover:bg-slate-50'
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={cn(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                              accent.surface,
                              accent.text
                            )}
                          >
                            <ToolIcon name={tool.icon} className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">
                              {renderHighlightedText(tool.name, trimmedQuery)}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {category?.name}
                            </p>
                          </div>
                        </div>

                        <div className="ms-2 flex shrink-0 items-center gap-2">
                          {tool.status === 'planned' && (
                            <Badge variant="warning" size="sm">
                              {t.toolsDirectory.statusPlanned}
                            </Badge>
                          )}
                          <ArrowRight
                            className="h-4 w-4 shrink-0 text-slate-400 rtl:rotate-180"
                            aria-hidden="true"
                          />
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-3.5 py-2 text-xs text-slate-500">
                <span className="truncate">{t.search.resultsHint}</span>
                <Link
                  to={buildPath(STATIC_ROUTES.tools)}
                  onClick={() => setIsOpen(false)}
                  className="shrink-0 font-semibold text-blue-700 hover:text-blue-800"
                >
                  {t.search.browseAllLink}
                </Link>
              </div>
            </>
          ) : (
            <div className="p-4">
              <EmptyState
                icon={<Search className="h-5 w-5" aria-hidden="true" />}
                title={t.search.noResultsTitle}
                description={t.search.noResultsDescription}
                action={
                  <Link
                    to={buildPath(STATIC_ROUTES.tools)}
                    onClick={() => setIsOpen(false)}
                    className={DESIGN_TOKENS.components.buttonSecondary}
                  >
                    {t.search.browseAllLink}
                  </Link>
                }
                className="border-0 bg-transparent py-6"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
