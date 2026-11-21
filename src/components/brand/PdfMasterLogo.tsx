import {cn} from '../../lib/cn';

export interface PdfMasterLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  className?: string;
}

const MARK_SIZE_CLASSES: Record<NonNullable<PdfMasterLogoProps['size']>, string> = {
  sm: 'h-7 w-7',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
};

const TEXT_SIZE_CLASSES: Record<NonNullable<PdfMasterLogoProps['size']>, string> = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
};

export function PdfMasterLogo({
  size = 'md',
  showWordmark = true,
  className,
}: PdfMasterLogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5 whitespace-nowrap shrink-0', className)}>
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className={cn(MARK_SIZE_CLASSES[size], 'shrink-0')}
      >
        <rect width="32" height="32" rx="8" fill="#1D4ED8" />
        <path
          d="M10 7.5C10 6.94772 10.4477 6.5 11 6.5H18.5858C18.851 6.5 19.1054 6.60536 19.2929 6.79289L23.2071 10.7071C23.3946 10.8946 23.5 11.149 23.5 11.4142V24.5C23.5 25.0523 23.0523 25.5 22.5 25.5H11C10.4477 25.5 10 25.0523 10 24.5V7.5Z"
          fill="#FFFFFF"
        />
        <path d="M18.5 6.5V11.5H23.5L18.5 6.5Z" fill="#93C5FD" />
        <rect x="12.5" y="14.5" width="8.5" height="1.75" rx="0.875" fill="#1D4ED8" />
        <rect x="12.5" y="18.25" width="6" height="1.75" rx="0.875" fill="#1D4ED8" />
        <path
          d="M7.5 10.5H8.75V24.5C8.75 25.7426 9.75736 26.75 11 26.75H20.5V28H11C9.067 28 7.5 26.433 7.5 24.5V10.5Z"
          fill="#BFDBFE"
        />
      </svg>
      {showWordmark && (
        <span
          className={cn(
            'font-display font-bold tracking-tight text-slate-900',
            TEXT_SIZE_CLASSES[size]
          )}
        >
          PDF Master
        </span>
      )}
    </span>
  );
}
