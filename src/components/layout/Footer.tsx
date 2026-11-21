import {Link} from 'react-router-dom';
import {SITE_CONFIG, STATIC_ROUTES} from '../../config/site';
import {getFeaturedTools} from '../../config/toolsRegistry';
import {useTranslation} from '../../services/localization/i18nService';
import {PdfMasterLogo} from '../brand/PdfMasterLogo';
import {Container} from '../ui';

export function Footer() {
  const {t, buildPath} = useTranslation();
  const featuredTools = getFeaturedTools();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <Container size="wide" className="py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <Link
              to={buildPath(STATIC_ROUTES.home)}
              className="inline-flex items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            >
              <PdfMasterLogo size="md" />
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-slate-600">
              {t.brand.shortDescription}
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {t.footer.toolsHeading}
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {featuredTools.map((tool) => (
                <li key={tool.id}>
                  <Link
                    to={buildPath(tool.route)}
                    className="text-slate-600 transition-colors hover:text-slate-900"
                  >
                    {tool.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to={buildPath(STATIC_ROUTES.tools)}
                  className="font-medium text-blue-700 transition-colors hover:text-blue-800"
                >
                  {t.footer.allToolsLink}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {t.footer.companyHeading}
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link
                  to={buildPath(STATIC_ROUTES.home)}
                  className="text-slate-600 transition-colors hover:text-slate-900"
                >
                  {t.nav.home}
                </Link>
              </li>
              <li>
                <Link
                  to={buildPath(STATIC_ROUTES.about)}
                  className="text-slate-600 transition-colors hover:text-slate-900"
                >
                  {t.footer.aboutLink}
                </Link>
              </li>
              <li>
                <Link
                  to={buildPath(STATIC_ROUTES.contact)}
                  className="text-slate-600 transition-colors hover:text-slate-900"
                >
                  {t.footer.contactLink}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {t.footer.legalHeading}
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link
                  to={buildPath(STATIC_ROUTES.privacyPolicy)}
                  className="text-slate-600 transition-colors hover:text-slate-900"
                >
                  {t.footer.privacyLink}
                </Link>
              </li>
              <li>
                <Link
                  to={buildPath(STATIC_ROUTES.terms)}
                  className="text-slate-600 transition-colors hover:text-slate-900"
                >
                  {t.footer.termsLink}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {SITE_CONFIG.copyrightYear} {t.brand.copyright}
          </p>
          <p>{t.footer.freeFirstNote}</p>
        </div>
      </Container>
    </footer>
  );
}
