export const SITE_CONFIG = {
  brandName: 'PDF Master',
  tagline: 'All Your PDF Tools. One Simple Platform.',
  description:
    'A free-first, comprehensive online PDF utility platform to merge, split, compress, convert, edit, and manage PDF files.',
  defaultLocale: 'en' as const,
  baseUrlFallback: 'https://pdfmaster.example',
  copyrightYear: 2026,
  defaultMaxFileSizeBytes: 25 * 1024 * 1024,
  defaultMaxFilesCount: 10,
} as const;

export const STATIC_ROUTES = {
  home: '/',
  tools: '/tools',
  about: '/about',
  contact: '/contact',
  privacyPolicy: '/privacy-policy',
  terms: '/terms',
} as const;
