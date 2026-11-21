import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {PdfMasterLogo} from '../components/brand/PdfMasterLogo';
import {Footer} from '../components/layout/Footer';
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
  ToastProvider,
} from '../components/ui';
import {validateJobLimits} from '../config/processingLimits';
import {
  getAllCategories,
  getAllTools,
  getFeaturedTools,
  getPopularTools,
  getToolBySlug,
  getToolsByCategory,
  searchTools,
} from '../config/toolsRegistry';
import {ErrorPanel} from '../features/pdf/components/ErrorPanel';
import {ProcessingPanel} from '../features/pdf/components/ProcessingPanel';
import {ResultPanel} from '../features/pdf/components/ResultPanel';
import {
  EngineRegistry,
  IllegalJobTransitionError,
  createProcessingError,
  createProcessingJob,
  jobReducer,
  mapPdfLibError,
  type ProcessingErrorCode,
} from '../features/pdf/engine';
import {pdfInspectEngine} from '../features/pdf/engine/engines/pdfInspectEngine';
import {pdfProcessingService} from '../features/pdf/services/PdfProcessingService';
import {cn} from '../lib/cn';
import {EN_COMMON_DICTIONARY} from '../locales/en/common';
import {AboutPage} from '../pages/AboutPage';
import {ContactPage} from '../pages/ContactPage';
import {DesignSystemPage} from '../pages/DesignSystemPage';
import {DevPipelinePage} from '../pages/DevPipelinePage';
import {HomePage} from '../pages/HomePage';
import {NotFoundPage} from '../pages/NotFoundPage';
import {PrivacyPage} from '../pages/PrivacyPage';
import {TermsPage} from '../pages/TermsPage';
import {ToolLandingPage} from '../pages/ToolLandingPage';
import {ToolsPage} from '../pages/ToolsPage';
import {
  buildOutputFileName,
  createTrackedObjectUrl,
  getTrackedObjectUrlCount,
  revokeAllTrackedObjectUrls,
  triggerOutputDownload,
} from '../services/file/downloadManager';
import {
  detectMagicByteKind,
  isPdfSignatureValid,
  sanitizeFileName,
  validateSelectedFiles,
} from '../services/file/fileValidation';
import {LocaleProvider} from '../services/localization/i18nService';
import {generateSitemapEntries} from '../services/seo/seoService';

const BANNED_CLAIMS = [
  'million',
  'users trust',
  '5 stars',
  'free forever',
  'always free',
  '100% secure',
  '100% safe',
  'encrypted',
  'deleted after',
  'no data stored',
  'unlimited',
  'strictly',
  'never uploaded',
  'zero ',
  'guaranteed',
  'safe',
  'private by',
  'ten tools',
  'all ten',
  'trusted',
  'lightning',
  'instant',
  'blazing',
  'best-in-class',
  'industry-leading',
  'bank-level',
  'military-grade',
] as const;

function assertNoBannedPhrases(sourceLabel: string, text: string) {
  const lower = text.toLowerCase();
  for (const phrase of BANNED_CLAIMS) {
    assert.equal(
      lower.includes(phrase),
      false,
      `${sourceLabel} must not contain banned phrase "${phrase}"`
    );
  }
}

async function run() {
  // 1. Class helper
  assert.equal(cn('a', false, null, undefined, 'b'), 'a b');

  // 2. Registry, search ranking, synonyms, popular & category helpers (all tools still planned)
  const tools = getAllTools();
  const categories = getAllCategories();
  assert.equal(tools.length, 10);
  assert.equal(categories.length, 8);
  assert.ok(tools.every((tool) => tool.status === 'planned'));
  assert.ok(getToolBySlug('merge-pdf'));
  assert.equal(getToolBySlug('missing-tool'), undefined);

  const combineResults = searchTools('combine');
  assert.equal(combineResults[0].id, 'merge-pdf');
  assert.equal(searchTools('shrink')[0].id, 'compress-pdf');
  assert.equal(searchTools('merge pdf')[0].id, 'merge-pdf');
  assert.equal(searchTools('   MéRgE   pDf  ')[0].id, 'merge-pdf');
  assert.equal(searchTools('').length, tools.length);
  assert.equal(searchTools('   ').length, tools.length);
  assert.equal(searchTools('nonexistent-xyz-query').length, 0);

  assert.deepEqual(
    getPopularTools(4).map((tool) => tool.id),
    ['merge-pdf', 'split-pdf', 'compress-pdf', 'pdf-to-word']
  );
  assert.equal(getFeaturedTools().length, 4);

  const totalCategoryToolCount = categories.reduce(
    (sum, category) => sum + getToolsByCategory(category.id).length,
    0
  );
  assert.equal(totalCategoryToolCount, tools.length);

  // 3. SEO sitemap exclusion of planned tools and dev-only routes
  const sitemapPaths = generateSitemapEntries().map((entry) => entry.path);
  assert.ok(sitemapPaths.includes('/'));
  assert.ok(sitemapPaths.includes('/tools'));
  assert.equal(sitemapPaths.includes('/merge-pdf'), false);
  assert.equal(sitemapPaths.includes('/dev/pipeline'), false);

  // 4. File validation, sanitization & magic-byte sniffing
  assert.equal(sanitizeFileName('../../evil<script>.pdf'), 'evil_script_.pdf');
  assert.equal(
    detectMagicByteKind(new TextEncoder().encode('%PDF-1.7\n')),
    'pdf'
  );
  assert.equal(
    isPdfSignatureValid(new TextEncoder().encode('%PDF-1.4\n')),
    true
  );
  assert.equal(
    detectMagicByteKind(new TextEncoder().encode('MZ\x90\x00exe')),
    'unknown'
  );
  assert.equal(
    isPdfSignatureValid(new TextEncoder().encode('MZ\x90\x00exe')),
    false
  );
  assert.equal(detectMagicByteKind(new Uint8Array(0)), 'unknown');
  assert.equal(
    isPdfSignatureValid(new TextEncoder().encode('%PDF')),
    false
  );
  assert.equal(
    detectMagicByteKind(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])),
    'jpeg'
  );
  assert.equal(
    detectMagicByteKind(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    'png'
  );

  // 5. Output filename generation (path traversal, unicode, long names)
  assert.equal(
    buildOutputFileName('../../evil/secret.pdf', 'processed', '.pdf'),
    'secret-processed.pdf'
  );
  assert.equal(
    buildOutputFileName('résumé_日本語.pdf', 'roundtrip', '.pdf'),
    'résumé_日本語-roundtrip.pdf'
  );
  const longGenerated = buildOutputFileName(
    `${'a'.repeat(240)}.pdf`,
    'processed',
    '.pdf'
  );
  assert.ok(longGenerated.length <= 180);
  assert.ok(longGenerated.endsWith('-processed.pdf'));

  // 6. Limits validation
  assert.equal(validateJobLimits([])?.code, 'INVALID_FILE');
  assert.equal(
    validateJobLimits([{name: 'empty.pdf', size: 0}])?.code,
    'INVALID_FILE'
  );
  assert.equal(
    validateJobLimits(
      [{name: 'big.pdf', size: 30 * 1024 * 1024}],
      {maxFileSizeBytes: 25 * 1024 * 1024}
    )?.code,
    'FILE_TOO_LARGE'
  );
  assert.equal(
    validateJobLimits(
      [
        {name: 'a.pdf', size: 20 * 1024 * 1024},
        {name: 'b.pdf', size: 20 * 1024 * 1024},
        {name: 'c.pdf', size: 20 * 1024 * 1024},
      ],
      {maxFileSizeBytes: 25 * 1024 * 1024, maxTotalSizeBytes: 50 * 1024 * 1024}
    )?.code,
    'FILE_TOO_LARGE'
  );
  assert.equal(
    validateJobLimits(
      Array.from({length: 11}, (_, i) => ({name: `f${i}.pdf`, size: 1024})),
      {maxFilesCount: 10}
    )?.code,
    'TOO_MANY_FILES'
  );
  assert.equal(
    validateJobLimits([{name: 'ok.pdf', size: 1024}]),
    null
  );

  // 7. Job state machine legal & illegal transitions + monotonic progress
  let job = createProcessingJob({
    id: 'job-1',
    toolId: 'internal:pdf-inspect',
    inputFiles: [{id: 'f1', name: 'doc.pdf', size: 100, mimeType: 'application/pdf'}],
    options: {},
  });
  assert.equal(job.status, 'idle');

  assert.throws(
    () => jobReducer(job, {type: 'START_PROCESSING'}),
    IllegalJobTransitionError
  );
  assert.throws(
    () =>
      jobReducer(job, {
        type: 'SUCCEED',
        result: {
          outputs: [],
          warnings: [],
          stats: {
            durationMs: 1,
            inputFileCount: 1,
            inputTotalBytes: 100,
            outputFileCount: 0,
            outputTotalBytes: 0,
          },
        },
      }),
    IllegalJobTransitionError
  );

  job = jobReducer(job, {type: 'START_VALIDATING'});
  assert.equal(job.status, 'validating');
  job = jobReducer(job, {type: 'QUEUE'});
  assert.equal(job.status, 'queued');
  job = jobReducer(job, {type: 'START_PROCESSING'});
  assert.equal(job.status, 'processing');
  job = jobReducer(job, {
    type: 'PROGRESS',
    progress: {mode: 'determinate', percent: 60},
  });
  job = jobReducer(job, {
    type: 'PROGRESS',
    progress: {mode: 'determinate', percent: 30}, // regression ignored
  });
  assert.equal(job.progress.percent, 60);
  job = jobReducer(job, {
    type: 'SUCCEED',
    result: {
      outputs: [],
      warnings: [],
      stats: {
        durationMs: 10,
        inputFileCount: 1,
        inputTotalBytes: 100,
        outputFileCount: 0,
        outputTotalBytes: 0,
      },
    },
  });
  assert.equal(job.status, 'succeeded');
  assert.equal(job.progress.percent, 100);
  assert.throws(
    () => jobReducer(job, {type: 'START_VALIDATING'}),
    IllegalJobTransitionError
  );

  // 8. Error taxonomy & pdf-lib error mapping
  const allErrorCodes: ProcessingErrorCode[] = [
    'INVALID_FILE',
    'NOT_A_PDF',
    'ENCRYPTED_PDF',
    'CORRUPT_PDF',
    'FILE_TOO_LARGE',
    'TOO_MANY_FILES',
    'OUT_OF_MEMORY',
    'WORKER_CRASHED',
    'CANCELLED',
    'ENGINE_NOT_FOUND',
    'NOT_IMPLEMENTED',
    'UNKNOWN',
  ];
  for (const code of allErrorCodes) {
    const err = createProcessingError(code, 'internal detail');
    assert.ok(EN_COMMON_DICTIONARY.processingErrors[err.messageKey]);
  }
  assert.equal(
    mapPdfLibError(new Error('Input document to PDFDocument.load is encrypted')).code,
    'ENCRYPTED_PDF'
  );
  assert.equal(
    mapPdfLibError(new Error('No PDF header found')).code,
    'NOT_A_PDF'
  );
  assert.equal(
    mapPdfLibError(new RangeError('Array buffer allocation failed')).code,
    'OUT_OF_MEMORY'
  );
  assert.equal(
    mapPdfLibError(new Error('Failed to parse PDF xref table')).code,
    'CORRUPT_PDF'
  );

  // 9. Engine registry & honest public NOT_IMPLEMENTED guard
  const registry = new EngineRegistry();
  assert.equal(
    registry.resolveEngineForTool('missing-tool').error?.code,
    'ENGINE_NOT_FOUND'
  );
  registry.registerEngine(pdfInspectEngine);
  assert.equal(
    registry.resolveEngineForTool('internal:pdf-inspect').engine?.id,
    'pdf-inspect'
  );
  assert.equal(
    registry.resolveEngineForTool('merge-pdf').error?.code,
    'ENGINE_NOT_FOUND'
  );

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
  assert.equal(validation.errors[0].code, 'INVALID_EXTENSION');

  const pdfResult = await pdfProcessingService.processFiles([validPdf], {
    operation: 'merge',
  });
  assert.equal(pdfResult.success, false);
  assert.equal(pdfResult.error?.code, 'NOT_IMPLEMENTED');

  // 10. Real pdf-lib inspect & roundtrip engine tests in Node
  const createdDoc = await PDFDocument.create();
  createdDoc.setTitle('Milestone 4 Inspect Test');
  createdDoc.setProducer('PDF Master Unit Suite');
  createdDoc.addPage([600, 800]);
  createdDoc.addPage([600, 800]);
  const generatedPdfBytes = await createdDoc.save();
  const generatedArrayBuffer = generatedPdfBytes.slice().buffer;

  const progressEvents: number[] = [];
  const inspectResult = await pdfInspectEngine.run(
    [
      {
        name: 'sample.pdf',
        mimeType: 'application/pdf',
        size: generatedArrayBuffer.byteLength,
        bytes: generatedArrayBuffer.slice(0),
      },
    ],
    {mode: 'inspect'},
    {
      onProgress: (p) => progressEvents.push(p.percent),
      signal: new AbortController().signal,
    }
  );
  assert.equal(inspectResult.stats.pageCount, 2);
  assert.equal(inspectResult.stats.isEncrypted, false);
  assert.equal(inspectResult.stats.metadata?.title, 'Milestone 4 Inspect Test');
  assert.equal(inspectResult.outputs.length, 0);
  assert.ok(progressEvents.length >= 2);

  const roundtripResult = await pdfInspectEngine.run(
    [
      {
        name: '../../evil/Quarterly Report.pdf',
        mimeType: 'application/pdf',
        size: generatedArrayBuffer.byteLength,
        bytes: generatedArrayBuffer.slice(0),
      },
    ],
    {mode: 'roundtrip'},
    {
      onProgress: () => {},
      signal: new AbortController().signal,
    }
  );
  assert.equal(roundtripResult.outputs.length, 1);
  assert.equal(roundtripResult.outputs[0].name, 'Quarterly Report-roundtrip.pdf');
  assert.equal(roundtripResult.outputs[0].mimeType, 'application/pdf');
  assert.equal(isPdfSignatureValid(roundtripResult.outputs[0].bytes), true);
  const reloadedRoundtrip = await PDFDocument.load(roundtripResult.outputs[0].bytes);
  assert.equal(reloadedRoundtrip.getPageCount(), 2);

  await assert.rejects(
    () =>
      pdfInspectEngine.run(
        [
          {
            name: 'spoofed.pdf',
            mimeType: 'application/pdf',
            size: 16,
            bytes: new TextEncoder().encode('MZ\x90\x00NotAPDF!').buffer,
          },
        ],
        {mode: 'inspect'},
        {onProgress: () => {}, signal: new AbortController().signal}
      ),
    (err: {code?: string}) => err?.code === 'NOT_A_PDF'
  );

  await assert.rejects(
    () =>
      pdfInspectEngine.run(
        [
          {
            name: 'truncated.pdf',
            mimeType: 'application/pdf',
            size: 18,
            bytes: new TextEncoder().encode('%PDF-1.4\ntruncated').buffer,
          },
        ],
        {mode: 'inspect'},
        {onProgress: () => {}, signal: new AbortController().signal}
      ),
    (err: {code?: string}) => err?.code === 'CORRUPT_PDF'
  );

  // 11. Download manager ObjectURL tracking & revocation test (mocked URL + DOM)
  const originalCreateObjectUrl = URL.createObjectURL;
  const originalRevokeObjectUrl = URL.revokeObjectURL;
  const originalDocument = (globalThis as {document?: unknown}).document;
  const createdUrls: string[] = [];
  const revokedUrls: string[] = [];
  let urlCounter = 0;

  URL.createObjectURL = () => {
    urlCounter += 1;
    const url = `blob:mock-${urlCounter}`;
    createdUrls.push(url);
    return url;
  };
  URL.revokeObjectURL = (url: string) => {
    revokedUrls.push(url);
  };
  (globalThis as {document: unknown}).document = {
    createElement: () => ({
      href: '',
      download: '',
      rel: '',
      click: () => {},
    }),
    body: {
      appendChild: () => {},
      removeChild: () => {},
    },
  };

  try {
    const tracked = createTrackedObjectUrl(new Blob(['%PDF-1.4'], {type: 'application/pdf'}));
    assert.equal(getTrackedObjectUrlCount(), 1);
    revokeAllTrackedObjectUrls();
    assert.equal(getTrackedObjectUrlCount(), 0);
    assert.ok(revokedUrls.includes(tracked));

    triggerOutputDownload(
      {
        name: 'test-output.pdf',
        mimeType: 'application/pdf',
        bytes: generatedPdfBytes,
        size: generatedPdfBytes.byteLength,
      },
      0
    );
    assert.equal(createdUrls.length, 2);
    assert.equal(revokedUrls.length, 2);
    assert.equal(getTrackedObjectUrlCount(), 0);
  } finally {
    URL.createObjectURL = originalCreateObjectUrl;
    URL.revokeObjectURL = originalRevokeObjectUrl;
    if (originalDocument === undefined) {
      delete (globalThis as {document?: unknown}).document;
    } else {
      (globalThis as {document: unknown}).document = originalDocument;
    }
  }

  // 12. SSR markup render checks for UI components + M4 panels
  const markup = renderToStaticMarkup(
    <LocaleProvider>
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
        <ProcessingPanel
          job={{
            ...createProcessingJob({
              id: 'ssr-job',
              toolId: 'internal:pdf-inspect',
              inputFiles: [],
              options: {},
            }),
            status: 'processing',
            progress: {mode: 'determinate', percent: 50, stageLabel: 'Inspecting'},
          }}
          elapsedMs={1200}
          onCancel={() => {}}
        />
        <ResultPanel result={roundtripResult} onDiscard={() => {}} />
        <ErrorPanel
          error={createProcessingError('NOT_A_PDF', 'RAW_DEV_SECRET_STACK_TRACE')}
          onRetry={() => {}}
        />
      </MemoryRouter>
    </LocaleProvider>
  );

  assert.ok(markup.includes('PDF Master'));
  assert.ok(markup.includes('Coming soon'));
  assert.ok(markup.includes('aria-busy="true"'));
  assert.ok(markup.includes('role="progressbar"'));
  assert.ok(markup.includes('Quarterly Report-roundtrip.pdf'));
  assert.ok(markup.includes('Discard results'));
  assert.equal(markup.includes('RAW_DEV_SECRET_STACK_TRACE'), false);

  // 13. Homepage SSR check + scan ALL pages & src/locales/en/common.ts for banned claims
  const renderPage = (element: React.ReactElement, initialEntry = '/') =>
    renderToStaticMarkup(
      <LocaleProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={[initialEntry]}>{element}</MemoryRouter>
        </ToastProvider>
      </LocaleProvider>
    );

  const homeMarkup = renderPage(<HomePage />, '/');
  const h1Matches = homeMarkup.match(/<h1\b/gi) ?? [];
  assert.equal(h1Matches.length, 1);
  assert.ok(homeMarkup.includes('role="combobox"'));
  assert.ok(homeMarkup.includes('Coming soon'));
  assert.ok(homeMarkup.includes('10 tools planned'));
  assert.ok(homeMarkup.includes('0 live'));
  assert.equal(homeMarkup.toLowerCase().includes('secure'), false);

  assertNoBannedPhrases(
    'src/locales/en/common.ts',
    JSON.stringify(EN_COMMON_DICTIONARY)
  );

  const pageSnapshots: Array<{name: string; html: string}> = [
    {name: 'HomePage', html: homeMarkup},
    {name: 'ToolsPage', html: renderPage(<ToolsPage />, '/tools')},
    {
      name: 'ToolLandingPage',
      html: renderToStaticMarkup(
        <LocaleProvider>
          <ToastProvider>
            <MemoryRouter initialEntries={['/merge-pdf']}>
              <Routes>
                <Route path="/:slug" element={<ToolLandingPage />} />
              </Routes>
            </MemoryRouter>
          </ToastProvider>
        </LocaleProvider>
      ),
    },
    {name: 'AboutPage', html: renderPage(<AboutPage />, '/about')},
    {name: 'ContactPage', html: renderPage(<ContactPage />, '/contact')},
    {name: 'PrivacyPage', html: renderPage(<PrivacyPage />, '/privacy-policy')},
    {name: 'TermsPage', html: renderPage(<TermsPage />, '/terms')},
    {name: 'NotFoundPage', html: renderPage(<NotFoundPage />, '/404')},
    {
      name: 'DesignSystemPage',
      html: renderPage(<DesignSystemPage />, '/design-system'),
    },
    {
      name: 'DevPipelinePage',
      html: renderPage(<DevPipelinePage />, '/dev/pipeline'),
    },
  ];

  for (const snapshot of pageSnapshots) {
    assertNoBannedPhrases(`SSR output (${snapshot.name})`, snapshot.html);
  }

  // 14. ToolsPage SSR checks
  const toolsQueryMarkup = renderPage(<ToolsPage />, '/tools?q=combine');
  assert.ok(toolsQueryMarkup.includes('Merge PDF'));
  const toolsInvalidCategoryMarkup = renderPage(
    <ToolsPage />,
    '/tools?category=invalid'
  );
  assert.ok(
    toolsInvalidCategoryMarkup.includes(
      EN_COMMON_DICTIONARY.toolsDirectory.invalidCategoryNotice
    )
  );

  // 15. Footer SSR check: honest single-language label
  const footerMarkup = renderToStaticMarkup(
    <LocaleProvider>
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    </LocaleProvider>
  );
  assert.ok(footerMarkup.includes('English'));
  assert.equal(footerMarkup.includes('aria-haspopup="listbox"'), false);

  console.log('All Milestone 4 unit & SSR render checks passed.');
}

run();
