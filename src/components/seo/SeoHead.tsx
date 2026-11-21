import {useEffect} from 'react';
import {buildHreflangAlternates, syncDocumentSeo} from '../../services/seo/seoService';
import type {SeoMetadata} from '../../types/seo';

interface SeoHeadProps extends SeoMetadata {
  includeHreflang?: boolean;
}

export function SeoHead({
  title,
  description,
  canonicalPath,
  robots = 'index, follow',
  ogType = 'website',
  keywords,
  structuredData,
  includeHreflang = true,
}: SeoHeadProps) {
  useEffect(() => {
    const resolvedPath = canonicalPath ?? window.location.pathname;
    const alternates = includeHreflang
      ? buildHreflangAlternates(resolvedPath)
      : undefined;

    syncDocumentSeo({
      title,
      description,
      canonicalPath: resolvedPath,
      robots,
      ogType,
      keywords,
      alternates,
    });
  }, [title, description, canonicalPath, robots, ogType, keywords, includeHreflang]);

  useEffect(() => {
    if (!structuredData) {
      return undefined;
    }

    const entries = Array.isArray(structuredData) ? structuredData : [structuredData];
    const scripts = entries.map((entry) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-route-schema', 'true');
      script.textContent = JSON.stringify(entry);
      document.head.appendChild(script);
      return script;
    });

    return () => {
      scripts.forEach((script) => script.remove());
    };
  }, [structuredData]);

  return null;
}
