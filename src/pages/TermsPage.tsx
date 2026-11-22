import {ContentSection} from '../components/layout/ContentSection';
import {PageHero} from '../components/layout/PageHero';
import {SeoHead} from '../components/seo/SeoHead';
import {PROCESSING_LIMITS} from '../config/processingLimits';
import {SITE_CONFIG, STATIC_ROUTES} from '../config/site';
import {formatBytes} from '../services/file/fileValidation';
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
        eyebrow="Effective for Current Release"
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
              2. Platform Availability &amp; Processing Modes
            </h2>
            <p className="mt-2">
              {SITE_CONFIG.brandName} is provided on a free-first basis and is actively under structured development. Merge PDF, Split PDF, Extract Pages, and Remove Pages operate inside your browser session today; tools marked as Coming soon provide route structure and client-side file validation only until their corresponding processing engines are released.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              3. User Responsibility for Content &amp; Limitations
            </h2>
            <p className="mt-2">
              You retain all rights and responsibility for files you select or process on {SITE_CONFIG.brandName}. Some interactive PDF features—such as bookmarks, outlines, or form fields—may not be preserved during page copying, so review downloaded outputs before discarding your original files.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              4. Browser Memory Limits
            </h2>
            <p className="mt-2">
              Active browser tools enforce conservative limits (currently {formatBytes(PROCESSING_LIMITS.maxFileSizeBytes)} per file, {formatBytes(PROCESSING_LIMITS.maxTotalSizeBytes)} combined payload, {PROCESSING_LIMITS.maxFilesCount} files per merge, and {PROCESSING_LIMITS.maxSplitOutputs} split outputs) to reduce browser crashes. Memory constraints depend on your device, and large documents may still fail on low-memory phones.
            </p>
          </div>
        </div>
      </ContentSection>
    </>
  );
}
