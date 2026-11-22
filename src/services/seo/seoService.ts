import {ACTIVE_LOCALE_CODES, DEFAULT_LOCALE} from '../../config/locales';
import {SITE_CONFIG} from '../../config/site';
import {getToolRoutesForSitemap} from '../../config/toolsRegistry';
import type {HreflangEntry, SeoMetadata} from '../../types/seo';
import {buildLocalizedPath} from '../localization/i18nService';

let hasWarnedMissingSiteUrl = false;

export interface ResolveBaseOriginOptions {
  envSiteUrl?: string;
  isDev?: boolean;
  windowOrigin?: string;
  onWarn?: (message: string) => void;
}

export function normalizeSiteOrigin(rawUrl: string | undefined | null): string {
  if (typeof rawUrl !== 'string') {
    return '';
  }
  const trimmed = rawUrl.trim().replace(/\/+$/, '');
  if (!trimmed) {
    return '';
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.origin.replace(/\/+$/, '');
    }
  } catch {
    // Non-URL origin override: return trimmed without trailing slashes
  }
  return trimmed;
}

function getBuildEnv(): {siteUrl?: string; isDev: boolean} {
  if (typeof import.meta === 'undefined') {
    return {isDev: false};
  }
  const env = (
    import.meta as unknown as {env?: {VITE_SITE_URL?: string; DEV?: boolean}}
  ).env;
  return {
    siteUrl: typeof env?.VITE_SITE_URL === 'string' ? env.VITE_SITE_URL : undefined,
    isDev: Boolean(env?.DEV),
  };
}

export function resolveBaseOrigin(options?: ResolveBaseOriginOptions): string {
  const buildEnv = getBuildEnv();
  const configuredRaw =
    options && 'envSiteUrl' in options ? options.envSiteUrl : buildEnv.siteUrl;
  const configuredOrigin = normalizeSiteOrigin(configuredRaw);

  if (configuredOrigin) {
    return configuredOrigin;
  }

  const isDev =
    options && 'isDev' in options ? Boolean(options.isDev) : buildEnv.isDev;

  const allowDevWarningInBuild =
    typeof import.meta !== 'undefined' &&
    typeof (import.meta as unknown as {env?: {DEV?: boolean}}).env !== 'undefined'
      ? import.meta.env.DEV
      : true;

  if (allowDevWarningInBuild && isDev) {
    const warningMessage =
      '[PDF Master] VITE_SITE_URL is not set; falling back to browser origin for canonical, og:url, hreflang, and JSON-LD URLs.';
    if (options?.onWarn) {
      options.onWarn(warningMessage);
    } else if (!hasWarnedMissingSiteUrl) {
      hasWarnedMissingSiteUrl = true;
      console.warn(warningMessage);
    }
  }

  if (options && 'windowOrigin' in options) {
    return normalizeSiteOrigin(options.windowOrigin);
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return normalizeSiteOrigin(window.location.origin);
  }

  return '';
}

export function normalizeCanonicalPath(path: string): string {
  const trimmed = path.trim() || '/';
  if (trimmed === '/') {
    return '/';
  }
  const normalized = `/${trimmed.replace(/^\/+/, '').replace(/\/+$/, '')}`;
  return normalized || '/';
}

export function buildCanonicalUrl(
  path: string,
  originOptions?: ResolveBaseOriginOptions
): string {
  const normalizedPath = normalizeCanonicalPath(path);
  return `${resolveBaseOrigin(originOptions)}${normalizedPath}`;
}

export function buildHreflangAlternates(
  cleanPath: string,
  originOptions?: ResolveBaseOriginOptions
): HreflangEntry[] {
  const origin = resolveBaseOrigin(originOptions);
  const normalizedClean = normalizeCanonicalPath(cleanPath);
  const entries: HreflangEntry[] = ACTIVE_LOCALE_CODES.map((code) => ({
    hrefLang: code,
    href: `${origin}${buildLocalizedPath(normalizedClean, code, code !== DEFAULT_LOCALE)}`,
  }));

  entries.push({
    hrefLang: 'x-default',
    href: `${origin}${buildLocalizedPath(normalizedClean, DEFAULT_LOCALE, false)}`,
  });

  return entries;
}

export function generateSitemapEntries(originOptions?: ResolveBaseOriginOptions) {
  const origin = resolveBaseOrigin(originOptions);
  return getToolRoutesForSitemap().map((entry) => ({
    ...entry,
    loc: `${origin}${normalizeCanonicalPath(entry.path)}`,
  }));
}

function upsertMetaTag(
  attributeName: 'name' | 'property',
  attributeValue: string,
  content: string
): void {
  let element = document.head.querySelector<HTMLMetaElement>(
    `meta[${attributeName}="${attributeValue}"]`
  );
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function upsertLinkTag(rel: string, href: string, hreflang?: string): void {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  let element = document.head.querySelector<HTMLLinkElement>(selector);
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    if (hreflang) {
      element.setAttribute('hreflang', hreflang);
    }
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

export function syncDocumentSeo(metadata: SeoMetadata): void {
  document.title = metadata.title;

  const robots = metadata.robots ?? 'index, follow';
  const canonicalUrl = buildCanonicalUrl(
    metadata.canonicalPath ?? window.location.pathname
  );

  upsertMetaTag('name', 'description', metadata.description);
  upsertMetaTag('name', 'robots', robots);
  upsertMetaTag('property', 'og:type', metadata.ogType ?? 'website');
  upsertMetaTag('property', 'og:site_name', SITE_CONFIG.brandName);
  upsertMetaTag('property', 'og:title', metadata.title);
  upsertMetaTag('property', 'og:description', metadata.description);
  upsertMetaTag('property', 'og:url', canonicalUrl);

  upsertMetaTag('name', 'twitter:card', 'summary_large_image');
  upsertMetaTag('name', 'twitter:title', metadata.title);
  upsertMetaTag('name', 'twitter:description', metadata.description);

  upsertLinkTag('canonical', canonicalUrl);

  if (metadata.alternates) {
    metadata.alternates.forEach((alt) => {
      upsertLinkTag('alternate', alt.href, alt.hrefLang);
    });
  }
}
