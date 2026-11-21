import React from 'react';
import {useTranslation} from '../../services/localization/i18nService';
import {Footer} from './Footer';
import {Header} from './Header';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({children}: AppLayoutProps) {
  const {t} = useTranslation();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 overflow-x-clip">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-blue-700 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        {t.nav.skipToContent}
      </a>
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
