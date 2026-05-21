import { PRODUCT_LISTINGS } from "../src/lib/products/listings";
import { PRODUCT_GALLERY_IMAGES, pickSiteImageByKey } from "../src/lib/images";
import { fa } from "../src/lib/i18n/fa";
import {
  homeFallbackTestimonials,
  homeFallbackInstagramPosts,
} from "../src/lib/home-static";

export const seedCollections = [
  {
    id: "royal-heritage",
    name: fa.collections["royal-heritage"].name,
    namePersian: fa.collections["royal-heritage"].persian,
  },
  {
    id: "ancient-dynasty",
    name: fa.collections["ancient-dynasty"].name,
    namePersian: fa.collections["ancient-dynasty"].persian,
  },
  {
    id: "modern-nobility",
    name: fa.collections["modern-nobility"].name,
    namePersian: fa.collections["modern-nobility"].persian,
  },
] as const;

export type SeedProduct = {
  id: string;
  name: string;
  namePersian: string;
  price: number;
  listPrice?: number;
  discountPercent?: number;
  category: "solitaire" | "halo" | "vintage" | "signet" | "eternity" | "stackable";
  metal: "sterling" | "oxidized" | "rhodium" | "matte-silver";
  stone:
    | "diamond"
    | "emerald"
    | "sapphire"
    | "ruby"
    | "turquoise"
    | "onyx"
    | "zabarjad"
    | "yemen-aqeeq"
    | "durr-najaf"
    | "moral";
  stoneShape: "round" | "oval" | "cushion" | "princess" | "pear" | "marquise";
  engravingType: "nastaliq" | "naskh" | "thuluth" | "kufic" | "modern" | "none";
  availability: "ready" | "preorder" | "sold" | "luxury" | "made-to-order";
  featured?: boolean;
  bestseller?: boolean;
  initialSalesCount?: number;
  collectionId?: "royal-heritage" | "ancient-dynasty" | "modern-nobility";
  condition?: "new" | "pre-owned";
  preOwned?: {
    originalPrice: number;
    depreciationPercent: number;
    grade: "excellent" | "very-good" | "good";
    certifiedRefurbished: boolean;
    canRemake: boolean;
    buybackRatePercent: number;
    story?: string;
  };
};

export const seedProducts: SeedProduct[] = [
  {
    id: "shiraz-solitaire",
    name: "تک‌نگین الماس «شیراز»",
    namePersian: "مجموعه میراث سلطنتی",
    price: 124_000_000,
    listPrice: 155_000_000,
    discountPercent: 20,
    category: "solitaire",
    metal: "sterling",
    stone: "diamond",
    stoneShape: "round",
    engravingType: "nastaliq",
    availability: "ready",
    featured: true,
    bestseller: true,
    initialSalesCount: 47,
    collectionId: "royal-heritage",
  },
  {
    id: "isfahan-halo",
    name: "هاله‌نگین «اصفهان»",
    namePersian: "مجموعه میراث سلطنتی",
    price: 189_000_000,
    listPrice: 210_000_000,
    discountPercent: 10,
    category: "halo",
    metal: "oxidized",
    stone: "turquoise",
    stoneShape: "oval",
    engravingType: "thuluth",
    availability: "preorder",
    featured: true,
    initialSalesCount: 31,
    collectionId: "royal-heritage",
  },
  {
    id: "persepolis-vintage",
    name: "زمرد «تخت‌جمشید»",
    namePersian: "مجموعه دودمان کهن",
    price: 221_000_000,
    listPrice: 260_000_000,
    discountPercent: 15,
    category: "vintage",
    metal: "rhodium",
    stone: "emerald",
    stoneShape: "cushion",
    engravingType: "kufic",
    availability: "sold",
    bestseller: true,
    initialSalesCount: 18,
    collectionId: "ancient-dynasty",
  },
  {
    id: "caspian-eternity",
    name: "ردیف ابدیت «خزر»",
    namePersian: "مجموعه دودمان کهن",
    price: 158_000_000,
    listPrice: 178_000_000,
    discountPercent: 11,
    category: "eternity",
    metal: "rhodium",
    stone: "sapphire",
    stoneShape: "round",
    engravingType: "none",
    availability: "ready",
    initialSalesCount: 26,
    collectionId: "ancient-dynasty",
  },
  {
    id: "tabriz-signet",
    name: "انگشتر مُهر «تبریز»",
    namePersian: "مجموعه نجیب‌زادگی معاصر",
    price: 89_000_000,
    listPrice: 99_000_000,
    discountPercent: 10,
    category: "signet",
    metal: "sterling",
    stone: "onyx",
    stoneShape: "cushion",
    engravingType: "naskh",
    availability: "made-to-order",
    initialSalesCount: 42,
    collectionId: "modern-nobility",
  },
  {
    id: "yazd-ruby",
    name: "تک‌نگین یاقوت «یزد»",
    namePersian: "مجموعه نجیب‌زادگی معاصر",
    price: 142_000_000,
    listPrice: 168_000_000,
    discountPercent: 15,
    category: "solitaire",
    metal: "oxidized",
    stone: "ruby",
    stoneShape: "pear",
    engravingType: "nastaliq",
    availability: "luxury",
    bestseller: true,
    initialSalesCount: 22,
    collectionId: "modern-nobility",
  },
  {
    id: "kashan-stack",
    name: "ردیف چندتایی «کاشان»",
    namePersian: "مجموعه نجیب‌زادگی معاصر",
    price: 62_000_000,
    listPrice: 72_000_000,
    discountPercent: 14,
    category: "stackable",
    metal: "matte-silver",
    stone: "diamond",
    stoneShape: "round",
    engravingType: "modern",
    availability: "preorder",
    initialSalesCount: 38,
    collectionId: "modern-nobility",
  },
  {
    id: "tehran-diamond",
    name: "الماس پرنسسی «تهران»",
    namePersian: "مجموعه میراث سلطنتی",
    price: 285_000_000,
    listPrice: 335_000_000,
    discountPercent: 15,
    category: "solitaire",
    metal: "rhodium",
    stone: "diamond",
    stoneShape: "princess",
    engravingType: "thuluth",
    availability: "sold",
    featured: true,
    initialSalesCount: 12,
    collectionId: "royal-heritage",
  },
  {
    id: "po-shiraz-solitaire",
    name: "تک‌نگین «شیراز» — دست‌دوم",
    namePersian: fa.preOwned.collectionLabel,
    price: 78_000_000,
    listPrice: 124_000_000,
    discountPercent: 37,
    category: "solitaire",
    metal: "sterling",
    stone: "diamond",
    stoneShape: "round",
    engravingType: "nastaliq",
    availability: "ready",
    condition: "pre-owned",
    initialSalesCount: 3,
    preOwned: {
      originalPrice: 124_000_000,
      depreciationPercent: 37,
      grade: "excellent",
      certifiedRefurbished: true,
      canRemake: true,
      buybackRatePercent: 58,
      story: "یک‌بار در مالکیت خصوصی؛ بازبینی کامل رکاب و نگین‌نشانی.",
    },
  },
  {
    id: "po-persepolis-vintage",
    name: "زمرد «تخت‌جمشید» — دست‌دوم",
    namePersian: fa.preOwned.collectionLabel,
    price: 142_000_000,
    listPrice: 221_000_000,
    discountPercent: 36,
    category: "vintage",
    metal: "oxidized",
    stone: "emerald",
    stoneShape: "cushion",
    engravingType: "kufic",
    availability: "ready",
    condition: "pre-owned",
    initialSalesCount: 1,
    preOwned: {
      originalPrice: 221_000_000,
      depreciationPercent: 36,
      grade: "very-good",
      certifiedRefurbished: true,
      canRemake: true,
      buybackRatePercent: 55,
    },
  },
  {
    id: "po-isfahan-halo",
    name: "هاله‌نگین «اصفهان» — دست‌دوم",
    namePersian: fa.preOwned.collectionLabel,
    price: 118_000_000,
    listPrice: 189_000_000,
    discountPercent: 38,
    category: "halo",
    metal: "oxidized",
    stone: "turquoise",
    stoneShape: "oval",
    engravingType: "thuluth",
    availability: "ready",
    condition: "pre-owned",
    featured: true,
    preOwned: {
      originalPrice: 189_000_000,
      depreciationPercent: 38,
      grade: "excellent",
      certifiedRefurbished: true,
      canRemake: true,
      buybackRatePercent: 56,
    },
  },
  {
    id: "po-kashan-stack",
    name: "ردیف «کاشان» — دست‌دوم",
    namePersian: fa.preOwned.collectionLabel,
    price: 39_000_000,
    listPrice: 62_000_000,
    discountPercent: 37,
    category: "stackable",
    metal: "matte-silver",
    stone: "diamond",
    stoneShape: "round",
    engravingType: "modern",
    availability: "ready",
    condition: "pre-owned",
    preOwned: {
      originalPrice: 62_000_000,
      depreciationPercent: 37,
      grade: "good",
      certifiedRefurbished: true,
      canRemake: true,
      buybackRatePercent: 52,
    },
  },
];

export function getSeedListing(productId: string) {
  return PRODUCT_LISTINGS[productId];
}

export function getSeedImage(productId: string) {
  return pickSiteImageByKey(productId);
}

export function getSeedGalleryImages() {
  return PRODUCT_GALLERY_IMAGES;
}

export const seedTestimonials = homeFallbackTestimonials;
export const seedInstagramPosts = homeFallbackInstagramPosts;
