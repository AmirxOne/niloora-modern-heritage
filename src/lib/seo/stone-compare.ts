import { absoluteUrl, buildPageMetadata } from "@/lib/seo/site";
import { getStoneGuideBySlug, listStoneGuides } from "@/lib/stones";
import type { StoneType } from "@/lib/types";
import { buildBreadcrumbJsonLd, buildFaqJsonLd } from "@/lib/seo/structured-data";
import { fa } from "@/lib/i18n/fa";

export type StoneCompareData = {
  leftSlug: string;
  rightSlug: string;
  leftName: string;
  rightName: string;
  leftCoreStone: StoneType | null;
  rightCoreStone: StoneType | null;
  title: string;
  description: string;
  path: string;
  intro: string;
  differences: string[];
  useCases: string[];
  faqs: Array<{ question: string; answer: string }>;
};

type PairPreset = {
  key: `${string}--${string}`;
  intro: (left: string, right: string) => string;
  differences: (left: string, right: string) => string[];
  useCases: (left: string, right: string) => string[];
  faqs: (left: string, right: string) => Array<{ question: string; answer: string }>;
};

const PRESETS: PairPreset[] = [
  {
    key: "peridot-zabarjad--turquoise-neishabur",
    intro: (left, right) =>
      `اگر بین ${left} و ${right} مردد هستید، این مقایسه سریع به شما کمک می‌کند بدانید کدام سنگ با سبک پوشش و انتظار شما از انگشتر هماهنگ‌تر است.`,
    differences: (left, right) => [
      `${left} معمولاً جلوه سبز زنده‌تری دارد، در حالی که ${right} حس سنتی و اصیل ایرانی را پررنگ‌تر منتقل می‌کند.`,
      `${right} برای استایل‌های کلاسیک و معنوی انتخاب پرتکرار است؛ ${left} بیشتر برای ظاهر تازه و مدرن توصیه می‌شود.`,
      `در نگهداری روزمره، هر دو نیاز به مراقبت ملایم دارند اما ${right} نسبت به مواد شیمیایی حساس‌تر است.`,
    ],
    useCases: (left, right) => [
      `برای هدیه با حس «اصالت ایرانی»، ${right} انتخاب مطمئن‌تری است.`,
      `برای استایل روزانه با انرژی رنگی، ${left} جذاب‌تر است.`,
      `اگر دنبال سنگ معنوی رایج هستید، ${right} بیشتر شناخته‌شده است.`,
    ],
    faqs: (left, right) => [
      {
        question: `برای استفاده روزمره ${left} بهتر است یا ${right}؟`,
        answer:
          `هر دو قابل استفاده روزمره هستند، اما انتخاب نهایی به سبک پوشش و سطح مراقبت شما بستگی دارد. برای دوام ظاهری، تماس با مواد شوینده را محدود کنید.`,
      },
      {
        question: `برای هدیه رسمی کدام انتخاب مناسب‌تر است؟`,
        answer:
          `اگر گیرنده هدیه سبک سنتی و مذهبی را می‌پسندد، ${right} معمولاً مناسب‌تر است؛ برای ظاهر جوان‌تر و رنگی‌تر، ${left} گزینه خوبی است.`,
      },
      {
        question: `کدام سنگ حس لوکس‌تری در قاب انگشتر ایجاد می‌کند؟`,
        answer:
          `این موضوع به طراحی رکاب و کیفیت تراش هم وابسته است، اما در بسیاری از مدل‌ها ${left} به‌دلیل طیف رنگی خاص، جلوه مدرن‌تری می‌دهد.`,
      },
    ],
  },
];

function normalizedPair(a: string, b: string): `${string}--${string}` {
  const [left, right] = [a, b].sort((x, y) => x.localeCompare(y, "fa"));
  return `${left}--${right}`;
}

function coreNameBySlug(slug: string): string {
  const guide = getStoneGuideBySlug(slug);
  if (!guide) return slug;
  return guide.name;
}

function fallbackCompareData(
  leftSlug: string,
  rightSlug: string
): Omit<StoneCompareData, "path" | "title" | "description" | "leftCoreStone" | "rightCoreStone"> {
  const leftName = coreNameBySlug(leftSlug);
  const rightName = coreNameBySlug(rightSlug);
  return {
    leftSlug,
    rightSlug,
    leftName,
    rightName,
    intro: `مقایسه ${leftName} و ${rightName} برای انتخاب دقیق‌تر انگشتر بر اساس سبک، نگهداری و کاربرد روزانه.`,
    differences: [
      `${leftName} و ${rightName} از نظر جلوه رنگی و حس استایل متفاوت هستند.`,
      `نوع استفاده (روزمره/مناسبتی) در انتخاب بین این دو سنگ اهمیت زیادی دارد.`,
      `برای تصمیم بهتر، سبک رکاب و بودجه را هم در کنار جنس سنگ بررسی کنید.`,
    ],
    useCases: [
      `برای هدیه، سنگی را انتخاب کنید که با شخصیت دریافت‌کننده هماهنگ باشد.`,
      `برای استفاده روزانه، نگهداری و مقاومت سنگ را در نظر بگیرید.`,
      `در استایل رسمی، ترکیب رنگ سنگ با فلز رکاب نقش اصلی را دارد.`,
    ],
    faqs: [
      {
        question: `چطور بین ${leftName} و ${rightName} تصمیم بگیرم؟`,
        answer:
          "ابتدا سبک ظاهری موردنظر، میزان استفاده روزمره و سطح نگهداری قابل‌قبول خود را مشخص کنید و سپس گزینه‌ها را در فروشگاه فیلتر کنید.",
      },
      {
        question: "آیا می‌توان این دو سنگ را با یک سبک رکاب مقایسه کرد؟",
        answer:
          "بله، بهترین روش این است که در فروشگاه سبک رکاب را ثابت نگه دارید و فقط نوع سنگ را تغییر دهید تا تفاوت واقعی مشخص شود.",
      },
    ],
  };
}

export function resolveStoneCompareData(leftSlug: string, rightSlug: string): StoneCompareData | null {
  if (!leftSlug || !rightSlug || leftSlug === rightSlug) return null;
  const left = getStoneGuideBySlug(leftSlug);
  const right = getStoneGuideBySlug(rightSlug);
  if (!left || !right) return null;

  const key = normalizedPair(leftSlug, rightSlug);
  const preset = PRESETS.find((item) => item.key === key);
  const core = preset
    ? {
        leftSlug,
        rightSlug,
        leftName: left.name,
        rightName: right.name,
        leftCoreStone: left.coreStone ?? null,
        rightCoreStone: right.coreStone ?? null,
        intro: preset.intro(left.name, right.name),
        differences: preset.differences(left.name, right.name),
        useCases: preset.useCases(left.name, right.name),
        faqs: preset.faqs(left.name, right.name),
      }
    : {
        ...fallbackCompareData(leftSlug, rightSlug),
        leftCoreStone: left.coreStone ?? null,
        rightCoreStone: right.coreStone ?? null,
      };

  const path = `/compare/stone/${leftSlug}-vs-${rightSlug}`;
  const title = `مقایسه ${core.leftName} با ${core.rightName}`;
  const description = `راهنمای کامل مقایسه ${core.leftName} و ${core.rightName} برای انتخاب انگشتر: تفاوت ظاهری، کاربرد، نگهداری و پیشنهاد خرید.`;

  return {
    ...core,
    path,
    title,
    description,
  };
}

export function listStoneCompareParams(): Array<{ pair: string }> {
  const guides = listStoneGuides();
  const pairs: Array<{ pair: string }> = [];
  const seen = new Set<string>();

  const featuredPair = resolveStoneCompareData("peridot-zabarjad", "turquoise-neishabur");
  if (featuredPair) {
    const pair = `${featuredPair.leftSlug}-vs-${featuredPair.rightSlug}`;
    seen.add(pair);
    pairs.push({ pair });
  }

  for (let i = 0; i < guides.length; i += 1) {
    for (let j = i + 1; j < guides.length; j += 1) {
      if (pairs.length >= 40) break;
      const left = guides[i];
      const right = guides[j];
      const pair = `${left.slug}-vs-${right.slug}`;
      if (seen.has(pair)) continue;
      seen.add(pair);
      pairs.push({ pair });
    }
    if (pairs.length >= 40) break;
  }

  return pairs;
}

export function parseStoneComparePair(pair: string): { leftSlug: string; rightSlug: string } | null {
  const parts = pair.split("-vs-");
  if (parts.length !== 2) return null;
  const leftSlug = parts[0]?.trim();
  const rightSlug = parts[1]?.trim();
  if (!leftSlug || !rightSlug) return null;
  return { leftSlug, rightSlug };
}

export function buildStoneCompareMetadata(data: StoneCompareData) {
  return buildPageMetadata({
    title: data.title,
    description: data.description,
    path: data.path,
  });
}

export function buildStoneCompareJsonLd(data: StoneCompareData) {
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "خانه", path: "/" },
    { name: "دانشنامه سنگ‌ها", path: "/stones" },
    { name: data.title, path: data.path },
  ]);

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: data.title,
    description: data.description,
    inLanguage: "fa-IR",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(data.path),
    },
    author: {
      "@type": "Organization",
      name: fa.brand.name,
    },
  };

  const faq = buildFaqJsonLd(data.faqs);
  return [article, breadcrumb, faq];
}
