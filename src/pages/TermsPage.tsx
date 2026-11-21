import {ContentSection} from '../components/layout/ContentSection';
import {PageHero} from '../components/layout/PageHero';
import {SeoHead} from '../components/seo/SeoHead';
import {SITE_CONFIG, STATIC_ROUTES} from '../config/site';
import {useTranslation} from '../services/localization/i18nService';

export function TermsPage() {
  const {t} = useTranslation();

  return (
    <>
      <SeoHead
        title={`${t.pages.termsTitle} – ${SITE_CONFIG.brandName}`}
        description="Terms and conditions governing use of the PDF Master online document platform."
        canonicalPath={STATIC_ROUTES.terms}
      />

      <PageHero
        title={t.pages.termsTitle}
        eyebrow="Effective for Current Foundation Release"
        containerSize="narrow"
      />

      <ContentSection containerSize="narrow">
        <div className="space-y-8 text-base leading-relaxed text-slate-600">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              1. Acceptance of Terms
            </h2>
            <p className="mt-2">
              By accessing {SITE_CONFIG.brandName}, you agree to use the platform only for lawful document tasks and in accordance with these terms.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              2. Platform Availability & Milestone Scope
            </h2>
            <p className="mt-2">
              {SITE_CONFIG.brandName} is provided on a free-first basis and is actively under structured development. Tools marked as Coming soon provide route structure and client-side file validation only until their corresponding processing engines are released.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              3. User Responsibility for Content
            </h2>
            <p className="mt-2">
              You retain all rights and responsibility for files you select or process on {SITE_CONFIG.brandName}. You must ensure you hold the necessary authorization before modifying, unlocking, or converting any document.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              4. Resource Limits & Fair Use
            </h2>
            <p className="mt-2">
              Each tool enforces configurable file format, file size, and queue count limits to maintain browser stability and fair resource usage across future processing capabilities.
            </p>
          </div>
        </div>
      </ContentSection>
    </>
  );
}
