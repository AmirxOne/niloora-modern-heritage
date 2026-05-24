import { fa } from "@/lib/i18n/fa";
import type { ProductOccasion, RingStyle, StoneType } from "@/lib/types";

export type ShopLandingFacet = "stone" | "style" | "occasion";

const STONE_VALUES: StoneType[] = [
  "diamond",
  "emerald",
  "sapphire",
  "ruby",
  "turquoise",
  "onyx",
  "zabarjad",
  "yemen-aqeeq",
  "durr-najaf",
  "moral",
];

const STYLE_VALUES: RingStyle[] = [
  "solitaire",
  "halo",
  "vintage",
  "signet",
  "eternity",
  "stackable",
];

const OCCASION_VALUES: ProductOccasion[] = [
  "engagement",
  "wedding",
  "anniversary",
  "birthday",
  "gift",
  "eid",
  "religious",
  "graduation",
  "everyday",
];

function isInList<T extends string>(value: string, list: readonly T[]): value is T {
  return (list as readonly string[]).includes(value);
}

export function isShopLandingFacet(value: string): value is ShopLandingFacet {
  return value === "stone" || value === "style" || value === "occasion";
}

export function parseShopLandingSlug(
  facet: ShopLandingFacet,
  slug: string
): StoneType | RingStyle | ProductOccasion | null {
  if (facet === "stone") return isInList(slug, STONE_VALUES) ? slug : null;
  if (facet === "style") return isInList(slug, STYLE_VALUES) ? slug : null;
  return isInList(slug, OCCASION_VALUES) ? slug : null;
}

export function listShopLandingParams(): Array<{ facet: ShopLandingFacet; slug: string }> {
  return [
    ...STONE_VALUES.map((slug) => ({ facet: "stone" as const, slug })),
    ...STYLE_VALUES.map((slug) => ({ facet: "style" as const, slug })),
    ...OCCASION_VALUES.map((slug) => ({ facet: "occasion" as const, slug })),
  ];
}

export function shopLandingPath(facet: ShopLandingFacet, slug: string): string {
  return `/shop/${facet}/${slug}`;
}

export function shopLandingLabel(facet: ShopLandingFacet, value: StoneType | RingStyle | ProductOccasion): string {
  if (facet === "stone") return fa.stones[value as StoneType];
  if (facet === "style") return fa.shop.styles[value as RingStyle];
  return fa.occasions[value as ProductOccasion];
}

export function shopLandingSeoCopy(
  facet: ShopLandingFacet,
  value: StoneType | RingStyle | ProductOccasion
): { title: string; description: string; intro: string } {
  const label = shopLandingLabel(facet, value);
  if (facet === "stone") {
    return {
      title: `خرید انگشتر ${label}`,
      description: `مدل‌های منتخب انگشتر با سنگ ${label} در گالری نیلورا. مقایسه قیمت، مشاهده موجودی و انتخاب آنلاین با ارسال امن.`,
      intro: `در این صفحه، مجموعه‌ای از انگشترهای دارای سنگ ${label} را می‌بینید. برای انتخاب دقیق‌تر می‌توانید قیمت، سبک و وضعیت تحویل را همزمان مقایسه کنید.`,
    };
  }
  if (facet === "style") {
    return {
      title: `انگشتر سبک ${label}`,
      description: `مدل‌های انگشتر با سبک ${label} در گالری نیلورا. مشاهده طراحی‌ها، انتخاب نگین و بررسی گزینه‌های متناسب با بودجه.`,
      intro: `اگر به سبک ${label} علاقه دارید، این صفحه بهترین مدل‌های همین سبک را یکجا نمایش می‌دهد تا سریع‌تر انتخاب کنید.`,
    };
  }
  return {
    title: `انگشتر مناسب ${label}`,
    description: `پیشنهاد انگشتر مناسب ${label} در گالری نیلورا. مجموعه‌ای از مدل‌های منتخب برای هدیه یا مناسبت شما با فیلترهای کاربردی.`,
    intro: `برای ${label}، این لندینگ محصولات هماهنگ با این مناسبت را یکجا نمایش می‌دهد تا در زمان کوتاه به گزینه مناسب برسید.`,
  };
}
