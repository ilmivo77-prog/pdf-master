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
    useToolCta: string;
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
    livePrivacyNotice: string;
  };
  fileManager: {
    dropzoneTitle: string;
    dropzoneSubtitle: string;
    liveDropzoneTitle: string;
    liveDropzoneSubtitle: string;
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
  workspace: {
    queueHeading: string;
    inspectingLabel: string;
    inspectErrorFallback: string;
    pagesUnitSingular: string;
    pagesUnitPlural: string;
    totalPagesLabel: string;
    moveUpLabel: string;
    moveDownLabel: string;
    memoryNotice: string;
    merge: {
      heading: string;
      helperText: string;
      minFilesWarning: string;
      runButton: string;
    };
    split: {
      heading: string;
      modeLabel: string;
      modeRangesLabel: string;
      modeRangesDesc: string;
      modeEveryNLabel: string;
      modeEveryNDesc: string;
      modeEveryPageLabel: string;
      modeEveryPageDesc: string;
      rangesInputLabel: string;
      rangesPlaceholder: string;
      rangesExamples: string;
      everyNInputLabel: string;
      everyNInvalid: string;
      summaryOneOutput: string;
      summaryManyPrefix: string;
      summaryManySuffix: string;
      tooManyOutputsPrefix: string;
      tooManyOutputsSuffix: string;
      runButton: string;
    };
    extract: {
      heading: string;
      rangesInputLabel: string;
      rangesPlaceholder: string;
      rangesExamples: string;
      summaryPrefix: string;
      summarySuffix: string;
      runButton: string;
    };
    remove: {
      heading: string;
      rangesInputLabel: string;
      rangesPlaceholder: string;
      rangesExamples: string;
      summaryPrefix: string;
      summaryMiddle: string;
      summarySuffix: string;
      removeAllError: string;
      runButton: string;
    };
    organize: {
      heading: string;
      helperText: string;
      selectAllButton: string;
      clearSelectionButton: string;
      rotateSelectedLeftButton: string;
      rotateSelectedRightButton: string;
      deleteSelectedButton: string;
      restoreAllButton: string;
      reverseOrderButton: string;
      resetOrderButton: string;
      summaryKeptSingular: string;
      summaryKeptPlural: string;
      summaryRemovedLabel: string;
      summarySelectedLabel: string;
      emptyResultError: string;
      largeDocNotice: string;
      hardCapNotice: string;
      libraryFailedNotice: string;
      thumbnailsLoadingNotice: string;
      pageLabel: string;
      removedBadge: string;
      selectPageLabel: string;
      moveEarlierLabel: string;
      moveLaterLabel: string;
      rotateLeftLabel: string;
      rotateRightLabel: string;
      deletePageLabel: string;
      restorePageLabel: string;
      runButton: string;
    };
    pageRangeErrors: {
      EMPTY_INPUT: string;
      INPUT_TOO_LONG: string;
      INVALID_PAGE_COUNT: string;
      INVALID_SYNTAX: string;
      ZERO_OR_NEGATIVE_PAGE: string;
      REVERSED_RANGE: string;
      PAGE_OUT_OF_RANGE: string;
    };
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
    downloadAllZipButton: string;
    discardResultsButton: string;
    startOverButton: string;
    outputsHeading: string;
    outputCountLabel: string;
    warningsHeading: string;
    statsHeading: string;
    pagesLabel: string;
    protectedLabel: string;
    protectedYes: string;
    protectedNo: string;
    metadataTitleLabel: string;
    metadataProducerLabel: string;
    noOutputsNotice: string;
    interactiveFeaturesNote: string;
    visualVerificationAdvice: string;
  };
  processingErrors: {
    invalidFile: string;
    notAPdf: string;
    passwordProtectedPdf: string;
    corruptPdf: string;
    fileTooLarge: string;
    tooManyFiles: string;
    tooManyOutputs: string;
    noPagesRemaining: string;
    invalidOptions: string;
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
