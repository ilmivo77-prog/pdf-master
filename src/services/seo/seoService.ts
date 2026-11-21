import {ACTIVE_LOCALE_CODES, DEFAULT_LOCALE} from '../../config/locales';
import {SITE_CONFIG} from '../../config/site';
import {getToolRoutesForSitemap} from '../../config/toolsRegistry';
import type {HreflangEntry, SeoMetadata} from '../../types/seo';
import {buildLocalizedPath} from '../localization/i18nService';

export function resolveBaseOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return SITE_CONFIG.baseUrlFallback;
}

export function buildCanonicalUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${resolveBaseOrigin()}${normalized}`;
}

export function buildHreflangAlternates(cleanPath: string): HreflangEntry[] {
  const origin = resolveBaseOrigin();
  const entries: HreflangEntry[] = ACTIVE_LOCALE_CODES.map((code) => ({
    hrefLang: code,
    href: `${origin}${buildLocalizedPath(cleanPath, code, code !== DEFAULT_LOCALE)}`,
  }));

  entries.push({
    hrefLang: 'x-default',
    href: `${origin}${buildLocalizedPath(cleanPath, DEFAULT_LOCALE, false)}`,
  });

  return entries;
}

export function generateSitemapEntries() {
  const origin = resolveBaseOrigin();
  return getToolRoutesForSitemap().map((entry) => ({
    ...entry,
    loc: `${origin}${entry.path}`,
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
