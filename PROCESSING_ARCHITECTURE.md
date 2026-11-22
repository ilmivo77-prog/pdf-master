# PDF Master — Processing Architecture (Milestone 5B)

This document describes the browser-first PDF processing infrastructure introduced in Milestone 4, expanded with page tools in Milestone 5A, and extended with visual page organization in Milestone 5B.

## 1. Architecture Summary
- **Execution Model**: All PDF parsing, inspection, page copying, rotation, and ZIP packaging run inside a dedicated ES module Web Worker (`src/features/pdf/engine/worker/pdfWorker.ts`) so the React main thread remains responsive.
- **Lazy Loading**: `PdfWorkerClient`, `pdf-lib`, and `jszip` are excluded from the initial application bundle. `ToolWorkspace` is lazy-loaded only on available text/queue tool routes, `OrganizerWorkspace` and `pdfjs-dist` are lazy-loaded only on `/organize-pdf`, `pdfWorker` is spawned only when inspecting/processing files, and `jszip` is dynamically imported inside the worker only when a multi-output split runs.
- **Thumbnail Rendering (`usePdfThumbnails`)**: Page thumbnails for `/organize-pdf` are rendered lazily on demand using self-hosted `pdfjs-dist/legacy/build/pdf.mjs` and its module worker (`pdf.worker.min.mjs`), only *after* our worker `internal:pdf-inspect` validates the PDF signature, structure, and absence of encryption. Helper assets (`cmaps/`, `standard_fonts/`, `wasm/`, `iccs/`) are served from our own `/pdfjs/` origin with zero third-party network requests (`enableXfa: false`, `disableAutoFetch: true`, `disableStream: true`, scripting disabled).
- **Public Tool Status (Milestone 5B)**:
  - **Available (`status: 'available'`)**: `merge-pdf` (`pdf-merge`), `split-pdf` (`pdf-split`), `extract-pages` (`pdf-extract`), `remove-pages` (`pdf-remove`), `organize-pdf` (`pdf-organize`).
  - **Planned (`status: 'planned'`)**: All remaining tools (`compress-pdf`, `pdf-to-word`, `word-to-pdf`, `jpg-to-pdf`, `pdf-to-jpg`, `rotate-pdf`, `protect-pdf`, `unlock-pdf`) remain in validation preview.

## 2. Job Status State Machine

```text
               START_VALIDATING                 QUEUE                  START_PROCESSING
   [idle] -------------------------> [validating] -------> [queued] ---------------------> [processing]
     |                                    |                   |                                 |
     | CANCEL                             | FAIL / CANCEL     | FAIL / CANCEL                   +--> [succeeded]
     v                                    v                   v                                 +--> [failed]
 [cancelled]                      [failed|cancelled]  [failed|cancelled]                        +--> [cancelled]
```

- Terminal states (`succeeded`, `failed`, `cancelled`) do not permit further transitions on the same job instance (`IllegalJobTransitionError` is thrown).
- Starting a new job or discarding results resets state with a fresh `idle` job via `RESET`.
- Determinate progress percentages are clamped to `[0, 100]` and enforced monotonically (`next >= current`).

## 3. Worker Message Protocol (`src/features/pdf/engine/worker/protocol.ts`)

### Main Thread → Worker
- `{ type: 'start', jobId, toolId, files, options }` — Transfers explicit `ArrayBuffer.slice(0)` copies via `postMessage(..., transferBuffers)` so caller caches (such as the cached file buffer in `OrganizerWorkspace`) are never detached or invalidated when transferred across workers.
- `{ type: 'cancel', jobId }` — Requests cooperative cancellation inside the worker before immediate `worker.terminate()` fallback on the main thread.

### Worker → Main Thread
- `{ type: 'progress', jobId, progress }` — Throttled to at most ~10 updates/second (`100ms`), preserving `0%` and `100%` boundaries.
- `{ type: 'result', jobId, result }` — Transfers output PDF `Uint8Array` buffers (and optional `archive` ZIP buffer) back to the main thread.
- `{ type: 'error', jobId, error }` — Structured `ProcessingError` (`code`, `messageKey`, optional `developerDetail` never shown raw to users).

### Cancellation, Memory Cleanup & Assertions
- **Page-Granularity Cancellation**: `copyPagesInChunks()` copies up to 15 pages per batch and checks `AbortSignal` before and after each batch.
- **Inter-File Reference Release**: Engines release `PDFDocument` references between files/outputs before saving or packaging a ZIP.
- **Thumbnail Queue Discipline**: Renders ~160 px thumbnails (DPR capped at 2), 1 canvas at a time (`canvas.width = 0; canvas.height = 0; pdfPage.cleanup()`), `IntersectionObserver`-driven, cancels scrolled-away/unmounted renders, evicts off-screen ObjectURLs beyond cache caps, and calls `pdfDoc.destroy()` on reset/unmount.
- **Expected Page Count Assertion**: Every engine asserts `outputDoc.getPageCount() === expectedCount` and re-verifies saved output bytes before returning.

## 4. Conservative Limits (`src/config/processingLimits.ts`)
Defaults chosen conservatively for mobile browser Web Worker and canvas memory budgets (**to be validated on real devices**):
- `maxFileSizeBytes`: `25 MB` per file
- `maxTotalSizeBytes`: `50 MB` total job payload
- `maxFilesCount`: `10` files per batch
- `maxSplitOutputs`: `50` output PDFs per split run (capped because each split PDF allocates independent object/font structures and output byte arrays before ZIP assembly)
- `maxOrganizePages`: `2000` operations per `pdf-organize` run
- `organizeThumbnailLazyThreshold`: `300` pages (stricter visible-only rootMargin and smaller cache)
- `organizeThumbnailHardCap`: `1000` pages (thumbnails disabled cleanly; page-number organization stays usable)
- `organizeThumbnailMaxCached` / `organizeThumbnailMaxCachedLarge`: `80` / `48` ObjectURLs in memory
- `jobTimeoutMs`: `60_000` ms per job
- `devTestMaxFileSizeBytes`: `50 MB` ceiling for `/dev/pipeline` testing only (real tools use `PROCESSING_LIMITS`)

## 5. Known PDF Structure Limitations (`pdf-lib` & `pdf.js`)
- **Password-Protected PDFs**: Public tools reject password-protected PDFs with `ENCRYPTED_PDF` (`ignoreEncryption` is never used for tool processing). `pdf-inspect` reports only `"Password protected: Yes"` without reading encrypted metadata strings.
- **Interactive & Structural Features**: `pdf-lib` page copying (`copyPages`) transfers page content streams and resources cleanly, but may not preserve form fields (`AcroForm`), bookmarks/outlines (`Outlines`), tagged structure (`StructTreeRoot`), or certain annotations/links (`Annots`). Engines detect these structures and surface a visible plain-language notice in `ResultPanel`.
- **Separate Render vs. Write Libraries**: Thumbnails are rendered by `pdf.js` while output PDFs are assembled and rotated by `pdf-lib`. Rotation changes preserve existing/inherited `/Rotate` (`(existing + delta) mod 360`), and visual appearance may differ slightly if a browser or viewer relies on non-standard PDF features.

## 6. Temporary File & ObjectURL Lifecycle (`src/services/file/downloadManager.ts` & `usePdfThumbnails.ts`)
1. **Selection & Inspection**: Selecting files stores `File` handles and sanitized metadata; magic bytes (`sniffFileSignature`) check the leading 1,024 bytes, and page counts are inspected sequentially in the worker.
2. **Outputs & Downloads**: Generated PDF/ZIP `Uint8Array` bytes stay strictly in browser session memory. `triggerOutputDownload()` revokes created ObjectURLs automatically after download.
3. **Explicit Cleanup**: Clicking **Start over** / **Clear Queue** / **Discard results** (or unmounting the workspace) aborts active jobs, terminates active workers, clears cached buffers, revokes all thumbnail and download ObjectURLs, destroys active `pdf.js` documents, and calls `revokeAllTrackedObjectUrls()`.

## 7. What Is Deferred Beyond Milestone 5B
- Compression, image/office conversions, standalone rotation, encryption/unlocking, OCR, and AI tools.
- Server-side processing endpoints, user accounts, or analytics.
