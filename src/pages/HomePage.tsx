import {ArrowRight, CheckCircle2, Globe2, Layers, Sparkles} from 'lucide-react';
import {Link} from 'react-router-dom';
import {ContentSection} from '../components/layout/ContentSection';
import {SeoHead} from '../components/seo/SeoHead';
import {
  Accordion,
  Alert,
  Badge,
  Card,
  Container,
  SectionHeading,
} from '../components/ui';
import {DESIGN_TOKENS} from '../config/designTokens';
import {SITE_CONFIG, STATIC_ROUTES} from '../config/site';
import {
  getAllCategories,
  getAllTools,
  getFeaturedTools,
  getPopularTools,
  getToolsByCategory,
} from '../config/toolsRegistry';
import {ToolCard} from '../features/pdf/components/ToolCard';
import {ToolIcon} from '../features/pdf/components/ToolIcon';
import {ToolSearch} from '../features/pdf/components/ToolSearch';
import {useTranslation} from '../services/localization/i18nService';
import {resolveBaseOrigin} from '../services/seo/seoService';

const WHY_ICONS = [Layers, CheckCircle2, Sparkles, Globe2] as const;

export function HomePage() {
  const {t, buildPath} = useTranslation();

  const allTools = getAllTools();
  const allCategories = getAllCategories();
  const popularTools = getPopularTools(8);
  const featuredTools = getFeaturedTools().slice(0, 4);

  const plannedCount = allTools.filter((tool) => tool.status === 'planned').length;
  const liveCount = allTools.filter(
    (tool) => tool.status === 'available' || tool.status === 'beta'
  ).length;
  const categoriesCount = allCategories.length;

  const faqAccordionItems = t.home.faqItems.map((item) => ({
    id: item.id,
    title: item.question,
    content: item.answer,
  }));

  const baseOrigin = resolveBaseOrigin();

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_CONFIG.brandName,
      url: `${baseOrigin}${buildPath(STATIC_ROUTES.home)}`,
      description: t.home.heroSubheadline,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: t.home.faqItems.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    },
  ];

  return (
    <>
      <SeoHead
        title={`${SITE_CONFIG.brandName} – ${t.home.heroHeadline}`}
        description={t.home.heroSubheadline}
        canonicalPath={STATIC_ROUTES.home}
        structuredData={structuredData}
      />

      {/* 1. Hero Section */}
      <section
        aria-labelledby="home-hero-title"
        className="border-b border-slate-200 bg-white"
      >
        <Container size="wide" className="py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold tracking-wide text-blue-700 uppercase">
              {t.home.heroEyebrow}
            </p>
            <h1
              id="home-hero-title"
              className={`mt-3 ${DESIGN_TOKENS.typography.scale.h1Hero}`}
            >
              {t.home.heroHeadline}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              {t.home.heroSubheadline}
            </p>

            <div className="mx-auto mt-8 max-w-xl text-start">
              <ToolSearch />
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3.5">
              <Link
                to={buildPath(STATIC_ROUTES.tools)}
                className={DESIGN_TOKENS.components.buttonPrimary}
              >
                <span>{t.home.heroPrimaryCta}</span>
                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              </Link>
              <a
                href="#how-it-works"
                className={DESIGN_TOKENS.components.buttonSecondary}
              >
                {t.home.heroSecondaryCta}
              </a>
            </div>
          </div>
        </Container>
      </section>

      {/* 2. Popular Tools Section */}
      <ContentSection
        id="popular-tools"
        aria-labelledby="home-popular-title"
        containerSize="wide"
      >
        <SectionHeading
          headingId="home-popular-title"
          title={t.home.popularToolsTitle}
          subtitle={t.home.popularToolsSubtitle}
          action={
            <Link
              to={buildPath(STATIC_ROUTES.tools)}
              className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800 whitespace-nowrap shrink-0"
            >
              <span>{t.home.viewAllToolsLink}</span>
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            </Link>
          }
        />

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {popularTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </ContentSection>

      {/* 3. Categories Section */}
      <ContentSection
        id="categories"
        aria-labelledby="home-categories-title"
        surface="white"
        bordered
        containerSize="wide"
      >
        <SectionHeading
          headingId="home-categories-title"
          title={t.home.categoriesSectionTitle}
          subtitle={t.home.categoriesSectionSubtitle}
        />

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {allCategories.map((category) => {
            const accent = DESIGN_TOKENS.colors.categories[category.id];
            const categoryToolCount = getToolsByCategory(category.id).length;
            const countLabel = `${categoryToolCount} ${
              categoryToolCount === 1
                ? t.home.categoryToolSingular
                : t.home.categoryToolPlural
            }`;

            return (
              <Link
                key={category.id}
                to={`${buildPath(STATIC_ROUTES.tools)}?category=${category.id}`}
                className="group block h-full rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
              >
                <Card
                  interactive
                  padding="md"
                  className="flex h-full flex-col justify-between bg-slate-50/50 p-5 sm:p-5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${accent.surface} ${accent.text}`}
                      >
                        <ToolIcon name={category.icon} className="h-5 w-5" />
                      </div>
                      <span className="font-mono text-xs tabular-nums text-slate-500">
                        {countLabel}
                      </span>
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-slate-900 transition-colors duration-150 group-hover:text-blue-700">
                      {category.name}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                      {category.description}
                    </p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </ContentSection>

      {/* 4. Featured Tools Section */}
      <ContentSection
        id="featured-tools"
        aria-labelledby="home-featured-title"
        containerSize="wide"
      >
        <SectionHeading
          headingId="home-featured-title"
          title={t.home.featuredToolsTitle}
          subtitle={t.home.featuredToolsSubtitle}
        />

        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          {featuredTools.map((tool) => {
            const accent = DESIGN_TOKENS.colors.categories[tool.category];
            const statusLabel =
              tool.status === 'available'
                ? t.toolsDirectory.statusAvailable
                : tool.status === 'beta'
                  ? t.toolsDirectory.statusBeta
                  : t.toolsDirectory.statusPlanned;
            const badgeVariant =
              tool.status === 'available'
                ? 'success'
                : tool.status === 'beta'
                  ? 'info'
                  : 'warning';

            return (
              <Card
                key={tool.id}
                padding="md"
                className="flex flex-col justify-between p-6"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accent.surface} ${accent.text}`}
                      >
                        <ToolIcon name={tool.icon} className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {tool.name}
                      </h3>
                    </div>
                    <Badge variant={badgeVariant} size="sm">
                      {statusLabel}
                    </Badge>
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {tool.description}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <span className="font-mono text-xs text-slate-500">
                    {tool.supportedInputFormats.join(', ').toUpperCase()} →{' '}
                    {tool.supportedOutputFormats.join(', ').toUpperCase()}
                  </span>
                  <Link
                    to={buildPath(tool.route)}
                    className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800"
                  >
                    <span>{t.home.openToolCta}</span>
                    <ArrowRight
                      className="h-4 w-4 rtl:rotate-180"
                      aria-hidden="true"
                    />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </ContentSection>

      {/* 5. Why PDF Master Section */}
      <ContentSection
        id="why-pdf-master"
        aria-labelledby="home-why-title"
        surface="white"
        bordered
        containerSize="wide"
      >
        <SectionHeading
          headingId="home-why-title"
          title={t.home.whySectionTitle}
          subtitle={t.home.whySectionSubtitle}
        />

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {t.home.whyBenefits.map((benefit, index) => {
            const IconComponent = WHY_ICONS[index % WHY_ICONS.length];
            return (
              <Card
                key={benefit.title}
                padding="md"
                className="flex flex-col justify-between bg-slate-50/70 p-5 sm:p-5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-blue-700">
                      <IconComponent className="h-4 w-4" aria-hidden="true" />
                    </div>
                    {benefit.tag && (
                      <Badge variant="info" size="sm">
                        {benefit.tag}
                      </Badge>
                    )}
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-slate-900">
                    {benefit.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {benefit.description}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </ContentSection>

      {/* 6. How It Works Section */}
      <ContentSection
        id="how-it-works"
        aria-labelledby="home-how-title"
        containerSize="wide"
      >
        <SectionHeading
          headingId="home-how-title"
          title={t.home.howItWorksTitle}
          subtitle={t.home.howItWorksSubtitle}
        />

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {t.home.howItWorksSteps.map((step) => (
            <Card key={step.stepNumber} padding="md">
              <p className="font-mono text-xs font-semibold tabular-nums text-blue-700">
                {step.stepNumber}
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

        <Alert variant="info" className="mt-6">
          {t.home.howItWorksDisclaimer}
        </Alert>
      </ContentSection>

      {/* 7. Roadmap / Status Strip Section */}
      <ContentSection
        id="platform-roadmap"
        aria-labelledby="home-roadmap-title"
        surface="white"
        bordered
        spacing="compact"
        containerSize="wide"
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2
              id="home-roadmap-title"
              className="text-lg font-semibold text-slate-900"
            >
              {t.home.roadmapStripTitle}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {plannedCount} {t.home.roadmapPlannedLabel} · {liveCount}{' '}
              {t.home.roadmapLiveLabel} · {categoriesCount}{' '}
              {t.home.roadmapCategoriesLabel}
            </p>
          </div>

          <dl className="grid grid-cols-3 gap-4 sm:gap-8">
            <div>
              <dt className="text-xs text-slate-500">
                {t.home.roadmapPlannedLabel}
              </dt>
              <dd className="font-mono text-2xl font-bold tabular-nums text-slate-900">
                {plannedCount}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">{t.home.roadmapLiveLabel}</dt>
              <dd className="font-mono text-2xl font-bold tabular-nums text-slate-900">
                {liveCount}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">
                {t.home.roadmapCategoriesLabel}
              </dt>
              <dd className="font-mono text-2xl font-bold tabular-nums text-slate-900">
                {categoriesCount}
              </dd>
            </div>
          </dl>
        </div>
      </ContentSection>

      {/* 8. FAQ Section */}
      <ContentSection
        id="faq"
        aria-labelledby="home-faq-title"
        containerSize="standard"
      >
        <SectionHeading
          headingId="home-faq-title"
          title={t.home.faqSectionTitle}
          subtitle={t.home.faqSectionSubtitle}
        />

        <div className="mt-8">
          <Accordion items={faqAccordionItems} />
        </div>
      </ContentSection>

      {/* 9. Final CTA Band */}
      <ContentSection
        id="final-cta"
        aria-labelledby="home-final-cta-title"
        surface="white"
        className="border-t border-slate-200"
        containerSize="standard"
      >
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:flex-row sm:items-center sm:p-8">
          <div className="max-w-xl">
            <h2
              id="home-final-cta-title"
              className={DESIGN_TOKENS.typography.scale.h2Section}
            >
              {t.home.finalCtaTitle}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
              {t.home.finalCtaDescription}
            </p>
          </div>

          <Link
            to={buildPath(STATIC_ROUTES.tools)}
            className={DESIGN_TOKENS.components.buttonPrimary}
          >
            <span>{t.home.finalCtaButton}</span>
            <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>
      </ContentSection>
    </>
  );
}
