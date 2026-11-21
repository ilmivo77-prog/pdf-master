import {ArrowRight, Check, Lock, Search, ShieldCheck} from 'lucide-react';
import {useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {ContentSection} from '../components/layout/ContentSection';
import {SeoHead} from '../components/seo/SeoHead';
import {Card, Container, Input, SectionHeading} from '../components/ui';
import {DESIGN_TOKENS} from '../config/designTokens';
import {SITE_CONFIG, STATIC_ROUTES} from '../config/site';
import {
  getAllCategories,
  getAllTools,
  searchTools,
} from '../config/toolsRegistry';
import {ToolCard} from '../features/pdf/components/ToolCard';
import {ToolIcon} from '../features/pdf/components/ToolIcon';
import {useTranslation} from '../services/localization/i18nService';

export function HomePage() {
  const {t, buildPath} = useTranslation();
  const [quickQuery, setQuickQuery] = useState('');

  const allTools = getAllTools();
  const allCategories = getAllCategories();

  const quickMatches = useMemo(() => {
    if (!quickQuery.trim()) {
      return allTools.slice(0, 5);
    }
    return searchTools(quickQuery).slice(0, 5);
  }, [quickQuery, allTools]);

  return (
    <>
      <SeoHead
        title={`${SITE_CONFIG.brandName} – ${t.home.heroHeadline}`}
        description={t.home.heroSubheadline}
        canonicalPath={STATIC_ROUTES.home}
      />

      {/* Hero Section */}
      <section className="border-b border-slate-200 bg-white">
        <Container size="wide" className="py-14 sm:py-20 lg:py-24">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              <p className="text-sm font-semibold text-blue-700">
                {t.brand.name} · Free-First PDF Platform
              </p>
              <h1 className={`mt-3 ${DESIGN_TOKENS.typography.scale.h1Hero}`}>
                {t.home.heroHeadline}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
                {t.home.heroSubheadline}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <Link
                  to={buildPath(STATIC_ROUTES.tools)}
                  className={DESIGN_TOKENS.components.buttonPrimary}
                >
                  <span>{t.home.heroPrimaryCta}</span>
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                </Link>
                <a
                  href="#tools-catalog"
                  className={DESIGN_TOKENS.components.buttonSecondary}
                >
                  {t.home.heroSecondaryCta}
                </a>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
                <span>10 planned tool routes</span>
                <span aria-hidden="true">·</span>
                <span>8 expandable categories</span>
                <span aria-hidden="true">·</span>
                <span>Local browser file validation active</span>
              </div>
            </div>

            {/* Interactive Quick Tool Finder Panel */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Quick Tool Finder
                  </h2>
                  <span className="font-mono text-xs tabular-nums text-slate-500">
                    {allTools.length} tools
                  </span>
                </div>

                <div className="mt-3">
                  <Input
                    type="search"
                    value={quickQuery}
                    onChange={(event) => setQuickQuery(event.target.value)}
                    placeholder="Find a tool (Merge, Split, Compress...)"
                    aria-label="Quick search PDF tools"
                    leftElement={<Search className="h-4 w-4" aria-hidden="true" />}
                  />
                </div>

                <ul className="mt-4 divide-y divide-slate-200/80 rounded-xl border border-slate-200 bg-white">
                  {quickMatches.length > 0 ? (
                    quickMatches.map((tool) => (
                      <li key={tool.id}>
                        <Link
                          to={buildPath(tool.route)}
                          className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-slate-50"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                              <ToolIcon name={tool.icon} className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-slate-900">
                                {tool.name}
                              </p>
                              <p className="truncate font-mono text-xs text-slate-500">
                                {tool.supportedInputFormats.join(', ').toUpperCase()} →{' '}
                                {tool.supportedOutputFormats.join(', ').toUpperCase()}
                              </p>
                            </div>
                          </div>
                          <ArrowRight
                            className="h-4 w-4 shrink-0 text-slate-400 rtl:rotate-180"
                            aria-hidden="true"
                          />
                        </Link>
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-6 text-center text-sm text-slate-500">
                      No matching tools found for "{quickQuery}".
                    </li>
                  )}
                </ul>

                <div className="mt-3 text-end">
                  <Link
                    to={buildPath(STATIC_ROUTES.tools)}
                    className="text-xs font-semibold text-blue-700 hover:text-blue-800"
                  >
                    Open full tools directory &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Tool Discovery Section */}
      <ContentSection id="tools-catalog" containerSize="wide">
        <SectionHeading
          title={t.home.toolsSectionTitle}
          subtitle={t.home.toolsSectionSubtitle}
          action={
            <Link
              to={buildPath(STATIC_ROUTES.tools)}
              className="text-sm font-semibold text-blue-700 hover:text-blue-800 whitespace-nowrap shrink-0"
            >
              View all tools &rarr;
            </Link>
          }
        />

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {allTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </ContentSection>

      {/* Categories Section */}
      <ContentSection
        id="categories"
        surface="white"
        bordered
        containerSize="wide"
      >
        <SectionHeading
          title={t.home.categoriesSectionTitle}
          subtitle={t.home.categoriesSectionSubtitle}
        />

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {allCategories.map((category) => {
            const accent = DESIGN_TOKENS.colors.categories[category.id];
            return (
              <Link
                key={category.id}
                to={`${buildPath(STATIC_ROUTES.tools)}?category=${category.id}`}
                className="group block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
              >
                <Card interactive padding="md" className="h-full bg-slate-50/50 p-5 sm:p-5">
                  <div
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${accent.surface} ${accent.text}`}
                  >
                    <ToolIcon name={category.icon} className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-slate-900 group-hover:text-blue-700">
                    {category.name}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                    {category.description}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      </ContentSection>

      {/* How It Works Section */}
      <ContentSection containerSize="wide">
        <SectionHeading
          title={t.home.howItWorksTitle}
          subtitle={t.home.howItWorksSubtitle}
        />

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {t.home.howItWorksSteps.map((step) => (
            <Card key={step.stepNumber} padding="md">
              <p className="font-mono text-xs font-semibold tabular-nums text-blue-700">
                Step {step.stepNumber}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {step.description}
              </p>
            </Card>
          ))}
        </div>

        <p className="mt-6 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600">
          {t.home.howItWorksDisclaimer}
        </p>
      </ContentSection>

      {/* Trust & Privacy Section */}
      <ContentSection surface="white" className="border-t border-slate-200" containerSize="wide">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className={`mt-4 ${DESIGN_TOKENS.typography.scale.h2Section}`}>
              {t.home.trustSectionTitle}
            </h2>
            <p className="mt-2.5 text-sm sm:text-base leading-relaxed text-slate-600">
              {t.home.trustSectionSubtitle}
            </p>
            <div className="mt-5">
              <Link
                to={buildPath(STATIC_ROUTES.privacyPolicy)}
                className="text-sm font-semibold text-blue-700 hover:text-blue-800"
              >
                Read our Privacy Policy &rarr;
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 lg:col-span-8">
            {t.home.trustPillars.map((pillar, index) => (
              <Card key={pillar.title} padding="md" className="bg-slate-50/70 p-5 sm:p-5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700">
                  {index === 0 ? (
                    <Lock className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  )}
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-900">
                  {pillar.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {pillar.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </ContentSection>
    </>
  );
}
