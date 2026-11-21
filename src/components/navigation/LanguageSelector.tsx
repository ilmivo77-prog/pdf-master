import {ChevronDown, Globe} from 'lucide-react';
import {useEffect, useRef, useState} from 'react';
import {LOCALE_CATALOG} from '../../config/locales';
import {useTranslation} from '../../services/localization/i18nService';

interface LanguageSelectorProps {
  dropDirection?: 'down' | 'up';
}

export function LanguageSelector({dropDirection = 'down'}: LanguageSelectorProps) {
  const {localeConfig, t} = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeLocales = LOCALE_CATALOG.filter((item) => item.isActive);
  const hasMultipleActiveLocales = activeLocales.length > 1;

  useEffect(() => {
    if (!hasMultipleActiveLocales) {
      return undefined;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [hasMultipleActiveLocales]);

  // Only English is currently implemented; display an honest non-interactive label
  // instead of a dropdown implying other languages work.
  if (!hasMultipleActiveLocales) {
    return (
      <span
        aria-label={`${t.nav.languageLabel}: ${localeConfig.nativeName}`}
        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 whitespace-nowrap shrink-0"
      >
        <Globe className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
        <span>{localeConfig.nativeName}</span>
      </span>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`${t.nav.languageLabel}: ${localeConfig.name}`}
        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50 whitespace-nowrap shrink-0"
      >
        <Globe className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
        <span>{localeConfig.code.toUpperCase()}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={t.nav.languageLabel}
          className={`absolute end-0 z-40 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg shadow-slate-900/5 ${
            dropDirection === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          <ul className="max-h-64 space-y-0.5 overflow-y-auto">
            {activeLocales.map((item) => (
              <li key={item.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={item.code === localeConfig.code}
                  onClick={() => setIsOpen(false)}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-start text-xs transition-colors ${
                    item.code === localeConfig.code
                      ? 'bg-blue-50 font-semibold text-blue-800'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">
                    {item.nativeName} · {item.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
