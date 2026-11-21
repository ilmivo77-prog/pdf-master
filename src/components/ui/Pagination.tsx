import {ChevronLeft, ChevronRight} from 'lucide-react';
import {cn} from '../../lib/cn';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  ariaLabel?: string;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  ariaLabel = 'Pagination',
  className,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from({length: totalPages}, (_, idx) => idx + 1);

  return (
    <nav aria-label={ariaLabel} className={cn('flex items-center justify-center', className)}>
      <ul className="inline-flex flex-wrap items-center gap-1.5">
        <li>
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            aria-label="Previous page"
            className="inline-flex min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          </button>
        </li>

        {pages.map((page) => {
          const isCurrent = page === currentPage;
          return (
            <li key={page}>
              <button
                type="button"
                onClick={() => onPageChange(page)}
                aria-current={isCurrent ? 'page' : undefined}
                className={cn(
                  'inline-flex min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] items-center justify-center rounded-lg px-3 text-sm font-medium font-mono tabular-nums transition-colors',
                  isCurrent
                    ? 'bg-blue-700 text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                )}
              >
                {page}
              </button>
            </li>
          );
        })}

        <li>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            aria-label="Next page"
            className="inline-flex min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          </button>
        </li>
      </ul>
    </nav>
  );
}
