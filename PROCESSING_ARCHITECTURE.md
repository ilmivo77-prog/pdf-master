# PDF Master — Processing Architecture (Milestone 5A)

This document describes the browser-first PDF processing infrastructure introduced in Milestone 4 and expanded with real client-side tools in Milestone 5A.

## 1. Architecture Summary
- **Execution Model**: All PDF parsing, inspection, page copying, and ZIP packaging run inside a dedicated ES module Web Worker (`src/features/pdf/engine/worker/pdfWorker.ts`) so the React main thread remains responsive.
- **Lazy Loading**: `PdfWorkerClient`, `pdf-lib`, and `jszip` are excluded from the initial application bundle. `ToolWorkspace` is lazy-loaded only on available tool routes, `pdfWorker` is spawned only when inspecting/processing files, and `jszip` is dynamically imported inside the worker only when a multi-output split runs.
- **Public Tool Status (Milestone 5A)**:
  - **Available (`status: 'available'`)**: `merge-pdf` (`pdf-merge`), `split-pdf` (`pdf-split`), `extract-pages` (`pdf-extract`), `remove-pages` (`pdf-remove`).
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
- `{ type: 'start', jobId, toolId, files, options }` — Transfers `ArrayBuffer` ownership via `postMessage(..., transferBuffers)`.
- `{ type: 'cancel', jobId }` — Requests cooperative cancellation inside the worker before immediate `worker.terminate()` fallback on the main thread.

### Worker → Main Thread
- `{ type: 'progress', jobId, progress }` — Throttled to at most ~10 updates/second (`100ms`), preserving `0%` and `100%` boundaries.
- `{ type: 'result', jobId, result }` — Transfers output PDF `Uint8Array` buffers (and optional `archive` ZIP buffer) back to the main thread.
- `{ type: 'error', jobId, error }` — Structured `ProcessingError` (`code`, `messageKey`, optional `developerDetail` never shown raw to users).

### Cancellation, Memory Cleanup & Assertions
- **Page-Granularity Cancellation**: `copyPagesInChunks()` copies up to 15 pages per batch and checks `AbortSignal` before and after each batch.
- **Inter-File Reference Release**: `pdf-merge` and `pdf-split` release `PDFDocument` references between files/outputs before starting the next item or packaging a ZIP.
- **Expected Page Count Assertion**: Every engine asserts `outputDoc.getPageCount() === expectedCount` before returning output bytes.

## 4. Conservative Limits (`src/config/processingLimits.ts`)
Defaults chosen conservatively for mobile browser Web Worker memory budgets (**to be validated by real-device testing**):
- `maxFileSizeBytes`: `25 MB` per file
- `maxTotalSizeBytes`: `50 MB` total job payload
- `maxFilesCount`: `10` files per batch
- `maxSplitOutputs`: `50` output PDFs per split run (capped because each split PDF allocates independent object/font structures and output byte arrays before ZIP assembly)
- `jobTimeoutMs`: `60_000` ms per job
- `devTestMaxFileSizeBytes`: `50 MB` ceiling for `/dev/pipeline` testing only (real tools use `PROCESSING_LIMITS`)

## 5. Known PDF Structure Limitations (`pdf-lib`)
- **Password-Protected PDFs**: Public tools reject password-protected PDFs with `ENCRYPTED_PDF` (`ignoreEncryption` is never used for tool processing). `pdf-inspect` reports only `"Password protected: Yes"` without reading encrypted metadata strings.
- **Interactive & Structural Features**: `pdf-lib` page copying (`copyPages`) transfers page content streams and resources cleanly, but may not preserve form fields (`AcroForm`), bookmarks/outlines (`Outlines`), tagged structure (`StructTreeRoot`), or certain annotations/links (`Annots`). Engines detect these structures and surface a visible plain-language notice in `ResultPanel`.

## 6. Temporary File & ObjectURL Lifecycle (`src/services/file/downloadManager.ts`)
1. **Selection & Inspection**: Selecting files stores `File` handles and sanitized metadata; magic bytes (`sniffFileSignature`) check only the leading 16 bytes, and page counts are inspected sequentially in the worker.
2. **Outputs & Downloads**: Generated PDF/ZIP `Uint8Array` bytes stay strictly in browser session memory. `triggerOutputDownload()` revokes created ObjectURLs automatically after download.
3. **Explicit Cleanup**: Clicking **Start over** / **Discard results** (or unmounting the workspace) aborts active jobs, terminates active workers, clears state, and calls `revokeAllTrackedObjectUrls()`.

## 7. What Is Deferred Beyond Milestone 5A
- Page thumbnail previews, `pdfjs-dist`, Organize PDF visual grid (Milestone 5B).
- Compression, image/office conversions, rotation, encryption/unlocking, OCR, and AI tools.
- Server-side processing endpoints, user accounts, or analytics.
