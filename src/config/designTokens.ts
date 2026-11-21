import type {ToolCategoryId} from '../types/tool';

/**
 * Single source of truth for PDF Master design tokens.
 * Values map to CSS variables in src/index.css so future dark-theme overrides
 * can extend `:root` cleanly without refactoring component styles.
 */
export const DESIGN_TOKENS = {
  colors: {
    brand: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      500: '#2563EB',
      600: '#1D4ED8',
      700: '#1E40AF',
      800: '#1E3A8A',
    },
    neutral: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
    },
    semantic: {
      successBg: '#ECFDF5',
      successBorder: '#A7F3D0',
      successText: '#047857',
      warningBg: '#FFFBEB',
      warningBorder: '#FDE68A',
      warningText: '#B45309',
      dangerBg: '#FEF2F2',
      dangerBorder: '#FECACA',
      dangerText: '#B91C1C',
      infoBg: '#F0F9FF',
      infoBorder: '#BAE6FD',
      infoText: '#0369A1',
    },
    categories: {
      'organize-pdf': {text: 'text-blue-700', surface: 'bg-blue-50', hex: '#1D4ED8'},
      'optimize-pdf': {text: 'text-emerald-700', surface: 'bg-emerald-50', hex: '#047857'},
      'convert-to-pdf': {text: 'text-sky-700', surface: 'bg-sky-50', hex: '#0369A1'},
      'convert-from-pdf': {text: 'text-amber-800', surface: 'bg-amber-50', hex: '#92400E'},
      'edit-pdf': {text: 'text-indigo-700', surface: 'bg-indigo-50', hex: '#4338CA'},
      security: {text: 'text-slate-700', surface: 'bg-slate-100', hex: '#334155'},
      'ocr-extraction': {text: 'text-teal-700', surface: 'bg-teal-50', hex: '#0F766E'},
      'ai-pdf-tools': {text: 'text-violet-700', surface: 'bg-violet-50', hex: '#6D28D9'},
    } satisfies Record<ToolCategoryId, {text: string; surface: string; hex: string}>,
  },
  typography: {
    families: {
      display: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
      body: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
      mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
    },
    scale: {
      h1Hero:
        'text-3xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight text-slate-900 leading-[1.1] text-balance',
      h1Page:
        'text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-[1.15] text-balance',
      h2Section:
        'text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-[1.2] text-balance',
      h3Card: 'text-base sm:text-lg font-semibold text-slate-900 leading-snug',
      bodyLead: 'text-base sm:text-lg text-slate-600 leading-relaxed',
      bodyRegular: 'text-sm sm:text-base text-slate-600 leading-relaxed',
      caption: 'text-xs text-slate-600 leading-normal',
      monoMeta: 'font-mono text-xs tabular-nums text-slate-600',
    },
    // Backwards-compatible aliases preserved from Milestone 1
    displayFont: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
    bodyFont: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
    monoFont: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
    heroHeadline:
      'text-3xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight text-slate-900 leading-[1.1] text-balance',
    sectionHeading:
      'text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-[1.2] text-balance',
    cardTitle: 'text-base font-semibold text-slate-900',
    bodyLead: 'text-base sm:text-lg text-slate-600 leading-relaxed',
    bodyRegular: 'text-sm sm:text-base text-slate-600 leading-relaxed',
    metadataText: 'text-xs text-slate-600',
  },
  spacing: {
    scale: {
      xs: '0.25rem', // 4px
      sm: '0.5rem', // 8px
      md: '1rem', // 16px
      lg: '1.5rem', // 24px
      xl: '2rem', // 32px
      '2xl': '3rem', // 48px
      '3xl': '4rem', // 64px
    },
    sectionY: 'py-12 sm:py-16 lg:py-20',
    sectionCompactY: 'py-8 sm:py-12',
    containerPaddingX: 'px-4 sm:px-6 lg:px-8',
    gridGap: 'gap-5 sm:gap-6',
  },
  radii: {
    sm: 'rounded-md',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    xl: 'rounded-2xl',
    full: 'rounded-full',
  },
  shadows: {
    none: 'shadow-none',
    sm: 'shadow-xs',
    cardHover: 'hover:shadow-sm',
    dropdown: 'shadow-lg shadow-slate-900/5',
    overlay: 'shadow-xl shadow-slate-900/10',
  },
  zIndex: {
    base: 'z-0',
    stickyHeader: 'z-30',
    dropdown: 'z-40',
    drawer: 'z-50',
    modal: 'z-50',
    toast: 'z-[60]',
  },
  breakpoints: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1440px',
  },
  containerWidths: {
    narrow: 'max-w-3xl mx-auto',
    standard: 'max-w-6xl mx-auto',
    wide: 'max-w-7xl mx-auto',
  },
  components: {
    buttonPrimary:
      'inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-blue-800 active:bg-blue-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap shrink-0 min-h-[44px]',
    buttonSecondary:
      'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition-colors duration-150 hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap shrink-0 min-h-[44px]',
    buttonGhost:
      'inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 whitespace-nowrap shrink-0 min-h-[44px]',
    inputBase:
      'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors duration-150 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 min-h-[44px]',
    cardBase:
      'rounded-xl border border-slate-200 bg-white transition-colors duration-150',
  },
} as const;
