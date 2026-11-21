import {Link} from 'react-router-dom';
import {Container} from '../components/ui';
import {SeoHead} from '../components/seo/SeoHead';
import {SITE_CONFIG, STATIC_ROUTES} from '../config/site';
import {useTranslation} from '../services/localization/i18nService';

export function NotFoundPage() {
  const {t, buildPath} = useTranslation();

  return (
    <>
      <SeoHead
        title={`${t.pages.notFoundTitle} – ${SITE_CONFIG.brandName}`}
        description={t.pages.notFoundDescription}
        robots="noindex"
        includeHreflang={false}
      />

      <section className="py-20 sm:py-28">
        <Container size="narrow" className="text-center">
          <p className="font-mono text-sm font-semibold text-blue-700">404</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            {t.pages.notFoundTitle}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-slate-600">
            {t.pages.notFoundDescription}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to={buildPath(STATIC_ROUTES.home)}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-blue-800 whitespace-nowrap"
            >
              {t.pages.notFoundHomeCta}
            </Link>
            <Link
              to={buildPath(STATIC_ROUTES.tools)}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition-colors duration-150 hover:bg-slate-50 whitespace-nowrap"
            >
              {t.pages.notFoundToolsCta}
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
