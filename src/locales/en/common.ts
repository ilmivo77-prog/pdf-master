import type {TranslationDictionary} from '../../types/i18n';

export const EN_COMMON_DICTIONARY: TranslationDictionary = {
  brand: {
    name: 'PDF Master',
    shortDescription:
      'A free-first online PDF utility platform designed for clear, accessible document workflows.',
    copyright: 'PDF Master. Free-first online PDF platform.',
  },
  nav: {
    home: 'Home',
    allTools: 'All Tools',
    categories: 'Categories',
    about: 'About',
    contact: 'Contact',
    exploreToolsCta: 'Explore PDF Tools',
    skipToContent: 'Skip to main content',
    languageLabel: 'Language',
    openMenu: 'Open navigation menu',
    closeMenu: 'Close navigation menu',
  },
  search: {
    placeholder: 'Search PDF tools (e.g., merge, compress, Word, JPG)...',
    ariaLabel: 'Search PDF tools',
    noResultsTitle: 'No tools found',
    noResultsDescription:
      'Try another keyword or browse the full tool directory.',
    browseAllLink: 'Browse all tools',
    resultsHint: 'Use Up and Down arrows to navigate results, Enter to open.',
  },
  home: {
    heroEyebrow: 'PDF Master · Planned Utility Platform',
    heroHeadline: 'All Your PDF Tools. One Simple Platform.',
    heroSubheadline:
      'Merge, split, compress, convert, rotate, and manage PDF files in one focused directory. Individual processing engines are being built milestone by milestone.',
    heroPrimaryCta: 'Browse all tools',
    heroSecondaryCta: 'How it works',
    popularToolsTitle: 'Popular PDF Tools',
    popularToolsSubtitle:
      'Core document workflows prioritized in our initial catalog. Each tool currently provides its dedicated route and local file validation preview.',
    viewAllToolsLink: 'View all tools',
    categoriesSectionTitle: 'Explore by Category',
    categoriesSectionSubtitle:
      'Structured categories spanning everyday organization, conversion, optimization, OCR, and planned AI workflows.',
    categoryToolSingular: 'tool',
    categoryToolPlural: 'tools',
    featuredToolsTitle: 'Featured Workflows',
    featuredToolsSubtitle:
      'Highlighted tools from our first wave of planned document utilities.',
    openToolCta: 'Preview tool page',
    whySectionTitle: 'Why PDF Master',
    whySectionSubtitle:
      'Architectural principles guiding the platform from the first foundation milestone onward.',
    whyBenefits: [
      {
        title: 'Simple, Focused Workflow',
        description:
          'Every tool lives on its own clean page with clear format limits and straightforward controls instead of crowded sidebars.',
      },
      {
        title: 'Built for Mobile & Keyboard',
        description:
          'Responsive layouts from 320px to 1440px, 44px touch targets, and accessible keyboard navigation across menus and dialogs.',
      },
      {
        title: 'Browser-First Roadmap',
        description:
          'We plan to process files directly in your browser using open-source tooling wherever practical before adding server workers for heavier tasks.',
        tag: 'Roadmap',
      },
      {
        title: 'Multilingual & RTL Ready',
        description:
          'Designed from the start with centralized translation dictionaries and logical layout rules for future international and RTL languages.',
        tag: 'Roadmap',
      },
    ],
    howItWorksTitle: 'How It Works',
    howItWorksSubtitle:
      'Each PDF Master tool is designed around a predictable three-step flow.',
    howItWorksSteps: [
      {
        stepNumber: '01',
        title: 'Choose a tool',
        description:
          'Find the operation you need from the homepage, search bar, or category directory.',
      },
      {
        stepNumber: '02',
        title: 'Add your file',
        description:
          'Select or drag documents into the dropzone. Local checks verify file extensions, MIME types, and size boundaries immediately.',
      },
      {
        stepNumber: '03',
        title: 'Download the result',
        description:
          'Retrieve your output file cleanly once the processing engine for that tool is enabled in an upcoming milestone.',
      },
    ],
    howItWorksDisclaimer:
      'Rollout notice: All tools are currently marked Coming soon while PDF processing engines are rolled out tool by tool in upcoming milestones.',
    roadmapStripTitle: 'Current Platform Catalog',
    roadmapPlannedLabel: 'tools planned',
    roadmapLiveLabel: 'live',
    roadmapCategoriesLabel: 'categories',
    faqSectionTitle: 'Frequently Asked Questions',
    faqSectionSubtitle:
      'Clear answers about the current stage of PDF Master and upcoming releases.',
    faqItems: [
      {
        id: 'free',
        question: 'Is PDF Master free to use?',
        answer:
          'PDF Master is designed with a free-first approach using open-source-friendly tooling wherever practical. Exact usage limits for future browser and server tools will be documented alongside each tool launch.',
      },
      {
        id: 'file-types',
        question: 'What file types are planned?',
        answer:
          'PDF Master is planned around PDF files plus common office document and image formats, with exact accepted formats shown on each tool page.',
      },
      {
        id: 'availability',
        question: 'When will the PDF tools be available to process files?',
        answer:
          'Tools are currently in the Coming soon stage while the processing pipeline and individual PDF engines are implemented milestone by milestone.',
      },
      {
        id: 'file-handling',
        question: 'How are my files handled right now?',
        answer:
          'PDF processing is not yet implemented. In the current release, files are only validated locally in your browser and are not uploaded. Full data-handling details will be published before processing launches.',
      },
      {
        id: 'languages',
        question: 'Which languages are supported?',
        answer:
          'English is active right now. The localization architecture and RTL layout rules are in place to support future languages.',
      },
    ],
    finalCtaTitle: 'Explore the Planned Tool Catalog',
    finalCtaDescription:
      'Browse registered tool pages, test local file validation rules, or search by task across every category.',
    finalCtaButton: 'Browse all tools',
  },
  toolsDirectory: {
    pageTitle: 'All PDF Tools',
    pageSubtitle:
      'Browse the centralized PDF Master tool catalog. Search by task, filter by category, or check release availability.',
    searchPlaceholder: 'Search PDF tools (e.g., merge, compress, Word, JPG)...',
    searchLabel: 'Search PDF tools',
    allCategoriesFilter: 'All Categories',
    availableOnlyLabel: 'Show only available tools',
    availableOnlyDescription:
      'Hide Coming soon tools and list only tools with live processing engines.',
    invalidCategoryNotice:
      'The requested category parameter was not recognized, so all categories are shown.',
    showingCountLabel: 'tools matching current filter',
    emptyStateTitle: 'No matching tools found',
    emptyStateDescription:
      'Try adjusting your search keywords or resetting the active category filter.',
    emptyAvailableTitle: 'No tools are live yet',
    emptyAvailableDescription:
      'All registered tools are currently in Coming soon status while processing engines are rolled out in upcoming milestones.',
    clearFiltersCta: 'Reset Filters',
    statusPlanned: 'Coming soon',
    statusAvailable: 'Available',
    statusBeta: 'Beta',
  },
  toolLanding: {
    breadcrumbHome: 'Home',
    breadcrumbTools: 'All PDF Tools',
    foundationNoticeTitle: 'Coming soon — Tool Foundation Preview',
    foundationNoticeBody:
      'This dedicated landing page and local file validation workflow are active. The underlying PDF processing engine for this operation will be integrated in an upcoming milestone—no files are uploaded or processed yet.',
    supportedInputsLabel: 'Accepted Inputs',
    supportedOutputsLabel: 'Target Outputs',
    executionTargetLabel: 'Planned Execution',
    relatedToolsTitle: 'Related PDF Tools',
    backToDirectory: 'View All PDF Tools',
  },
  fileManager: {
    dropzoneTitle: 'Select or drag files here to validate',
    dropzoneSubtitle: 'Files stay in your browser session for local format and size verification.',
    selectFilesButton: 'Select Files',
    addMoreButton: 'Add More Files',
    clearAllButton: 'Clear Queue',
    removeFileLabel: 'Remove file',
    acceptedFormatsPrefix: 'Accepted formats:',
    maxFileSizePrefix: 'Max size per file:',
    maxFilesPrefix: 'Max files:',
    selectedFilesHeading: 'Validated File Queue',
    validationSuccessText: 'Validated locally (ready for future engine)',
    processUnavailableNotice:
      'Processing execution is not enabled yet. Your files passed local validation and were not uploaded anywhere.',
  },
  processing: {
    statusLabels: {
      idle: 'Ready',
      validating: 'Validating file',
      queued: 'Queued',
      processing: 'Processing in browser',
      succeeded: 'Completed',
      failed: 'Failed',
      cancelled: 'Cancelled',
    },
    cancelButton: 'Cancel',
    retryButton: 'Try again',
    elapsedLabel: 'Elapsed',
    stageDefaultLabel: 'Working on document',
    downloadButton: 'Download',
    discardResultsButton: 'Discard results',
    outputsHeading: 'Generated Files',
    warningsHeading: 'Notices',
    statsHeading: 'Document Summary',
    pagesLabel: 'Pages',
    protectedLabel: 'Password protected',
    protectedYes: 'Yes',
    protectedNo: 'No',
    metadataTitleLabel: 'Title',
    metadataProducerLabel: 'Producer',
    noOutputsNotice: 'No output files were produced for this inspection run.',
  },
  processingErrors: {
    invalidFile:
      'The selected file is empty or unreadable. Please choose another file.',
    notAPdf:
      'This file does not appear to be a valid PDF document (missing %PDF- header).',
    passwordProtectedPdf:
      'This PDF is password-protected and cannot be modified without unlocking it first.',
    corruptPdf:
      'The PDF structure could not be parsed. The file may be damaged or incomplete.',
    fileTooLarge:
      'The selected file or batch exceeds the browser memory limit for this operation.',
    tooManyFiles:
      'Too many files were selected for this operation. Please reduce the queue size.',
    outOfMemory:
      'Your browser ran low on memory while handling this file. Close other tabs or try a smaller PDF.',
    workerCrashed:
      'The background browser worker stopped or timed out. Please try again.',
    cancelled: 'Processing was cancelled before completion.',
    engineNotFound:
      'No processing engine is registered for this operation yet.',
    notImplemented:
      'This PDF tool is still in Coming soon status and is not enabled yet.',
    unknown:
      'An unexpected error occurred while handling this file in your browser.',
  },
  footer: {
    toolsHeading: 'Popular Tool Routes',
    companyHeading: 'Platform',
    legalHeading: 'Legal & Privacy',
    allToolsLink: 'All PDF Tools',
    aboutLink: 'About PDF Master',
    contactLink: 'Contact',
    privacyLink: 'Privacy Policy',
    termsLink: 'Terms and Conditions',
    freeFirstNote: 'Free-first architecture · English (Multilingual & RTL ready)',
  },
  pages: {
    aboutTitle: 'About PDF Master',
    contactTitle: 'Contact PDF Master',
    privacyTitle: 'Privacy Policy',
    termsTitle: 'Terms and Conditions',
    notFoundTitle: 'Page Not Found',
    notFoundDescription:
      'The URL you requested does not match an existing PDF Master page or registered tool route.',
    notFoundHomeCta: 'Return to Homepage',
    notFoundToolsCta: 'Browse PDF Tools',
  },
};
