import type {TranslationDictionary} from '../../types/i18n';

export const EN_COMMON_DICTIONARY: TranslationDictionary = {
  brand: {
    name: 'PDF Master',
    tagline: 'All Your PDF Tools. One Simple Platform.',
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
  home: {
    heroHeadline: 'All Your PDF Tools. One Simple Platform.',
    heroSubheadline:
      'Merge, split, compress, convert, edit, and manage your PDF files with simple online tools.',
    heroPrimaryCta: 'Explore PDF Tools',
    heroSecondaryCta: 'Browse All Tools',
    toolsSectionTitle: 'Core PDF Tools',
    toolsSectionSubtitle:
      'Initial tool routes established in the central registry. Each tool has a dedicated URL and file validation workflow ready for upcoming processing engines.',
    categoriesSectionTitle: 'Eight Planned Tool Categories',
    categoriesSectionSubtitle:
      'Structured to scale cleanly from everyday document tasks to OCR, extraction, and AI-assisted workflows.',
    howItWorksTitle: 'How PDF Master Works',
    howItWorksSubtitle:
      'A consistent three-step workflow designed to keep every document tool predictable and easy to use.',
    howItWorksSteps: [
      {
        stepNumber: '01',
        title: 'Upload your file.',
        description:
          'Select or drag documents into the tool dropzone. Client-side checks verify file extensions, MIME types, and size limits immediately.',
      },
      {
        stepNumber: '02',
        title: 'Choose your PDF operation.',
        description:
          'Configure page order, compression preferences, output format, or orientation options tailored to the tool.',
      },
      {
        stepNumber: '03',
        title: 'Download your processed file.',
        description:
          'Retrieve your output cleanly once processing engines are enabled in upcoming platform milestones.',
      },
    ],
    howItWorksDisclaimer:
      'Platform stage: Milestone 1 provides the application architecture, tool routes, and client-side file validation. Individual PDF processing engines are scheduled for upcoming milestones.',
    trustSectionTitle: 'Built with a Privacy-First Architecture',
    trustSectionSubtitle:
      'Designed around clear data boundaries, transparent platform capabilities, and zero unnecessary data collection.',
    trustPillars: [
      {
        title: 'No Unnecessary File Storage',
        description:
          'In the current foundation release, selected files remain strictly in your browser memory for local validation and are never uploaded to remote servers.',
      },
      {
        title: 'Client-Side Processing Priority',
        description:
          'Where practical, upcoming milestones prioritize browser-based execution for operations like merging, splitting, and rotating before introducing server-side workers.',
      },
      {
        title: 'Honest Capabilities & Limits',
        description:
          'We state exact accepted file formats, size boundaries, and current tool readiness without exaggerated claims or hidden paywalls.',
      },
    ],
  },
  toolsDirectory: {
    pageTitle: 'All PDF Tools',
    pageSubtitle:
      'Browse the centralized PDF Master tool catalog. Search by task or filter across the eight platform categories.',
    searchPlaceholder: 'Search tools (e.g., merge, compress, Word, JPG)...',
    searchLabel: 'Search PDF tools',
    allCategoriesFilter: 'All Categories',
    showingCountLabel: 'tools matching current filter',
    emptyStateTitle: 'No matching tools found',
    emptyStateDescription:
      'Try adjusting your search keywords or switching back to all categories.',
    clearFiltersCta: 'Reset Filters',
    statusPlanned: 'Coming soon',
    statusAvailable: 'Available',
    statusBeta: 'Beta',
  },
  toolLanding: {
    breadcrumbHome: 'Home',
    breadcrumbTools: 'All PDF Tools',
    foundationNoticeTitle: 'Milestone 1 Tool Foundation',
    foundationNoticeBody:
      'This dedicated landing page and file validation workflow are active. The underlying PDF processing engine for this operation will be integrated in an upcoming milestone—no files are uploaded or falsely processed.',
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
    validationNoticeText: 'Local validation passed. Server upload is disabled in Milestone 1.',
    processUnavailableNotice:
      'Processing execution is not enabled yet in Milestone 1. Your files passed validation and were not sent anywhere.',
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
