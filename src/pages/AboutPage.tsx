import {Link} from 'react-router-dom';
import {ContentSection} from '../components/layout/ContentSection';
import {PageHero} from '../components/layout/PageHero';
import {SeoHead} from '../components/seo/SeoHead';
import {Card} from '../components/ui';
import {DESIGN_TOKENS} from '../config/designTokens';
import {SITE_CONFIG, STATIC_ROUTES} from '../config/site';
import {useTranslation} from '../services/localization/i18nService';

export function AboutPage() {
  const {t, buildPath} = useTranslation();

  return (
    <>
      <SeoHead
        title={`${t.pages.aboutTitle} – ${SITE_CONFIG.brandName}`}
        description="Learn about PDF Master, a free-first online PDF utility platform built for clear document workflows, accessibility, and privacy-conscious architecture."
        canonicalPath={STATIC_ROUTES.about}
      />

      <PageHero
        title={t.pages.aboutTitle}
        description={`${SITE_CONFIG.brandName} is being built as a free-first, comprehensive online PDF utility platform designed to make everyday document tasks straightforward for everyone.`}
        containerSize="narrow"
      />

      <ContentSection containerSize="narrow">
        <div className="space-y-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Platform Principles
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              Document utilities should be fast to understand, accessible on any screen size, and honest about what happens to your files. PDF Master separates tool discovery, file validation, and processing engines so each capability can be tested and documented clearly as it is introduced.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Card padding="md">
              <h3 className="text-base font-semibold text-slate-900">
                Free-First Architecture
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Prioritizes open-source tooling and browser-side execution wherever practical before introducing server-side workers for heavy conversions.
              </p>
            </Card>
            <Card padding="md">
              <h3 className="text-base font-semibold text-slate-900">
                Global & Multilingual Ready
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Built initially in English with centralized translation dictionaries, localized routing patterns, and layout support for future RTL languages.
              </p>
            </Card>
          </div>

          <Card padding="md">
            <h2 className="text-lg font-semibold text-slate-900">
              Current Stage: Design System & Foundation
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              The platform currently provides the application architecture, centralized tool registry, SEO metadata system, localization framework, client-side file validation layer, and accessible UI design system. Processing engines for individual PDF operations will follow in upcoming milestones.
            </p>
            <div className="mt-5">
              <Link
                to={buildPath(STATIC_ROUTES.tools)}
                className={DESIGN_TOKENS.components.buttonPrimary}
              >
                {t.nav.exploreToolsCta}
              </Link>
            </div>
          </Card>
        </div>
      </ContentSection>
    </>
  );
}
