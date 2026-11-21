import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter} from 'react-router-dom';
import {PdfMasterLogo} from '../components/brand/PdfMasterLogo';
import {
  Accordion,
  Alert,
  Badge,
  Breadcrumbs,
  Button,
  EmptyState,
  Pagination,
  ProgressBar,
  Spinner,
} from '../components/ui';
import {getAllTools, getToolBySlug} from '../config/toolsRegistry';
import {pdfProcessingService} from '../features/pdf/services/PdfProcessingService';
import {cn} from '../lib/cn';
import {
  sanitizeFileName,
  validateSelectedFiles,
} from '../services/file/fileValidation';
import {generateSitemapEntries} from '../services/seo/seoService';

async function run() {
  // 1. Class helper
  assert.equal(cn('a', false, null, undefined, 'b'), 'a b');

  // 2. Registry & SEO sitemap exclusion of planned tools
  const tools = getAllTools();
  assert.equal(tools.length, 10);
  assert.ok(getToolBySlug('merge-pdf'));
  assert.equal(getToolBySlug('missing-tool'), undefined);

  const sitemapPaths = generateSitemapEntries().map((entry) => entry.path);
  assert.ok(sitemapPaths.includes('/'));
  assert.ok(sitemapPaths.includes('/tools'));
  assert.equal(sitemapPaths.includes('/merge-pdf'), false);

  // 3. File validation & sanitization
  assert.equal(sanitizeFileName('../../evil<script>.pdf'), 'evil_script_.pdf');
  const validPdf = new File(['%PDF-1.4'], 'report.pdf', {
    type: 'application/pdf',
  });
  const invalidExe = new File(['mz'], 'bad.exe', {
    type: 'application/x-msdownload',
  });
  const validation = validateSelectedFiles([validPdf, invalidExe], {
    allowedExtensions: ['.pdf'],
    allowedMimeTypes: ['application/pdf'],
    maxFileSizeBytes: 1024 * 1024,
    maxFilesCount: 5,
    allowMultiple: true,
  });
  assert.equal(validation.acceptedFiles.length, 1);
  assert.equal(validation.errors.length, 1);
  assert.equal(validation.errors[0].code, 'INVALID_EXTENSION');

  // 4. PDF processing service honest NOT_IMPLEMENTED guard
  const pdfResult = await pdfProcessingService.processFiles([validPdf], {
    operation: 'merge',
  });
  assert.equal(pdfResult.success, false);
  assert.equal(pdfResult.error?.code, 'NOT_IMPLEMENTED');

  // 5. SSR markup render smoke checks for UI components
  const markup = renderToStaticMarkup(
    <MemoryRouter>
      <PdfMasterLogo />
      <Button isLoading loadingText="Working">
        Save
      </Button>
      <Badge variant="warning">Coming soon</Badge>
      <Alert variant="info" title="Notice">
        Body
      </Alert>
      <ProgressBar value={45} showValue label="Queue" />
      <Spinner />
      <Accordion items={[{id: '1', title: 'Q1', content: 'A1'}]} />
      <Breadcrumbs items={[{label: 'Home', to: '/'}, {label: 'Tools'}]} />
      <EmptyState title="Empty" description="None" />
      <Pagination currentPage={1} totalPages={3} onPageChange={() => {}} />
    </MemoryRouter>
  );

  assert.ok(markup.includes('PDF Master'));
  assert.ok(markup.includes('Coming soon'));
  assert.ok(markup.includes('aria-busy="true"'));
  assert.ok(markup.includes('role="progressbar"'));

  console.log('All Milestone 2 unit & SSR render checks passed.');
}

run();
