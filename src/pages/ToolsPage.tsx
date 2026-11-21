import {Search} from 'lucide-react';
import {useMemo, useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import {ContentSection} from '../components/layout/ContentSection';
import {PageHero} from '../components/layout/PageHero';
import {SeoHead} from '../components/seo/SeoHead';
import {Button, EmptyState, Input} from '../components/ui';
import {SITE_CONFIG, STATIC_ROUTES} from '../config/site';
import {getAllCategories, searchTools} from '../config/toolsRegistry';
import {ToolCard} from '../features/pdf/components/ToolCard';
import {useTranslation} from '../services/localization/i18nService';
import type {ToolCategoryId} from '../types/tool';

export function ToolsPage() {
  const {t} = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const allCategories = getAllCategories();
  const paramCategory = searchParams.get('category');

  const validCategoryFilter: ToolCategoryId | 'all' = useMemo(() => {
    if (
      paramCategory &&
      allCategories.some((cat) => cat.id === paramCategory)
    ) {
      return paramCategory as ToolCategoryId;
    }
    return 'all';
  }, [paramCategory, allCategories]);

  const [query, setQuery] = useState('');

  const filteredTools = useMemo(
    () => searchTools(query, validCategoryFilter),
    [query, validCategoryFilter]
  );

  const handleCategoryChange = (nextCategory: ToolCategoryId | 'all') => {
    if (nextCategory === 'all') {
      searchParams.delete('category');
      setSearchParams(searchParams, {replace: true});
    } else {
      setSearchParams({category: nextCategory}, {replace: true});
    }
  };

  const handleResetFilters = () => {
    setQuery('');
    handleCategoryChange('all');
  };

  return (
    <>
      <SeoHead
        title={`${t.toolsDirectory.pageTitle} – ${SITE_CONFIG.brandName}`}
        description={t.toolsDirectory.pageSubtitle}
        canonicalPath={STATIC_ROUTES.tools}
      />

      <PageHero
        title={t.toolsDirectory.pageTitle}
        description={t.toolsDirectory.pageSubtitle}
        containerSize="wide"
      />

      <ContentSection spacing="compact" containerSize="wide">
        <div className="mb-8 space-y-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="w-full md:max-w-md">
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.toolsDirectory.searchPlaceholder}
                aria-label={t.toolsDirectory.searchLabel}
                leftElement={<Search className="h-4 w-4" aria-hidden="true" />}
              />
            </div>

            <p className="font-mono text-sm tabular-nums text-slate-600">
              <strong className="font-semibold text-slate-900">
                {filteredTools.length}
              </strong>{' '}
              {t.toolsDirectory.showingCountLabel}
            </p>
          </div>

          <div
            role="group"
            aria-label="Filter tools by category"
            className="flex flex-wrap gap-2"
          >
            <button
              type="button"
              onClick={() => handleCategoryChange('all')}
              className={`min-h-[40px] rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
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
                onClick={() => handleCategoryChange(category.id)}
                className={`min-h-[40px] rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
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

        {filteredTools.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
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
        )}
      </ContentSection>
    </>
  );
}
