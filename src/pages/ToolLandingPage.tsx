import {Suspense, lazy, useMemo} from 'react';
import {useParams} from 'react-router-dom';
import {ToolPageLayout} from '../components/layout/ToolPageLayout';
import {SeoHead} from '../components/seo/SeoHead';
import {Skeleton, type AccordionItem} from '../components/ui';
import {SITE_CONFIG} from '../config/site';
import {getToolRichContent} from '../config/toolPageContent';
import {
  getCategoryById,
  getRelatedTools,
  getToolBySlug,
} from '../config/toolsRegistry';
import {FileDropzone} from '../features/pdf/components/FileDropzone';
import {formatBytes} from '../services/file/fileValidation';
import {buildCanonicalUrl} from '../services/seo/seoService';
import type {FileValidationRule} from '../types/file';
import {NotFoundPage} from './NotFoundPage';

const ToolWorkspace = lazy(() =>
  import('../features/pdf/components/ToolWorkspace').then((mod) => ({
    default: mod.ToolWorkspace,
  }))
);

export function ToolLandingPage() {
  const {slug = ''} = useParams<{slug: string}>();

  const tool = getToolBySlug(slug);

  const validationRule: FileValidationRule | null = useMemo(() => {
    if (!tool) {
      return null;
    }
    return {
      allowedExtensions: tool.supportedInputFormats,
      allowedMimeTypes: tool.supportedInputMimeTypes,
      maxFileSizeBytes: tool.maxFileSizeBytes,
      maxFilesCount: tool.maxFilesCount,
      allowMultiple: tool.allowMultipleFiles,
    };
  }, [tool]);

  if (!tool || !validationRule) {
    return <NotFoundPage />;
  }

  const category = getCategoryById(tool.category);
  const relatedTools = getRelatedTools(tool, 3);
  const isPlanned = tool.status === 'planned';
  const richContent = isPlanned ? null : getToolRichContent(tool.id);

  const executionLabel = isPlanned
    ? tool.executionMode === 'client'
      ? 'Browser-side engine planned'
      : tool.executionMode === 'server'
        ? 'Dedicated server worker planned'
        : 'Hybrid browser / server planned'
    : 'Browser Web Worker (session memory)';

  const faqItems: AccordionItem[] = richContent
    ? richContent.faqs
    : [
        {
          id: 'availability',
          title: `Is ${tool.name} available to process files right now?`,
          content:
            'Not yet. This page is marked as Coming soon while the PDF processing engine is scheduled for an upcoming milestone. You can test local file format and size validation in the dropzone above.',
        },
        {
          id: 'formats-limits',
          title: `What file formats and limits does ${tool.name} accept?`,
          content: `Accepted input formats: ${tool.supportedInputFormats.join(', ').toUpperCase()}. Maximum size per file: ${formatBytes(tool.maxFileSizeBytes)}. Maximum files per queue: ${tool.maxFilesCount}.`,
        },
        {
          id: 'privacy',
          title: 'Are my files sent to a server when I test the dropzone?',
          content:
            'In the current release, planned tools only validate files locally in your browser without sending them to a server.',
        },
      ];

  const structuredData: Record<string, unknown>[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: `${tool.name} – ${SITE_CONFIG.brandName}`,
      url: buildCanonicalUrl(tool.route),
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'All',
      description: tool.seoDescription,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    },
  ];

  if (!isPlanned && faqItems.length > 0) {
    structuredData.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map((item) => ({
        '@type': 'Question',
        name: item.title,
        acceptedAnswer: {
          '@type': 'Answer',
          text: typeof item.content === 'string' ? item.content : '',
        },
      })),
    });
  }

  return (
    <>
      <SeoHead
        title={tool.seoTitle}
        description={tool.seoDescription}
        canonicalPath={tool.route}
        robots={isPlanned ? 'noindex' : 'index, follow'}
        keywords={tool.keywords}
        structuredData={structuredData}
      />

      <ToolPageLayout
        tool={tool}
        category={category}
        executionLabel={executionLabel}
        relatedTools={relatedTools}
        faqItems={faqItems}
        richContent={richContent}
        workspace={
          isPlanned ? (
            <FileDropzone toolName={tool.name} validationRule={validationRule} />
          ) : (
            <Suspense
              fallback={
                <div aria-busy="true" className="space-y-4">
                  <Skeleton variant="rect" className="h-[310px] sm:h-[288px] w-full rounded-2xl" />
                  <Skeleton variant="text" className="h-4 w-3/4" />
                </div>
              }
            >
              <ToolWorkspace tool={tool} validationRule={validationRule} />
            </Suspense>
          )
        }
      />
    </>
  );
}
