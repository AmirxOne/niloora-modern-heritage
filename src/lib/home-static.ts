import { fa } from "@/lib/i18n/fa";
import { pickSiteImage } from "@/lib/images";

export const homeFallbackCollections = [
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
];

export const homeFallbackTestimonials = [
  {
    id: "1",
    name: "لیلا احمدی",
    location: "دبی، امارات",
    text: "حلقهٔ عروسی ما با استاندارد کارگاه ساخته شد؛ از انتخاب نگین تا خوشنویسی روی رکاب، همه‌چیز شفاف و دقیق بود.",
    rating: 5,
  },
  {
    id: "2",
    name: "جیمز ویتفیلد",
    location: "لندن، انگلستان",
    text: "سفارشی‌سازی انگشتر در ابراهیم آذری تجربه‌ای نزدیک به سفارش حضوری در کارگاه بود — قیود فنی و سازگاری گزینه‌ها بسیار حرفه‌ای است.",
    rating: 5,
  },
  {
    id: "3",
    name: "سارا کریمی",
    location: "لس‌آنجلس، آمریکا",
    text: "از بسته‌بندی تا کیفیت پرداخت سطح، همه‌چیز شایستهٔ یک خانهٔ جواهر ممتاز بود.",
    rating: 5,
  },
];

export const homeFallbackInstagramPosts = [
  { id: "1", image: pickSiteImage(0), likes: 2847 },
  { id: "2", image: pickSiteImage(1), likes: 1923 },
  { id: "3", image: pickSiteImage(0), likes: 3102 },
  { id: "4", image: pickSiteImage(1), likes: 1654 },
  { id: "5", image: pickSiteImage(0), likes: 2201 },
  { id: "6", image: pickSiteImage(1), likes: 1890 },
];
