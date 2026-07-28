export type Locale = "en" | "ru" | "he";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Dictionary {
  hero: {
    subtitle: string;
    titleLine1: string;
    titleLine2: string;
    description: string;
    shopAll: string;
    sellTrade: string;
    badgeAuthentic: string;
    badgeIsrael: string;
    photoAlt: string;
  };
  stats: {
    fastShippingTitle: string;
    fastShippingDesc: string;
    competitivePricesTitle: string;
    competitivePricesDesc: string;
    authenticityTitle: string;
    authenticityDesc: string;
  };
  announcement: {
    freeShipping: string;
    authenticity: string;
    newDrops: string;
  };
  header: {
    allDrops: string;
    madeToOrder: string;
    brandNew: string;
    brands: string;
    aboutUs: string;
    sellTrade: string;
    openCart: string;
    toggleMenu: string;
    instagram: string;
    account: string;
  };
  categories: {
    sneakers: string;
    clothing: string;
    accessories: string;
  };
  catalog: {
    newestArrivals: string;
    shopLatest: string;
    theDrops: string;
    all: string;
    allBrands: string;
    shopByBrand: string;
    searchPlaceholder: string;
    allSizes: string;
    sortByPrice: string;
    sortLowToHigh: string;
    sortHighToLow: string;
    noResults: string;
    madeToOrderTitle: string;
    madeToOrderIntro: string;
    brandNewTitle: string;
    brandNewIntro: string;
  };
  cart: {
    title: string;
    empty: string;
    size: string;
    oneSize: string;
    subtotal: string;
    checkout: string;
    close: string;
    added: string;
    selectSize: string;
  };
  product: {
    condition: string;
    brand: string;
    selectSize: string;
    outOfStock: string;
    contactForSize: string;
    addToCart: string;
    orderWhatsApp: string;
    statusNewDrop: string;
    statusReserved: string;
    statusSold: string;
    statusMadeToOrder: string;
    statusBrandNew: string;
  };
  account: {
    signIn: string;
    signInHelp: string;
    email: string;
    password: string;
    confirmPassword: string;
    loginButton: string;
    invalidCredentials: string;
    noAccount: string;
    createAccount: string;
    registerTitle: string;
    registerHelp: string;
    registerButton: string;
    haveAccount: string;
    passwordRequirements: string;
    passwordsMismatch: string;
    forgotPassword: string;
    forgotTitle: string;
    forgotHelp: string;
    sendResetLink: string;
    resetSent: string;
    resetTitle: string;
    resetHelp: string;
    newPassword: string;
    resetButton: string;
    resetSuccess: string;
    invalidResetLink: string;
    backToLogin: string;
    wait: string;
    configError: string;
    title: string;
    signOut: string;
    loading: string;
    profile: string;
    name: string;
    phone: string;
    save: string;
    saving: string;
    favorites: string;
    noFavorites: string;
    shop: string;
    orders: string;
    noOrders: string;
    oneSize: string;
    total: string;
  };
  footer: {
    style: string;
    dark: string;
    light: string;
    privacy: string;
    faq: string;
    cart: string;
    shopTitle: string;
    infoTitle: string;
    contactTitle: string;
    tagline: string;
    rights: string;
  };
  consent: {
    text: string;
    privacy: string;
    accept: string;
  };
  sellTrade: {
    title: string;
    intro: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
    portalTitle: string;
    category: string;
    selectCategory: string;
    sneakers: string;
    clothing: string;
    accessories: string;
    brandModel: string;
    size: string;
    condition: string;
    wantedPrice: string;
    notes: string;
    submit: string;
    required: string;
    close: string;
  };
  faq: {
    title: string;
    close: string;
    items: FaqItem[];
  };
  about: {
    title: string;
    backLink: string;
    lead: string;
    paragraphs: string[];
    photoAlt: string;
    contactsTitle: string;
    locationTitle: string;
    openInMaps: string;
    instagramHandle: string;
  };
}
