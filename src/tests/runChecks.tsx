import assert from 'node:assert/strict';
import JSZip from 'jszip';
import {PDFArray, PDFDocument, PDFName, PDFNumber, PDFRef, StandardFonts} from 'pdf-lib';
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
import {pdfExtractEngine} from '../features/pdf/engine/engines/pdfExtractEngine';
import {pdfInspectEngine} from '../features/pdf/engine/engines/pdfInspectEngine';
import {pdfMergeEngine} from '../features/pdf/engine/engines/pdfMergeEngine';
import {pdfRemoveEngine} from '../features/pdf/engine/engines/pdfRemoveEngine';
import {pdfSplitEngine} from '../features/pdf/engine/engines/pdfSplitEngine';
import {
  verifyPdfPageIntegrity,
  verifySavedPdfOutput,
} from '../features/pdf/engine/engines/sharedPdfUtils';
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
  assert.equal(tools.length, 12);
  assert.equal(categories.length, 8);

  const availableIds = tools
    .filter((tool) => tool.status === 'available')
    .map((tool) => tool.id)
    .sort();
  assert.deepEqual(availableIds, [
    'extract-pages',
    'merge-pdf',
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
  assert.equal(markup.includes('RAW_DEV_SECRET_STACK_TRACE'), false);

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
  assert.ok(homeMarkup.includes('4 live'));
  assert.ok(homeMarkup.includes('Available'));
  assert.ok(homeMarkup.includes('Coming soon'));

  assertNoBannedPhrases(
    'src/locales/en/common.ts',
    JSON.stringify(EN_COMMON_DICTIONARY)
  );

  const pageSnapshots: Array<{name: string; html: string}> = [
    {name: 'HomePage', html: homeMarkup},
    {name: 'ToolsPage', html: renderPage(<ToolsPage />, '/tools')},
    ...['merge-pdf', 'split-pdf', 'extract-pages', 'remove-pages', 'compress-pdf'].map(
      (slug) => ({
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
      })
    ),
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

  // Verify live tool pages include non-thin documentation sections and no Coming soon notice,
  // while planned tool pages keep the Coming soon notice.
  for (const liveSlug of ['merge-pdf', 'split-pdf', 'extract-pages', 'remove-pages']) {
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
  }
  const compressSnapshot = pageSnapshots.find(
    (s) => s.name === 'ToolLandingPage(compress-pdf)'
  )!;
  assert.ok(
    compressSnapshot.html.includes(EN_COMMON_DICTIONARY.toolLanding.foundationNoticeTitle)
  );

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
    'All Milestone 5A unit, real-PDF engine, integrity/truncation, ZIP, limit, SEO origin, cancel & SSR render checks passed.'
  );
}

run();
