import {useCallback, useEffect, useRef, useState} from 'react';
import type {
  PDFDocumentLoadingTask,
  PDFDocumentProxy,
  RenderTask,
} from 'pdfjs-dist/types/src/display/api';
import {PROCESSING_LIMITS} from '../../../config/processingLimits';

export interface ThumbnailEntry {
  status: 'idle' | 'loading' | 'ready' | 'error';
  url?: string;
  width?: number;
  height?: number;
}

export type ThumbnailNoticeMode =
  | 'none'
  | 'lazy-large'
  | 'hard-cap'
  | 'load-failed';

export interface UsePdfThumbnailsParams {
  sourceBuffer: ArrayBuffer | null;
  fileKey: string;
  pageCount: number;
  enabled: boolean;
}

export interface UsePdfThumbnailsResult {
  thumbnails: Record<number, ThumbnailEntry>;
  noticeMode: ThumbnailNoticeMode;
  isLibraryLoading: boolean;
  registerCardElement: (pageNumber: number, el: HTMLElement | null) => void;
}

const TARGET_THUMBNAIL_WIDTH_PX = 160;
const MAX_DEVICE_PIXEL_RATIO = 2;

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob);
      },
      'image/jpeg',
      0.82
    );
  });
}

export function usePdfThumbnails({
  sourceBuffer,
  fileKey,
  pageCount,
  enabled,
}: UsePdfThumbnailsParams): UsePdfThumbnailsResult {
  const [thumbnails, setThumbnails] = useState<Record<number, ThumbnailEntry>>(
    {}
  );
  const [noticeMode, setNoticeMode] = useState<ThumbnailNoticeMode>('none');
  const [isLibraryLoading, setIsLibraryLoading] = useState(false);

  const generationRef = useRef(0);
  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);
  const loadingTaskRef = useRef<PDFDocumentLoadingTask | null>(null);
  const activeRenderTaskRef = useRef<RenderTask | null>(null);
  const activeRenderPageRef = useRef<number | null>(null);
  const isRenderLoopActiveRef = useRef(false);

  const elementByPageRef = useRef<Map<number, HTMLElement>>(new Map());
  const pageByElementRef = useRef<Map<HTMLElement, number>>(new Map());
  const visiblePagesRef = useRef<Set<number>>(new Set());
  const queuedPagesRef = useRef<number[]>([]);
  const liveUrlsRef = useRef<Map<number, string>>(new Map());
  const statusMapRef = useRef<Map<number, ThumbnailEntry>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);

  const maxCachedRef = useRef<number>(
    PROCESSING_LIMITS.organizeThumbnailMaxCached
  );
  const hardCapRef = useRef<boolean>(false);

  const revokeAllThumbnailUrls = useCallback(() => {
    for (const url of liveUrlsRef.current.values()) {
      URL.revokeObjectURL(url);
    }
    liveUrlsRef.current.clear();
    statusMapRef.current.clear();
  }, []);

  const syncEntry = useCallback(
    (pageNumber: number, entry: ThumbnailEntry, generation: number) => {
      if (generation !== generationRef.current) {
        return;
      }
      statusMapRef.current.set(pageNumber, entry);
      setThumbnails((prev) => ({
        ...prev,
        [pageNumber]: entry,
      }));
    },
    []
  );

  const evictFurthestIfNeeded = useCallback(
    (generation: number) => {
      const cap = maxCachedRef.current;
      if (liveUrlsRef.current.size < cap) {
        return;
      }

      const visibleList = Array.from(visiblePagesRef.current);
      const anchorPage =
        visibleList.length > 0
          ? visibleList.reduce((acc, v) => acc + v, 0) / visibleList.length
          : 1;

      while (liveUrlsRef.current.size >= cap) {
        let candidatePage: number | null = null;
        let maxDistance = -1;
        for (const cachedPage of liveUrlsRef.current.keys()) {
          if (visiblePagesRef.current.has(cachedPage)) {
            continue;
          }
          const distance = Math.abs(cachedPage - anchorPage);
          if (distance > maxDistance) {
            maxDistance = distance;
            candidatePage = cachedPage;
          }
        }
        if (candidatePage === null) {
          break;
        }
        const evictedUrl = liveUrlsRef.current.get(candidatePage);
        if (evictedUrl) {
          URL.revokeObjectURL(evictedUrl);
        }
        liveUrlsRef.current.delete(candidatePage);
        syncEntry(candidatePage, {status: 'idle'}, generation);
      }
    },
    [syncEntry]
  );

  const pumpRenderQueue = useCallback(
    async (generation: number) => {
      if (
        isRenderLoopActiveRef.current ||
        generation !== generationRef.current ||
        !pdfDocRef.current ||
        hardCapRef.current
      ) {
        return;
      }

      isRenderLoopActiveRef.current = true;
      try {
        while (
          generation === generationRef.current &&
          pdfDocRef.current &&
          queuedPagesRef.current.length > 0
        ) {
          const nextPage = queuedPagesRef.current.shift();
          if (nextPage === undefined) {
            continue;
          }

          if (!visiblePagesRef.current.has(nextPage)) {
            continue;
          }

          const existing = statusMapRef.current.get(nextPage);
          if (existing?.status === 'ready' || existing?.status === 'error') {
            continue;
          }

          syncEntry(nextPage, {status: 'loading'}, generation);
          activeRenderPageRef.current = nextPage;

          const canvas = document.createElement('canvas');
          let pdfPage: Awaited<ReturnType<PDFDocumentProxy['getPage']>> | null =
            null;
          let cancelledDueToScrollOrDispose = false;

          try {
            pdfPage = await pdfDocRef.current.getPage(nextPage);
            if (
              generation !== generationRef.current ||
              !visiblePagesRef.current.has(nextPage)
            ) {
              cancelledDueToScrollOrDispose = true;
              continue;
            }

            const baseViewport = pdfPage.getViewport({scale: 1});
            const dpr = Math.min(
              typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
              MAX_DEVICE_PIXEL_RATIO
            );
            const scale =
              (TARGET_THUMBNAIL_WIDTH_PX / Math.max(1, baseViewport.width)) *
              dpr;
            const viewport = pdfPage.getViewport({scale});

            canvas.width = Math.max(1, Math.round(viewport.width));
            canvas.height = Math.max(1, Math.round(viewport.height));

            const renderTask = pdfPage.render({
              canvas,
              viewport,
            });
            activeRenderTaskRef.current = renderTask;
            await renderTask.promise;

            if (
              generation !== generationRef.current ||
              !visiblePagesRef.current.has(nextPage)
            ) {
              cancelledDueToScrollOrDispose = true;
              continue;
            }

            const blob = await canvasToBlob(canvas);
            if (!blob || generation !== generationRef.current) {
              if (generation === generationRef.current) {
                syncEntry(nextPage, {status: 'error'}, generation);
              }
              continue;
            }

            evictFurthestIfNeeded(generation);

            const previousUrl = liveUrlsRef.current.get(nextPage);
            if (previousUrl) {
              URL.revokeObjectURL(previousUrl);
            }
            const objectUrl = URL.createObjectURL(blob);
            if (generation !== generationRef.current) {
              URL.revokeObjectURL(objectUrl);
              continue;
            }

            liveUrlsRef.current.set(nextPage, objectUrl);
            syncEntry(
              nextPage,
              {
                status: 'ready',
                url: objectUrl,
                width: Math.round(baseViewport.width),
                height: Math.round(baseViewport.height),
              },
              generation
            );
          } catch (err) {
            const isCancelledError =
              cancelledDueToScrollOrDispose ||
              generation !== generationRef.current ||
              !visiblePagesRef.current.has(nextPage) ||
              (err instanceof Error &&
                (err.name === 'RenderingCancelledException' ||
                  err.message.toLowerCase().includes('cancelled')));

            if (isCancelledError) {
              if (generation === generationRef.current) {
                syncEntry(nextPage, {status: 'idle'}, generation);
              }
            } else if (generation === generationRef.current) {
              syncEntry(nextPage, {status: 'error'}, generation);
            }
          } finally {
            activeRenderTaskRef.current = null;
            activeRenderPageRef.current = null;
            canvas.width = 0;
            canvas.height = 0;
            pdfPage?.cleanup();
          }
        }
      } finally {
        isRenderLoopActiveRef.current = false;
        if (
          generation === generationRef.current &&
          pdfDocRef.current &&
          queuedPagesRef.current.length > 0
        ) {
          void pumpRenderQueue(generation);
        }
      }
    },
    [evictFurthestIfNeeded, syncEntry]
  );

  const enqueueVisiblePage = useCallback(
    (pageNumber: number) => {
      if (hardCapRef.current || !pdfDocRef.current) {
        return;
      }
      const existing = statusMapRef.current.get(pageNumber);
      if (existing?.status === 'ready' || existing?.status === 'error') {
        return;
      }
      if (activeRenderPageRef.current === pageNumber) {
        return;
      }
      if (!queuedPagesRef.current.includes(pageNumber)) {
        queuedPagesRef.current.push(pageNumber);
      }
      void pumpRenderQueue(generationRef.current);
    },
    [pumpRenderQueue]
  );

  const registerCardElement = useCallback(
    (pageNumber: number, el: HTMLElement | null) => {
      const prevEl = elementByPageRef.current.get(pageNumber);
      if (prevEl && prevEl !== el) {
        observerRef.current?.unobserve(prevEl);
        pageByElementRef.current.delete(prevEl);
        elementByPageRef.current.delete(pageNumber);
        visiblePagesRef.current.delete(pageNumber);
      }

      if (!el) {
        return;
      }

      elementByPageRef.current.set(pageNumber, el);
      pageByElementRef.current.set(el, pageNumber);

      if (observerRef.current) {
        observerRef.current.observe(el);
      } else {
        visiblePagesRef.current.add(pageNumber);
        enqueueVisiblePage(pageNumber);
      }
    },
    [enqueueVisiblePage]
  );

  useEffect(() => {
    const generation = generationRef.current + 1;
    generationRef.current = generation;

    activeRenderTaskRef.current?.cancel();
    activeRenderTaskRef.current = null;
    activeRenderPageRef.current = null;
    queuedPagesRef.current = [];
    visiblePagesRef.current.clear();

    observerRef.current?.disconnect();
    observerRef.current = null;

    revokeAllThumbnailUrls();
    setThumbnails({});

    const prevDoc = pdfDocRef.current;
    const prevTask = loadingTaskRef.current;
    pdfDocRef.current = null;
    loadingTaskRef.current = null;
    if (prevDoc) {
      void prevDoc.cleanup(false).catch(() => {});
      void prevDoc.loadingTask.destroy().catch(() => {});
    }
    void prevTask?.destroy().catch(() => {});

    if (
      typeof window === 'undefined' ||
      !enabled ||
      !sourceBuffer ||
      pageCount <= 0
    ) {
      hardCapRef.current = false;
      setNoticeMode('none');
      setIsLibraryLoading(false);
      return;
    }

    if (pageCount > PROCESSING_LIMITS.organizeThumbnailHardCap) {
      hardCapRef.current = true;
      setNoticeMode('hard-cap');
      setIsLibraryLoading(false);
      return;
    }

    hardCapRef.current = false;
    const isLargeDoc =
      pageCount > PROCESSING_LIMITS.organizeThumbnailLazyThreshold;
    maxCachedRef.current = isLargeDoc
      ? PROCESSING_LIMITS.organizeThumbnailMaxCachedLarge
      : PROCESSING_LIMITS.organizeThumbnailMaxCached;
    setNoticeMode(isLargeDoc ? 'lazy-large' : 'none');

    if (typeof IntersectionObserver !== 'undefined') {
      const rootMargin = isLargeDoc ? '0px' : '240px 0px';
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (generation !== generationRef.current) {
            return;
          }
          for (const entry of entries) {
            const pageNum = pageByElementRef.current.get(
              entry.target as HTMLElement
            );
            if (pageNum === undefined) {
              continue;
            }
            if (entry.isIntersecting) {
              visiblePagesRef.current.add(pageNum);
              enqueueVisiblePage(pageNum);
            } else {
              visiblePagesRef.current.delete(pageNum);
              queuedPagesRef.current = queuedPagesRef.current.filter(
                (p) => p !== pageNum
              );
              if (activeRenderPageRef.current === pageNum) {
                activeRenderTaskRef.current?.cancel();
              }
            }
          }
        },
        {rootMargin, threshold: 0.01}
      );

      for (const el of elementByPageRef.current.values()) {
        observerRef.current.observe(el);
      }
    }

    let disposed = false;
    setIsLibraryLoading(true);

    void (async () => {
      try {
        const [pdfjs, workerUrlModule] = await Promise.all([
          import('pdfjs-dist/legacy/build/pdf.mjs'),
          import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'),
        ]);
        if (disposed || generation !== generationRef.current) {
          return;
        }

        pdfjs.GlobalWorkerOptions.workerSrc = workerUrlModule.default;

        // Pass an explicit ArrayBuffer copy so pdf.js worker transfer/detach never
        // invalidates OrganizerWorkspace's cached source buffer for final pdf-lib output.
        const pdfBytesCopy = new Uint8Array(sourceBuffer.slice(0));
        const initParams = {
          data: pdfBytesCopy,
          cMapUrl: '/pdfjs/cmaps/',
          cMapPacked: true,
          standardFontDataUrl: '/pdfjs/standard_fonts/',
          wasmUrl: '/pdfjs/wasm/',
          iccUrl: '/pdfjs/iccs/',
          enableXfa: false,
          disableAutoFetch: true,
          disableStream: true,
          isEvalSupported: false,
        };

        const loadingTask = pdfjs.getDocument(
          initParams as Parameters<typeof pdfjs.getDocument>[0]
        );
        loadingTaskRef.current = loadingTask;

        const doc = await loadingTask.promise;
        if (disposed || generation !== generationRef.current) {
          await doc.cleanup(false).catch(() => {});
          await loadingTask.destroy().catch(() => {});
          return;
        }

        pdfDocRef.current = doc;
        setIsLibraryLoading(false);

        if (typeof IntersectionObserver === 'undefined') {
          for (const pageNum of elementByPageRef.current.keys()) {
            visiblePagesRef.current.add(pageNum);
            enqueueVisiblePage(pageNum);
          }
        } else {
          for (const pageNum of visiblePagesRef.current) {
            enqueueVisiblePage(pageNum);
          }
        }
      } catch {
        if (!disposed && generation === generationRef.current) {
          setIsLibraryLoading(false);
          setNoticeMode('load-failed');
        }
      }
    })();

    return () => {
      disposed = true;
      generationRef.current += 1;
      activeRenderTaskRef.current?.cancel();
      activeRenderTaskRef.current = null;
      activeRenderPageRef.current = null;
      queuedPagesRef.current = [];
      visiblePagesRef.current.clear();
      observerRef.current?.disconnect();
      observerRef.current = null;
      revokeAllThumbnailUrls();

      const docToDestroy = pdfDocRef.current;
      const taskToDestroy = loadingTaskRef.current;
      pdfDocRef.current = null;
      loadingTaskRef.current = null;
      if (docToDestroy) {
        void docToDestroy.cleanup(false).catch(() => {});
        void docToDestroy.loadingTask.destroy().catch(() => {});
      }
      void taskToDestroy?.destroy().catch(() => {});
    };
  }, [
    sourceBuffer,
    fileKey,
    pageCount,
    enabled,
    enqueueVisiblePage,
    revokeAllThumbnailUrls,
  ]);

  return {
    thumbnails,
    noticeMode,
    isLibraryLoading,
    registerCardElement,
  };
}
