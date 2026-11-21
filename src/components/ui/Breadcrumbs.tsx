import {ChevronRight} from 'lucide-react';
import {Link} from 'react-router-dom';
import {cn} from '../../lib/cn';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  ariaLabel?: string;
  className?: string;
}

export function Breadcrumbs({
  items,
  ariaLabel = 'Breadcrumb',
  className,
}: BreadcrumbsProps) {
  return (
    <nav aria-label={ariaLabel} className={cn('text-xs text-slate-600', className)}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5">
              {index > 0 && (
                <ChevronRight
                  aria-hidden="true"
                  className="h-3.5 w-3.5 shrink-0 text-slate-400 rtl:rotate-180"
                />
              )}
              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  className="transition-colors hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={cn(isLast ? 'font-medium text-slate-900' : undefined)}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
