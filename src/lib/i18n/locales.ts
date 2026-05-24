export const SUPPORTED_LOCALES = ["fa", "en", "ar"] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "fa";

export function isSupportedLocale(value: string): value is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function localeDirection(locale: AppLocale): "rtl" | "ltr" {
  return locale === "en" ? "ltr" : "rtl";
}

export function localePath(locale: AppLocale, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return normalized;
  return normalized === "/" ? `/${locale}` : `/${locale}${normalized}`;
}

export function stripLocalePrefix(path: string): { locale: AppLocale; path: string } {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const segments = normalized.split("/");
  const first = segments[1] ?? "";
  if (isSupportedLocale(first)) {
    const rest = `/${segments.slice(2).join("/")}`.replace(/\/+/g, "/");
    return { locale: first, path: rest === "/" ? "/" : rest.replace(/\/$/, "") || "/" };
  }
  return { locale: DEFAULT_LOCALE, path: normalized };
}

type LocalizedDictionary = {
  code: AppLocale;
  lang: string;
  dir: "rtl" | "ltr";
  nav: {
    home: string;
    shop: string;
    blog: string;
    about: string;
  };
  common: {
    switchLanguage: string;
    backToMainFa: string;
  };
  pages: {
    home: {
      title: string;
      description: string;
      hero: string;
      lead: string;
      shopCta: string;
      blogCta: string;
      aboutCta: string;
    };
    shop: {
      title: string;
      description: string;
      heading: string;
      subtitle: string;
      browseFaShop: string;
    };
    blog: {
      title: string;
      description: string;
      heading: string;
      subtitle: string;
      readMore: string;
    };
    about: {
      title: string;
      description: string;
      heading: string;
      body: string;
      craftsmanshipTitle: string;
      craftsmanshipBody: string;
    };
  };
};

const EN: LocalizedDictionary = {
  code: "en",
  lang: "en",
  dir: "ltr",
  nav: {
    home: "Home",
    shop: "Shop",
    blog: "Blog",
    about: "About",
  },
  common: {
    switchLanguage: "Language",
    backToMainFa: "Open Persian full experience",
  },
  pages: {
    home: {
      title: "Niloora | Handcrafted Rings",
      description:
        "Handcrafted rings, gemstone stories, and custom atelier services. Explore Niloora in English.",
      hero: "Niloora Handcrafted Jewelry",
      lead:
        "A multilingual foundation is now available. Browse key pages in English while the full Persian storefront remains active.",
      shopCta: "Browse shop highlights",
      blogCta: "Read latest stories",
      aboutCta: "About the atelier",
    },
    shop: {
      title: "Shop | Niloora",
      description: "Discover ring collections and gemstone-focused pieces from Niloora atelier.",
      heading: "Shop Highlights",
      subtitle:
        "Localized storefront foundation for EN/AR is active. Product data is shared across all locales.",
      browseFaShop: "Open full shop experience",
    },
    blog: {
      title: "Blog | Niloora",
      description: "Educational articles on gemstones, craftsmanship, and care guides.",
      heading: "Latest Articles",
      subtitle: "Selected educational stories from Niloora journal.",
      readMore: "Read article",
    },
    about: {
      title: "About | Niloora",
      description: "About Niloora atelier, craftsmanship process, and design philosophy.",
      heading: "About Niloora Atelier",
      body:
        "Niloora combines Persian craftsmanship heritage with modern jewelry direction. Every piece is handcrafted with quality controls from sketch to final polish.",
      craftsmanshipTitle: "Craftsmanship Process",
      craftsmanshipBody:
        "Consultation, ring construction, stone setting, engraving, and final quality control are performed in the atelier workflow.",
    },
  },
};

const AR: LocalizedDictionary = {
  code: "ar",
  lang: "ar",
  dir: "rtl",
  nav: {
    home: "الرئيسية",
    shop: "المتجر",
    blog: "المدونة",
    about: "من نحن",
  },
  common: {
    switchLanguage: "اللغة",
    backToMainFa: "فتح النسخة الفارسية الكاملة",
  },
  pages: {
    home: {
      title: "نيلورا | خواتم مصنوعة يدويًا",
      description:
        "خواتم مصنوعة يدويًا وقصص الأحجار الكريمة وخدمات التصميم المخصص في نيلورا.",
      hero: "نيلورا للمجوهرات اليدوية",
      lead:
        "تم تفعيل البنية الأساسية متعددة اللغات. يمكنك تصفح الصفحات الرئيسية بالعربية مع بقاء المتجر الفارسي الكامل.",
      shopCta: "استعراض أبرز المنتجات",
      blogCta: "قراءة أحدث المقالات",
      aboutCta: "التعرّف على الورشة",
    },
    shop: {
      title: "المتجر | نيلورا",
      description: "اكتشف مجموعات الخواتم والقطع المعتمدة على الأحجار الكريمة في نيلورا.",
      heading: "أبرز منتجات المتجر",
      subtitle:
        "تم تفعيل أساس الواجهة متعددة اللغات للإنجليزية والعربية، مع مشاركة بيانات المنتجات بين جميع اللغات.",
      browseFaShop: "فتح تجربة المتجر الكاملة",
    },
    blog: {
      title: "المدونة | نيلورا",
      description: "مقالات تعليمية عن الأحجار الكريمة والحرفية والعناية بالمجوهرات.",
      heading: "أحدث المقالات",
      subtitle: "محتوى تعليمي مختار من مجلة نيلورا.",
      readMore: "قراءة المقال",
    },
    about: {
      title: "من نحن | نيلورا",
      description: "تعرف على ورشة نيلورا وخطوات التصنيع وفلسفة التصميم.",
      heading: "عن ورشة نيلورا",
      body:
        "تجمع نيلورا بين إرث الصياغة الفارسية والرؤية المعاصرة للتصميم. كل قطعة تُصنع يدويًا وفق معايير جودة دقيقة.",
      craftsmanshipTitle: "مراحل الحرفة",
      craftsmanshipBody:
        "الاستشارة، تشكيل الخاتم، تثبيت الحجر، النقش، ثم الفحص النهائي ضمن سير عمل الورشة.",
    },
  },
};

export function getLocaleDictionary(locale: AppLocale): LocalizedDictionary {
  if (locale === "en") return EN;
  if (locale === "ar") return AR;
  // FA uses the existing full translation system in the non-prefixed routes.
  return EN;
}
