import {Search} from 'lucide-react';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import {ContentSection} from '../components/layout/ContentSection';
import {PageHero} from '../components/layout/PageHero';
import {SeoHead} from '../components/seo/SeoHead';
import {Alert, Button, EmptyState, Switch} from '../components/ui';
import {DESIGN_TOKENS} from '../config/designTokens';
import {SITE_CONFIG, STATIC_ROUTES} from '../config/site';
import {getAllCategories, searchTools} from '../config/toolsRegistry';
import {ToolCard} from '../features/pdf/components/ToolCard';
import {ToolIcon} from '../features/pdf/components/ToolIcon';
import {ToolSearch} from '../features/pdf/components/ToolSearch';
import {useTranslation} from '../services/localization/i18nService';
import type {ToolCategoryId} from '../types/tool';

export function ToolsPage() {
  const {t} = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const allCategories = getAllCategories();
  const paramCategory = searchParams.get('category');
  const paramQuery = searchParams.get('q') ?? '';

  const isInvalidCategoryParam = Boolean(
    paramCategory && !allCategories.some((cat) => cat.id === paramCategory)
  );

  const validCategoryFilter: ToolCategoryId | 'all' = useMemo(() => {
    if (
      paramCategory &&
      allCategories.some((cat) => cat.id === paramCategory)
    ) {
      return paramCategory as ToolCategoryId;
    }
    return 'all';
  }, [paramCategory, allCategories]);

  const [query, setQuery] = useState(paramQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(paramQuery);
  const [availableOnly, setAvailableOnly] = useState(false);

  // Keep local search input aligned when URL ?q= changes externally (navigation, back/forward)
  useEffect(() => {
    setQuery(paramQuery);
    setDebouncedQuery(paramQuery);
  }, [paramQuery]);

  const syncUrlParams = useCallback(
    (nextQuery: string, nextCategory: ToolCategoryId | 'all') => {
      const nextParams = new URLSearchParams();
      const trimmed = nextQuery.trim();
      if (trimmed) {
        nextParams.set('q', trimmed);
      }
      if (nextCategory !== 'all') {
        nextParams.set('category', nextCategory);
      }
      setSearchParams(nextParams, {replace: true});
    },
    [setSearchParams]
  );

  const handleDebouncedQueryChange = useCallback(
    (nextDebounced: string) => {
      setDebouncedQuery(nextDebounced);
      if (nextDebounced.trim() !== paramQuery.trim()) {
        syncUrlParams(nextDebounced, validCategoryFilter);
      }
    },
    [paramQuery, syncUrlParams, validCategoryFilter]
  );

  const handleCategoryChange = (nextCategory: ToolCategoryId | 'all') => {
    syncUrlParams(query, nextCategory);
  };

  const handleResetFilters = () => {
    setQuery('');
    setDebouncedQuery('');
    setAvailableOnly(false);
    setSearchParams(new URLSearchParams(), {replace: true});
  };

  const filteredTools = useMemo(() => {
    const baseResults = searchTools(debouncedQuery, validCategoryFilter);
    if (!availableOnly) {
      return baseResults;
    }
    return baseResults.filter(
      (tool) => tool.status === 'available' || tool.status === 'beta'
    );
  }, [debouncedQuery, validCategoryFilter, availableOnly]);

  const isUnfiltered =
    !debouncedQuery.trim() && validCategoryFilter === 'all' && !availableOnly;

  const groupedByCategory = useMemo(() => {
    return allCategories
      .map((category) => ({
        category,
        tools: filteredTools.filter((tool) => tool.category === category.id),
      }))
      .filter((group) => group.tools.length > 0);
  }, [allCategories, filteredTools]);

  const hasUrlFilters = Boolean(paramQuery.trim() || paramCategory?.trim());

  return (
    <>
      <SeoHead
        title={`${t.toolsDirectory.pageTitle} – ${SITE_CONFIG.brandName}`}
        description={t.toolsDirectory.pageSubtitle}
        canonicalPath={STATIC_ROUTES.tools}
        robots={hasUrlFilters ? 'noindex, follow' : 'index, follow'}
      />

      <PageHero
        title={t.toolsDirectory.pageTitle}
        description={t.toolsDirectory.pageSubtitle}
        containerSize="wide"
      />

      <ContentSection spacing="compact" containerSize="wide">
        <div className="mb-8 space-y-5">
          {isInvalidCategoryParam && (
            <Alert variant="info">{t.toolsDirectory.invalidCategoryNotice}</Alert>
          )}

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="w-full lg:max-w-md">
              <ToolSearch
                value={query}
                onQueryChange={setQuery}
                onDebouncedQueryChange={handleDebouncedQueryChange}
                categoryFilter={validCategoryFilter}
                placeholder={t.toolsDirectory.searchPlaceholder}
                ariaLabel={t.toolsDirectory.searchLabel}
                showPopularOnEmptyFocus={false}
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:gap-6">
              <Switch
                checked={availableOnly}
                onCheckedChange={setAvailableOnly}
                label={t.toolsDirectory.availableOnlyLabel}
                description={t.toolsDirectory.availableOnlyDescription}
                className="sm:max-w-xs"
              />

              <p
                aria-live="polite"
                className="font-mono text-sm tabular-nums text-slate-600 whitespace-nowrap"
              >
                <strong className="font-semibold text-slate-900">
                  {filteredTools.length}
                </strong>{' '}
                {t.toolsDirectory.showingCountLabel}
              </p>
            </div>
          </div>

          <div
            role="group"
            aria-label={t.nav.categories}
            className="flex flex-wrap gap-2"
          >
            <button
              type="button"
              aria-pressed={validCategoryFilter === 'all'}
              onClick={() => handleCategoryChange('all')}
              className={`min-h-[44px] min-w-[44px] rounded-lg px-3.5 py-2 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
                validCategoryFilter === 'all'
                  ? 'bg-blue-700 text-white'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              {t.toolsDirectory.allCategoriesFilter}
            </button>

            {allCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                aria-pressed={validCategoryFilter === category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`min-h-[44px] min-w-[44px] rounded-lg px-3.5 py-2 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
                  validCategoryFilter === category.id
                    ? 'bg-blue-700 text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {filteredTools.length === 0 ? (
          availableOnly ? (
            <EmptyState
              icon={<Search className="h-6 w-6" aria-hidden="true" />}
              title={t.toolsDirectory.emptyAvailableTitle}
              description={t.toolsDirectory.emptyAvailableDescription}
              action={
                <Button variant="primary" onClick={handleResetFilters}>
                  {t.toolsDirectory.clearFiltersCta}
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={<Search className="h-6 w-6" aria-hidden="true" />}
              title={t.toolsDirectory.emptyStateTitle}
              description={t.toolsDirectory.emptyStateDescription}
              action={
                <Button variant="primary" onClick={handleResetFilters}>
                  {t.toolsDirectory.clearFiltersCta}
                </Button>
              }
            />
          )
        ) : isUnfiltered ? (
          <div className="space-y-12">
            {groupedByCategory.map(({category, tools}) => {
              const accent = DESIGN_TOKENS.colors.categories[category.id];
              const headingId = `tools-category-${category.id}`;

              return (
                <section key={category.id} aria-labelledby={headingId}>
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accent.surface} ${accent.text}`}
                      >
                        <ToolIcon name={category.icon} className="h-4 w-4" />
                      </span>
                      <div>
                        <h2
                          id={headingId}
                          className="text-lg font-semibold text-slate-900"
                        >
                          {category.name}
                        </h2>
                        <p className="text-xs text-slate-600">
                          {category.description}
                        </p>
                      </div>
                    </div>

                    <span className="font-mono text-xs tabular-nums text-slate-500">
                      {tools.length}{' '}
                      {tools.length === 1
                        ? t.home.categoryToolSingular
                        : t.home.categoryToolPlural}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {tools.map((tool) => (
                      <ToolCard key={tool.id} tool={tool} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        )}
      </ContentSection>
    </>
  );
}
