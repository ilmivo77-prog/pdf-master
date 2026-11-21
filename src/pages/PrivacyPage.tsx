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
              In the current foundation release of {SITE_CONFIG.brandName}, files you select in any tool dropzone remain strictly inside your browser session memory for client-side extension, MIME type, and size validation. No files are uploaded to remote servers, stored in databases, or shared with third parties.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              2. Personal Data Collection
            </h2>
            <p className="mt-2">
              {SITE_CONFIG.brandName} does not require user accounts, login credentials, or personal profiles. We do not collect tracking cookies or behavioral advertising profiles.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              3. Future Processing Architecture
            </h2>
            <p className="mt-2">
              As individual PDF processing engines are introduced in upcoming milestones, operations that run directly in the browser will continue to keep documents on your device. Whenever a future tool requires server-side processing (such as complex document format conversions or OCR), clear retention, cleanup, and transport policies will be published and enforced before those tools are enabled.
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
