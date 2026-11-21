export type TextDirection = 'ltr' | 'rtl';

export type SupportedLocaleCode = 'en';

export type PlannedLocaleCode =
  | 'en'
  | 'es'
  | 'fr'
  | 'de'
  | 'pt'
  | 'it'
  | 'nl'
  | 'pl'
  | 'ru'
  | 'tr'
  | 'ar'
  | 'ur'
  | 'hi'
  | 'bn'
  | 'id'
  | 'ms'
  | 'vi'
  | 'th'
  | 'ja'
  | 'ko'
  | 'zh-CN'
  | 'zh-TW'
  | 'sv'
  | 'da'
  | 'no'
  | 'fi';

export interface LocaleConfig {
  code: PlannedLocaleCode;
  name: string;
  nativeName: string;
  direction: TextDirection;
  isActive: boolean;
  regionHint?: string;
}

export interface TranslationDictionary {
  brand: {
    name: string;
    shortDescription: string;
    copyright: string;
  };
  nav: {
    home: string;
    allTools: string;
    categories: string;
    about: string;
    contact: string;
    exploreToolsCta: string;
    skipToContent: string;
    languageLabel: string;
    openMenu: string;
    closeMenu: string;
  };
  search: {
    placeholder: string;
    ariaLabel: string;
    noResultsTitle: string;
    noResultsDescription: string;
    browseAllLink: string;
    resultsHint: string;
  };
  home: {
    heroEyebrow: string;
    heroHeadline: string;
    heroSubheadline: string;
    heroPrimaryCta: string;
    heroSecondaryCta: string;
    popularToolsTitle: string;
    popularToolsSubtitle: string;
    viewAllToolsLink: string;
    categoriesSectionTitle: string;
    categoriesSectionSubtitle: string;
    categoryToolSingular: string;
    categoryToolPlural: string;
    featuredToolsTitle: string;
    featuredToolsSubtitle: string;
    openToolCta: string;
    whySectionTitle: string;
    whySectionSubtitle: string;
    whyBenefits: {
      title: string;
      description: string;
      tag?: string;
    }[];
    howItWorksTitle: string;
    howItWorksSubtitle: string;
    howItWorksSteps: {
      stepNumber: string;
      title: string;
      description: string;
    }[];
    howItWorksDisclaimer: string;
    roadmapStripTitle: string;
    roadmapPlannedLabel: string;
    roadmapLiveLabel: string;
    roadmapCategoriesLabel: string;
    faqSectionTitle: string;
    faqSectionSubtitle: string;
    faqItems: {
      id: string;
      question: string;
      answer: string;
    }[];
    finalCtaTitle: string;
    finalCtaDescription: string;
    finalCtaButton: string;
  };
  toolsDirectory: {
    pageTitle: string;
    pageSubtitle: string;
    searchPlaceholder: string;
    searchLabel: string;
    allCategoriesFilter: string;
    availableOnlyLabel: string;
    availableOnlyDescription: string;
    invalidCategoryNotice: string;
    showingCountLabel: string;
    emptyStateTitle: string;
    emptyStateDescription: string;
    emptyAvailableTitle: string;
    emptyAvailableDescription: string;
    clearFiltersCta: string;
    statusPlanned: string;
    statusAvailable: string;
    statusBeta: string;
  };
  toolLanding: {
    breadcrumbHome: string;
    breadcrumbTools: string;
    foundationNoticeTitle: string;
    foundationNoticeBody: string;
    supportedInputsLabel: string;
    supportedOutputsLabel: string;
    executionTargetLabel: string;
    relatedToolsTitle: string;
    backToDirectory: string;
  };
  fileManager: {
    dropzoneTitle: string;
    dropzoneSubtitle: string;
    selectFilesButton: string;
    addMoreButton: string;
    clearAllButton: string;
    removeFileLabel: string;
    acceptedFormatsPrefix: string;
    maxFileSizePrefix: string;
    maxFilesPrefix: string;
    selectedFilesHeading: string;
    validationSuccessText: string;
    processUnavailableNotice: string;
  };
  processing: {
    statusLabels: {
      idle: string;
      validating: string;
      queued: string;
      processing: string;
      succeeded: string;
      failed: string;
      cancelled: string;
    };
    cancelButton: string;
    retryButton: string;
    elapsedLabel: string;
    stageDefaultLabel: string;
    downloadButton: string;
    discardResultsButton: string;
    outputsHeading: string;
    warningsHeading: string;
    statsHeading: string;
    pagesLabel: string;
    protectedLabel: string;
    protectedYes: string;
    protectedNo: string;
    metadataTitleLabel: string;
    metadataProducerLabel: string;
    noOutputsNotice: string;
  };
  processingErrors: {
    invalidFile: string;
    notAPdf: string;
    passwordProtectedPdf: string;
    corruptPdf: string;
    fileTooLarge: string;
    tooManyFiles: string;
    outOfMemory: string;
    workerCrashed: string;
    cancelled: string;
    engineNotFound: string;
    notImplemented: string;
    unknown: string;
  };
  footer: {
    toolsHeading: string;
    companyHeading: string;
    legalHeading: string;
    allToolsLink: string;
    aboutLink: string;
    contactLink: string;
    privacyLink: string;
    termsLink: string;
    freeFirstNote: string;
  };
  pages: {
    aboutTitle: string;
    contactTitle: string;
    privacyTitle: string;
    termsTitle: string;
    notFoundTitle: string;
    notFoundDescription: string;
    notFoundHomeCta: string;
    notFoundToolsCta: string;
  };
}
