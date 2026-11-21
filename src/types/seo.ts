export interface HreflangEntry {
  hrefLang: string;
  href: string;
}

export type RobotsDirective =
  | 'index, follow'
  | 'noindex'
  | 'noindex, nofollow'
  | 'noindex, follow';

export interface SeoMetadata {
  title: string;
  description: string;
  canonicalPath?: string;
  robots?: RobotsDirective;
  ogType?: 'website' | 'article';
  keywords?: string[];
  structuredData?: Record<string, unknown>;
  alternates?: HreflangEntry[];
}

export interface SitemapRouteEntry {
  path: string;
  changeFrequency: 'weekly' | 'monthly';
  priority: number;
}
