import type {
  PdfToolDefinition,
  ToolCategoryDefinition,
  ToolCategoryId,
} from '../types/tool';
import type {SitemapRouteEntry} from '../types/seo';
import {PROCESSING_LIMITS} from './processingLimits';
import {STATIC_ROUTES} from './site';

export const TOOL_CATEGORIES: ToolCategoryDefinition[] = [
  {
    id: 'organize-pdf',
    name: 'Organize PDF',
    slug: 'organize-pdf',
    description: 'Combine, split, extract, and structure pages across PDF documents.',
    icon: 'layers',
    accentColorClass: 'text-blue-700',
    accentSurfaceClass: 'bg-blue-50',
    displayOrder: 1,
  },
  {
    id: 'optimize-pdf',
    name: 'Optimize PDF',
    slug: 'optimize-pdf',
    description: 'Reduce document file size and clean internal structure for easier sharing.',
    icon: 'compress',
    accentColorClass: 'text-emerald-700',
    accentSurfaceClass: 'bg-emerald-50',
    displayOrder: 2,
  },
  {
    id: 'convert-to-pdf',
    name: 'Convert to PDF',
    slug: 'convert-to-pdf',
    description: 'Turn office documents, spreadsheets, and images into standard PDFs.',
    icon: 'file-text',
    accentColorClass: 'text-sky-700',
    accentSurfaceClass: 'bg-sky-50',
    displayOrder: 3,
  },
  {
    id: 'convert-from-pdf',
    name: 'Convert from PDF',
    slug: 'convert-from-pdf',
    description: 'Export PDF pages into editable Word files or crisp raster images.',
    icon: 'images',
    accentColorClass: 'text-amber-800',
    accentSurfaceClass: 'bg-amber-50',
    displayOrder: 4,
  },
  {
    id: 'edit-pdf',
    name: 'Edit PDF',
    slug: 'edit-pdf',
    description: 'Rotate pages, add page numbers, insert watermarks, and annotate.',
    icon: 'edit',
    accentColorClass: 'text-indigo-700',
    accentSurfaceClass: 'bg-indigo-50',
    displayOrder: 5,
  },
  {
    id: 'security',
    name: 'Security',
    slug: 'security',
    description:
      'Planned tools for password protection, permissions, and authorized file unlocking.',
    icon: 'shield',
    accentColorClass: 'text-slate-700',
    accentSurfaceClass: 'bg-slate-100',
    displayOrder: 6,
  },
  {
    id: 'ocr-extraction',
    name: 'OCR and Extraction',
    slug: 'ocr-extraction',
    description: 'Recognize scanned text and extract text, tables, or embedded assets.',
    icon: 'scan-text',
    accentColorClass: 'text-teal-700',
    accentSurfaceClass: 'bg-teal-50',
    displayOrder: 7,
  },
  {
    id: 'ai-pdf-tools',
    name: 'AI PDF Tools',
    slug: 'ai-pdf-tools',
    description: 'Future intelligent document summarization, Q&A, and structured extraction.',
    icon: 'sparkles',
    accentColorClass: 'text-violet-700',
    accentSurfaceClass: 'bg-violet-50',
    displayOrder: 8,
  },
];

const PDF_MIME_TYPES = ['application/pdf'];
const WORD_MIME_TYPES = [
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const JPG_MIME_TYPES = ['image/jpeg'];

export const PDF_TOOLS_REGISTRY: PdfToolDefinition[] = [
  {
    id: 'merge-pdf',
    name: 'Merge PDF',
    slug: 'merge-pdf',
    description: 'Combine multiple PDF documents into a single file in your preferred order.',
    category: 'organize-pdf',
    icon: 'merge',
    route: '/merge-pdf',
    supportedInputFormats: ['.pdf'],
    supportedInputMimeTypes: PDF_MIME_TYPES,
    supportedOutputFormats: ['.pdf'],
    allowMultipleFiles: true,
    maxFileSizeBytes: PROCESSING_LIMITS.maxFileSizeBytes,
    maxFilesCount: PROCESSING_LIMITS.maxFilesCount,
    status: 'available',
    executionMode: 'client',
    seoTitle: 'Merge PDF Files in Your Browser – PDF Master',
    seoDescription:
      'Combine 2 to 10 unrestricted PDF documents into one ordered PDF directly in your browser using PDF Master.',
    keywords: ['merge pdf', 'combine', 'combine pdf', 'join', 'join pdf files', 'append'],
    isFeatured: true,
    featured: true,
    popularityRank: 1,
    relatedToolIds: ['split-pdf', 'extract-pages', 'remove-pages'],
  },
  {
    id: 'split-pdf',
    name: 'Split PDF',
    slug: 'split-pdf',
    description: 'Separate a multi-page PDF into individual pages, fixed chunks, or custom page ranges.',
    category: 'organize-pdf',
    icon: 'split',
    route: '/split-pdf',
    supportedInputFormats: ['.pdf'],
    supportedInputMimeTypes: PDF_MIME_TYPES,
    supportedOutputFormats: ['.pdf', '.zip'],
    allowMultipleFiles: false,
    maxFileSizeBytes: PROCESSING_LIMITS.maxFileSizeBytes,
    maxFilesCount: 1,
    status: 'available',
    executionMode: 'client',
    seoTitle: 'Split PDF Pages in Your Browser – PDF Master',
    seoDescription:
      'Divide a PDF by custom page ranges, fixed page counts, or individual pages with automatic ZIP packaging on PDF Master.',
    keywords: ['split pdf', 'divide pdf', 'separate pages', 'split by range', 'chunk pdf'],
    isFeatured: true,
    featured: true,
    popularityRank: 2,
    relatedToolIds: ['extract-pages', 'remove-pages', 'merge-pdf'],
  },
  {
    id: 'extract-pages',
    name: 'Extract Pages',
    slug: 'extract-pages',
    description: 'Pick specific pages or ranges from a PDF and save them into a new document in your chosen order.',
    category: 'organize-pdf',
    icon: 'extract',
    route: '/extract-pages',
    supportedInputFormats: ['.pdf'],
    supportedInputMimeTypes: PDF_MIME_TYPES,
    supportedOutputFormats: ['.pdf'],
    allowMultipleFiles: false,
    maxFileSizeBytes: PROCESSING_LIMITS.maxFileSizeBytes,
    maxFilesCount: 1,
    status: 'available',
    executionMode: 'client',
    seoTitle: 'Extract PDF Pages in Your Browser – PDF Master',
    seoDescription:
      'Select exact pages or ranges from a PDF and save them as a single new document in your chosen order.',
    keywords: ['extract pages', 'select pages', 'pick pages', 'extract pdf pages', 'save pages'],
    isFeatured: false,
    featured: false,
    popularityRank: 5,
    relatedToolIds: ['remove-pages', 'split-pdf', 'merge-pdf'],
  },
  {
    id: 'remove-pages',
    name: 'Remove Pages',
    slug: 'remove-pages',
    description: 'Delete unwanted pages or page ranges from a PDF while keeping the remaining pages in order.',
    category: 'organize-pdf',
    icon: 'remove',
    route: '/remove-pages',
    supportedInputFormats: ['.pdf'],
    supportedInputMimeTypes: PDF_MIME_TYPES,
    supportedOutputFormats: ['.pdf'],
    allowMultipleFiles: false,
    maxFileSizeBytes: PROCESSING_LIMITS.maxFileSizeBytes,
    maxFilesCount: 1,
    status: 'available',
    executionMode: 'client',
    seoTitle: 'Remove Pages from PDF in Your Browser – PDF Master',
    seoDescription:
      'Delete specific pages or ranges from an unrestricted PDF directly inside your browser using PDF Master.',
    keywords: ['remove pages', 'delete pages', 'drop pages', 'delete pdf pages', 'trim pdf'],
    isFeatured: false,
    featured: false,
    popularityRank: 6,
    relatedToolIds: ['extract-pages', 'organize-pdf', 'split-pdf'],
  },
  {
    id: 'organize-pdf',
    name: 'Organize PDF',
    slug: 'organize-pdf',
    description:
      'Visually rearrange, rotate, and delete PDF pages in your preferred order before saving a clean document.',
    category: 'organize-pdf',
    icon: 'organize',
    route: '/organize-pdf',
    supportedInputFormats: ['.pdf'],
    supportedInputMimeTypes: PDF_MIME_TYPES,
    supportedOutputFormats: ['.pdf'],
    allowMultipleFiles: false,
    maxFileSizeBytes: PROCESSING_LIMITS.maxFileSizeBytes,
    maxFilesCount: 1,
    status: 'available',
    executionMode: 'client',
    seoTitle: 'Organize PDF Pages in Your Browser – PDF Master',
    seoDescription:
      'Rearrange, reorder, rotate, sort, and remove pages inside an unrestricted PDF directly in your browser using PDF Master.',
    keywords: [
      'organize pdf',
      'rearrange pages',
      'reorder pages',
      'sort pages',
      'rotate pages',
      'delete pages',
    ],
    isFeatured: false,
    featured: false,
    popularityRank: 7,
    relatedToolIds: ['merge-pdf', 'split-pdf', 'extract-pages'],
  },
  {
    id: 'compress-pdf',
    name: 'Compress PDF',
    slug: 'compress-pdf',
    description: 'Reduce PDF file size while keeping text and visuals readable for email and web.',
    category: 'optimize-pdf',
    icon: 'compress',
    route: '/compress-pdf',
    supportedInputFormats: ['.pdf'],
    supportedInputMimeTypes: PDF_MIME_TYPES,
    supportedOutputFormats: ['.pdf'],
    allowMultipleFiles: true,
    maxFileSizeBytes: 50 * 1024 * 1024,
    maxFilesCount: 10,
    status: 'planned',
    executionMode: 'hybrid',
    seoTitle: 'Compress PDF Online – Reduce PDF Size | PDF Master',
    seoDescription:
      'Shrink large PDF documents for easier sharing and lighter uploads with PDF Master.',
    keywords: ['compress pdf', 'reduce size', 'reduce pdf size', 'shrink', 'optimize pdf'],
    isFeatured: true,
    featured: true,
    popularityRank: 3,
    relatedToolIds: ['merge-pdf', 'split-pdf', 'pdf-to-jpg'],
  },
  {
    id: 'pdf-to-word',
    name: 'PDF to Word',
    slug: 'pdf-to-word',
    description: 'Convert PDF documents into editable Word (.docx) files for quick revisions.',
    category: 'convert-from-pdf',
    icon: 'file-text',
    route: '/pdf-to-word',
    supportedInputFormats: ['.pdf'],
    supportedInputMimeTypes: PDF_MIME_TYPES,
    supportedOutputFormats: ['.docx'],
    allowMultipleFiles: true,
    maxFileSizeBytes: PROCESSING_LIMITS.maxFileSizeBytes,
    maxFilesCount: 5,
    status: 'planned',
    executionMode: 'server',
    seoTitle: 'PDF to Word Converter Online – PDF Master',
    seoDescription:
      'Transform static PDF documents into editable Word files cleanly with PDF Master.',
    keywords: ['pdf to word', 'pdf to docx', 'convert pdf to word', 'editable word', 'doc'],
    isFeatured: true,
    featured: true,
    popularityRank: 4,
    relatedToolIds: ['word-to-pdf', 'pdf-to-jpg', 'compress-pdf'],
  },
  {
    id: 'word-to-pdf',
    name: 'Word to PDF',
    slug: 'word-to-pdf',
    description: 'Convert Microsoft Word (.doc, .docx) documents into universally readable PDFs.',
    category: 'convert-to-pdf',
    icon: 'file-spreadsheet',
    route: '/word-to-pdf',
    supportedInputFormats: ['.doc', '.docx'],
    supportedInputMimeTypes: WORD_MIME_TYPES,
    supportedOutputFormats: ['.pdf'],
    allowMultipleFiles: true,
    maxFileSizeBytes: PROCESSING_LIMITS.maxFileSizeBytes,
    maxFilesCount: 5,
    status: 'planned',
    executionMode: 'server',
    seoTitle: 'Word to PDF Converter Online – PDF Master',
    seoDescription:
      'Convert DOC and DOCX documents into clean, print-ready PDF files with PDF Master.',
    keywords: ['word to pdf', 'docx to pdf', 'doc to pdf', 'convert word to pdf'],
    isFeatured: false,
    featured: false,
    popularityRank: 7,
    relatedToolIds: ['pdf-to-word', 'jpg-to-pdf', 'merge-pdf'],
  },
  {
    id: 'jpg-to-pdf',
    name: 'JPG to PDF',
    slug: 'jpg-to-pdf',
    description: 'Turn JPG and JPEG images into a formatted single or multi-page PDF document.',
    category: 'convert-to-pdf',
    icon: 'image',
    route: '/jpg-to-pdf',
    supportedInputFormats: ['.jpg', '.jpeg'],
    supportedInputMimeTypes: JPG_MIME_TYPES,
    supportedOutputFormats: ['.pdf'],
    allowMultipleFiles: true,
    maxFileSizeBytes: PROCESSING_LIMITS.maxFileSizeBytes,
    maxFilesCount: 25,
    status: 'planned',
    executionMode: 'client',
    seoTitle: 'JPG to PDF Converter Online – PDF Master',
    seoDescription:
      'Combine JPG and JPEG photos into a clean, shareable PDF document using PDF Master.',
    keywords: ['jpg to pdf', 'jpeg to pdf', 'image to pdf', 'photo to pdf'],
    isFeatured: false,
    featured: false,
    popularityRank: 8,
    relatedToolIds: ['pdf-to-jpg', 'merge-pdf', 'compress-pdf'],
  },
  {
    id: 'pdf-to-jpg',
    name: 'PDF to JPG',
    slug: 'pdf-to-jpg',
    description: 'Render PDF pages into high-clarity JPG images for slides, previews, and web use.',
    category: 'convert-from-pdf',
    icon: 'images',
    route: '/pdf-to-jpg',
    supportedInputFormats: ['.pdf'],
    supportedInputMimeTypes: PDF_MIME_TYPES,
    supportedOutputFormats: ['.jpg', '.zip'],
    allowMultipleFiles: false,
    maxFileSizeBytes: PROCESSING_LIMITS.maxFileSizeBytes,
    maxFilesCount: 1,
    status: 'planned',
    executionMode: 'client',
    seoTitle: 'PDF to JPG Converter Online – PDF Master',
    seoDescription:
      'Convert individual PDF pages into crisp JPG images directly from PDF Master.',
    keywords: ['pdf to jpg', 'pdf to image', 'export pdf pages', 'jpeg'],
    isFeatured: false,
    featured: false,
    popularityRank: 9,
    relatedToolIds: ['jpg-to-pdf', 'split-pdf', 'compress-pdf'],
  },
  {
    id: 'rotate-pdf',
    name: 'Rotate PDF',
    slug: 'rotate-pdf',
    description: 'Fix sideways or upside-down PDF pages permanently by 90, 180, or 270 degrees.',
    category: 'edit-pdf',
    icon: 'rotate-cw',
    route: '/rotate-pdf',
    supportedInputFormats: ['.pdf'],
    supportedInputMimeTypes: PDF_MIME_TYPES,
    supportedOutputFormats: ['.pdf'],
    allowMultipleFiles: true,
    maxFileSizeBytes: PROCESSING_LIMITS.maxFileSizeBytes,
    maxFilesCount: 10,
    status: 'planned',
    executionMode: 'client',
    seoTitle: 'Rotate PDF Pages Online – PDF Master',
    seoDescription:
      'Rotate upside-down or sideways PDF pages permanently with PDF Master.',
    keywords: ['rotate pdf', 'turn pdf pages', 'fix pdf orientation', 'flip'],
    isFeatured: false,
    featured: false,
    popularityRank: 10,
    relatedToolIds: ['merge-pdf', 'split-pdf', 'compress-pdf'],
  },
  {
    id: 'protect-pdf',
    name: 'Protect PDF',
    slug: 'protect-pdf',
    description:
      'Planned: restrict unauthorized viewing or copying by adding password protection to a PDF.',
    category: 'security',
    icon: 'lock',
    route: '/protect-pdf',
    supportedInputFormats: ['.pdf'],
    supportedInputMimeTypes: PDF_MIME_TYPES,
    supportedOutputFormats: ['.pdf'],
    allowMultipleFiles: false,
    maxFileSizeBytes: PROCESSING_LIMITS.maxFileSizeBytes,
    maxFilesCount: 1,
    status: 'planned',
    executionMode: 'hybrid',
    seoTitle: 'Protect PDF with Password – PDF Master',
    seoDescription:
      'Planned tool to add password protection to PDF documents using PDF Master.',
    keywords: ['protect pdf', 'password protect pdf', 'lock pdf', 'restrict'],
    isFeatured: false,
    featured: false,
    popularityRank: 11,
    relatedToolIds: ['unlock-pdf', 'merge-pdf', 'compress-pdf'],
  },
  {
    id: 'unlock-pdf',
    name: 'Unlock PDF',
    slug: 'unlock-pdf',
    description:
      'Planned: remove password restrictions from PDF files you are authorized to access.',
    category: 'security',
    icon: 'unlock',
    route: '/unlock-pdf',
    supportedInputFormats: ['.pdf'],
    supportedInputMimeTypes: PDF_MIME_TYPES,
    supportedOutputFormats: ['.pdf'],
    allowMultipleFiles: false,
    maxFileSizeBytes: PROCESSING_LIMITS.maxFileSizeBytes,
    maxFilesCount: 1,
    status: 'planned',
    executionMode: 'hybrid',
    seoTitle: 'Unlock PDF Password Online – PDF Master',
    seoDescription:
      'Planned tool to remove password restrictions from authorized PDF files with PDF Master.',
    keywords: ['unlock pdf', 'remove pdf password', 'decrypt pdf', 'unprotect'],
    isFeatured: false,
    featured: false,
    popularityRank: 12,
    relatedToolIds: ['protect-pdf', 'split-pdf', 'compress-pdf'],
  },
];

export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function getAllCategories(): ToolCategoryDefinition[] {
  return [...TOOL_CATEGORIES].sort((a, b) => a.displayOrder - b.displayOrder);
}

export function getCategoryById(
  categoryId: ToolCategoryId
): ToolCategoryDefinition | undefined {
  return TOOL_CATEGORIES.find((cat) => cat.id === categoryId);
}

export function getAllTools(): PdfToolDefinition[] {
  return PDF_TOOLS_REGISTRY;
}

export function getFeaturedTools(): PdfToolDefinition[] {
  return PDF_TOOLS_REGISTRY.filter((tool) => tool.featured ?? tool.isFeatured);
}

export function getPopularTools(limit?: number): PdfToolDefinition[] {
  const sorted = [...PDF_TOOLS_REGISTRY].sort((a, b) => {
    const rankA = a.popularityRank ?? Number.MAX_SAFE_INTEGER;
    const rankB = b.popularityRank ?? Number.MAX_SAFE_INTEGER;
    if (rankA !== rankB) {
      return rankA - rankB;
    }
    return a.name.localeCompare(b.name);
  });

  return typeof limit === 'number' && limit >= 0 ? sorted.slice(0, limit) : sorted;
}

export function getToolBySlug(slug: string): PdfToolDefinition | undefined {
  return PDF_TOOLS_REGISTRY.find((tool) => tool.slug === slug);
}

export function getToolsByCategory(
  categoryId: ToolCategoryId
): PdfToolDefinition[] {
  return PDF_TOOLS_REGISTRY.filter((tool) => tool.category === categoryId);
}

function scoreToolMatch(
  tool: PdfToolDefinition,
  normalizedQuery: string
): number {
  const normalizedName = normalizeSearchText(tool.name);
  const normalizedDescription = normalizeSearchText(tool.description);
  const normalizedKeywords = tool.keywords.map(normalizeSearchText);
  const categoryName = normalizeSearchText(
    getCategoryById(tool.category)?.name ?? ''
  );

  // Ranking order: exact name match > name partial > keyword match > category/description match
  if (normalizedName === normalizedQuery) {
    return 100;
  }
  if (normalizedName.startsWith(normalizedQuery)) {
    return 85;
  }
  if (normalizedName.includes(normalizedQuery)) {
    return 70;
  }

  if (normalizedKeywords.some((kw) => kw === normalizedQuery)) {
    return 60;
  }
  if (normalizedKeywords.some((kw) => kw.includes(normalizedQuery))) {
    return 50;
  }

  // Multi-word query fallback: every query token appears across name + keywords + category
  const queryTokens = normalizedQuery.split(' ').filter(Boolean);
  const combinedKeywordsAndName = `${normalizedName} ${normalizedKeywords.join(' ')}`;
  if (
    queryTokens.length > 1 &&
    queryTokens.every((token) => combinedKeywordsAndName.includes(token))
  ) {
    return 45;
  }

  if (categoryName.includes(normalizedQuery)) {
    return 30;
  }

  if (normalizedDescription.includes(normalizedQuery)) {
    return 20;
  }

  if (
    queryTokens.length > 1 &&
    queryTokens.every((token) =>
      `${combinedKeywordsAndName} ${categoryName} ${normalizedDescription}`.includes(
        token
      )
    )
  ) {
    return 15;
  }

  return 0;
}

export function searchTools(
  query: string,
  categoryFilter?: ToolCategoryId | 'all'
): PdfToolDefinition[] {
  const normalizedQuery = normalizeSearchText(query);

  const categoryFiltered = PDF_TOOLS_REGISTRY.filter((tool) => {
    return (
      !categoryFilter ||
      categoryFilter === 'all' ||
      tool.category === categoryFilter
    );
  });

  if (!normalizedQuery) {
    return categoryFiltered;
  }

  return categoryFiltered
    .map((tool) => ({
      tool,
      score: scoreToolMatch(tool, normalizedQuery),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      const rankA = a.tool.popularityRank ?? Number.MAX_SAFE_INTEGER;
      const rankB = b.tool.popularityRank ?? Number.MAX_SAFE_INTEGER;
      if (rankA !== rankB) {
        return rankA - rankB;
      }
      return a.tool.name.localeCompare(b.tool.name);
    })
    .map((entry) => entry.tool);
}

export function getRelatedTools(
  tool: PdfToolDefinition,
  limit = 3
): PdfToolDefinition[] {
  const explicitIds = tool.relatedToolIds ?? [];
  const explicitTools = explicitIds
    .map((id) => PDF_TOOLS_REGISTRY.find((item) => item.id === id))
    .filter((item): item is PdfToolDefinition => Boolean(item && item.id !== tool.id));

  if (explicitTools.length >= limit) {
    return explicitTools.slice(0, limit);
  }

  const sameCategoryFallbacks = PDF_TOOLS_REGISTRY.filter(
    (item) =>
      item.id !== tool.id &&
      item.category === tool.category &&
      !explicitTools.some((existing) => existing.id === item.id)
  );

  return [...explicitTools, ...sameCategoryFallbacks].slice(0, limit);
}

export function getToolRoutesForSitemap(): SitemapRouteEntry[] {
  const staticEntries: SitemapRouteEntry[] = [
    {path: STATIC_ROUTES.home, changeFrequency: 'weekly', priority: 1.0},
    {path: STATIC_ROUTES.tools, changeFrequency: 'weekly', priority: 0.9},
    {path: STATIC_ROUTES.about, changeFrequency: 'monthly', priority: 0.6},
    {path: STATIC_ROUTES.contact, changeFrequency: 'monthly', priority: 0.5},
    {path: STATIC_ROUTES.privacyPolicy, changeFrequency: 'monthly', priority: 0.4},
    {path: STATIC_ROUTES.terms, changeFrequency: 'monthly', priority: 0.4},
  ];

  const toolEntries: SitemapRouteEntry[] = PDF_TOOLS_REGISTRY.filter(
    (tool) => tool.status !== 'planned'
  ).map((tool) => ({
    path: tool.route,
    changeFrequency: 'weekly',
    priority: (tool.featured ?? tool.isFeatured) ? 0.85 : 0.8,
  }));

  return [...staticEntries, ...toolEntries];
}
