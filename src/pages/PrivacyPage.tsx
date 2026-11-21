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
        description="Read the PDF Master Privacy Policy describing current browser-only file validation and our commitment to minimal data handling."
        canonicalPath={STATIC_ROUTES.privacyPolicy}
      />

      <PageHero
        title={t.pages.privacyTitle}
        eyebrow="Effective for Current Foundation Release"
        containerSize="narrow"
      />

      <ContentSection containerSize="narrow">
        <div className="space-y-8 text-base leading-relaxed text-slate-600">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              1. Local File Handling
            </h2>
            <p className="mt-2">
              In the current release, files are only validated locally in your browser and are not uploaded. Extension, MIME type, and size checks run in browser memory, and no file contents are sent to remote servers or stored in databases.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              2. Personal Data Collection
            </h2>
            <p className="mt-2">
              In the current release, {SITE_CONFIG.brandName} has no user accounts, login forms, or backend database storage, and sets no tracking cookies or advertising scripts.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              3. Future Processing Architecture
            </h2>
            <p className="mt-2">
              PDF processing is not implemented in the current release. Future browser-based tools are planned to process files on your device, and if any future tool requires server-side processing (such as complex document conversions or OCR), updated data-handling and retention details will be published before that tool is enabled.
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
