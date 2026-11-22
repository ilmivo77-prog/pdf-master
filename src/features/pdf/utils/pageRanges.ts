export const MAX_RANGE_INPUT_LENGTH = 2000;

export type PageRangeErrorCode =
  | 'EMPTY_INPUT'
  | 'INPUT_TOO_LONG'
  | 'INVALID_PAGE_COUNT'
  | 'INVALID_SYNTAX'
  | 'ZERO_OR_NEGATIVE_PAGE'
  | 'REVERSED_RANGE'
  | 'PAGE_OUT_OF_RANGE';

export interface PageRangeError {
  code: PageRangeErrorCode;
  /** 0-based character offset in the original input string where the error starts. */
  position: number;
  token?: string;
  value?: number;
  max?: number;
}

export interface PageRangeSegment {
  start: number;
  end: number;
  pages: number[];
}

export interface ParsedPageRanges {
  /** Ascending sorted, deduplicated 1-based page numbers. */
  sortedPages: number[];
  /** First-seen order preserved, deduplicated 1-based page numbers. */
  orderedPages: number[];
  /** Validated individual range segments as written by the user. */
  segments: PageRangeSegment[];
}

export type ParsePageRangesResult =
  | {ok: true; value: ParsedPageRanges}
  | {ok: false; error: PageRangeError};

const ASCII_DIGITS_ONLY = /^[0-9]+$/;

function parseStrictPositiveInt(
  raw: string,
  position: number
): {ok: true; value: number} | {ok: false; error: PageRangeError} {
  if (/^-[0-9]+$/.test(raw)) {
    return {
      ok: false,
      error: {
        code: 'ZERO_OR_NEGATIVE_PAGE',
        position,
        token: raw,
        value: Number(raw),
      },
    };
  }

  if (!ASCII_DIGITS_ONLY.test(raw)) {
    return {
      ok: false,
      error: {
        code: 'INVALID_SYNTAX',
        position,
        token: raw,
      },
    };
  }

  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed)) {
    return {
      ok: false,
      error: {
        code: 'INVALID_SYNTAX',
        position,
        token: raw,
      },
    };
  }

  if (parsed <= 0) {
    return {
      ok: false,
      error: {
        code: 'ZERO_OR_NEGATIVE_PAGE',
        position,
        token: raw,
        value: parsed,
      },
    };
  }

  return {ok: true, value: parsed};
}

/**
 * Parses 1-based page range strings like "1-3, 5, 8-10".
 * Rejects non-ASCII digits (Unicode / full-width), 0/negative numbers,
 * reversed ranges ("5-2"), out-of-range pages, empty segments, and oversized input.
 */
export function parsePageRanges(
  input: string,
  pageCount: number,
  maxLength = MAX_RANGE_INPUT_LENGTH
): ParsePageRangesResult {
  if (!Number.isInteger(pageCount) || pageCount < 1) {
    return {
      ok: false,
      error: {
        code: 'INVALID_PAGE_COUNT',
        position: 0,
        max: pageCount,
      },
    };
  }

  if (input.length > maxLength) {
    return {
      ok: false,
      error: {
        code: 'INPUT_TOO_LONG',
        position: maxLength,
        value: input.length,
        max: maxLength,
      },
    };
  }

  if (input.trim().length === 0) {
    return {
      ok: false,
      error: {
        code: 'EMPTY_INPUT',
        position: 0,
      },
    };
  }

  const seen = new Uint8Array(pageCount + 1);
  const orderedPages: number[] = [];
  const segments: PageRangeSegment[] = [];

  let cursor = 0;
  const rawParts = input.split(',');

  for (const rawPart of rawParts) {
    const partStart = cursor;
    cursor += rawPart.length + 1; // +1 for comma

    const leadingWsMatch = rawPart.match(/^\s*/);
    const leadingWs = leadingWsMatch ? leadingWsMatch[0].length : 0;
    const trimmed = rawPart.trim();
    const trimmedOffset = partStart + leadingWs;

    if (!trimmed) {
      return {
        ok: false,
        error: {
          code: 'INVALID_SYNTAX',
          position: partStart,
          token: rawPart,
        },
      };
    }

    // Negative single value like "-3" (as opposed to "1-3" or "3-")
    if (/^-[0-9]+$/.test(trimmed)) {
      return {
        ok: false,
        error: {
          code: 'ZERO_OR_NEGATIVE_PAGE',
          position: trimmedOffset,
          token: trimmed,
          value: Number(trimmed),
        },
      };
    }

    const dashIndex = trimmed.indexOf('-');
    if (dashIndex === -1) {
      const single = parseStrictPositiveInt(trimmed, trimmedOffset);
      if (!single.ok) {
        return single;
      }
      if (single.value > pageCount) {
        return {
          ok: false,
          error: {
            code: 'PAGE_OUT_OF_RANGE',
            position: trimmedOffset,
            token: trimmed,
            value: single.value,
            max: pageCount,
          },
        };
      }

      segments.push({
        start: single.value,
        end: single.value,
        pages: [single.value],
      });

      if (seen[single.value] === 0) {
        seen[single.value] = 1;
        orderedPages.push(single.value);
      }
      continue;
    }

    const secondDashIndex = trimmed.indexOf('-', dashIndex + 1);
    if (secondDashIndex !== -1) {
      return {
        ok: false,
        error: {
          code: 'INVALID_SYNTAX',
          position: trimmedOffset + secondDashIndex,
          token: trimmed,
        },
      };
    }

    const rawStart = trimmed.slice(0, dashIndex);
    const rawEnd = trimmed.slice(dashIndex + 1);
    const startTrimmed = rawStart.trim();
    const endTrimmed = rawEnd.trim();

    if (!startTrimmed || !endTrimmed) {
      return {
        ok: false,
        error: {
          code: 'INVALID_SYNTAX',
          position: trimmedOffset + (!startTrimmed ? 0 : dashIndex + 1),
          token: trimmed,
        },
      };
    }

    const startOffset =
      trimmedOffset + (rawStart.length - rawStart.trimStart().length);
    const endOffset =
      trimmedOffset +
      dashIndex +
      1 +
      (rawEnd.length - rawEnd.trimStart().length);

    const parsedStart = parseStrictPositiveInt(startTrimmed, startOffset);
    if (!parsedStart.ok) {
      return parsedStart;
    }

    const parsedEnd = parseStrictPositiveInt(endTrimmed, endOffset);
    if (!parsedEnd.ok) {
      return parsedEnd;
    }

    if (parsedStart.value > pageCount) {
      return {
        ok: false,
        error: {
          code: 'PAGE_OUT_OF_RANGE',
          position: startOffset,
          token: startTrimmed,
          value: parsedStart.value,
          max: pageCount,
        },
      };
    }

    if (parsedEnd.value > pageCount) {
      return {
        ok: false,
        error: {
          code: 'PAGE_OUT_OF_RANGE',
          position: endOffset,
          token: endTrimmed,
          value: parsedEnd.value,
          max: pageCount,
        },
      };
    }

    if (parsedStart.value > parsedEnd.value) {
      return {
        ok: false,
        error: {
          code: 'REVERSED_RANGE',
          position: trimmedOffset,
          token: trimmed,
          value: parsedStart.value,
          max: parsedEnd.value,
        },
      };
    }

    const segPages: number[] = [];
    for (let page = parsedStart.value; page <= parsedEnd.value; page += 1) {
      segPages.push(page);
      if (seen[page] === 0) {
        seen[page] = 1;
        orderedPages.push(page);
      }
    }

    segments.push({
      start: parsedStart.value,
      end: parsedEnd.value,
      pages: segPages,
    });
  }

  const sortedPages: number[] = [];
  for (let page = 1; page <= pageCount; page += 1) {
    if (seen[page] === 1) {
      sortedPages.push(page);
    }
  }

  return {
    ok: true,
    value: {
      sortedPages,
      orderedPages,
      segments,
    },
  };
}

/**
 * Returns sorted 1-based page numbers from 1..pageCount excluding `selectedPages`.
 */
export function invertPageSelection(
  selectedPages: readonly number[],
  pageCount: number
): number[] {
  if (!Number.isInteger(pageCount) || pageCount < 1) {
    return [];
  }
  const excluded = new Uint8Array(pageCount + 1);
  for (const page of selectedPages) {
    if (Number.isInteger(page) && page >= 1 && page <= pageCount) {
      excluded[page] = 1;
    }
  }
  const remaining: number[] = [];
  for (let page = 1; page <= pageCount; page += 1) {
    if (excluded[page] === 0) {
      remaining.push(page);
    }
  }
  return remaining;
}

/**
 * Groups pages 1..pageCount into consecutive chunks of `chunkSize`.
 */
export function chunkPagesBySize(
  pageCount: number,
  chunkSize: number
): number[][] {
  if (
    !Number.isInteger(pageCount) ||
    pageCount < 1 ||
    !Number.isInteger(chunkSize) ||
    chunkSize < 1
  ) {
    return [];
  }

  const groups: number[][] = [];
  for (let start = 1; start <= pageCount; start += chunkSize) {
    const end = Math.min(pageCount, start + chunkSize - 1);
    const group: number[] = [];
    for (let page = start; page <= end; page += 1) {
      group.push(page);
    }
    groups.push(group);
  }
  return groups;
}

/**
 * Returns one single-page group per page across 1..pageCount.
 */
export function splitEveryPage(pageCount: number): number[][] {
  return chunkPagesBySize(pageCount, 1);
}
