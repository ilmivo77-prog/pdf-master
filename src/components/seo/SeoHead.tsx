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

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-route-schema', 'true');
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [structuredData]);

  return null;
}
