import assert from 'node:assert/strict';
import JSZip from 'jszip';
import {PDFArray, PDFDocument, PDFName, PDFNumber, PDFRef, StandardFonts, degrees} from 'pdf-lib';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {PdfMasterLogo} from '../components/brand/PdfMasterLogo';
import {Footer} from '../components/layout/Footer';
import {Header} from '../components/layout/Header';
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
  Switch,
  ToastProvider,
} from '../components/ui';
import {
  PROCESSING_LIMITS,
  PRODUCTION_TOOL_LIMITS,
  validateJobLimits,
} from '../config/processingLimits';
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
import {ToolWorkspace} from '../features/pdf/components/ToolWorkspace';
import {
  EngineRegistry,
  IllegalJobTransitionError,
  createProcessingError,
  createProcessingJob,
  jobReducer,
  mapPdfLibError,
  type ProcessingErrorCode,
} from '../features/pdf/engine';
import {getToolRichContent} from '../config/toolPageContent';
import {pdfExtractEngine} from '../features/pdf/engine/engines/pdfExtractEngine';
import {pdfInspectEngine} from '../features/pdf/engine/engines/pdfInspectEngine';
import {pdfMergeEngine} from '../features/pdf/engine/engines/pdfMergeEngine';
import {
  pdfOrganizeEngine,
  validateOrganizeOperations,
} from '../features/pdf/engine/engines/pdfOrganizeEngine';
import {pdfRemoveEngine} from '../features/pdf/engine/engines/pdfRemoveEngine';
import {pdfSplitEngine} from '../features/pdf/engine/engines/pdfSplitEngine';
import {
  checkPdfTailHeuristic,
  preparePdfBytes,
  verifyPdfPageIntegrity,
  verifySavedPdfOutput,
} from '../features/pdf/engine/engines/sharedPdfUtils';
import {
  buildOrganizeOperations,
  createInitialOrganizeState,
  getOrganizeCounts,
  organizeReducer,
} from '../features/pdf/organize/organizeReducer';
import {
  OrganizeGridSection,
  OrganizerWorkspace,
} from '../features/pdf/organize/OrganizerWorkspace';
import {pdfProcessingService} from '../features/pdf/services/PdfProcessingService';
import {
  chunkPagesBySize,
  invertPageSelection,
  parsePageRanges,
  splitEveryPage,
} from '../features/pdf/utils/pageRanges';
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
  sniffFileSignature,
  validateSelectedFiles,
} from '../services/file/fileValidation';
import {LocaleProvider} from '../services/localization/i18nService';
import {
  buildCanonicalUrl,
  buildHreflangAlternates,
  generateSitemapEntries,
  resolveBaseOrigin,
} from '../services/seo/seoService';

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
  'no data collected',
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
  'no limits',
  'fast',
  'secure',
] as const;

// Minimal valid PDF 1.4 containing /Encrypt dictionary and garbled /Info strings
// (pdf-lib cannot create encrypted PDFs directly, so we embed this deterministic base64 fixture).
const ENCRYPTED_PDF_FIXTURE_BASE64 =
  'JVBERi0xLjQKMSAwIG9iaiA8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4gZW5kb2JqCjIgMCBvYmogPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4gZW5kb2JqCjMgMCBvYmogPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCAyMDAgMjAwXSA+PiBlbmRvYmoKNCAwIG9iaiA8PCAvRmlsdGVyIC9TdGFuZGFyZCAvViAxIC9SIDIgL08gKDAxMjM0NTY3ODlhYmNkZWYwMTIzNDU2Nzg5YWJjZGVmKSAvVSAoMDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWYpIC9QIC00ID4+IGVuZG9iago1IDAgb2JqIDw8IC9UaXRsZSAoR2FyYmxlZEVuY3J5cHRlZFRpdGxlKSAvUHJvZHVjZXIgKEdhcmJsZWRFbmNyeXB0ZWRQcm9kdWNlcikgPj4gZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4IDAwMDAwIG4gCjAwMDAwMDAxMTUgMDAwMDAgbiAKMDAwMDAwMDE4MSAwMDAwMCBuIAowMDAwMDAwMzE1IDAwMDAwIG4gCnRyYWlsZXIgPDwgL1NpemUgNiAvUm9vdCAxIDAgUiAvRW5jcnlwdCA0IDAgUiAvSW5mbyA1IDAgUiA+PgpzdGFydHhyZWYKMzkyCiUlRU9G';

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

async function createMarkedPdf(
  pageWidths: readonly number[],
  options: {title?: string; withOutlines?: boolean} = {}
): Promise<ArrayBuffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  if (options.title) {
    doc.setTitle(options.title);
  }

  for (let i = 0; i < pageWidths.length; i += 1) {
    const width = pageWidths[i];
    const page = doc.addPage([width, 500]);
    page.drawText(`Page marker ${i + 1} (w=${width})`, {
      x: 24,
      y: 440,
      size: 14,
      font,
    });
  }

  if (options.withOutlines) {
    const outlinesDict = doc.context.obj({Type: 'Outlines', Count: 0});
    const outlinesRef = doc.context.register(outlinesDict);
    doc.catalog.set(PDFName.of('Outlines'), outlinesRef);
  }

  const saved = await doc.save();
  return saved.slice().buffer;
}

async function readPageWidths(pdfBytes: Uint8Array): Promise<number[]> {
  const loaded = await PDFDocument.load(pdfBytes);
  return loaded.getPages().map((page) => Math.round(page.getSize().width));
}

async function run() {
  // 1. Class helper
  assert.equal(cn('a', false, null, undefined, 'b'), 'a b');

  // 2. Registry, search ranking, synonyms, available tools & category helpers
  const tools = getAllTools();
  const categories = getAllCategories();
  assert.equal(tools.length, 13);
  assert.equal(categories.length, 8);

  const availableIds = tools
    .filter((tool) => tool.status === 'available')
    .map((tool) => tool.id)
    .sort();
  assert.deepEqual(availableIds, [
    'extract-pages',
    'merge-pdf',
    'organize-pdf',
    'remove-pages',
    'split-pdf',
  ]);
  assert.ok(
    tools
      .filter((tool) => !availableIds.includes(tool.id))
      .every((tool) => tool.status === 'planned')
  );

  // Confirm production limits match real tools (not devTestMaxFileSizeBytes)
  assert.equal(PROCESSING_LIMITS.maxFileSizeBytes, 25 * 1024 * 1024);
  assert.equal(PROCESSING_LIMITS.maxTotalSizeBytes, 50 * 1024 * 1024);
  assert.equal(PROCESSING_LIMITS.maxFilesCount, 10);
  assert.equal(PROCESSING_LIMITS.maxSplitOutputs, 50);
  assert.ok(
    PROCESSING_LIMITS.devTestMaxFileSizeBytes > PRODUCTION_TOOL_LIMITS.maxFileSizeBytes
  );
  for (const id of availableIds) {
    const toolDef = getToolBySlug(id);
    assert.ok(toolDef);
    assert.equal(toolDef.maxFileSizeBytes, PRODUCTION_TOOL_LIMITS.maxFileSizeBytes);
    assert.ok(toolDef.maxFilesCount <= PRODUCTION_TOOL_LIMITS.maxFilesCount);
  }

  assert.ok(getToolBySlug('extract-pages'));
  assert.ok(getToolBySlug('remove-pages'));
  assert.equal(getToolBySlug('missing-tool'), undefined);

  assert.equal(searchTools('combine')[0].id, 'merge-pdf');
  assert.equal(searchTools('select pages')[0].id, 'extract-pages');
  assert.equal(searchTools('delete pages')[0].id, 'remove-pages');
  assert.equal(searchTools('shrink')[0].id, 'compress-pdf');
  assert.equal(searchTools('   MéRgE   pDf  ')[0].id, 'merge-pdf');
  assert.equal(searchTools('').length, tools.length);
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

  // 3. SEO sitemap includes live tools and excludes planned + dev routes
  const sitemapPaths = generateSitemapEntries().map((entry) => entry.path);
  assert.ok(sitemapPaths.includes('/'));
  assert.ok(sitemapPaths.includes('/tools'));
  assert.ok(sitemapPaths.includes('/merge-pdf'));
  assert.ok(sitemapPaths.includes('/split-pdf'));
  assert.ok(sitemapPaths.includes('/extract-pages'));
  assert.ok(sitemapPaths.includes('/remove-pages'));
  assert.ok(sitemapPaths.includes('/organize-pdf'));
  assert.equal(sitemapPaths.includes('/compress-pdf'), false);
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
    isPdfSignatureValid(new TextEncoder().encode('MZ\x90\x00exe')),
    false
  );
  assert.equal(detectMagicByteKind(new Uint8Array(0)), 'unknown');
  assert.equal(
    isPdfSignatureValid(new TextEncoder().encode('%PDF')),
    false
  );

  // 5. Output filename generation (path traversal, unicode, long names, empty suffix for merged.pdf)
  assert.equal(buildOutputFileName('merged', '', '.pdf'), 'merged.pdf');
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
    validateJobLimits([{name: 'big.pdf', size: 26 * 1024 * 1024}])?.code,
    'FILE_TOO_LARGE'
  );
  assert.equal(
    validateJobLimits([
      {name: 'a.pdf', size: 20 * 1024 * 1024},
      {name: 'b.pdf', size: 20 * 1024 * 1024},
      {name: 'c.pdf', size: 20 * 1024 * 1024},
    ])?.code,
    'FILE_TOO_LARGE'
  );
  assert.equal(
    validateJobLimits(
      Array.from({length: 11}, (_, i) => ({name: `f${i}.pdf`, size: 1024}))
    )?.code,
    'TOO_MANY_FILES'
  );
  assert.equal(validateJobLimits([{name: 'ok.pdf', size: 1024}]), null);

  // 7. Page Range Parser comprehensive suite
  const parsedStandard = parsePageRanges(' 1-3, 5 , 8 - 10 ', 10);
  assert.equal(parsedStandard.ok, true);
  if (parsedStandard.ok) {
    assert.deepEqual(parsedStandard.value.sortedPages, [1, 2, 3, 5, 8, 9, 10]);
    assert.deepEqual(parsedStandard.value.orderedPages, [1, 2, 3, 5, 8, 9, 10]);
    assert.equal(parsedStandard.value.segments.length, 3);
  }

  const parsedOrderedOverlap = parsePageRanges('5, 1-3, 2, 3-4', 10);
  assert.equal(parsedOrderedOverlap.ok, true);
  if (parsedOrderedOverlap.ok) {
    assert.deepEqual(parsedOrderedOverlap.value.orderedPages, [5, 1, 2, 3, 4]);
    assert.deepEqual(parsedOrderedOverlap.value.sortedPages, [1, 2, 3, 4, 5]);
  }

  // Reject invalid inputs, 0/negatives, unicode/full-width digits, reversed, out-of-range, empty, too long
  const assertRangeError = (
    input: string,
    pageCount: number,
    expectedCode: string
  ) => {
    const res = parsePageRanges(input, pageCount);
    assert.equal(res.ok, false);
    if (!res.ok) {
      assert.equal(res.error.code, expectedCode);
    }
  };

  assertRangeError('', 5, 'EMPTY_INPUT');
  assertRangeError('   ', 5, 'EMPTY_INPUT');
  assertRangeError('0', 5, 'ZERO_OR_NEGATIVE_PAGE');
  assertRangeError('-2', 5, 'ZERO_OR_NEGATIVE_PAGE');
  assertRangeError('0-3', 5, 'ZERO_OR_NEGATIVE_PAGE');
  assertRangeError('5-2', 5, 'REVERSED_RANGE');
  assertRangeError('1, 9', 5, 'PAGE_OUT_OF_RANGE');

  const syntaxOut = parsePageRanges('1, abc, 3', 5);
  assert.equal(syntaxOut.ok, false);
  if (!syntaxOut.ok) {
    assert.equal(syntaxOut.error.code, 'INVALID_SYNTAX');
    assert.equal(syntaxOut.error.position, 3);
  }
  // Reject Unicode / full-width digits and punctuation
  assertRangeError('١-٣', 5, 'INVALID_SYNTAX');
  assertRangeError('१-३', 5, 'INVALID_SYNTAX');
  assertRangeError('１-３', 5, 'INVALID_SYNTAX');
  assertRangeError('1，3', 5, 'INVALID_SYNTAX');
  assertRangeError('1,,3', 5, 'INVALID_SYNTAX');
  assertRangeError('1,', 5, 'INVALID_SYNTAX');
  assertRangeError('1-2-3', 5, 'INVALID_SYNTAX');
  assertRangeError('1,'.repeat(1100), 100, 'INPUT_TOO_LONG');

  // 10,000-page parser performance check
  const perfStart = performance.now();
  const largeRange = parsePageRanges('1-10000, 500-2500', 10000);
  const perfElapsedMs = performance.now() - perfStart;
  assert.equal(largeRange.ok, true);
  if (largeRange.ok) {
    assert.equal(largeRange.value.sortedPages.length, 10000);
    assert.equal(largeRange.value.orderedPages.length, 10000);
  }
  assert.ok(perfElapsedMs < 150, `10k parser took ${perfElapsedMs}ms`);

  // Helpers: invert, chunk, splitEveryPage
  assert.deepEqual(invertPageSelection([1, 3, 5], 5), [2, 4]);
  assert.deepEqual(invertPageSelection([1, 2, 3], 3), []);
  assert.deepEqual(chunkPagesBySize(5, 2), [[1, 2], [3, 4], [5]]);
  assert.deepEqual(splitEveryPage(3), [[1], [2], [3]]);

  // 8. Job state machine legal & illegal transitions + monotonic progress
  let job = createProcessingJob({
    id: 'job-1',
    toolId: 'merge-pdf',
    inputFiles: [{id: 'f1', name: 'doc.pdf', size: 100, mimeType: 'application/pdf'}],
    options: {},
  });
  assert.equal(job.status, 'idle');
  assert.throws(
    () => jobReducer(job, {type: 'START_PROCESSING'}),
    IllegalJobTransitionError
  );
  job = jobReducer(job, {type: 'START_VALIDATING'});
  job = jobReducer(job, {type: 'QUEUE'});
  job = jobReducer(job, {type: 'START_PROCESSING'});
  job = jobReducer(job, {
    type: 'PROGRESS',
    progress: {mode: 'determinate', percent: 60},
  });
  job = jobReducer(job, {
    type: 'PROGRESS',
    progress: {mode: 'determinate', percent: 30},
  });
  assert.equal(job.progress.percent, 60);

  // 9. Error taxonomy & EngineRegistry
  const allErrorCodes: ProcessingErrorCode[] = [
    'INVALID_FILE',
    'NOT_A_PDF',
    'ENCRYPTED_PDF',
    'CORRUPT_PDF',
    'FILE_TOO_LARGE',
    'TOO_MANY_FILES',
    'TOO_MANY_OUTPUTS',
    'NO_PAGES_REMAINING',
    'INVALID_OPTIONS',
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

  const registry = new EngineRegistry();
  registry.registerEngine(pdfInspectEngine);
  registry.registerEngine(pdfMergeEngine);
  registry.registerEngine(pdfSplitEngine);
  registry.registerEngine(pdfExtractEngine);
  registry.registerEngine(pdfRemoveEngine);
  registry.registerEngine(pdfOrganizeEngine);
  assert.equal(registry.resolveEngineForTool('merge-pdf').engine?.id, 'pdf-merge');
  assert.equal(registry.resolveEngineForTool('split-pdf').engine?.id, 'pdf-split');
  assert.equal(
    registry.resolveEngineForTool('extract-pages').engine?.id,
    'pdf-extract'
  );
  assert.equal(
    registry.resolveEngineForTool('remove-pages').engine?.id,
    'pdf-remove'
  );
  assert.equal(
    registry.resolveEngineForTool('organize-pdf').engine?.id,
    'pdf-organize'
  );
  assert.equal(
    registry.resolveEngineForTool('compress-pdf').error?.code,
    'ENGINE_NOT_FOUND'
  );

  // 10. M4 Carry-over Regression: Encrypted PDF metadata omission + tool rejection
  const encryptedBytes = Uint8Array.from(
    Buffer.from(ENCRYPTED_PDF_FIXTURE_BASE64, 'base64')
  ).buffer;

  const encryptedInspect = await pdfInspectEngine.run(
    [
      {
        name: 'locked.pdf',
        mimeType: 'application/pdf',
        size: encryptedBytes.byteLength,
        bytes: encryptedBytes.slice(0),
      },
    ],
    {mode: 'inspect'},
    {onProgress: () => {}, signal: new AbortController().signal}
  );
  assert.equal(encryptedInspect.stats.isEncrypted, true);
  assert.equal(encryptedInspect.stats.pageCount, 1);
  assert.equal(encryptedInspect.stats.metadata?.title, undefined);
  assert.equal(encryptedInspect.stats.metadata?.producer, undefined);

  const encryptedResultMarkup = renderToStaticMarkup(
    <LocaleProvider>
      <ResultPanel result={encryptedInspect} onDiscard={() => {}} />
    </LocaleProvider>
  );
  assert.ok(encryptedResultMarkup.includes('Protected or restricted'));
  assert.equal(encryptedResultMarkup.includes('GarbledEncrypted'), false);

  // Public engines MUST reject encrypted PDFs with ENCRYPTED_PDF
  const validPdf1 = await createMarkedPdf([301, 302], {title: 'Doc A'});
  const validPdf2 = await createMarkedPdf([401], {withOutlines: true});
  const validPdf3 = await createMarkedPdf([501, 502, 503]);
  const fivePagePdf = await createMarkedPdf([601, 602, 603, 604, 605], {
    withOutlines: true,
  });

  for (const [label, fn] of [
    [
      'merge',
      () =>
        pdfMergeEngine.run(
          [
            {
              name: 'locked.pdf',
              mimeType: 'application/pdf',
              size: encryptedBytes.byteLength,
              bytes: encryptedBytes.slice(0),
            },
            {
              name: 'ok.pdf',
              mimeType: 'application/pdf',
              size: validPdf1.byteLength,
              bytes: validPdf1.slice(0),
            },
          ],
          {},
          {onProgress: () => {}, signal: new AbortController().signal}
        ),
    ],
    [
      'split',
      () =>
        pdfSplitEngine.run(
          [
            {
              name: 'locked.pdf',
              mimeType: 'application/pdf',
              size: encryptedBytes.byteLength,
              bytes: encryptedBytes.slice(0),
            },
          ],
          {mode: 'every-page'},
          {onProgress: () => {}, signal: new AbortController().signal}
        ),
    ],
    [
      'extract',
      () =>
        pdfExtractEngine.run(
          [
            {
              name: 'locked.pdf',
              mimeType: 'application/pdf',
              size: encryptedBytes.byteLength,
              bytes: encryptedBytes.slice(0),
            },
          ],
          {rangesText: '1'},
          {onProgress: () => {}, signal: new AbortController().signal}
        ),
    ],
    [
      'remove',
      () =>
        pdfRemoveEngine.run(
          [
            {
              name: 'locked.pdf',
              mimeType: 'application/pdf',
              size: encryptedBytes.byteLength,
              bytes: encryptedBytes.slice(0),
            },
          ],
          {rangesText: '1'},
          {onProgress: () => {}, signal: new AbortController().signal}
        ),
    ],
  ] as const) {
    await assert.rejects(
      fn,
      (err: {code?: string}) => err?.code === 'ENCRYPTED_PDF',
      `${label} must reject encrypted PDFs with ENCRYPTED_PDF`
    );
  }

  // 11. Real PDF Engine Tests (Merge, Split all 3 modes + ZIP, Extract, Remove, Cancellation)
  // 11a. MERGE 3 files -> verify page count, exact order via page widths, interactive limitation flag
  const mergeProgress: number[] = [];
  const mergeRes = await pdfMergeEngine.run(
    [
      {name: 'a.pdf', mimeType: 'application/pdf', size: validPdf1.byteLength, bytes: validPdf1.slice(0)},
      {name: 'b.pdf', mimeType: 'application/pdf', size: validPdf2.byteLength, bytes: validPdf2.slice(0)},
      {name: 'c.pdf', mimeType: 'application/pdf', size: validPdf3.byteLength, bytes: validPdf3.slice(0)},
    ],
    {},
    {
      onProgress: (p) => mergeProgress.push(p.percent),
      signal: new AbortController().signal,
    }
  );
  assert.equal(mergeRes.outputs.length, 1);
  assert.equal(mergeRes.outputs[0].name, 'merged.pdf');
  assert.equal(mergeRes.archive, undefined);
  assert.equal(mergeRes.stats.pageCount, 6);
  assert.equal(mergeRes.stats.interactiveFeaturesDetected, true);
  assert.deepEqual(
    await readPageWidths(mergeRes.outputs[0].bytes),
    [301, 302, 401, 501, 502, 503]
  );
  assert.ok(mergeProgress[mergeProgress.length - 1] === 100);

  // Merge < 2 files rejected
  await assert.rejects(
    () =>
      pdfMergeEngine.run(
        [{name: 'a.pdf', mimeType: 'application/pdf', size: validPdf1.byteLength, bytes: validPdf1.slice(0)}],
        {},
        {onProgress: () => {}, signal: new AbortController().signal}
      ),
    (err: {code?: string}) => err?.code === 'INVALID_FILE'
  );

  // 11b. SPLIT Mode (a): Single range -> 1 PDF directly (no ZIP)
  const splitOneRes = await pdfSplitEngine.run(
    [{name: 'five.pdf', mimeType: 'application/pdf', size: fivePagePdf.byteLength, bytes: fivePagePdf.slice(0)}],
    {mode: 'ranges', rangesText: '2-4'},
    {onProgress: () => {}, signal: new AbortController().signal}
  );
  assert.equal(splitOneRes.outputs.length, 1);
  assert.equal(splitOneRes.archive, undefined);
  assert.deepEqual(await readPageWidths(splitOneRes.outputs[0].bytes), [602, 603, 604]);

  // 11c. SPLIT Mode (a): Multiple ranges -> individual PDFs + valid ZIP readable with JSZip
  const splitMultiRangesRes = await pdfSplitEngine.run(
    [{name: '../../evil/Quarterly.pdf', mimeType: 'application/pdf', size: fivePagePdf.byteLength, bytes: fivePagePdf.slice(0)}],
    {mode: 'ranges', rangesText: '1-2, 4, 5'},
    {onProgress: () => {}, signal: new AbortController().signal}
  );
  assert.equal(splitMultiRangesRes.outputs.length, 3);
  assert.ok(splitMultiRangesRes.archive);
  assert.equal(splitMultiRangesRes.archive.name, 'Quarterly-split.zip');
  assert.equal(splitMultiRangesRes.archive.mimeType, 'application/zip');
  assert.deepEqual(await readPageWidths(splitMultiRangesRes.outputs[0].bytes), [601, 602]);
  assert.deepEqual(await readPageWidths(splitMultiRangesRes.outputs[1].bytes), [604]);
  assert.deepEqual(await readPageWidths(splitMultiRangesRes.outputs[2].bytes), [605]);

  const loadedZip = await JSZip.loadAsync(splitMultiRangesRes.archive.bytes);
  const zipEntries = Object.keys(loadedZip.files);
  assert.equal(zipEntries.length, 3);
  for (const outPdf of splitMultiRangesRes.outputs) {
    const zipFileObj = loadedZip.file(outPdf.name);
    assert.ok(zipFileObj, `ZIP missing ${outPdf.name}`);
    const zipEntryBytes = await zipFileObj.async('uint8array');
    assert.deepEqual(
      await readPageWidths(zipEntryBytes),
      await readPageWidths(outPdf.bytes)
    );
  }

  // 11d. SPLIT Mode (b): Every N pages (everyN=2 on 5-page PDF -> 2, 2, 1)
  const splitEveryNRes = await pdfSplitEngine.run(
    [{name: 'five.pdf', mimeType: 'application/pdf', size: fivePagePdf.byteLength, bytes: fivePagePdf.slice(0)}],
    {mode: 'every-n', everyN: 2},
    {onProgress: () => {}, signal: new AbortController().signal}
  );
  assert.equal(splitEveryNRes.outputs.length, 3);
  assert.ok(splitEveryNRes.archive);
  assert.deepEqual(await readPageWidths(splitEveryNRes.outputs[0].bytes), [601, 602]);
  assert.deepEqual(await readPageWidths(splitEveryNRes.outputs[1].bytes), [603, 604]);
  assert.deepEqual(await readPageWidths(splitEveryNRes.outputs[2].bytes), [605]);
  const everyNZip = await JSZip.loadAsync(splitEveryNRes.archive.bytes);
  assert.equal(Object.keys(everyNZip.files).length, 3);

  // 11e. SPLIT Mode (c): Every page separately on 3-page PDF -> 3 individual PDFs + ZIP
  const splitEveryPageRes = await pdfSplitEngine.run(
    [{name: 'three.pdf', mimeType: 'application/pdf', size: validPdf3.byteLength, bytes: validPdf3.slice(0)}],
    {mode: 'every-page'},
    {onProgress: () => {}, signal: new AbortController().signal}
  );
  assert.equal(splitEveryPageRes.outputs.length, 3);
  assert.ok(splitEveryPageRes.archive);
  assert.deepEqual(await readPageWidths(splitEveryPageRes.outputs[0].bytes), [501]);
  assert.deepEqual(await readPageWidths(splitEveryPageRes.outputs[1].bytes), [502]);
  assert.deepEqual(await readPageWidths(splitEveryPageRes.outputs[2].bytes), [503]);

  // Split cap rejection (> 50 outputs)
  const overCapRanges = Array.from({length: 51}, () => '1').join(',');
  await assert.rejects(
    () =>
      pdfSplitEngine.run(
        [{name: 'five.pdf', mimeType: 'application/pdf', size: fivePagePdf.byteLength, bytes: fivePagePdf.slice(0)}],
        {mode: 'ranges', rangesText: overCapRanges},
        {onProgress: () => {}, signal: new AbortController().signal}
      ),
    (err: {code?: string}) => err?.code === 'TOO_MANY_OUTPUTS'
  );

  // 11f. EXTRACT PAGES: order preserved, duplicates deduped ("5, 1-3, 2" -> [5, 1, 2, 3])
  const extractRes = await pdfExtractEngine.run(
    [{name: 'five.pdf', mimeType: 'application/pdf', size: fivePagePdf.byteLength, bytes: fivePagePdf.slice(0)}],
    {rangesText: '5, 1-3, 2'},
    {onProgress: () => {}, signal: new AbortController().signal}
  );
  assert.equal(extractRes.outputs.length, 1);
  assert.equal(extractRes.outputs[0].name, 'five-extracted.pdf');
  assert.deepEqual(
    await readPageWidths(extractRes.outputs[0].bytes),
    [605, 601, 602, 603]
  );

  // 11g. REMOVE PAGES: keeps remaining pages in order; rejects removing ALL pages
  const removeRes = await pdfRemoveEngine.run(
    [{name: 'five.pdf', mimeType: 'application/pdf', size: fivePagePdf.byteLength, bytes: fivePagePdf.slice(0)}],
    {rangesText: '2, 4'},
    {onProgress: () => {}, signal: new AbortController().signal}
  );
  assert.equal(removeRes.outputs.length, 1);
  assert.equal(removeRes.outputs[0].name, 'five-trimmed.pdf');
  assert.deepEqual(await readPageWidths(removeRes.outputs[0].bytes), [601, 603, 605]);

  await assert.rejects(
    () =>
      pdfRemoveEngine.run(
        [{name: 'five.pdf', mimeType: 'application/pdf', size: fivePagePdf.byteLength, bytes: fivePagePdf.slice(0)}],
        {rangesText: '1-5'},
        {onProgress: () => {}, signal: new AbortController().signal}
      ),
    (err: {code?: string}) => err?.code === 'NO_PAGES_REMAINING'
  );

  // 11g2. ORGANIZE REDUCER pure state unit tests
  {
    let st = createInitialOrganizeState(4);
    assert.equal(st.items.length, 4);
    assert.deepEqual(
      st.items.map((x) => x.originalPageNumber),
      [1, 2, 3, 4]
    );
    assert.deepEqual(getOrganizeCounts(st), {
      totalCount: 4,
      keptCount: 4,
      deletedCount: 0,
      selectedCount: 0,
    });

    // Move step earlier/later + boundary no-op
    st = organizeReducer(st, {type: 'MOVE_STEP', sourcePageIndex: 0, delta: -1});
    assert.deepEqual(
      st.items.map((x) => x.sourcePageIndex),
      [0, 1, 2, 3]
    );
    st = organizeReducer(st, {type: 'MOVE_STEP', sourcePageIndex: 2, delta: -1});
    assert.deepEqual(
      st.items.map((x) => x.sourcePageIndex),
      [0, 2, 1, 3]
    );
    assert.ok(st.lastAnnouncement.includes('Page 3 moved to position 2 of 4'));

    st = organizeReducer(st, {type: 'MOVE_TO_INDEX', fromIndex: 3, toIndex: 0});
    assert.deepEqual(
      st.items.map((x) => x.sourcePageIndex),
      [3, 0, 2, 1]
    );

    // Rotation wrapping (0 -> 270 -> 180 -> 90 -> 0)
    st = organizeReducer(st, {type: 'ROTATE_PAGE', sourcePageIndex: 0, step: -90});
    assert.equal(st.items.find((x) => x.sourcePageIndex === 0)?.rotationDelta, 270);
    st = organizeReducer(st, {type: 'ROTATE_PAGE', sourcePageIndex: 0, step: -90});
    assert.equal(st.items.find((x) => x.sourcePageIndex === 0)?.rotationDelta, 180);
    st = organizeReducer(st, {type: 'ROTATE_PAGE', sourcePageIndex: 0, step: 90});
    assert.equal(st.items.find((x) => x.sourcePageIndex === 0)?.rotationDelta, 270);
    st = organizeReducer(st, {type: 'ROTATE_PAGE', sourcePageIndex: 0, step: 90});
    assert.equal(st.items.find((x) => x.sourcePageIndex === 0)?.rotationDelta, 0);
    st = organizeReducer(st, {type: 'ROTATE_PAGE', sourcePageIndex: 2, step: 90});

    // Selection + delete + auto-deselect + restore
    st = organizeReducer(st, {type: 'TOGGLE_SELECT_PAGE', sourcePageIndex: 1});
    st = organizeReducer(st, {type: 'TOGGLE_SELECT_PAGE', sourcePageIndex: 3});
    assert.equal(getOrganizeCounts(st).selectedCount, 2);
    st = organizeReducer(st, {type: 'ROTATE_SELECTED', step: 90});
    assert.equal(st.items.find((x) => x.sourcePageIndex === 1)?.rotationDelta, 90);
    assert.equal(st.items.find((x) => x.sourcePageIndex === 3)?.rotationDelta, 90);

    st = organizeReducer(st, {type: 'TOGGLE_DELETE_PAGE', sourcePageIndex: 1});
    assert.equal(st.items.find((x) => x.sourcePageIndex === 1)?.deleted, true);
    assert.equal(st.items.find((x) => x.sourcePageIndex === 1)?.selected, false);
    // Selecting a deleted page is ignored
    st = organizeReducer(st, {type: 'TOGGLE_SELECT_PAGE', sourcePageIndex: 1});
    assert.equal(st.items.find((x) => x.sourcePageIndex === 1)?.selected, false);
    assert.deepEqual(buildOrganizeOperations(st), [
      {sourcePageIndex: 3, rotationDelta: 90},
      {sourcePageIndex: 0, rotationDelta: 0},
      {sourcePageIndex: 2, rotationDelta: 90},
    ]);

    st = organizeReducer(st, {type: 'SELECT_ALL_ACTIVE'});
    assert.equal(getOrganizeCounts(st).selectedCount, 3);
    st = organizeReducer(st, {type: 'DELETE_SELECTED'});
    assert.deepEqual(getOrganizeCounts(st), {
      totalCount: 4,
      keptCount: 0,
      deletedCount: 4,
      selectedCount: 0,
    });
    assert.deepEqual(buildOrganizeOperations(st), []);

    st = organizeReducer(st, {type: 'RESTORE_ALL'});
    assert.equal(getOrganizeCounts(st).keptCount, 4);

    st = organizeReducer(st, {type: 'RESET_ORDER'});
    assert.deepEqual(buildOrganizeOperations(st), [
      {sourcePageIndex: 0, rotationDelta: 0},
      {sourcePageIndex: 1, rotationDelta: 0},
      {sourcePageIndex: 2, rotationDelta: 0},
      {sourcePageIndex: 3, rotationDelta: 0},
    ]);

    st = organizeReducer(st, {type: 'REVERSE_ORDER'});
    assert.deepEqual(
      buildOrganizeOperations(st).map((o) => o.sourcePageIndex),
      [3, 2, 1, 0]
    );
  }

  // 11g3. ORGANIZE PDF Engine real-PDF verification suite
  {
    const orgSourceBuf = await createMarkedPdf([301, 302, 303, 304]);

    // Encrypted rejected with ENCRYPTED_PDF
    await assert.rejects(
      () =>
        pdfOrganizeEngine.run(
          [
            {
              name: 'locked.pdf',
              mimeType: 'application/pdf',
              size: encryptedBytes.byteLength,
              bytes: encryptedBytes.slice(0),
            },
          ],
          {operations: [{sourcePageIndex: 0, rotationDelta: 0}]},
          {onProgress: () => {}, signal: new AbortController().signal}
        ),
      (err: {code?: string}) => err?.code === 'ENCRYPTED_PDF'
    );

    // Reorder [2, 0, 3, 1] -> [303, 301, 304, 302] + filename <base>-organized.pdf
    const reorderRes = await pdfOrganizeEngine.run(
      [
        {
          name: 'quarterly-deck.pdf',
          mimeType: 'application/pdf',
          size: orgSourceBuf.byteLength,
          bytes: orgSourceBuf.slice(0),
        },
      ],
      {
        operations: [
          {sourcePageIndex: 2, rotationDelta: 0},
          {sourcePageIndex: 0, rotationDelta: 0},
          {sourcePageIndex: 3, rotationDelta: 0},
          {sourcePageIndex: 1, rotationDelta: 0},
        ],
      },
      {onProgress: () => {}, signal: new AbortController().signal}
    );
    assert.equal(reorderRes.outputs.length, 1);
    assert.equal(reorderRes.outputs[0].name, 'quarterly-deck-organized.pdf');
    assert.equal(reorderRes.stats.pageCount, 4);
    assert.deepEqual(
      await readPageWidths(reorderRes.outputs[0].bytes),
      [303, 301, 304, 302]
    );

    // Delete subset (keep [0, 2] -> [301, 303]) & single remaining page ([2] -> [303])
    const keepTwoRes = await pdfOrganizeEngine.run(
      [{name: 'doc.pdf', mimeType: 'application/pdf', size: orgSourceBuf.byteLength, bytes: orgSourceBuf.slice(0)}],
      {
        operations: [
          {sourcePageIndex: 0, rotationDelta: 0},
          {sourcePageIndex: 2, rotationDelta: 0},
        ],
      },
      {onProgress: () => {}, signal: new AbortController().signal}
    );
    assert.deepEqual(await readPageWidths(keepTwoRes.outputs[0].bytes), [301, 303]);

    const keepOneRes = await pdfOrganizeEngine.run(
      [{name: 'doc.pdf', mimeType: 'application/pdf', size: orgSourceBuf.byteLength, bytes: orgSourceBuf.slice(0)}],
      {operations: [{sourcePageIndex: 2, rotationDelta: 180}]},
      {onProgress: () => {}, signal: new AbortController().signal}
    );
    const keepOneLoaded = await PDFDocument.load(keepOneRes.outputs[0].bytes);
    assert.equal(keepOneLoaded.getPageCount(), 1);
    assert.equal(Math.round(keepOneLoaded.getPage(0).getWidth()), 303);
    assert.equal(keepOneLoaded.getPage(0).getRotation().angle, 180);

    // Reverse [3, 2, 1, 0] -> [304, 303, 302, 301]
    const reverseRes = await pdfOrganizeEngine.run(
      [{name: 'doc.pdf', mimeType: 'application/pdf', size: orgSourceBuf.byteLength, bytes: orgSourceBuf.slice(0)}],
      {
        operations: [
          {sourcePageIndex: 3, rotationDelta: 0},
          {sourcePageIndex: 2, rotationDelta: 0},
          {sourcePageIndex: 1, rotationDelta: 0},
          {sourcePageIndex: 0, rotationDelta: 0},
        ],
      },
      {onProgress: () => {}, signal: new AbortController().signal}
    );
    assert.deepEqual(
      await readPageWidths(reverseRes.outputs[0].bytes),
      [304, 303, 302, 301]
    );

    // Rotate 0, 90, 180, 270
    const rotRes = await pdfOrganizeEngine.run(
      [{name: 'doc.pdf', mimeType: 'application/pdf', size: orgSourceBuf.byteLength, bytes: orgSourceBuf.slice(0)}],
      {
        operations: [
          {sourcePageIndex: 0, rotationDelta: 0},
          {sourcePageIndex: 1, rotationDelta: 90},
          {sourcePageIndex: 2, rotationDelta: 180},
          {sourcePageIndex: 3, rotationDelta: 270},
        ],
      },
      {onProgress: () => {}, signal: new AbortController().signal}
    );
    const rotLoaded = await PDFDocument.load(rotRes.outputs[0].bytes);
    assert.deepEqual(
      rotLoaded.getPages().map((p) => p.getRotation().angle),
      [0, 90, 180, 270]
    );

    // Existing page /Rotate 90: +90 => 180, +270 => 0
    const explicitRotDoc = await PDFDocument.create();
    const erp1 = explicitRotDoc.addPage([200, 300]);
    erp1.setRotation(degrees(90));
    const erp2 = explicitRotDoc.addPage([210, 300]);
    erp2.setRotation(degrees(90));
    const explicitRotBuf = (await explicitRotDoc.save()).slice().buffer;

    const explicitRotOut = await pdfOrganizeEngine.run(
      [{name: 'rot90.pdf', mimeType: 'application/pdf', size: explicitRotBuf.byteLength, bytes: explicitRotBuf.slice(0)}],
      {
        operations: [
          {sourcePageIndex: 0, rotationDelta: 90},
          {sourcePageIndex: 1, rotationDelta: 270},
        ],
      },
      {onProgress: () => {}, signal: new AbortController().signal}
    );
    const explicitRotLoaded = await PDFDocument.load(explicitRotOut.outputs[0].bytes);
    assert.deepEqual(
      explicitRotLoaded.getPages().map((p) => p.getRotation().angle),
      [180, 0]
    );

    // Inherited /Rotate 90 on parent /Pages tree node
    const inheritedRotDoc = await PDFDocument.create();
    inheritedRotDoc.addPage([200, 300]);
    inheritedRotDoc.addPage([210, 300]);
    const pagesDict = inheritedRotDoc.catalog.lookup(PDFName.of('Pages')) as unknown as {
      set: (k: PDFName, v: unknown) => void;
    };
    pagesDict.set(PDFName.of('Rotate'), PDFNumber.of(90));
    const inheritedRotBuf = (await inheritedRotDoc.save()).slice().buffer;

    const inheritedRotOut = await pdfOrganizeEngine.run(
      [{name: 'inherited-rot90.pdf', mimeType: 'application/pdf', size: inheritedRotBuf.byteLength, bytes: inheritedRotBuf.slice(0)}],
      {
        operations: [
          {sourcePageIndex: 0, rotationDelta: 0},
          {sourcePageIndex: 1, rotationDelta: 90},
        ],
      },
      {onProgress: () => {}, signal: new AbortController().signal}
    );
    const inheritedRotLoaded = await PDFDocument.load(inheritedRotOut.outputs[0].bytes);
    assert.deepEqual(
      inheritedRotLoaded.getPages().map((p) => p.getRotation().angle),
      [90, 180]
    );

    // Validation & rejection checks
    assert.throws(
      () => validateOrganizeOperations([], 4),
      (err: {code?: string}) => err?.code === 'NO_PAGES_REMAINING'
    );
    assert.throws(
      () =>
        validateOrganizeOperations(
          [
            {sourcePageIndex: 1, rotationDelta: 0},
            {sourcePageIndex: 1, rotationDelta: 90},
          ],
          4
        ),
      (err: {code?: string}) => err?.code === 'INVALID_OPTIONS'
    );
    assert.throws(
      () =>
        validateOrganizeOperations([{sourcePageIndex: -1, rotationDelta: 0}], 4),
      (err: {code?: string}) => err?.code === 'INVALID_OPTIONS'
    );
    assert.throws(
      () =>
        validateOrganizeOperations([{sourcePageIndex: 4, rotationDelta: 0}], 4),
      (err: {code?: string}) => err?.code === 'INVALID_OPTIONS'
    );
    assert.throws(
      () =>
        validateOrganizeOperations([{sourcePageIndex: 1.5, rotationDelta: 0}], 4),
      (err: {code?: string}) => err?.code === 'INVALID_OPTIONS'
    );
    assert.throws(
      () =>
        validateOrganizeOperations([{sourcePageIndex: 0, rotationDelta: 45}], 4),
      (err: {code?: string}) => err?.code === 'INVALID_OPTIONS'
    );
    assert.throws(
      () => validateOrganizeOperations('not-an-array', 4),
      (err: {code?: string}) => err?.code === 'INVALID_OPTIONS'
    );
    assert.throws(
      () =>
        validateOrganizeOperations(
          Array.from({length: 5}, (_, idx) => ({
            sourcePageIndex: idx,
            rotationDelta: 0,
          })),
          10,
          4
        ),
      (err: {code?: string}) => err?.code === 'INVALID_OPTIONS'
    );

    await assert.rejects(
      () =>
        pdfOrganizeEngine.run(
          [{name: 'doc.pdf', mimeType: 'application/pdf', size: orgSourceBuf.byteLength, bytes: orgSourceBuf.slice(0)}],
          {operations: []},
          {onProgress: () => {}, signal: new AbortController().signal}
        ),
      (err: {code?: string}) => err?.code === 'NO_PAGES_REMAINING'
    );
    await assert.rejects(
      () =>
        pdfOrganizeEngine.run(
          [{name: 'doc.pdf', mimeType: 'application/pdf', size: orgSourceBuf.byteLength, bytes: orgSourceBuf.slice(0)}],
          {
            operations: [
              {sourcePageIndex: 0, rotationDelta: 0},
              {sourcePageIndex: 0, rotationDelta: 90},
            ],
          },
          {onProgress: () => {}, signal: new AbortController().signal}
        ),
      (err: {code?: string}) => err?.code === 'INVALID_OPTIONS'
    );

    // Truncated input rejected with CORRUPT_PDF
    const truncOrgBytes = new Uint8Array(orgSourceBuf).slice(
      0,
      Math.floor(orgSourceBuf.byteLength * 0.5)
    );
    await assert.rejects(
      () =>
        pdfOrganizeEngine.run(
          [{name: 'trunc.pdf', mimeType: 'application/pdf', size: truncOrgBytes.byteLength, bytes: truncOrgBytes.slice().buffer}],
          {operations: [{sourcePageIndex: 0, rotationDelta: 0}]},
          {onProgress: () => {}, signal: new AbortController().signal}
        ),
      (err: {code?: string}) => err?.code === 'CORRUPT_PDF'
    );

    // Mid-run cancellation on multi-page PDF
    const manyPageDoc = await PDFDocument.create();
    for (let i = 0; i < 60; i += 1) {
      manyPageDoc.addPage([200 + i, 300]);
    }
    const manyPageBuf = (await manyPageDoc.save()).slice().buffer;
    const orgAbort = new AbortController();
    await assert.rejects(
      () =>
        pdfOrganizeEngine.run(
          [{name: 'many.pdf', mimeType: 'application/pdf', size: manyPageBuf.byteLength, bytes: manyPageBuf.slice(0)}],
          {
            operations: Array.from({length: 60}, (_, idx) => ({
              sourcePageIndex: idx,
              rotationDelta: 0,
            })),
          },
          {
            onProgress: (p) => {
              if (p.percent >= 20) {
                orgAbort.abort();
              }
            },
            signal: orgAbort.signal,
          }
        ),
      (err: {code?: string}) => err?.code === 'CANCELLED'
    );
  }

  // 11h. Mid-run cancellation via AbortSignal
  const abortMidRun = new AbortController();
  await assert.rejects(
    () =>
      pdfMergeEngine.run(
        [
          {name: 'a.pdf', mimeType: 'application/pdf', size: fivePagePdf.byteLength, bytes: fivePagePdf.slice(0)},
          {name: 'b.pdf', mimeType: 'application/pdf', size: fivePagePdf.byteLength, bytes: fivePagePdf.slice(0)},
        ],
        {},
        {
          onProgress: (p) => {
            if (p.percent >= 5) {
              abortMidRun.abort();
            }
          },
          signal: abortMidRun.signal,
        }
      ),
    (err: {code?: string}) => err?.code === 'CANCELLED'
  );

  // Non-PDF and corrupt PDF rejection across tools
  await assert.rejects(
    () =>
      pdfExtractEngine.run(
        [{name: 'bad.pdf', mimeType: 'application/pdf', size: 12, bytes: new TextEncoder().encode('MZ\x90\x00NotAPDF').buffer}],
        {rangesText: '1'},
        {onProgress: () => {}, signal: new AbortController().signal}
      ),
    (err: {code?: string}) => err?.code === 'NOT_A_PDF'
  );
  await assert.rejects(
    () =>
      pdfRemoveEngine.run(
        [{name: 'trunc.pdf', mimeType: 'application/pdf', size: 18, bytes: new TextEncoder().encode('%PDF-1.4\ntruncated').buffer}],
        {rangesText: '1'},
        {onProgress: () => {}, signal: new AbortController().signal}
      ),
    (err: {code?: string}) => err?.code === 'CORRUPT_PDF'
  );

  // 11i. FIX 1: Corrupt / Truncated PDF Integrity Verification Suite (real bytes, no mocks)
  // Valid PDF with useObjectStreams: false
  const noObjStreamDoc = await PDFDocument.create();
  const noObjStreamFont = await noObjStreamDoc.embedFont(StandardFonts.Helvetica);
  for (let p = 1; p <= 10; p += 1) {
    const page = noObjStreamDoc.addPage([400 + p, 600]);
    page.drawText(`NoObjStream Page ${p}`, {x: 24, y: 540, size: 12, font: noObjStreamFont});
  }
  const noObjStreamBytes = await noObjStreamDoc.save({useObjectStreams: false});
  const noObjStreamBuffer = noObjStreamBytes.slice().buffer;

  // Classic hand-written minimal valid PDF with classic xref table
  const classicPdfParts = [
    '%PDF-1.4\n',
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Resources << >> /Contents 4 0 R >> endobj\n',
    '4 0 obj << /Length 0 >> stream\n\nendstream endobj\n',
  ];
  let offset = 0;
  const offsets: number[] = [];
  for (let idx = 0; idx < classicPdfParts.length; idx += 1) {
    if (idx > 0) {
      offsets.push(offset);
    }
    offset += classicPdfParts[idx].length;
  }
  const xrefStart = offset;
  const xrefLines = [
    'xref\n0 5\n0000000000 65535 f \n',
    ...offsets.map((off) => `${String(off).padStart(10, '0')} 00000 n \n`),
    `trailer << /Size 5 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`,
  ];
  const classicXrefBytes = new TextEncoder().encode([...classicPdfParts, ...xrefLines].join(''));
  const classicXrefBuffer = classicXrefBytes.slice().buffer;

  // Blank-page PDF (no /Contents entry — legal PDF page)
  const blankPageDoc = await PDFDocument.create();
  blankPageDoc.addPage([300, 400]);
  blankPageDoc.addPage([300, 400]);
  const blankPageBuffer = (await blankPageDoc.save()).slice().buffer;

  // Multi-stream /Contents array PDF + indirect /Resources PDFRef -> PDFDict
  const multiStreamDoc = await PDFDocument.create();
  const msPage = multiStreamDoc.addPage([350, 500]);
  const stream1Ref = multiStreamDoc.context.register(
    multiStreamDoc.context.flateStream('q Q')
  );
  const stream2Ref = multiStreamDoc.context.register(
    multiStreamDoc.context.flateStream('q Q')
  );
  const resourcesRef = multiStreamDoc.context.register(
    multiStreamDoc.context.obj({})
  );
  msPage.node.set(
    PDFName.of('Contents'),
    multiStreamDoc.context.obj([stream1Ref, stream2Ref])
  );
  msPage.node.set(PDFName.of('Resources'), resourcesRef);
  const multiStreamBuffer = (await multiStreamDoc.save({useObjectStreams: false})).slice().buffer;

  for (const [fixtureName, buf] of [
    ['default object-stream PDF', validPdf3],
    ['useObjectStreams:false PDF', noObjStreamBuffer],
    ['classic xref PDF', classicXrefBuffer],
    ['blank-page PDF', blankPageBuffer],
    ['multi-stream /Contents array PDF', multiStreamBuffer],
  ] as const) {
    const inspectOk = await pdfInspectEngine.run(
      [{name: `${fixtureName}.pdf`, mimeType: 'application/pdf', size: buf.byteLength, bytes: buf.slice(0)}],
      {mode: 'inspect'},
      {onProgress: () => {}, signal: new AbortController().signal}
    );
    assert.ok(
      typeof inspectOk.stats.pageCount === 'number' && inspectOk.stats.pageCount >= 1,
      `${fixtureName} inspect failed`
    );

    const mergeOk = await pdfMergeEngine.run(
      [
        {name: `${fixtureName}-1.pdf`, mimeType: 'application/pdf', size: buf.byteLength, bytes: buf.slice(0)},
        {name: `${fixtureName}-2.pdf`, mimeType: 'application/pdf', size: validPdf1.byteLength, bytes: validPdf1.slice(0)},
      ],
      {},
      {onProgress: () => {}, signal: new AbortController().signal}
    );
    assert.equal(mergeOk.outputs.length, 1);

    const splitOk = await pdfSplitEngine.run(
      [{name: `${fixtureName}.pdf`, mimeType: 'application/pdf', size: buf.byteLength, bytes: buf.slice(0)}],
      {mode: 'ranges', rangesText: '1'},
      {onProgress: () => {}, signal: new AbortController().signal}
    );
    assert.equal(splitOk.outputs.length, 1);

    const extractOk = await pdfExtractEngine.run(
      [{name: `${fixtureName}.pdf`, mimeType: 'application/pdf', size: buf.byteLength, bytes: buf.slice(0)}],
      {rangesText: '1'},
      {onProgress: () => {}, signal: new AbortController().signal}
    );
    assert.equal(extractOk.outputs.length, 1);

    if ((inspectOk.stats.pageCount ?? 0) >= 2) {
      const removeOk = await pdfRemoveEngine.run(
        [{name: `${fixtureName}.pdf`, mimeType: 'application/pdf', size: buf.byteLength, bytes: buf.slice(0)}],
        {rangesText: '1'},
        {onProgress: () => {}, signal: new AbortController().signal}
      );
      assert.equal(removeOk.outputs.length, 1);
    }
  }

  // Dangling /Contents ref, non-stream /Contents, and dangling /Resources ref rejected as CORRUPT_PDF
  {
    const docDanglingContents = await PDFDocument.create();
    const p1 = docDanglingContents.addPage([300, 400]);
    p1.node.set(PDFName.of('Contents'), PDFRef.of(999999, 0));
    const danglingBytes = await docDanglingContents.save({useObjectStreams: false});
    await assert.rejects(
      () =>
        pdfExtractEngine.run(
          [{name: 'dangling-contents.pdf', mimeType: 'application/pdf', size: danglingBytes.byteLength, bytes: danglingBytes.slice().buffer}],
          {rangesText: '1'},
          {onProgress: () => {}, signal: new AbortController().signal}
        ),
      (err: {code?: string}) => err?.code === 'CORRUPT_PDF'
    );

    const docNonStreamContents = await PDFDocument.create();
    const p2 = docNonStreamContents.addPage([300, 400]);
    p2.node.set(PDFName.of('Contents'), PDFNumber.of(42));
    const nonStreamBytes = await docNonStreamContents.save({useObjectStreams: false});
    await assert.rejects(
      () =>
        pdfInspectEngine.run(
          [{name: 'non-stream.pdf', mimeType: 'application/pdf', size: nonStreamBytes.byteLength, bytes: nonStreamBytes.slice().buffer}],
          {mode: 'inspect'},
          {onProgress: () => {}, signal: new AbortController().signal}
        ),
      (err: {code?: string}) => err?.code === 'CORRUPT_PDF'
    );

    const docDanglingRes = await PDFDocument.create();
    const p3 = docDanglingRes.addPage([300, 400]);
    p3.node.set(PDFName.of('Resources'), PDFRef.of(888888, 0));
    const danglingResBytes = await docDanglingRes.save({useObjectStreams: false});
    await assert.rejects(
      () =>
        pdfInspectEngine.run(
          [{name: 'dangling-res.pdf', mimeType: 'application/pdf', size: danglingResBytes.byteLength, bytes: danglingResBytes.slice().buffer}],
          {mode: 'inspect'},
          {onProgress: () => {}, signal: new AbortController().signal}
        ),
      (err: {code?: string}) => err?.code === 'CORRUPT_PDF'
    );
  }

  // 10-page PDFs (both default & useObjectStreams:false) truncated at 30%, 60%, 90%, 99% + middle-chunk corrupt
  const tenPageDefaultDoc = await PDFDocument.create();
  const tenPageFont = await tenPageDefaultDoc.embedFont(StandardFonts.Helvetica);
  for (let p = 1; p <= 10; p += 1) {
    const pg = tenPageDefaultDoc.addPage([500, 700]);
    pg.drawText(`Default 10-page document page ${p}`, {x: 32, y: 640, size: 14, font: tenPageFont});
  }
  const tenPageDefaultBytes = await tenPageDefaultDoc.save();

  for (const [variantLabel, sourceBytes] of [
    ['default-obj-streams', tenPageDefaultBytes],
    ['no-obj-streams', noObjStreamBytes],
  ] as const) {
    const middleCorruptBytes = sourceBytes.slice();
    const midStart = Math.floor(middleCorruptBytes.byteLength * 0.4);
    const midEnd = Math.floor(middleCorruptBytes.byteLength * 0.6);
    for (let idx = midStart; idx < midEnd; idx += 1) {
      middleCorruptBytes[idx] = (idx * 73 + 19) & 0xff;
    }

    const corruptionCases: Array<{label: string; bytes: Uint8Array}> = [
      ...[0.3, 0.6, 0.9, 0.99].map((ratio) => ({
        label: `trunc-${Math.round(ratio * 100)}%`,
        bytes: sourceBytes.slice(0, Math.floor(sourceBytes.byteLength * ratio)),
      })),
      {label: 'middle-corrupt', bytes: middleCorruptBytes},
    ];

    for (const c of corruptionCases) {
      const buf = c.bytes.slice().buffer;
      const inputFile = {
        name: `${variantLabel}-${c.label}.pdf`,
        mimeType: 'application/pdf',
        size: buf.byteLength,
        bytes: buf,
      };
      const engineChecks: Array<[string, () => Promise<unknown>]> = [
        ['inspect', () => pdfInspectEngine.run([inputFile], {mode: 'inspect'}, {onProgress: () => {}, signal: new AbortController().signal})],
        [
          'merge',
          () =>
            pdfMergeEngine.run(
              [
                inputFile,
                {name: 'valid.pdf', mimeType: 'application/pdf', size: validPdf1.byteLength, bytes: validPdf1.slice(0)},
              ],
              {},
              {onProgress: () => {}, signal: new AbortController().signal}
            ),
        ],
        ['split', () => pdfSplitEngine.run([inputFile], {mode: 'every-page'}, {onProgress: () => {}, signal: new AbortController().signal})],
        ['extract', () => pdfExtractEngine.run([inputFile], {rangesText: '1'}, {onProgress: () => {}, signal: new AbortController().signal})],
        ['remove', () => pdfRemoveEngine.run([inputFile], {rangesText: '1'}, {onProgress: () => {}, signal: new AbortController().signal})],
      ];

      for (const [engineLabel, runFn] of engineChecks) {
        await assert.rejects(
          runFn,
          (err: {code?: string}) => err?.code === 'CORRUPT_PDF',
          `${variantLabel} ${c.label} must be rejected as CORRUPT_PDF by ${engineLabel}`
        );
      }
    }
  }

  // Output re-verification failure when saved bytes are truncated
  await assert.rejects(
    () =>
      verifySavedPdfOutput(
        tenPageDefaultBytes.slice(0, Math.floor(tenPageDefaultBytes.byteLength * 0.9)),
        10,
        'Truncated saved check',
        new AbortController().signal
      ),
    (err: {code?: string}) => err?.code === 'CORRUPT_PDF'
  );

  // 10,000-page integrity check speed (O(pages))
  {
    const doc10k = await PDFDocument.create();
    for (let i = 0; i < 10000; i += 1) {
      doc10k.addPage([200, 200]);
    }
    const t0 = performance.now();
    verifyPdfPageIntegrity(doc10k, new AbortController().signal, '10k-blank.pdf');
    const integrityMs = performance.now() - t0;
    assert.ok(integrityMs < 1500, `10k page integrity check took ${integrityMs.toFixed(1)}ms`);
  }

  // 11j. FIX 9: Heavy multi-thousand-page PDF merge cancellation & integrity checkpoint cancel
  {
    const heavyDoc = await PDFDocument.create();
    const heavyFont = await heavyDoc.embedFont(StandardFonts.Helvetica);
    for (let i = 0; i < 2000; i += 1) {
      const pg = heavyDoc.addPage([400, 600]);
      pg.drawText(`Heavy page ${i + 1}`, {x: 24, y: 550, size: 10, font: heavyFont});
    }
    const heavyBytes = await heavyDoc.save({useObjectStreams: true});
    assert.ok(
      heavyBytes.byteLength < PROCESSING_LIMITS.maxFileSizeBytes,
      `Generated 2000-page PDF (${heavyBytes.byteLength} bytes) must stay below 25 MB limit`
    );

    const heavyAbort = new AbortController();
    let abortedAtPercent = -1;
    await assert.rejects(
      () =>
        pdfMergeEngine.run(
          [
            {name: 'heavy-a.pdf', mimeType: 'application/pdf', size: heavyBytes.byteLength, bytes: heavyBytes.slice().buffer},
            {name: 'heavy-b.pdf', mimeType: 'application/pdf', size: heavyBytes.byteLength, bytes: heavyBytes.slice().buffer},
          ],
          {},
          {
            onProgress: (p) => {
              if (p.percent >= 10 && !heavyAbort.signal.aborted) {
                abortedAtPercent = p.percent;
                heavyAbort.abort();
              }
            },
            signal: heavyAbort.signal,
          }
        ),
      (err: {code?: string}) => err?.code === 'CANCELLED'
    );
    assert.ok(abortedAtPercent >= 10 && abortedAtPercent < 100);

    // AbortSignal checkpoint during integrity check on pre-aborted signal
    const preAborted = new AbortController();
    preAborted.abort();
    assert.throws(
      () => verifyPdfPageIntegrity(heavyDoc, preAborted.signal, 'heavy-cancel-check.pdf'),
      (err: {code?: string}) => err?.code === 'CANCELLED'
    );
  }

  // 11k. Round 2 real-byte tolerance, incremental update, inherited attrs, /Count mismatch, reason codes & 25 MB benchmark
  {
    const distinctDoc = await PDFDocument.create();
    const distinctFont = await distinctDoc.embedFont(StandardFonts.Helvetica);
    for (let p = 1; p <= 5; p += 1) {
      const pg = distinctDoc.addPage([300 + p, 420]);
      pg.drawText(`Distinct Page ${p}`, {x: 24, y: 380, size: 12, font: distinctFont});
    }
    const distinctBytes = await distinctDoc.save({useObjectStreams: false});

    const runAllToolsAndAssertValid = async (label: string, sourceBytes: Uint8Array, expectWarningSubstr?: string) => {
      const makeInput = (suffix = '') => ({
        name: `${label}${suffix}.pdf`,
        mimeType: 'application/pdf',
        size: sourceBytes.byteLength,
        bytes: sourceBytes.slice().buffer,
      });

      const inspectRes = await pdfInspectEngine.run(
        [makeInput()],
        {mode: 'inspect'},
        {onProgress: () => {}, signal: new AbortController().signal}
      );
      assert.equal(inspectRes.stats.pageCount, 5, `${label} inspect expected 5 pages`);
      if (expectWarningSubstr) {
        assert.ok(
          inspectRes.warnings.some((w) => w.includes(expectWarningSubstr)),
          `${label} inspect missing warning "${expectWarningSubstr}"`
        );
      }

      const mergeOut = await pdfMergeEngine.run(
        [
          makeInput('-a'),
          {name: 'v1.pdf', mimeType: 'application/pdf', size: validPdf1.byteLength, bytes: validPdf1.slice(0)},
        ],
        {},
        {onProgress: () => {}, signal: new AbortController().signal}
      );
      assert.equal(mergeOut.outputs.length, 1);
      const mergedLoaded = await PDFDocument.load(mergeOut.outputs[0].bytes);
      assert.equal(mergedLoaded.getPageCount(), 7, `${label} merge expected 7 pages`);
      assert.deepEqual(
        mergedLoaded.getPages().slice(0, 5).map((p) => Math.round(p.getWidth())),
        [301, 302, 303, 304, 305]
      );

      const splitOut = await pdfSplitEngine.run(
        [makeInput()],
        {mode: 'ranges', rangesText: '1-2, 3-5'},
        {onProgress: () => {}, signal: new AbortController().signal}
      );
      assert.equal(splitOut.outputs.length, 2);
      assert.equal((await PDFDocument.load(splitOut.outputs[0].bytes)).getPageCount(), 2);
      assert.equal((await PDFDocument.load(splitOut.outputs[1].bytes)).getPageCount(), 3);

      const extractOut = await pdfExtractEngine.run(
        [makeInput()],
        {rangesText: '5, 1'},
        {onProgress: () => {}, signal: new AbortController().signal}
      );
      assert.equal(extractOut.outputs.length, 1);
      const extractedLoaded = await PDFDocument.load(extractOut.outputs[0].bytes);
      assert.deepEqual(
        extractedLoaded.getPages().map((p) => Math.round(p.getWidth())),
        [305, 301]
      );

      const removeOut = await pdfRemoveEngine.run(
        [makeInput()],
        {rangesText: '2, 4'},
        {onProgress: () => {}, signal: new AbortController().signal}
      );
      assert.equal(removeOut.outputs.length, 1);
      const removedLoaded = await PDFDocument.load(removeOut.outputs[0].bytes);
      assert.deepEqual(
        removedLoaded.getPages().map((p) => Math.round(p.getWidth())),
        [301, 303, 305]
      );
    };

    // A) Trailing bytes after %%EOF: +2054 zeros, +102406 garbage, +2MB garbage
    const appendBytes = (base: Uint8Array, extraLength: number, fillFn: (idx: number) => number): Uint8Array => {
      const combined = new Uint8Array(base.byteLength + extraLength);
      combined.set(base, 0);
      for (let i = 0; i < extraLength; i += 1) {
        combined[base.byteLength + i] = fillFn(i);
      }
      return combined;
    };

    await runAllToolsAndAssertValid('trailing-2054-zeros', appendBytes(distinctBytes, 2054, () => 0));
    await runAllToolsAndAssertValid(
      'trailing-102406-garbage',
      appendBytes(distinctBytes, 102406, (i) => ((i * 37 + 13) & 0xff) === 0x25 ? 0x20 : (i * 37 + 13) & 0xff)
    );
    await runAllToolsAndAssertValid(
      'trailing-2mb-garbage',
      appendBytes(distinctBytes, 2 * 1024 * 1024, (i) => ((i * 19 + 7) & 0xff) === 0x25 ? 0x20 : (i * 19 + 7) & 0xff)
    );

    // B) Leading bytes before %PDF-: UTF-8 BOM (3 bytes), 100 junk bytes, vs 2000 junk bytes rejected
    const prependBytes = (prefix: Uint8Array, base: Uint8Array): Uint8Array => {
      const combined = new Uint8Array(prefix.byteLength + base.byteLength);
      combined.set(prefix, 0);
      combined.set(base, prefix.byteLength);
      return combined;
    };

    const bomPrefix = new Uint8Array([0xef, 0xbb, 0xbf]);
    const bomPdfBytes = prependBytes(bomPrefix, distinctBytes);
    assert.equal(detectMagicByteKind(bomPdfBytes), 'pdf');
    assert.equal(isPdfSignatureValid(bomPdfBytes), true);
    assert.equal(
      await sniffFileSignature(new File([bomPdfBytes.slice().buffer], 'bom.pdf', {type: 'application/pdf'})),
      'pdf'
    );
    await runAllToolsAndAssertValid('leading-bom', bomPdfBytes, 'Skipped 3 leading byte(s)');

    const junk100 = new Uint8Array(100);
    junk100.fill(0x58); // 'X'
    const junk100PdfBytes = prependBytes(junk100, distinctBytes);
    assert.equal(detectMagicByteKind(junk100PdfBytes), 'pdf');
    assert.equal(
      await sniffFileSignature(new File([junk100PdfBytes.slice().buffer], 'offset100.pdf', {type: 'application/pdf'})),
      'pdf'
    );
    await runAllToolsAndAssertValid('leading-100-junk', junk100PdfBytes, 'Skipped 100 leading byte(s)');

    const junk2000 = new Uint8Array(2000);
    junk2000.fill(0x58);
    const junk2000PdfBytes = prependBytes(junk2000, distinctBytes);
    assert.equal(detectMagicByteKind(junk2000PdfBytes), 'unknown');
    assert.equal(
      await sniffFileSignature(new File([junk2000PdfBytes.slice().buffer], 'offset2000.pdf', {type: 'application/pdf'})),
      'unknown'
    );
    await assert.rejects(
      () =>
        pdfInspectEngine.run(
          [{name: 'offset2000.pdf', mimeType: 'application/pdf', size: junk2000PdfBytes.byteLength, bytes: junk2000PdfBytes.slice().buffer}],
          {mode: 'inspect'},
          {onProgress: () => {}, signal: new AbortController().signal}
        ),
      (err: {code?: string; developerDetail?: string}) =>
        err?.code === 'NOT_A_PDF' && Boolean(err.developerDetail?.includes('[reason:header]'))
    );

    // C) /Count mismatch tolerance (declared /Count 6 and /Count 3 on a 5-page PDF) vs /Count 3 with 0 kids
    const asciiDistinct = new TextDecoder('latin1').decode(distinctBytes);
    for (const fakeCount of [6, 3]) {
      const patchedStr = asciiDistinct.replace('/Count 5', `/Count ${fakeCount}`);
      assert.notEqual(patchedStr, asciiDistinct, `Expected to patch /Count 5 -> ${fakeCount}`);
      const patchedBytes = new Uint8Array(patchedStr.length);
      for (let i = 0; i < patchedStr.length; i += 1) {
        patchedBytes[i] = patchedStr.charCodeAt(i);
      }
      await runAllToolsAndAssertValid(`count-mismatch-${fakeCount}`, patchedBytes, `reported ${fakeCount} page(s), while 5 reachable page(s) were found`);
    }

    const emptyKidsCount3 = [
      '%PDF-1.4\n',
      '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n',
      '2 0 obj << /Type /Pages /Kids [] /Count 3 >> endobj\n',
      'xref\n0 3\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n',
      'trailer << /Size 3 /Root 1 0 R >>\nstartxref\n111\n%%EOF\n',
    ].join('');
    const emptyKidsBytes = new TextEncoder().encode(emptyKidsCount3);
    await assert.rejects(
      () =>
        pdfInspectEngine.run(
          [{name: 'empty-kids-count3.pdf', mimeType: 'application/pdf', size: emptyKidsBytes.byteLength, bytes: emptyKidsBytes.slice().buffer}],
          {mode: 'inspect'},
          {onProgress: () => {}, signal: new AbortController().signal}
        ),
      (err: {code?: string; developerDetail?: string}) =>
        err?.code === 'CORRUPT_PDF' && Boolean(err.developerDetail?.includes('[reason:page-tree]'))
    );

    // D) Hand-written incremental update PDF + inherited /MediaBox and /Resources on parent /Pages
    const rev1Parts = [
      '%PDF-1.4\n',
      '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n',
      '2 0 obj << /Type /Pages /MediaBox [0 0 250 350] /Resources << >> /Kids [3 0 R] /Count 1 >> endobj\n',
      '3 0 obj << /Type /Page /Parent 2 0 R /Contents 4 0 R >> endobj\n',
      '4 0 obj << /Length 0 >> stream\n\nendstream endobj\n',
    ];
    let incOffset = 0;
    const rev1Offsets: number[] = [];
    for (let i = 0; i < rev1Parts.length; i += 1) {
      if (i > 0) rev1Offsets.push(incOffset);
      incOffset += rev1Parts[i].length;
    }
    const rev1XrefStart = incOffset;
    const rev1Trailer = [
      'xref\n0 5\n0000000000 65535 f \n',
      ...rev1Offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`),
      `trailer << /Size 5 /Root 1 0 R >>\nstartxref\n${rev1XrefStart}\n%%EOF\n`,
    ].join('');
    const rev1Str = [...rev1Parts, rev1Trailer].join('');
    const rev2Obj2Off = rev1Str.length;
    const rev2Obj2 = '2 0 obj << /Type /Pages /MediaBox [0 0 250 350] /Resources << >> /Kids [3 0 R 5 0 R] /Count 2 >> endobj\n';
    const rev2Obj5Off = rev2Obj2Off + rev2Obj2.length;
    const rev2Obj5 = '5 0 obj << /Type /Page /Parent 2 0 R /Contents 4 0 R >> endobj\n';
    const rev2XrefOff = rev2Obj5Off + rev2Obj5.length;
    const rev2Trailer =
      `xref\n2 1\n${String(rev2Obj2Off).padStart(10, '0')} 00000 n \n5 1\n${String(rev2Obj5Off).padStart(10, '0')} 00000 n \n` +
      `trailer << /Size 6 /Root 1 0 R /Prev ${rev1XrefStart} >>\nstartxref\n${rev2XrefOff}\n%%EOF\n`;
    const incrementalBytes = new TextEncoder().encode(rev1Str + rev2Obj2 + rev2Obj5 + rev2Trailer);

    const incInspect = await pdfInspectEngine.run(
      [{name: 'incremental-inherited.pdf', mimeType: 'application/pdf', size: incrementalBytes.byteLength, bytes: incrementalBytes.slice().buffer}],
      {mode: 'inspect'},
      {onProgress: () => {}, signal: new AbortController().signal}
    );
    assert.equal(incInspect.stats.pageCount, 2);
    const incExtract = await pdfExtractEngine.run(
      [{name: 'incremental-inherited.pdf', mimeType: 'application/pdf', size: incrementalBytes.byteLength, bytes: incrementalBytes.slice().buffer}],
      {rangesText: '2, 1'},
      {onProgress: () => {}, signal: new AbortController().signal}
    );
    const incExtractedDoc = await PDFDocument.load(incExtract.outputs[0].bytes);
    assert.equal(incExtractedDoc.getPageCount(), 2);
    assert.equal(Math.round(incExtractedDoc.getPage(0).getWidth()), 250);

    // E) Tail-reason & page-tree cycle / dangling /Kids reason code verification
    const noDigitTailBytes = new TextEncoder().encode(
      `${asciiDistinct.slice(0, asciiDistinct.lastIndexOf('startxref'))}startxref\n%%EOF\n`
    );
    await assert.rejects(
      () =>
        pdfInspectEngine.run(
          [{name: 'missing-startxref-digits.pdf', mimeType: 'application/pdf', size: noDigitTailBytes.byteLength, bytes: noDigitTailBytes.slice().buffer}],
          {mode: 'inspect'},
          {onProgress: () => {}, signal: new AbortController().signal}
        ),
      (err: {code?: string; developerDetail?: string}) =>
        err?.code === 'CORRUPT_PDF' && Boolean(err.developerDetail?.includes('[reason:tail]'))
    );

    const missingEofTailBytes = new TextEncoder().encode(
      `${asciiDistinct.slice(0, asciiDistinct.lastIndexOf('%%EOF'))}`
    );
    await assert.rejects(
      () =>
        pdfInspectEngine.run(
          [{name: 'missing-eof-after-startxref.pdf', mimeType: 'application/pdf', size: missingEofTailBytes.byteLength, bytes: missingEofTailBytes.slice().buffer}],
          {mode: 'inspect'},
          {onProgress: () => {}, signal: new AbortController().signal}
        ),
      (err: {code?: string; developerDetail?: string}) =>
        err?.code === 'CORRUPT_PDF' && Boolean(err.developerDetail?.includes('[reason:tail]'))
    );

    // Cycle in /Pages tree (root -> childPages -> root)
    const cycleDoc = await PDFDocument.create();
    const cycleChildDict = cycleDoc.context.obj({
      Type: 'Pages',
      Kids: [cycleDoc.catalog.get(PDFName.of('Pages'))!],
      Count: 1,
    });
    const cycleChildRef = cycleDoc.context.register(cycleChildDict);
    const cycleRootPages = cycleDoc.catalog.lookup(PDFName.of('Pages')) as unknown as {
      set: (key: PDFName, val: unknown) => void;
    };
    cycleRootPages.set(PDFName.of('Kids'), cycleDoc.context.obj([cycleChildRef]));
    assert.throws(
      () => verifyPdfPageIntegrity(cycleDoc, new AbortController().signal, 'cycle.pdf'),
      (err: {code?: string; developerDetail?: string}) =>
        err?.code === 'CORRUPT_PDF' && Boolean(err.developerDetail?.includes('[reason:page-tree]'))
    );

    // F) 25 MB worst-case whole-buffer tail & header benchmark (zero 25 MB string allocation)
    const benchmark25Mb = new Uint8Array(25 * 1024 * 1024);
    benchmark25Mb.set(distinctBytes, 0);
    // Fill remaining ~25 MB with non-% non-s bytes so backward scan traverses the entire 25 MB
    benchmark25Mb.fill(0x20, distinctBytes.byteLength);
    const benchStart = performance.now();
    const preparedBench = preparePdfBytes(benchmark25Mb, 'benchmark-25mb.pdf');
    checkPdfTailHeuristic(preparedBench.pdfBytes, 'benchmark-25mb.pdf');
    const benchMs = performance.now() - benchStart;
    assert.ok(benchMs < 500, `25 MB header+tail scan took too long: ${benchMs.toFixed(1)}ms`);
    console.log(`25 MB worst-case header+tail scan completed in ${benchMs.toFixed(2)} ms.`);
  }

  // Honest legacy facade check for planned ops
  const plannedPdfResult = await pdfProcessingService.processFiles(
    [new File(['%PDF-1.4'], 'report.pdf', {type: 'application/pdf'})],
    {operation: 'compress'}
  );
  assert.equal(plannedPdfResult.success, false);
  assert.equal(plannedPdfResult.error?.code, 'NOT_IMPLEMENTED');

  // 12. Download manager ObjectURL tracking & revocation test
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
    createElement: () => ({href: '', download: '', rel: '', click: () => {}}),
    body: {appendChild: () => {}, removeChild: () => {}},
  };

  try {
    const tracked = createTrackedObjectUrl(new Blob(['%PDF-1.4'], {type: 'application/pdf'}));
    assert.equal(getTrackedObjectUrlCount(), 1);
    revokeAllTrackedObjectUrls();
    assert.equal(getTrackedObjectUrlCount(), 0);
    assert.ok(revokedUrls.includes(tracked));

    triggerOutputDownload(mergeRes.outputs[0], 0);
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

  // 13. SSR markup render checks for UI components + ResultPanel ZIP & interactive note + ErrorPanel
  const mergeToolDef = getToolBySlug('merge-pdf')!;
  const markup = renderToStaticMarkup(
    <LocaleProvider>
      <MemoryRouter>
        <PdfMasterLogo />
        <Button isLoading loadingText="Working">
          Save
        </Button>
        <Badge variant="success">Available</Badge>
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
              toolId: 'merge-pdf',
              inputFiles: [],
              options: {},
            }),
            status: 'processing',
            progress: {mode: 'determinate', percent: 50, stageLabel: 'Merging'},
          }}
          elapsedMs={1200}
          onCancel={() => {}}
        />
        <ResultPanel result={splitMultiRangesRes} onDiscard={() => {}} />
        <ResultPanel result={mergeRes} onDiscard={() => {}} />
        <ErrorPanel
          error={createProcessingError('NOT_A_PDF', 'RAW_DEV_SECRET_STACK_TRACE')}
          onRetry={() => {}}
        />
        <ToolWorkspace
          tool={mergeToolDef}
          validationRule={{
            allowedExtensions: ['.pdf'],
            allowedMimeTypes: ['application/pdf'],
            maxFileSizeBytes: PROCESSING_LIMITS.maxFileSizeBytes,
            maxFilesCount: PROCESSING_LIMITS.maxFilesCount,
            allowMultiple: true,
          }}
        />
      </MemoryRouter>
    </LocaleProvider>
  );

  assert.ok(markup.includes('PDF Master'));
  assert.ok(markup.includes('Download all as ZIP'));
  assert.ok(markup.includes('merged.pdf'));
  assert.ok(markup.includes(EN_COMMON_DICTIONARY.processing.interactiveFeaturesNote));
  assert.ok(markup.includes(EN_COMMON_DICTIONARY.processing.visualVerificationAdvice));
  assert.equal(markup.includes('RAW_DEV_SECRET_STACK_TRACE'), false);

  const secretReasonErrorMarkup = renderToStaticMarkup(
    <LocaleProvider>
      <ErrorPanel
        error={createProcessingError('CORRUPT_PDF', '[reason:page-tree] INTERNAL_REASON_SHOULD_STAY_HIDDEN')}
        onRetry={() => {}}
      />
    </LocaleProvider>
  );
  assert.ok(secretReasonErrorMarkup.includes(EN_COMMON_DICTIONARY.processingErrors.corruptPdf));
  assert.equal(secretReasonErrorMarkup.includes('[reason:page-tree]'), false);
  assert.equal(secretReasonErrorMarkup.includes('INTERNAL_REASON_SHOULD_STAY_HIDDEN'), false);

  // 14. SSR scan ALL pages & src/locales/en/common.ts for banned claims + live status counts
  const renderPage = (element: React.ReactElement, initialEntry = '/') =>
    renderToStaticMarkup(
      <LocaleProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={[initialEntry]}>{element}</MemoryRouter>
        </ToastProvider>
      </LocaleProvider>
    );

  const homeMarkup = renderPage(<HomePage />, '/');
  assert.equal((homeMarkup.match(/<h1\b/gi) ?? []).length, 1);
  assert.ok(homeMarkup.includes('8 tools planned'));
  assert.ok(homeMarkup.includes('5 live'));
  assert.ok(homeMarkup.includes('Available'));
  assert.ok(homeMarkup.includes('Coming soon'));

  assertNoBannedPhrases(
    'src/locales/en/common.ts',
    JSON.stringify(EN_COMMON_DICTIONARY)
  );

  // 14b. Organize PDF SSR component checks (idle workspace, populated grid, 0-kept error, thumbnail fallback notices)
  {
    const organizeToolDef = getToolBySlug('organize-pdf')!;
    const idleOrgHtml = renderToStaticMarkup(
      <LocaleProvider>
        <MemoryRouter>
          <OrganizerWorkspace
            tool={organizeToolDef}
            validationRule={{
              allowedExtensions: ['.pdf'],
              allowedMimeTypes: ['application/pdf'],
              maxFileSizeBytes: PROCESSING_LIMITS.maxFileSizeBytes,
              maxFilesCount: 1,
              allowMultiple: false,
            }}
          />
        </MemoryRouter>
      </LocaleProvider>
    );
    assert.ok(idleOrgHtml.includes('Select or drag PDF files here'));
    assertNoBannedPhrases('SSR output (OrganizerWorkspace idle)', idleOrgHtml);

    let sampleState = createInitialOrganizeState(3);
    sampleState = organizeReducer(sampleState, {
      type: 'ROTATE_PAGE',
      sourcePageIndex: 1,
      step: 90,
    });
    sampleState = organizeReducer(sampleState, {
      type: 'TOGGLE_SELECT_PAGE',
      sourcePageIndex: 0,
    });
    sampleState = organizeReducer(sampleState, {
      type: 'TOGGLE_DELETE_PAGE',
      sourcePageIndex: 2,
    });

    const populatedGridHtml = renderToStaticMarkup(
      <LocaleProvider>
        <OrganizeGridSection
          state={sampleState}
          thumbnails={{}}
          noticeMode="lazy-large"
          isLibraryLoading={false}
          isRunning={false}
          onDispatch={() => {}}
          onRun={() => {}}
        />
      </LocaleProvider>
    );
    assert.ok(populatedGridHtml.includes('aria-label="Move page 2 earlier"'));
    assert.ok(populatedGridHtml.includes('aria-label="Move page 2 later"'));
    assert.ok(
      populatedGridHtml.includes('aria-label="Rotate page 2 left 90 degrees"')
    );
    assert.ok(
      populatedGridHtml.includes('aria-label="Rotate page 2 right 90 degrees"')
    );
    assert.ok(populatedGridHtml.includes('aria-label="Remove page 2"'));
    assert.ok(populatedGridHtml.includes('aria-label="Restore page 3"'));
    assert.ok(populatedGridHtml.includes('aria-label="Select page 1"'));
    assert.ok(populatedGridHtml.includes('+90°'));
    assert.ok(populatedGridHtml.includes(EN_COMMON_DICTIONARY.workspace.organize.largeDocNotice));
    assertNoBannedPhrases('SSR output (OrganizeGridSection populated)', populatedGridHtml);

    let zeroKeptState = createInitialOrganizeState(2);
    zeroKeptState = organizeReducer(zeroKeptState, {type: 'SELECT_ALL_ACTIVE'});
    zeroKeptState = organizeReducer(zeroKeptState, {type: 'DELETE_SELECTED'});
    const zeroKeptGridHtml = renderToStaticMarkup(
      <LocaleProvider>
        <OrganizeGridSection
          state={zeroKeptState}
          thumbnails={{}}
          noticeMode="hard-cap"
          isLibraryLoading={false}
          isRunning={false}
          onDispatch={() => {}}
          onRun={() => {}}
        />
      </LocaleProvider>
    );
    assert.ok(
      zeroKeptGridHtml.includes(
        EN_COMMON_DICTIONARY.workspace.organize.emptyResultError
      )
    );
    assert.ok(
      zeroKeptGridHtml.includes(
        EN_COMMON_DICTIONARY.workspace.organize.hardCapNotice
      )
    );
    assert.ok(/<button[^>]*disabled[^>]*>[\s\S]*?Save Organized PDF/.test(zeroKeptGridHtml));
    assertNoBannedPhrases('SSR output (OrganizeGridSection zero-kept)', zeroKeptGridHtml);

    const libFailedHtml = renderToStaticMarkup(
      <LocaleProvider>
        <OrganizeGridSection
          state={createInitialOrganizeState(1)}
          thumbnails={{}}
          noticeMode="load-failed"
          isLibraryLoading={false}
          isRunning={false}
          onDispatch={() => {}}
          onRun={() => {}}
        />
      </LocaleProvider>
    );
    assert.ok(
      libFailedHtml.includes(
        EN_COMMON_DICTIONARY.workspace.organize.libraryFailedNotice
      )
    );
    assertNoBannedPhrases('SSR output (OrganizeGridSection load-failed)', libFailedHtml);
  }

  const pageSnapshots: Array<{name: string; html: string}> = [
    {name: 'HomePage', html: homeMarkup},
    {name: 'ToolsPage', html: renderPage(<ToolsPage />, '/tools')},
    ...[
      'merge-pdf',
      'split-pdf',
      'extract-pages',
      'remove-pages',
      'organize-pdf',
      'compress-pdf',
      'protect-pdf',
      'unlock-pdf',
    ].map((slug) => ({
      name: `ToolLandingPage(${slug})`,
      html: renderToStaticMarkup(
        <LocaleProvider>
          <ToastProvider>
            <MemoryRouter initialEntries={[`/${slug}`]}>
              <Routes>
                <Route path="/:slug" element={<ToolLandingPage />} />
              </Routes>
            </MemoryRouter>
          </ToastProvider>
        </LocaleProvider>
      ),
    })),
    {name: 'AboutPage', html: renderPage(<AboutPage />, '/about')},
    {name: 'ContactPage', html: renderPage(<ContactPage />, '/contact')},
    {name: 'PrivacyPage', html: renderPage(<PrivacyPage />, '/privacy-policy')},
    {name: 'TermsPage', html: renderPage(<TermsPage />, '/terms')},
    {name: 'NotFoundPage', html: renderPage(<NotFoundPage />, '/404')},
    {name: 'DesignSystemPage', html: renderPage(<DesignSystemPage />, '/design-system')},
    {name: 'DevPipelinePage', html: renderPage(<DevPipelinePage />, '/dev/pipeline')},
  ];

  for (const snapshot of pageSnapshots) {
    assertNoBannedPhrases(`SSR output (${snapshot.name})`, snapshot.html);
  }

  // Verify live tool pages include non-thin documentation sections, visual advice limitation,
  // and no Coming soon notice, while planned tool pages (including Security) stay clearly labeled Planned/Coming soon.
  for (const liveSlug of [
    'merge-pdf',
    'split-pdf',
    'extract-pages',
    'remove-pages',
    'organize-pdf',
  ]) {
    const rich = getToolRichContent(liveSlug);
    assert.ok(
      rich?.limitations.includes(EN_COMMON_DICTIONARY.processing.visualVerificationAdvice),
      `${liveSlug} rich limitations missing visualVerificationAdvice`
    );
    const snapshot = pageSnapshots.find(
      (s) => s.name === `ToolLandingPage(${liveSlug})`
    )!;
    assert.equal(
      snapshot.html.includes(EN_COMMON_DICTIONARY.toolLanding.foundationNoticeTitle),
      false,
      `${liveSlug} should not render planned notice`
    );
    assert.ok(snapshot.html.includes('Browser Limits'));
    assert.ok(snapshot.html.includes('25.0 MB'));
    assert.ok(snapshot.html.includes(EN_COMMON_DICTIONARY.processing.visualVerificationAdvice));
  }
  for (const plannedSlug of ['compress-pdf', 'protect-pdf', 'unlock-pdf']) {
    const plannedSnapshot = pageSnapshots.find(
      (s) => s.name === `ToolLandingPage(${plannedSlug})`
    )!;
    assert.ok(
      plannedSnapshot.html.includes(EN_COMMON_DICTIONARY.toolLanding.foundationNoticeTitle),
      `${plannedSlug} must show planned notice`
    );
  }
  assert.ok(homeMarkup.includes('Planned tools for password protection'));
  assert.ok(pageSnapshots.find((s) => s.name === 'ToolsPage')!.html.includes('Planned:'));

  // 15. ToolsPage SSR & Footer checks
  const toolsQueryMarkup = renderPage(<ToolsPage />, '/tools?q=combine');
  assert.ok(toolsQueryMarkup.includes('Merge PDF'));
  const footerMarkup = renderToStaticMarkup(
    <LocaleProvider>
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    </LocaleProvider>
  );
  assert.ok(footerMarkup.includes('English'));
  assert.equal(footerMarkup.includes('aria-haspopup="listbox"'), false);

  // Confirm FileDropzone validation helper works cleanly
  const validPdf = new File(['%PDF-1.4'], 'report.pdf', {type: 'application/pdf'});
  const invalidExe = new File(['mz'], 'bad.exe', {type: 'application/x-msdownload'});
  const validation = validateSelectedFiles([validPdf, invalidExe], {
    allowedExtensions: ['.pdf'],
    allowedMimeTypes: ['application/pdf'],
    maxFileSizeBytes: PRODUCTION_TOOL_LIMITS.maxFileSizeBytes,
    maxFilesCount: 5,
    allowMultiple: true,
  });
  assert.equal(validation.acceptedFiles.length, 1);
  assert.equal(validation.errors[0].code, 'INVALID_EXTENSION');

  // 16. FIX 4: SSR structural check for >= 44px touch-target utility classes
  const touchTargetHtml = renderToStaticMarkup(
    <LocaleProvider>
      <MemoryRouter>
        <Header />
        <Breadcrumbs items={[{label: 'Home', to: '/'}, {label: 'All PDF Tools', to: '/tools'}]} />
        <Switch checked={false} onCheckedChange={() => {}} label="Every page" />
        <Footer />
      </MemoryRouter>
    </LocaleProvider>
  );
  assert.ok(touchTargetHtml.includes('min-h-[44px]'));
  assert.ok(touchTargetHtml.includes('min-w-[44px]'));

  // 17. FIX 7: VITE_SITE_URL origin resolution & trailing-slash normalization
  {
    const devWarnings: string[] = [];
    assert.equal(
      resolveBaseOrigin({
        envSiteUrl: 'https://YOUR-PROJECT.vercel.app///',
        isDev: true,
        windowOrigin: 'http://localhost:3000',
        onWarn: (msg) => devWarnings.push(msg),
      }),
      'https://your-project.vercel.app'
    );
    assert.equal(devWarnings.length, 0);

    assert.equal(
      buildCanonicalUrl('/merge-pdf/', {
        envSiteUrl: 'https://YOUR-PROJECT.vercel.app/',
        isDev: false,
      }),
      'https://your-project.vercel.app/merge-pdf'
    );

    const customAlternates = buildHreflangAlternates('/split-pdf/', {
      envSiteUrl: 'https://YOUR-PROJECT.vercel.app/',
      isDev: false,
    });
    assert.ok(
      customAlternates.some((alt) => alt.href === 'https://your-project.vercel.app/split-pdf')
    );

    const customSitemap = generateSitemapEntries({
      envSiteUrl: 'https://YOUR-PROJECT.vercel.app/',
      isDev: false,
    });
    assert.ok(
      customSitemap.some((entry) => entry.loc === 'https://your-project.vercel.app/merge-pdf')
    );

    // Unset in dev warns and uses windowOrigin
    const unsetDevOrigin = resolveBaseOrigin({
      envSiteUrl: '',
      isDev: true,
      windowOrigin: 'http://localhost:3000',
      onWarn: (msg) => devWarnings.push(msg),
    });
    assert.equal(unsetDevOrigin, 'http://localhost:3000');
    assert.equal(devWarnings.length, 1);

    // Unset in non-dev does NOT warn
    const prodWarnings: string[] = [];
    const unsetProdOrigin = resolveBaseOrigin({
      envSiteUrl: '',
      isDev: false,
      windowOrigin: 'https://YOUR-PROJECT.vercel.app/',
      onWarn: (msg) => prodWarnings.push(msg),
    });
    assert.equal(unsetProdOrigin, 'https://your-project.vercel.app');
    assert.equal(prodWarnings.length, 0);

    // SSR fallback with no env and no windowOrigin returns empty origin (relative path)
    assert.equal(
      buildCanonicalUrl('/merge-pdf/', {
        envSiteUrl: '',
        isDev: false,
        windowOrigin: '',
      }),
      '/merge-pdf'
    );
  }

  console.log(
    'All Milestone 5B unit, real-PDF engine, organize reducer/SSR, integrity/truncation, ZIP, limit, SEO origin, cancel & SSR render checks passed.'
  );
}

run();
