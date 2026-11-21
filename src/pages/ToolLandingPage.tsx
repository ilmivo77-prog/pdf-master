import {useMemo} from 'react';
import {useParams} from 'react-router-dom';
import {ToolPageLayout} from '../components/layout/ToolPageLayout';
import {SeoHead} from '../components/seo/SeoHead';
import type {AccordionItem} from '../components/ui';
import {SITE_CONFIG} from '../config/site';
import {
  getCategoryById,
  getRelatedTools,
  getToolBySlug,
} from '../config/toolsRegistry';
import {FileDropzone} from '../features/pdf/components/FileDropzone';
import {formatBytes} from '../services/file/fileValidation';
import type {FileValidationRule} from '../types/file';
import {NotFoundPage} from './NotFoundPage';

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

  const executionLabel =
    tool.executionMode === 'client'
      ? 'Browser-side engine planned'
      : tool.executionMode === 'server'
        ? 'Dedicated server worker planned'
        : 'Hybrid browser / server planned';

  const faqItems: AccordionItem[] = [
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
      title: 'Are my files uploaded to a server when I test the dropzone?',
      content:
        'In the current release, files are only validated locally in your browser and are not uploaded.',
    },
  ];

  const toolSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: `${tool.name} – ${SITE_CONFIG.brandName}`,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'All',
    description: tool.seoDescription,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <>
      <SeoHead
        title={tool.seoTitle}
        description={tool.seoDescription}
        canonicalPath={tool.route}
        robots={isPlanned ? 'noindex' : 'index, follow'}
        keywords={tool.keywords}
        structuredData={toolSchema}
      />

      <ToolPageLayout
        tool={tool}
        category={category}
        executionLabel={executionLabel}
        relatedTools={relatedTools}
        faqItems={faqItems}
        workspace={
          <FileDropzone toolName={tool.name} validationRule={validationRule} />
        }
      />
    </>
  );
}
