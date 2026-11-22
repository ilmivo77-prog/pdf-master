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
    placeholder: 'Search PDF tools (e.g., merge, split, organize, extract)...',
    ariaLabel: 'Search PDF tools',
    noResultsTitle: 'No tools found',
    noResultsDescription:
      'Try another keyword or browse the full tool directory.',
    browseAllLink: 'Browse all tools',
    resultsHint: 'Use Up and Down arrows to navigate results, Enter to open.',
  },
  home: {
    heroEyebrow: 'PDF Master · Browser PDF Utilities',
    heroHeadline: 'All Your PDF Tools. One Simple Platform.',
    heroSubheadline:
      'Merge, split, organize, extract, and remove PDF pages directly inside your browser, with conversion, optimization, and editing utilities rolling out milestone by milestone.',
    heroPrimaryCta: 'Browse all tools',
    heroSecondaryCta: 'How it works',
    popularToolsTitle: 'Popular PDF Tools',
    popularToolsSubtitle:
      'Core document workflows prioritized in our catalog, starting with browser-based PDF organization tools.',
    viewAllToolsLink: 'View all tools',
    categoriesSectionTitle: 'Explore by Category',
    categoriesSectionSubtitle:
      'Structured categories spanning everyday organization, conversion, optimization, OCR, and planned AI workflows.',
    categoryToolSingular: 'tool',
    categoryToolPlural: 'tools',
    featuredToolsTitle: 'Featured Workflows',
    featuredToolsSubtitle:
      'Highlighted PDF tools across our active browser utilities and upcoming milestones.',
    openToolCta: 'Preview tool page',
    useToolCta: 'Open tool',
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
        title: 'Browser-First Architecture',
        description:
          'Available organization tools execute inside a browser Web Worker using open-source tooling so document bytes stay in your browser session.',
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
          'Select or drag documents into the dropzone. Local checks verify signatures, formats, and browser memory limits immediately.',
      },
      {
        stepNumber: '03',
        title: 'Download the result',
        description:
          'Run the browser worker on available tools and download your PDF or ZIP outputs directly from session memory.',
      },
    ],
    howItWorksDisclaimer:
      'Availability note: Merge PDF, Split PDF, Organize PDF, Extract Pages, and Remove Pages run today inside your browser. Tools marked Coming soon remain in local file-validation preview.',
    roadmapStripTitle: 'Current Platform Catalog',
    roadmapPlannedLabel: 'tools planned',
    roadmapLiveLabel: 'live',
    roadmapCategoriesLabel: 'categories',
    faqSectionTitle: 'Frequently Asked Questions',
    faqSectionSubtitle:
      'Clear answers about the current stage of PDF Master, active tools, and browser memory limits.',
    faqItems: [
      {
        id: 'free',
        question: 'Is PDF Master free to use?',
        answer:
          'PDF Master is designed with a free-first approach using open-source browser libraries wherever practical. Active browser tools have conservative file size limits to protect device memory.',
      },
      {
        id: 'file-types',
        question: 'What file types are supported?',
        answer:
          'Current live tools accept standard PDF (.pdf) documents. Additional tools for office documents and image formats are planned with exact accepted formats shown on each tool page.',
      },
      {
        id: 'availability',
        question: 'Which PDF tools can process files right now?',
        answer:
          'Merge PDF, Split PDF, Organize PDF, Extract Pages, and Remove Pages are live inside your browser. Remaining tools stay marked Coming soon while their engines are built milestone by milestone.',
      },
      {
        id: 'file-handling',
        question: 'How are my files handled right now?',
        answer:
          'For live browser tools, files are processed inside your browser by the page’s own code and are not sent to a server by PDF Master. Results exist only in browser memory for your current session. Planned tools only run local validation checks. When serving the site, the hosting provider may keep standard server logs such as IP address and requested URL.',
      },
      {
        id: 'languages',
        question: 'Which languages are supported?',
        answer:
          'English is active right now. The localization architecture and RTL layout rules are in place to support future languages.',
      },
    ],
    finalCtaTitle: 'Explore the PDF Tool Catalog',
    finalCtaDescription:
      'Use the live browser organization tools or inspect upcoming utilities across every document category.',
    finalCtaButton: 'Browse all tools',
  },
  toolsDirectory: {
    pageTitle: 'All PDF Tools',
    pageSubtitle:
      'Browse the centralized PDF Master tool catalog. Search by task, filter by category, or view only live browser tools.',
    searchPlaceholder: 'Search PDF tools (e.g., merge, split, organize, extract)...',
    searchLabel: 'Search PDF tools',
    allCategoriesFilter: 'All Categories',
    availableOnlyLabel: 'Show only available tools',
    availableOnlyDescription:
      'Hide Coming soon tools and list only tools with active browser processing.',
    invalidCategoryNotice:
      'The requested category parameter was not recognized, so all categories are shown.',
    showingCountLabel: 'tools matching current filter',
    emptyStateTitle: 'No matching tools found',
    emptyStateDescription:
      'Try adjusting your search keywords or resetting the active category filter.',
    emptyAvailableTitle: 'No matching available tools',
    emptyAvailableDescription:
      'No available tools matched your current search or category filter. Clear filters to view all tools.',
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
      'This dedicated landing page and local file validation workflow are active. The underlying PDF processing engine for this operation will be integrated in an upcoming milestone.',
    supportedInputsLabel: 'Accepted Inputs',
    supportedOutputsLabel: 'Target Outputs',
    executionTargetLabel: 'Processing Mode',
    relatedToolsTitle: 'Related PDF Tools',
    backToDirectory: 'View All PDF Tools',
    livePrivacyNotice:
      'Files are processed inside your browser by the page’s own code and are not sent to a server by PDF Master. Results exist only in browser memory for this session.',
  },
  fileManager: {
    dropzoneTitle: 'Select or drag files here to validate',
    dropzoneSubtitle: 'Files stay in your browser session for local format and size verification.',
    liveDropzoneTitle: 'Select or drag PDF files here',
    liveDropzoneSubtitle:
      'Processed inside your browser Web Worker. Files are not sent to a server and stay in session memory only.',
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
      'Processing execution is not enabled yet for this planned tool. Your files passed local validation and were not sent to any server.',
  },
  workspace: {
    queueHeading: 'Selected PDF Files',
    inspectingLabel: 'Reading pages...',
    inspectErrorFallback: 'Could not read PDF structure.',
    pagesUnitSingular: 'page',
    pagesUnitPlural: 'pages',
    totalPagesLabel: 'Total pages',
    moveUpLabel: 'Move up',
    moveDownLabel: 'Move down',
    memoryNotice:
      'Browser memory limits are conservative and large documents may fail on low-memory phones.',
    merge: {
      heading: '1. Order PDF Files to Merge',
      helperText:
        'Files will be combined from top to bottom. Use Move up or Move down to arrange the final page order.',
      minFilesWarning: 'Select at least 2 valid, unrestricted PDF files to merge.',
      runButton: 'Merge PDFs',
    },
    split: {
      heading: '1. Choose Split Method',
      modeLabel: 'Split mode',
      modeRangesLabel: 'Custom page ranges',
      modeRangesDesc:
        'Create one output PDF per comma-separated range group (e.g., "1-3, 5, 8-10").',
      modeEveryNLabel: 'Every N pages',
      modeEveryNDesc:
        'Divide the document into consecutive chunks of a fixed page count.',
      modeEveryPageLabel: 'Every page separately',
      modeEveryPageDesc:
        'Save every single page as its own individual PDF inside a ZIP archive.',
      rangesInputLabel: 'Page ranges',
      rangesPlaceholder: 'e.g., 1-3, 5, 8-10',
      rangesExamples: 'Examples: "1-3, 5" creates 2 PDFs; "1-2, 3-4, 5" creates 3 PDFs.',
      everyNInputLabel: 'Pages per split PDF',
      everyNInvalid: 'Enter a whole number greater than or equal to 1.',
      summaryOneOutput: 'This configuration will produce 1 PDF file (direct download).',
      summaryManyPrefix: 'This configuration will produce',
      summaryManySuffix: 'PDF files packaged into a ZIP archive.',
      tooManyOutputsPrefix: 'Too many output files requested. Reduce groups or raise pages per split so output count is at most',
      tooManyOutputsSuffix: '.',
      runButton: 'Split PDF',
    },
    extract: {
      heading: '1. Select Pages to Extract',
      rangesInputLabel: 'Pages to extract (order preserved)',
      rangesPlaceholder: 'e.g., 1-3, 5, 8-10',
      rangesExamples:
        'Duplicate pages are omitted automatically while keeping the first position you wrote (e.g., "5, 1-3").',
      summaryPrefix: 'Will extract',
      summarySuffix: 'into a new PDF in the order listed.',
      runButton: 'Extract Pages',
    },
    remove: {
      heading: '1. Select Pages to Remove',
      rangesInputLabel: 'Pages to delete from the document',
      rangesPlaceholder: 'e.g., 2, 4-6',
      rangesExamples:
        'All other pages will remain in their original order. You must keep at least 1 page.',
      summaryPrefix: 'Will remove',
      summaryMiddle: 'and keep',
      summarySuffix: 'in the output PDF.',
      removeAllError:
        'Removing all pages would leave an empty PDF. Deselect at least one page to keep.',
      runButton: 'Remove Pages',
    },
    organize: {
      heading: '1. Arrange, Rotate, or Remove Pages',
      helperText:
        'Reorder pages using the card arrows or drag-and-drop, rotate individual or selected pages, and mark unwanted pages for removal.',
      selectAllButton: 'Select all',
      clearSelectionButton: 'Clear selection',
      rotateSelectedLeftButton: 'Rotate selected left',
      rotateSelectedRightButton: 'Rotate selected right',
      deleteSelectedButton: 'Remove selected',
      restoreAllButton: 'Restore all',
      reverseOrderButton: 'Reverse order',
      resetOrderButton: 'Reset',
      summaryKeptSingular: 'page will be kept',
      summaryKeptPlural: 'pages will be kept',
      summaryRemovedLabel: 'removed',
      summarySelectedLabel: 'selected',
      emptyResultError:
        'All pages are currently marked for removal. Restore at least one page to create an output PDF.',
      largeDocNotice:
        'Large document: page thumbnails load only as cards scroll into view to manage browser memory.',
      hardCapNotice:
        'Thumbnail previews are disabled above the 1,000-page preview limit to protect browser memory. You can still reorder, rotate, and remove pages by page number.',
      libraryFailedNotice:
        'Thumbnail preview rendering is unavailable in this browser session, so page cards show page numbers only. You can still reorder, rotate, and remove pages.',
      thumbnailsLoadingNotice: 'Loading page thumbnail renderer...',
      pageLabel: 'Page',
      removedBadge: 'Removed',
      selectPageLabel: 'Select page',
      moveEarlierLabel: 'earlier',
      moveLaterLabel: 'later',
      rotateLeftLabel: 'left 90 degrees',
      rotateRightLabel: 'right 90 degrees',
      deletePageLabel: 'Remove page',
      restorePageLabel: 'Restore page',
      runButton: 'Save Organized PDF',
    },
    pageRangeErrors: {
      EMPTY_INPUT: 'Enter one or more page numbers or ranges (for example: 1-3, 5).',
      INPUT_TOO_LONG: 'The page range input is too long. Shorten the range expression.',
      INVALID_PAGE_COUNT: 'Document page count is not available yet.',
      INVALID_SYNTAX:
        'Use ASCII numbers, hyphens, and commas only (for example: 1-3, 5, 8-10).',
      ZERO_OR_NEGATIVE_PAGE: 'Page numbers start at 1. Numbers below 1 are not allowed.',
      REVERSED_RANGE: 'Each range start must be less than or equal to its end (e.g., 2-5, not 5-2).',
      PAGE_OUT_OF_RANGE: 'One or more page numbers exceed the document page count.',
    },
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
    downloadAllZipButton: 'Download all as ZIP',
    discardResultsButton: 'Discard results',
    startOverButton: 'Start over',
    outputsHeading: 'Generated Files',
    outputCountLabel: 'Output files',
    warningsHeading: 'Notices',
    statsHeading: 'Document Summary',
    pagesLabel: 'Pages',
    protectedLabel: 'Protected or restricted',
    protectedYes: 'Yes',
    protectedNo: 'No',
    metadataTitleLabel: 'Title',
    metadataProducerLabel: 'Producer',
    noOutputsNotice: 'No output files were produced for this inspection run.',
    interactiveFeaturesNote:
      'Some interactive features such as bookmarks or form fields may not be preserved.',
    visualVerificationAdvice:
      'Open the downloaded file in your PDF viewer to confirm it looks right before using it. PDF Master does not inspect the visual content of your pages.',
  },
  processingErrors: {
    invalidFile:
      'The selected file is empty or unreadable. Please choose another file.',
    notAPdf:
      'This file does not appear to be a valid PDF document (missing %PDF- header).',
    passwordProtectedPdf:
      'This PDF uses encryption or permission restrictions, so PDF Master cannot process it yet. Remove the encryption or restrictions in your PDF viewer first.',
    corruptPdf:
      'The PDF structure appears damaged, truncated, or incomplete and cannot be processed.',
    fileTooLarge:
      'The selected file or batch exceeds the browser memory limit for this operation.',
    tooManyFiles:
      'Too many files were selected for this operation. Please reduce the queue size.',
    tooManyOutputs:
      'This split would create more output files than the browser memory cap allows. Increase pages per split or select fewer groups.',
    noPagesRemaining:
      'Removing all pages would leave an empty PDF. Keep at least one page.',
    invalidOptions:
      'Please review your page selection or tool options and try again.',
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
