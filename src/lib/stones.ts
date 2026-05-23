import type { StoneType } from "@/lib/types";

export interface StoneGuideProfile {
  id: StoneType;
  slug: string;
  name: string;
  shortTagline: string;
  scientificFamily: string;
  historicalOrigin: string;
  firstMajorUsePeriod: string;
  culturalStory: string;
  psychologicalEffects: string[];
  spiritualNotes: string[];
  recommendedFor: string[];
  cautionNotes: string[];
  maintenanceTips: string[];
  colorHex: string;
}

const STONE_GUIDES: Record<StoneType, StoneGuideProfile> = {
  diamond: {
    id: "diamond",
    slug: "diamond",
    name: "الماس",
    shortTagline: "نماد شفافیت، اقتدار و تصمیم‌گیری قاطع",
    scientificFamily: "کربن خالص کریستالی",
    historicalOrigin: "قدیمی‌ترین منابع شناخته‌شده در هند باستان",
    firstMajorUsePeriod: "از حدود ۴۰۰ پیش از میلاد در زیور سلطنتی",
    culturalStory:
      "در دربارهای کهن، الماس نشانه جایگاه و تعهد بود و بعدها به نشانه وفاداری در حلقه‌های نامزدی تثبیت شد.",
    psychologicalEffects: [
      "افزایش احساس وضوح ذهنی و تمرکز",
      "تقویت اعتمادبه‌نفس در تصمیم‌های مهم",
      "کمک به ثبات عاطفی در شرایط پراسترس",
    ],
    spiritualNotes: [
      "در باور سنتی، سنگی برای استحکام نیت و صداقت",
      "به‌عنوان سنگ تقویت اراده شناخته می‌شود",
    ],
    recommendedFor: [
      "افراد مدیر و تصمیم‌گیر",
      "کسانی که دنبال حس وقار و قدرت آرام هستند",
      "مناسب رویدادهای رسمی و حلقه‌های تعهد",
    ],
    cautionNotes: ["برای استفاده روزانه، مراقب ضربه‌های نقطه‌ای شدید باشید."],
    maintenanceTips: [
      "شست‌وشو با آب ولرم و شوینده ملایم",
      "خشک‌کردن با پارچه میکروفایبر",
      "دوری از کلر و مواد شیمیایی قوی",
    ],
    colorHex: "#DCEFF7",
  },
  emerald: {
    id: "emerald",
    slug: "emerald",
    name: "زمرد",
    shortTagline: "سنگ آرامش، عشق عمیق و بازسازی هیجانی",
    scientificFamily: "بریل سبز (Beryl)",
    historicalOrigin: "مصر و سپس معادن آمریکای جنوبی",
    firstMajorUsePeriod: "حدود ۱۵۰۰ پیش از میلاد در مصر باستان",
    culturalStory:
      "زمرد در فرهنگ‌های باستانی نماد زندگی و باروری بود و در جواهرات درباری کاربرد ویژه داشت.",
    psychologicalEffects: [
      "کاهش تنش ذهنی و بهبود تعادل احساسی",
      "تقویت حس امید و رشد درونی",
      "افزایش همدلی در روابط عاطفی",
    ],
    spiritualNotes: ["در روایت‌های سنتی، سنگ پیوند قلب و بینش درونی است."],
    recommendedFor: [
      "افراد حساس و احساسی",
      "کسانی که دوران بازسازی روانی را می‌گذرانند",
      "مناسب هدیه‌های عاشقانه و سالگرد",
    ],
    cautionNotes: ["زمرد نسبت به ضربه و فشار ناگهانی حساس‌تر از الماس است."],
    maintenanceTips: ["از بخارشو و اولتراسونیک استفاده نشود.", "تمیزکاری فقط با پارچه نرم و آب ولرم."],
    colorHex: "#4FB673",
  },
  sapphire: {
    id: "sapphire",
    slug: "sapphire",
    name: "یاقوت کبود",
    shortTagline: "سنگ خرد، نظم ذهنی و عمق فکری",
    scientificFamily: "کوراندوم آبی",
    historicalOrigin: "هند، سریلانکا و آسیای میانه",
    firstMajorUsePeriod: "از دوران باستان در مهرها و زیور پادشاهان",
    culturalStory:
      "یاقوت کبود در تاریخ به‌عنوان سنگ حکمت و صداقت شناخته می‌شد و در حلقه‌های سلطنتی کاربرد داشت.",
    psychologicalEffects: [
      "تقویت تمرکز و تفکر استراتژیک",
      "کمک به آرام‌سازی ذهن پرمشغله",
      "پشتیبانی از نظم شخصی و انضباط",
    ],
    spiritualNotes: ["در سنت‌ها، سنگ حفاظت ذهنی و تعادل گفتار دانسته می‌شود."],
    recommendedFor: ["دانش‌پژوهان و افراد تحلیلی", "افراد پرمسئولیت", "مناسب استفاده روزمره رسمی"],
    cautionNotes: ["با اینکه مقاوم است، از ضربه مستقیم به لبه‌ها جلوگیری شود."],
    maintenanceTips: ["تمیزکاری دوره‌ای با آب ولرم", "جدا از سنگ‌های نرم‌تر نگهداری شود"],
    colorHex: "#2D5EBD",
  },
  ruby: {
    id: "ruby",
    slug: "ruby",
    name: "یاقوت سرخ",
    shortTagline: "سنگ جسارت، انرژی و انگیزه عمل",
    scientificFamily: "کوراندوم قرمز",
    historicalOrigin: "برمه، هند و جنوب شرق آسیا",
    firstMajorUsePeriod: "دوران باستان در نشان‌های قدرت",
    culturalStory:
      "یاقوت سرخ همیشه نماد شور زندگی و جایگاه اجتماعی بوده و در زیور حاکمان دیده می‌شده است.",
    psychologicalEffects: [
      "افزایش انگیزه و جسارت در عمل",
      "تقویت اشتیاق و شور زندگی",
      "کمک به خروج از رخوت و بی‌انرژی بودن",
    ],
    spiritualNotes: ["در باور سنتی، سنگ گرمی قلب و نیروی درونی است."],
    recommendedFor: ["افراد کم‌انرژی", "افراد اقدام‌محور", "مناسب تیپ‌های جسور و برون‌گرا"],
    cautionNotes: ["برای تیپ‌های بسیار هیجانی، استفاده متعادل توصیه می‌شود."],
    maintenanceTips: ["تمیزکاری ملایم و منظم", "پرهیز از برخورد با سطوح بسیار سخت"],
    colorHex: "#C73555",
  },
  turquoise: {
    id: "turquoise",
    slug: "turquoise",
    name: "فیروزه نیشابور",
    shortTagline: "سنگ آرامش، خوش‌یمنی و پیوند فرهنگی ایرانی",
    scientificFamily: "فسفات مس و آلومینیوم",
    historicalOrigin: "معادن تاریخی نیشابور",
    firstMajorUsePeriod: "از ایران باستان در زیور و تزیینات",
    culturalStory:
      "فیروزه در فرهنگ ایرانی نماد برکت و محافظت بوده و جایگاه ویژه‌ای در انگشترهای سنتی دارد.",
    psychologicalEffects: [
      "ایجاد حس آرامش و امنیت درونی",
      "کاهش دل‌نگرانی‌های روزمره",
      "تقویت ارتباط کلامی آرام و روشن",
    ],
    spiritualNotes: ["در سنت ایرانی، از سنگ‌های خوش‌یمن و دفع‌کننده انرژی منفی دانسته می‌شود."],
    recommendedFor: ["افراد مضطرب", "کسانی که دنبال حس سنت و اصالت هستند", "مناسب هدیه‌های معنوی"],
    cautionNotes: ["با عطر، چربی و مواد اسیدی تماس مستقیم نداشته باشد."],
    maintenanceTips: ["فقط با پارچه خشک و نرم تمیز شود", "در معرض آب طولانی‌مدت قرار نگیرد"],
    colorHex: "#2A9D8F",
  },
  onyx: {
    id: "onyx",
    slug: "onyx",
    name: "عقیق سیاه (اونیکس)",
    shortTagline: "سنگ ثبات، محافظت ذهنی و جدیت شخصیتی",
    scientificFamily: "کالسدونی لایه‌ای",
    historicalOrigin: "مدیترانه و خاورمیانه",
    firstMajorUsePeriod: "از روم باستان در مهر و زیور مردانه",
    culturalStory:
      "اونیکس در تاریخ نماد انضباط و جدیت بود و در انگشترهای نشان و امضا نیز استفاده می‌شد.",
    psychologicalEffects: [
      "تقویت حس کنترل هیجان",
      "افزایش تمرکز روی اهداف بلندمدت",
      "کمک به کاهش پراکندگی ذهن",
    ],
    spiritualNotes: ["در سنت‌ها، سنگ محافظ در برابر آشفتگی ذهنی معرفی شده است."],
    recommendedFor: ["افراد مدیر", "افراد در محیط‌های پراسترس", "استایل رسمی و کلاسیک"],
    cautionNotes: ["سطح آن را از خط‌وخش مکانیکی حفظ کنید."],
    maintenanceTips: ["پارچه نرم و آب ولرم", "نگهداری جدا از فلزات زبر"],
    colorHex: "#222629",
  },
  zabarjad: {
    id: "zabarjad",
    slug: "peridot-zabarjad",
    name: "زبرجد",
    shortTagline: "سنگ نشاط، تازگی ذهن و سبک‌شدن هیجان",
    scientificFamily: "الیوین سبز (Peridot)",
    historicalOrigin: "جزایر دریای سرخ و خاورمیانه",
    firstMajorUsePeriod: "از دوره‌های کلاسیک در زیور اشراف",
    culturalStory:
      "زبرجد به‌عنوان سنگ نور و سرزندگی شناخته می‌شد و در زیورهای سبک و درخشان استفاده می‌شده است.",
    psychologicalEffects: [
      "افزایش حس امید و نشاط",
      "کمک به رهاسازی دلخوری‌های انباشته",
      "ایجاد احساس سبک‌بالی فکری",
    ],
    spiritualNotes: ["در متون سنتی، سنگ گشایش و روشن‌شدن مسیر دانسته شده است."],
    recommendedFor: ["افراد خسته ذهنی", "کسانی که دنبال انرژی مثبت ملایم هستند"],
    cautionNotes: ["در برابر ضربه‌های لبه‌ای محافظت شود."],
    maintenanceTips: ["شست‌وشوی ملایم", "دوری از دمای بسیار بالا"],
    colorHex: "#7BA05B",
  },
  "yemen-aqeeq": {
    id: "yemen-aqeeq",
    slug: "yemeni-agate",
    name: "عقیق یمنی",
    shortTagline: "سنگ ریشه، آرامش عمیق و پایداری شخصیتی",
    scientificFamily: "کالسدونی (Agate)",
    historicalOrigin: "یمن و شبه‌جزیره عرب",
    firstMajorUsePeriod: "از صدر اسلام در انگشترهای معنوی",
    culturalStory:
      "عقیق یمنی در فرهنگ اسلامی و ایرانی جایگاه معنوی ویژه‌ای دارد و در انگشترهای سنتی بسیار محبوب است.",
    psychologicalEffects: [
      "تقویت حس ثبات و زمین‌گیری",
      "کاهش بی‌قراری و نوسان هیجانی",
      "افزایش تحمل در فشارهای روزمره",
    ],
    spiritualNotes: ["در روایات، سنگ برکت و آرامش قلب معرفی شده است."],
    recommendedFor: ["افراد جویای آرامش درونی", "استفاده معنوی روزمره", "مناسب هدیه‌های مذهبی"],
    cautionNotes: ["از شوینده‌های قوی دور نگه داشته شود."],
    maintenanceTips: ["پاک‌کردن با پارچه نخی", "اجتناب از ضربه‌های مکرر"],
    colorHex: "#8B4513",
  },
  "durr-najaf": {
    id: "durr-najaf",
    slug: "dorr-e-najaf",
    name: "در نجف",
    shortTagline: "سنگ شفافیت نیت و آرامش ذهنی معنوی",
    scientificFamily: "کوارتز شفاف",
    historicalOrigin: "منطقه نجف و عراق",
    firstMajorUsePeriod: "در زیورهای مذهبی قرون اسلامی",
    culturalStory:
      "در نجف در فرهنگ شیعی سنگی پرارج است و در انگشترهای مذهبی و یادمانی استفاده گسترده دارد.",
    psychologicalEffects: [
      "افزایش حس پاکی و تمرکز ذهن",
      "کمک به آرام‌شدن گفت‌وگوی درونی",
      "ایجاد حس توازن در تصمیم‌گیری",
    ],
    spiritualNotes: ["از سنگ‌های محبوب معنوی برای مراقبه و ذکر محسوب می‌شود."],
    recommendedFor: ["افراد معنویت‌گرا", "کسانی که سنگ‌های شفاف و ساده دوست دارند"],
    cautionNotes: ["از تماس با سطوح بسیار زبر پرهیز شود."],
    maintenanceTips: ["شست‌وشوی سبک با آب", "خشک‌کردن کامل بعد از تماس با رطوبت"],
    colorHex: "#D9DDE0",
  },
  moral: {
    id: "moral",
    slug: "moral-stone",
    name: "مرمر هندی (مُرَ)",
    shortTagline: "سنگ نرمی، تعادل و حس کلاسیک سنتی",
    scientificFamily: "سنگ تزئینی کربناتی/کلسیتی",
    historicalOrigin: "هند و آسیای جنوبی",
    firstMajorUsePeriod: "در آثار تزئینی و زیور سنتی منطقه‌ای",
    culturalStory:
      "مرمر هندی به دلیل بافت خاص و جلوه اصیل، در زیورهای دست‌ساز سنتی کاربرد داشته است.",
    psychologicalEffects: [
      "ایجاد حس سکون و آهستگی روانی",
      "کمک به کاهش تحریک‌پذیری",
      "افزایش حس وقار مینیمال",
    ],
    spiritualNotes: ["در سنت‌های محلی به‌عنوان سنگ تعادل شناخته می‌شود."],
    recommendedFor: ["افراد مینیمال‌پسند", "کسانی که جلوه بسیار نرم و مات دوست دارند"],
    cautionNotes: ["سنگی نسبتاً نرم‌تر است؛ در برابر ضربه و مواد اسیدی مراقبت شود."],
    maintenanceTips: ["فقط پارچه نرم", "دوری از شوینده‌های قوی و مواد آرایشی مستقیم"],
    colorHex: "#D7D1C9",
  },
};

export function listStoneGuides(): StoneGuideProfile[] {
  return Object.values(STONE_GUIDES);
}

export function getStoneGuideById(stone: StoneType): StoneGuideProfile {
  return STONE_GUIDES[stone];
}

export function getStoneGuideBySlug(slug: string): StoneGuideProfile | null {
  return Object.values(STONE_GUIDES).find((s) => s.slug === slug) ?? null;
}

