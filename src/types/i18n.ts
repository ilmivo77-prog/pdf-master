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
    tagline: string;
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
  home: {
    heroHeadline: string;
    heroSubheadline: string;
    heroPrimaryCta: string;
    heroSecondaryCta: string;
    toolsSectionTitle: string;
    toolsSectionSubtitle: string;
    categoriesSectionTitle: string;
    categoriesSectionSubtitle: string;
    howItWorksTitle: string;
    howItWorksSubtitle: string;
    howItWorksSteps: {
      stepNumber: string;
      title: string;
      description: string;
    }[];
    howItWorksDisclaimer: string;
    trustSectionTitle: string;
    trustSectionSubtitle: string;
    trustPillars: {
      title: string;
      description: string;
    }[];
  };
  toolsDirectory: {
    pageTitle: string;
    pageSubtitle: string;
    searchPlaceholder: string;
    searchLabel: string;
    allCategoriesFilter: string;
    showingCountLabel: string;
    emptyStateTitle: string;
    emptyStateDescription: string;
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
    validationNoticeText: string;
    processUnavailableNotice: string;
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
