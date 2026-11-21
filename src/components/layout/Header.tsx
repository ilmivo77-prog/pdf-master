import {Menu} from 'lucide-react';
import {useEffect, useState} from 'react';
import {Link, NavLink, useLocation} from 'react-router-dom';
import {STATIC_ROUTES} from '../../config/site';
import {cn} from '../../lib/cn';
import {useTranslation} from '../../services/localization/i18nService';
import {PdfMasterLogo} from '../brand/PdfMasterLogo';
import {LanguageSelector} from '../navigation/LanguageSelector';
import {Container, Drawer, IconButton} from '../ui';

export function Header() {
  const {t, buildPath} = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.hash]);

  const navLinkClass = ({isActive}: {isActive: boolean}) =>
    cn(
      'whitespace-nowrap shrink-0 text-sm font-medium transition-colors duration-150 hover:underline underline-offset-4',
      isActive ? 'text-blue-700' : 'text-slate-600 hover:text-slate-900'
    );

  const mobileLinkClass = ({isActive}: {isActive: boolean}) =>
    cn(
      'flex min-h-[44px] items-center rounded-lg px-3.5 text-sm font-medium transition-colors duration-150',
      isActive
        ? 'bg-blue-50 text-blue-800'
        : 'text-slate-800 hover:bg-slate-100'
    );

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <Container size="wide" className="h-full">
        <div className="flex h-full items-center justify-between gap-8">
          <Link
            to={buildPath(STATIC_ROUTES.home)}
            className="inline-flex items-center whitespace-nowrap shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          >
            <PdfMasterLogo size="md" />
          </Link>

          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-6"
          >
            <NavLink to={buildPath(STATIC_ROUTES.home)} end className={navLinkClass}>
              {t.nav.home}
            </NavLink>
            <NavLink to={buildPath(STATIC_ROUTES.tools)} className={navLinkClass}>
              {t.nav.allTools}
            </NavLink>
            <Link
              to={`${buildPath(STATIC_ROUTES.home)}#categories`}
              className="whitespace-nowrap shrink-0 text-sm font-medium text-slate-600 transition-colors duration-150 hover:text-slate-900 hover:underline underline-offset-4"
            >
              {t.nav.categories}
            </Link>
            <NavLink to={buildPath(STATIC_ROUTES.about)} className={navLinkClass}>
              {t.nav.about}
            </NavLink>
            <NavLink to={buildPath(STATIC_ROUTES.contact)} className={navLinkClass}>
              {t.nav.contact}
            </NavLink>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <LanguageSelector />

            <Link
              to={buildPath(STATIC_ROUTES.tools)}
              className="hidden sm:inline-flex min-h-[40px] items-center justify-center rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-colors duration-150 hover:bg-blue-800 active:bg-blue-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            >
              {t.nav.exploreToolsCta}
            </Link>

            <IconButton
              variant="secondary"
              size="md"
              onClick={() => setMobileMenuOpen(true)}
              aria-expanded={mobileMenuOpen}
              aria-label={t.nav.openMenu}
              className="md:hidden"
              icon={<Menu className="h-5 w-5" aria-hidden="true" />}
            />
          </div>
        </div>
      </Container>

      <Drawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        title={t.brand.name}
        closeLabel={t.nav.closeMenu}
        placement="end"
      >
        <nav aria-label="Mobile navigation" className="flex flex-col space-y-1">
          <NavLink to={buildPath(STATIC_ROUTES.home)} end className={mobileLinkClass}>
            {t.nav.home}
          </NavLink>
          <NavLink to={buildPath(STATIC_ROUTES.tools)} className={mobileLinkClass}>
            {t.nav.allTools}
          </NavLink>
          <Link
            to={`${buildPath(STATIC_ROUTES.home)}#categories`}
            className="flex min-h-[44px] items-center rounded-lg px-3.5 text-sm font-medium text-slate-800 transition-colors duration-150 hover:bg-slate-100"
          >
            {t.nav.categories}
          </Link>
          <NavLink to={buildPath(STATIC_ROUTES.about)} className={mobileLinkClass}>
            {t.nav.about}
          </NavLink>
          <NavLink to={buildPath(STATIC_ROUTES.contact)} className={mobileLinkClass}>
            {t.nav.contact}
          </NavLink>

          <div className="border-t border-slate-200 pt-4 mt-4">
            <Link
              to={buildPath(STATIC_ROUTES.tools)}
              className="flex min-h-[44px] w-full items-center justify-center rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
            >
              {t.nav.exploreToolsCta}
            </Link>
          </div>
        </nav>
      </Drawer>
    </header>
  );
}
