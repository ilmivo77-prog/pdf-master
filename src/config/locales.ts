import type {LocaleConfig, PlannedLocaleCode, SupportedLocaleCode} from '../types/i18n';

export const DEFAULT_LOCALE: SupportedLocaleCode = 'en';

export const ACTIVE_LOCALE_CODES: SupportedLocaleCode[] = ['en'];

export const LOCALE_CATALOG: LocaleConfig[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    isActive: true,
    regionHint: 'Global',
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    direction: 'ltr',
    isActive: false,
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    direction: 'ltr',
    isActive: false,
  },
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    direction: 'ltr',
    isActive: false,
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    direction: 'rtl',
    isActive: false,
  },
  {
    code: 'ur',
    name: 'Urdu',
    nativeName: 'اردو',
    direction: 'rtl',
    isActive: false,
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    direction: 'ltr',
    isActive: false,
  },
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    direction: 'ltr',
    isActive: false,
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    direction: 'ltr',
    isActive: false,
  },
  {
    code: 'zh-CN',
    name: 'Chinese (Simplified)',
    nativeName: '简体中文',
    direction: 'ltr',
    isActive: false,
  },
];

export function isSupportedActiveLocale(code: string): code is SupportedLocaleCode {
  return (ACTIVE_LOCALE_CODES as string[]).includes(code);
}

export function isKnownLocaleCode(code: string): code is PlannedLocaleCode {
  return LOCALE_CATALOG.some((locale) => locale.code === code);
}

export function getLocaleConfig(code: string): LocaleConfig {
  return (
    LOCALE_CATALOG.find((locale) => locale.code === code) ?? LOCALE_CATALOG[0]
  );
}
