# PDF Master — Processing Architecture (Milestone 4)

This document describes the browser-first PDF processing infrastructure introduced in Milestone 4.

## 1. Architecture Summary
- **Execution Model**: All PDF parsing and manipulation runs inside a dedicated module Web Worker (`src/features/pdf/engine/worker/pdfWorker.ts`) so the React main thread remains responsive.
- **Lazy Loading**: Both the `PdfWorkerClient` worker instance and `pdf-lib` are excluded from the initial application bundle. The worker is spawned only when a job begins.
- **Public Tool Status**: All user-facing PDF tools remain `status: 'planned'` ("Coming soon") in Milestone 4. Only internal self-test operations (`internal:pdf-inspect`, `internal:pdf-roundtrip`) exist on the dev-only `/dev/pipeline` harness.

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
- `{ type: 'result', jobId, result }` — Transfers output `Uint8Array` backing `ArrayBuffer`s back to the main thread.
- `{ type: 'error', jobId, error }` — Structured `ProcessingError` (`code`, `messageKey`, optional `developerDetail` never shown raw to users).

### Concurrency, Timeouts & Crash Recovery
- `PdfWorkerClient` executes one active job per worker at a time and queues additional jobs sequentially.
- A per-job watchdog (`PROCESSING_LIMITS.jobTimeoutMs`, default `60_000` ms) terminates stalled workers and fails the job cleanly.
- On `AbortSignal` abort, `onerror`, or `messageerror`, active listeners and timers are cleared, `worker.terminate()` is invoked, and the next job lazily spawns a fresh worker.

## 4. Conservative Limits (`src/config/processingLimits.ts`)
Defaults chosen conservatively for mobile browser Web Worker memory budgets (**to be validated by real-device testing**):
- `maxFileSizeBytes`: `25 MB` per file
- `maxTotalSizeBytes`: `50 MB` total job payload
- `maxFilesCount`: `10` files per batch
- `jobTimeoutMs`: `60_000` ms per job
- `devTestMaxFileSizeBytes`: `50 MB` ceiling for `/dev/pipeline` testing

## 5. Temporary File & ObjectURL Lifecycle (`src/services/file/downloadManager.ts`)
1. **Selection**: Selecting a file keeps only the browser `File` handle and sanitized metadata (`SafeFileMetadata`); file bytes are **not** read at selection time.
2. **Header Check**: Before reading full bytes, `sniffFileSignature()` reads only the first `16` bytes (`file.slice(0, 16)`) to verify magic headers (`%PDF-x.y`, JPEG, PNG).
3. **Processing**: `file.arrayBuffer()` is read lazily right before worker dispatch and transferred to the worker.
4. **Outputs & Downloads**: Output `Uint8Array` bytes reside strictly in browser session memory. `triggerOutputDownload()` creates a `Blob` and tracked ObjectURL, triggers download using a sanitized filename (`buildOutputFileName`), and revokes the URL via `URL.revokeObjectURL`.
5. **Explicit Cleanup**: Clicking **Discard results** (or unmounting the component/hook) aborts any active job, terminates any active worker, drops result references, and calls `revokeAllTrackedObjectUrls()`.

## 6. What Is NOT Implemented in Milestone 4
- Real user-facing PDF tools (merge, split, compress, convert, rotate, protect, unlock, OCR, AI).
- Multi-worker parallelism or server-side processing workers.
- Persistent storage, user accounts, or backend upload endpoints.
