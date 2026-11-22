import {Suspense, lazy, useEffect} from 'react';
import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
  useParams,
} from 'react-router-dom';
import {AppLayout} from '../components/layout/AppLayout';
import {Skeleton} from '../components/ui';
import {isSupportedActiveLocale} from '../config/locales';
import {STATIC_ROUTES} from '../config/site';
import {NotFoundPage} from '../pages/NotFoundPage';

const HomePage = lazy(() =>
  import('../pages/HomePage').then((mod) => ({default: mod.HomePage}))
);
const ToolsPage = lazy(() =>
  import('../pages/ToolsPage').then((mod) => ({default: mod.ToolsPage}))
);
const ToolLandingPage = lazy(() =>
  import('../pages/ToolLandingPage').then((mod) => ({
    default: mod.ToolLandingPage,
  }))
);
const AboutPage = lazy(() =>
  import('../pages/AboutPage').then((mod) => ({default: mod.AboutPage}))
);
const ContactPage = lazy(() =>
  import('../pages/ContactPage').then((mod) => ({default: mod.ContactPage}))
);
const PrivacyPage = lazy(() =>
  import('../pages/PrivacyPage').then((mod) => ({default: mod.PrivacyPage}))
);
const TermsPage = lazy(() =>
  import('../pages/TermsPage').then((mod) => ({default: mod.TermsPage}))
);
const DesignSystemPage = lazy(() =>
  import('../pages/DesignSystemPage').then((mod) => ({
    default: mod.DesignSystemPage,
  }))
);
const DevPipelinePage = lazy(() =>
  import('../pages/DevPipelinePage').then((mod) => ({
    default: mod.DevPipelinePage,
  }))
);

function ScrollManager() {
  const {pathname, hash} = useLocation();

  useEffect(() => {
    if (hash) {
      const targetId = hash.slice(1);
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({behavior: 'smooth'});
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}

function PageLoadingFallback() {
  return (
    <div
      aria-busy="true"
      className="min-h-[calc(100vh-4rem)] border-b border-slate-200 bg-slate-50"
    >
      <div className="border-b border-slate-200 bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-6xl space-y-4 px-4 sm:px-6 lg:px-8">
          <Skeleton variant="text" className="h-4 w-32" />
          <Skeleton variant="text" className="h-10 w-72 sm:w-96" />
          <Skeleton variant="text" className="h-5 w-full max-w-xl" />
        </div>
      </div>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        <Skeleton variant="rect" className="h-64 w-full rounded-2xl" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton variant="rect" className="h-36 rounded-xl" />
          <Skeleton variant="rect" className="h-36 rounded-xl" />
          <Skeleton variant="rect" className="h-36 rounded-xl" />
          <Skeleton variant="rect" className="h-36 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function LocalizedRouteGuard({children}: {children: React.ReactNode}) {
  const {locale = ''} = useParams<{locale: string}>();
  if (!isSupportedActiveLocale(locale)) {
    return <NotFoundPage />;
  }
  return <>{children}</>;
}

function DevOnlyDesignSystemRoute() {
  if (!import.meta.env.DEV) {
    return <NotFoundPage />;
  }
  return <DesignSystemPage />;
}

function DevOnlyPipelineRoute() {
  if (!import.meta.env.DEV) {
    return <NotFoundPage />;
  }
  return <DevPipelinePage />;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollManager />
      <AppLayout>
        <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
            {/* Default English Routes */}
            <Route path={STATIC_ROUTES.home} element={<HomePage />} />
            <Route path={STATIC_ROUTES.tools} element={<ToolsPage />} />
            <Route path={STATIC_ROUTES.about} element={<AboutPage />} />
            <Route path={STATIC_ROUTES.contact} element={<ContactPage />} />
            <Route path={STATIC_ROUTES.privacyPolicy} element={<PrivacyPage />} />
            <Route path={STATIC_ROUTES.terms} element={<TermsPage />} />
            <Route path="/design-system" element={<DevOnlyDesignSystemRoute />} />
            <Route path="/dev/pipeline" element={<DevOnlyPipelineRoute />} />
            <Route path="/:slug" element={<ToolLandingPage />} />

            {/* Localized URL Prefix Architecture (e.g. /en, /en/merge-pdf) */}
            <Route
              path="/:locale"
              element={
                <LocalizedRouteGuard>
                  <HomePage />
                </LocalizedRouteGuard>
              }
            />
            <Route
              path="/:locale/tools"
              element={
                <LocalizedRouteGuard>
                  <ToolsPage />
                </LocalizedRouteGuard>
              }
            />
            <Route
              path="/:locale/about"
              element={
                <LocalizedRouteGuard>
                  <AboutPage />
                </LocalizedRouteGuard>
              }
            />
            <Route
              path="/:locale/contact"
              element={
                <LocalizedRouteGuard>
                  <ContactPage />
                </LocalizedRouteGuard>
              }
            />
            <Route
              path="/:locale/privacy-policy"
              element={
                <LocalizedRouteGuard>
                  <PrivacyPage />
                </LocalizedRouteGuard>
              }
            />
            <Route
              path="/:locale/terms"
              element={
                <LocalizedRouteGuard>
                  <TermsPage />
                </LocalizedRouteGuard>
              }
            />
            <Route
              path="/:locale/design-system"
              element={
                <LocalizedRouteGuard>
                  <DevOnlyDesignSystemRoute />
                </LocalizedRouteGuard>
              }
            />
            <Route
              path="/:locale/:slug"
              element={
                <LocalizedRouteGuard>
                  <ToolLandingPage />
                </LocalizedRouteGuard>
              }
            />

            {/* Fallback 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AppLayout>
    </BrowserRouter>
  );
}
