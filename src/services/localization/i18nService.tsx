import React, {createContext, useContext, useEffect, useMemo, useState} from 'react';
import {
  DEFAULT_LOCALE,
  getLocaleConfig,
  isSupportedActiveLocale,
} from '../../config/locales';
import {EN_COMMON_DICTIONARY} from '../../locales/en/common';
import type {
  LocaleConfig,
  SupportedLocaleCode,
  TextDirection,
  TranslationDictionary,
} from '../../types/i18n';

interface LocalizationContextValue {
  locale: SupportedLocaleCode;
  localeConfig: LocaleConfig;
  direction: TextDirection;
  t: TranslationDictionary;
  setLocale: (nextLocale: SupportedLocaleCode) => void;
  buildPath: (path: string, targetLocale?: SupportedLocaleCode) => string;
}

const DICTIONARIES: Record<SupportedLocaleCode, TranslationDictionary> = {
  en: EN_COMMON_DICTIONARY,
};

const LocalizationContext = createContext<LocalizationContextValue | null>(null);

export function stripLocalePrefix(pathname: string): {
  localePrefix: string | null;
  cleanPath: string;
} {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) {
    return {localePrefix: null, cleanPath: '/'};
  }

  const firstSegment = segments[0];
  if (isSupportedActiveLocale(firstSegment)) {
    const rest = segments.slice(1).join('/');
    return {
      localePrefix: firstSegment,
      cleanPath: rest ? `/${rest}` : '/',
    };
  }

  return {localePrefix: null, cleanPath: pathname};
}

export function buildLocalizedPath(
  path: string,
  locale: SupportedLocaleCode = DEFAULT_LOCALE,
  includeDefaultPrefix = false
): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE && !includeDefaultPrefix) {
    return normalizedPath;
  }
  return normalizedPath === '/' ? `/${locale}` : `/${locale}${normalizedPath}`;
}

export function LocaleProvider({children}: {children: React.ReactNode}) {
  const [locale, setLocale] = useState<SupportedLocaleCode>(DEFAULT_LOCALE);
  const localeConfig = useMemo(() => getLocaleConfig(locale), [locale]);

  useEffect(() => {
    document.documentElement.lang = localeConfig.code;
    document.documentElement.dir = localeConfig.direction;
  }, [localeConfig]);

  const value = useMemo<LocalizationContextValue>(
    () => ({
      locale,
      localeConfig,
      direction: localeConfig.direction,
      t: DICTIONARIES[locale] ?? EN_COMMON_DICTIONARY,
      setLocale,
      buildPath: (path: string, targetLocale?: SupportedLocaleCode) =>
        buildLocalizedPath(path, targetLocale ?? locale),
    }),
    [locale, localeConfig]
  );

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
}

export function useTranslation(): LocalizationContextValue {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LocaleProvider');
  }
  return context;
}
