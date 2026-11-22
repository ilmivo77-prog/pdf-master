import {ContentSection} from '../components/layout/ContentSection';
import {PageHero} from '../components/layout/PageHero';
import {SeoHead} from '../components/seo/SeoHead';
import {SITE_CONFIG, STATIC_ROUTES} from '../config/site';
import {useTranslation} from '../services/localization/i18nService';

export function PrivacyPage() {
  const {t} = useTranslation();

  return (
    <>
      <SeoHead
        title={`${t.pages.privacyTitle} – ${SITE_CONFIG.brandName}`}
        description="Read the PDF Master Privacy Policy describing browser-based file processing for live tools, local validation, and session-memory data handling."
        canonicalPath={STATIC_ROUTES.privacyPolicy}
      />

      <PageHero
        title={t.pages.privacyTitle}
        eyebrow="Effective for Current Release"
        containerSize="narrow"
      />

      <ContentSection containerSize="narrow">
        <div className="space-y-8 text-base leading-relaxed text-slate-600">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              1. Local File Processing &amp; Validation
            </h2>
            <p className="mt-2">
              For the four available tools (Merge PDF, Split PDF, Extract Pages, and Remove Pages), files are processed inside your browser by the page’s own code and are not sent to a server by {SITE_CONFIG.brandName}. All input bytes and generated results exist only in browser memory for your current session and are cleared when you discard results, close the tab, or reload the page. Tools still marked Coming soon only run local format and size validation in your browser.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              2. Personal Data &amp; Analytics
            </h2>
            <p className="mt-2">
              In the current release, {SITE_CONFIG.brandName} has no user accounts, login forms, backend database storage, third-party analytics scripts, or tracking cookies. Fonts are self-hosted with the application bundle rather than fetched from external font servers.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              3. Future Processing Architecture
            </h2>
            <p className="mt-2">
              Future browser-based tools will continue running on your device wherever practical. If any future tool (such as complex document conversions or OCR) requires server-side processing, updated data-handling and retention disclosures will be published before that tool is enabled.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              4. Policy Updates
            </h2>
            <p className="mt-2">
              This privacy policy will be updated alongside future platform milestones to accurately reflect enabled processing modes and infrastructure boundaries.
            </p>
          </div>
        </div>
      </ContentSection>
    </>
  );
}
