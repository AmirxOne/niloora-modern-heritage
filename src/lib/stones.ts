import { pickSiteImageByKey } from "@/lib/images";
import type { KnownStoneGuideId, Product, StoneType } from "@/lib/types";

export interface StoneGuideProfile {
  id: KnownStoneGuideId | `custom-${string}`;
  coreStone?: StoneType;
  slug: string;
  name: string;
  image: string;
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
  searchTags: string[];
}

const CORE_STONE_GUIDES: StoneGuideProfile[] = [
  {
    id: "diamond",
    coreStone: "diamond",
    slug: "diamond",
    name: "الماس",
    image: pickSiteImageByKey("stone-guide-diamond"),
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
    searchTags: ["diamond", "الماس", "نگین شفاف", "engagement"],
  },
  {
    id: "emerald",
    coreStone: "emerald",
    slug: "emerald",
    name: "زمرد",
    image: pickSiteImageByKey("stone-guide-emerald"),
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
    searchTags: ["emerald", "زمرد", "بریل", "سنگ سبز"],
  },
  {
    id: "sapphire",
    coreStone: "sapphire",
    slug: "sapphire",
    name: "یاقوت کبود",
    image: pickSiteImageByKey("stone-guide-sapphire"),
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
    searchTags: ["sapphire", "یاقوت کبود", "کوراندوم"],
  },
  {
    id: "ruby",
    coreStone: "ruby",
    slug: "ruby",
    name: "یاقوت سرخ",
    image: pickSiteImageByKey("stone-guide-ruby"),
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
    searchTags: ["ruby", "یاقوت سرخ", "یاقوت", "قرمز"],
  },
  {
    id: "turquoise",
    coreStone: "turquoise",
    slug: "turquoise-neishabur",
    name: "فیروزه نیشابور",
    image: pickSiteImageByKey("stone-guide-turquoise"),
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
    searchTags: ["turquoise", "فیروزه", "نیشابور", "سنگ ایرانی"],
  },
  {
    id: "onyx",
    coreStone: "onyx",
    slug: "onyx",
    name: "عقیق سیاه (اونیکس)",
    image: pickSiteImageByKey("stone-guide-onyx"),
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
    searchTags: ["onyx", "اونیکس", "عقیق سیاه"],
  },
  {
    id: "zabarjad",
    coreStone: "zabarjad",
    slug: "peridot-zabarjad",
    name: "زبرجد",
    image: pickSiteImageByKey("stone-guide-zabarjad"),
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
    searchTags: ["zabarjad", "peridot", "زبرجد", "الیوین"],
  },
  {
    id: "yemen-aqeeq",
    coreStone: "yemen-aqeeq",
    slug: "yemeni-agate",
    name: "عقیق یمنی",
    image: pickSiteImageByKey("stone-guide-yemen-aqeeq"),
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
    searchTags: ["aqeeq", "agate", "عقیق", "یمنی", "yemen"],
  },
  {
    id: "durr-najaf",
    coreStone: "durr-najaf",
    slug: "dorr-e-najaf",
    name: "در نجف",
    image: pickSiteImageByKey("stone-guide-durr-najaf"),
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
    searchTags: ["durr najaf", "در نجف", "دُر نجف", "کوارتز"],
  },
  {
    id: "moral",
    coreStone: "moral",
    slug: "moral-stone",
    name: "مرمر هندی (مُرَ)",
    image: pickSiteImageByKey("stone-guide-moral"),
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
    searchTags: ["moral", "مرمر", "سنگ مات", "هندی"],
  },
];

const EXTRA_STONE_GUIDES: StoneGuideProfile[] = [
  {
    id: "amethyst",
    slug: "amethyst",
    name: "آمتیست (کوارتز بنفش)",
    image: pickSiteImageByKey("stone-guide-amethyst"),
    shortTagline: "سنگ آرامش ذهن، تعادل هیجانی و تمرکز درونی",
    scientificFamily: "کوارتز بنفش",
    historicalOrigin: "یونان باستان و سپس برزیل",
    firstMajorUsePeriod: "از سده‌های کلاسیک در انگشتر و تسبیح",
    culturalStory:
      "آمتیست در فرهنگ‌های مختلف نماد خویشتنداری و وضوح ذهن بود و در زیورهای اشرافی نیز دیده می‌شد.",
    psychologicalEffects: ["کاهش تنش ذهنی", "کمک به خواب آرام‌تر", "تقویت تمرکز فکری"],
    spiritualNotes: ["در روایات سنگی برای آرام‌سازی ذهن و مراقبه معرفی شده است."],
    recommendedFor: ["افراد پرمشغله", "کسانی که آرامش و رنگ خاص می‌خواهند"],
    cautionNotes: ["در برابر نور شدید و طولانی، رنگ ممکن است کم‌رنگ شود."],
    maintenanceTips: ["با آب ولرم و پارچه نرم تمیز شود.", "دور از گرمای زیاد نگهداری شود."],
    colorHex: "#8B5FBF",
    searchTags: ["amethyst", "آمتیست", "کوارتز بنفش", "بنفش"],
  },
  {
    id: "topaz",
    slug: "topaz",
    name: "توپاز",
    image: pickSiteImageByKey("stone-guide-topaz"),
    shortTagline: "سنگ وضوح فکری، اعتماد به بیان و انرژی روشن",
    scientificFamily: "سیلیکات آلومینیوم و فلوئور",
    historicalOrigin: "مصر، برزیل و روسیه",
    firstMajorUsePeriod: "از قرون میانه در زیور درباری",
    culturalStory:
      "توپاز در تمدن‌های مختلف نشانه روشنی ذهن و صداقت در گفتار دانسته می‌شد.",
    psychologicalEffects: ["افزایش وضوح ذهن", "تقویت بیان و ارتباط", "کمک به تصمیم‌گیری"],
    spiritualNotes: ["در سنت‌ها با پاکی نیت و صداقت پیوند دارد."],
    recommendedFor: ["افراد سخنران", "دانشجویان", "استفاده روزمره"],
    cautionNotes: ["از ضربه ناگهانی به لبه سنگ جلوگیری شود."],
    maintenanceTips: ["تمیزکاری ملایم", "نگهداری جدا از سنگ‌های خیلی سخت"],
    colorHex: "#E6B85C",
    searchTags: ["topaz", "توپاز", "زرد عسلی"],
  },
  {
    id: "opal",
    slug: "opal",
    name: "اوپال",
    image: pickSiteImageByKey("stone-guide-opal"),
    shortTagline: "سنگ خلاقیت، انعطاف ذهنی و الهام هنری",
    scientificFamily: "سیلیکا آبدار",
    historicalOrigin: "استرالیا و اروپا",
    firstMajorUsePeriod: "از روم باستان در جواهرات فاخر",
    culturalStory:
      "اوپال به‌خاطر بازی رنگ منحصربه‌فردش همواره برای هنرمندان و علاقه‌مندان سبک خاص جذاب بوده است.",
    psychologicalEffects: ["تقویت خلاقیت", "افزایش انعطاف ذهن", "ایجاد حس تازگی"],
    spiritualNotes: ["در باورها سنگ الهام و شهود دانسته می‌شود."],
    recommendedFor: ["افراد هنری", "طرفداران سبک خاص و متفاوت"],
    cautionNotes: ["اوپال نسبت به خشکی شدید و تغییر دمای ناگهانی حساس است."],
    maintenanceTips: ["تماس طولانی با گرما نداشته باشد.", "در جعبه نرم نگهداری شود."],
    colorHex: "#7FC8C3",
    searchTags: ["opal", "اوپال", "بازی رنگ"],
  },
  {
    id: "lapis-lazuli",
    slug: "lapis-lazuli",
    name: "لاجورد",
    image: pickSiteImageByKey("stone-guide-lapis-lazuli"),
    shortTagline: "سنگ عمق فکری، وقار و بیان صادقانه",
    scientificFamily: "سنگ دگرگونی (حاوی لازوریت)",
    historicalOrigin: "بدخشان و خاورمیانه",
    firstMajorUsePeriod: "از مصر باستان در مهر و زیور سلطنتی",
    culturalStory:
      "لاجورد در فرهنگ ایرانی و بین‌النهرین نماد آسمان شب و دانش بود و در آثار فاخر کاربرد داشت.",
    psychologicalEffects: ["افزایش تمرکز ذهنی", "تقویت گفت‌وگوی آگاهانه", "کاهش آشفتگی"],
    spiritualNotes: ["سنگی برای تعادل فکر و بیان معرفی شده است."],
    recommendedFor: ["افراد پژوهشی", "مدیران", "استایل رسمی کلاسیک"],
    cautionNotes: ["از شوینده اسیدی دور نگه داشته شود."],
    maintenanceTips: ["با پارچه نرم پاک شود.", "به‌صورت جداگانه نگهداری شود."],
    colorHex: "#2E4EA1",
    searchTags: ["lapis", "lapis lazuli", "لاجورد", "لاپیس"],
  },
  {
    id: "jade",
    slug: "jade",
    name: "یشم",
    image: pickSiteImageByKey("stone-guide-jade"),
    shortTagline: "سنگ توازن، نرمی رفتار و آرامش پایدار",
    scientificFamily: "نفریت/ژادئیت",
    historicalOrigin: "چین، آسیای مرکزی و آمریکای باستان",
    firstMajorUsePeriod: "از هزاره‌های پیش در آیین‌های شرقی",
    culturalStory:
      "یشم در تمدن‌های شرقی سنگ خوش‌یمن و نماد تعادل شخصیت و زندگی دانسته می‌شد.",
    psychologicalEffects: ["ایجاد آرامش پایدار", "تقویت مهربانی", "کمک به تعادل احساسی"],
    spiritualNotes: ["در سنت‌های شرقی با برکت و توازن مرتبط است."],
    recommendedFor: ["افراد پراسترس", "سبک زندگی مینیمال و آرام"],
    cautionNotes: ["از ضربه مکانیکی مستقیم محافظت شود."],
    maintenanceTips: ["تمیزکاری با آب ولرم", "خشک‌کردن کامل پس از شست‌وشو"],
    colorHex: "#5BAF7D",
    searchTags: ["jade", "یشم", "سبز آرام"],
  },
  {
    id: "garnet",
    slug: "garnet",
    name: "گارنت",
    image: pickSiteImageByKey("stone-guide-garnet"),
    shortTagline: "سنگ پایداری، انگیزه و انرژی عمل هدفمند",
    scientificFamily: "گروه سیلیکاتی گارنت",
    historicalOrigin: "هند، سریلانکا و آفریقا",
    firstMajorUsePeriod: "از روم باستان در انگشترهای امضا",
    culturalStory:
      "گارنت در تاریخ به‌عنوان سنگ محافظ مسافران و نماد تعهد شناخته می‌شد.",
    psychologicalEffects: ["افزایش انرژی عمل", "تقویت پایداری در هدف", "کاهش رخوت"],
    spiritualNotes: ["سنگی برای استقامت و عزم شخصی دانسته می‌شود."],
    recommendedFor: ["افراد اقدام‌گرا", "سبک رسمی یا کلاسیک"],
    cautionNotes: ["با وجود مقاومت مناسب، بهتر است از ضربه شدید دور باشد."],
    maintenanceTips: ["پاک‌سازی ملایم دوره‌ای", "نگهداری جدا از سنگ‌های نرم"],
    colorHex: "#8D1E3F",
    searchTags: ["garnet", "گارنت", "زرشکی"],
  },
  {
    id: "pearl",
    slug: "pearl",
    name: "مروارید",
    image: pickSiteImageByKey("stone-guide-pearl"),
    shortTagline: "سنگ لطافت، وقار و آرامش در ارتباطات",
    scientificFamily: "گوهر آلی (کربنات کلسیم لایه‌ای)",
    historicalOrigin: "خلیج فارس، دریای جنوبی و ژاپن",
    firstMajorUsePeriod: "از دوران باستان در زیور سلطنتی",
    culturalStory:
      "مروارید در فرهنگ‌های مختلف نماد پاکی و وقار بود و در جواهرات فاخر زنانه جایگاه ویژه‌ای داشت.",
    psychologicalEffects: ["تقویت لطافت رفتاری", "آرامش در گفت‌وگو", "کاهش تنش اجتماعی"],
    spiritualNotes: ["در روایات نماد خلوص و آرامش معرفی شده است."],
    recommendedFor: ["استایل کلاسیک", "هدیه رسمی", "افراد با روحیه ملایم"],
    cautionNotes: ["مروارید نسبت به عطر و مواد شیمیایی بسیار حساس است."],
    maintenanceTips: ["آخرین مرحله استفاده شود (بعد از عطر).", "با پارچه بسیار نرم پاک شود."],
    colorHex: "#E8E3DA",
    searchTags: ["pearl", "مروارید", "گوهر دریایی"],
  },
  {
    id: "citrine",
    slug: "citrine",
    name: "سیترین",
    image: pickSiteImageByKey("stone-guide-citrine"),
    shortTagline: "سنگ انرژی مثبت، اعتمادبه‌نفس و نگاه امیدوار",
    scientificFamily: "کوارتز زرد",
    historicalOrigin: "برزیل و اروپا",
    firstMajorUsePeriod: "از قرون میانه در جواهرات روزمره",
    culturalStory:
      "سیترین با رنگ گرم و روشنش سنگ نشاط و انگیزه شناخته می‌شود و در استایل‌های روزانه محبوب است.",
    psychologicalEffects: ["افزایش روحیه", "تقویت اعتمادبه‌نفس", "کمک به نگاه مثبت"],
    spiritualNotes: ["در متون نوین، سنگ وفور و سرزندگی قلمداد می‌شود."],
    recommendedFor: ["افراد کم‌انرژی", "استفاده روزمره", "هدیه‌های انگیزشی"],
    cautionNotes: ["قرارگیری طولانی در نور شدید ممکن است رنگ را کمرنگ کند."],
    maintenanceTips: ["با شوینده ملایم تمیز شود.", "از حرارت بالا دور نگه دارید."],
    colorHex: "#D8A640",
    searchTags: ["citrine", "سیترین", "کوارتز زرد"],
  },
];

const STONE_GUIDES: StoneGuideProfile[] = [...CORE_STONE_GUIDES, ...EXTRA_STONE_GUIDES];

function normalizeFaText(input: string): string {
  return input
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("fa-IR");
}

function slugifyFa(input: string): string {
  const normalized = normalizeFaText(input).replace(/[^a-z0-9\u0600-\u06ff\s-]/gi, "").trim();
  const slug = normalized.replace(/\s+/g, "-");
  return slug || "stone";
}

function extractStoneTypeFromProductDetails(product: Product): string | null {
  const line = (product.listing?.details ?? []).find((item) => /^نگین\s*:/.test(item.trim()));
  if (!line) return null;
  const value = line.replace(/^نگین\s*:\s*/, "").trim();
  const firstPart = value.split("-")[0]?.trim();
  return firstPart || null;
}

export function findStoneGuideByText(query: string): StoneGuideProfile | null {
  const normalized = normalizeFaText(query);
  if (!normalized) return null;
  return (
    STONE_GUIDES.find((stone) => normalizeFaText(stone.name) === normalized) ??
    STONE_GUIDES.find((stone) => stone.searchTags.some((tag) => normalizeFaText(tag) === normalized)) ??
    STONE_GUIDES.find(
      (stone) =>
        normalizeFaText(stone.name).includes(normalized) ||
        stone.searchTags.some((tag) => normalizeFaText(tag).includes(normalized))
    ) ??
    null
  );
}

function deriveCustomStoneGuide(name: string): StoneGuideProfile {
  const clean = name.trim();
  const slug = `catalog-${slugifyFa(clean)}`;
  return {
    id: `custom-${slug}`,
    slug,
    name: clean,
    image: pickSiteImageByKey(slug),
    shortTagline: `سنگ «${clean}» در کاتالوگ محصولات ثبت شده است.`,
    scientificFamily: "نامشخص",
    historicalOrigin: "اطلاعات تاریخچه در کاتالوگ محصول ثبت نشده است.",
    firstMajorUsePeriod: "نامشخص",
    culturalStory: `این سنگ در محصولات واقعی کاتالوگ مشاهده شده و نیاز به تکمیل دانشنامه اختصاصی دارد.`,
    psychologicalEffects: ["اطلاعات اثر روان‌شناختی ثبت نشده است."],
    spiritualNotes: ["اطلاعات معنوی ثبت نشده است."],
    recommendedFor: ["با توجه به ویژگی‌های محصول، انتخاب شود."],
    cautionNotes: ["پیش از خرید، مشخصات دقیق نگین از کارگاه استعلام شود."],
    maintenanceTips: ["نگهداری با پارچه نرم و دوری از مواد شیمیایی قوی."],
    colorHex: "#6B7280",
    searchTags: [clean],
  };
}

export function listStoneGuidesForCatalog(products: Product[]): StoneGuideProfile[] {
  const bySlug = new Map(STONE_GUIDES.map((stone) => [stone.slug, stone]));

  for (const product of products) {
    const extracted = extractStoneTypeFromProductDetails(product);
    if (!extracted) continue;
    const existing = findStoneGuideByText(extracted);
    if (existing) {
      bySlug.set(existing.slug, existing);
      continue;
    }
    const custom = deriveCustomStoneGuide(extracted);
    bySlug.set(custom.slug, custom);
  }

  return Array.from(bySlug.values());
}

export function getStoneGuideBySlugForCatalog(
  slug: string,
  products: Product[]
): StoneGuideProfile | null {
  return listStoneGuidesForCatalog(products).find((stone) => stone.slug === slug) ?? null;
}

export function getStoneGuideForProduct(product: Product): StoneGuideProfile | null {
  const fromDetails = extractStoneTypeFromProductDetails(product);
  if (fromDetails) {
    const byText = findStoneGuideByText(fromDetails);
    if (byText) return byText;
  }
  return getStoneGuideById(product.stone);
}

export function listStoneGuides(): StoneGuideProfile[] {
  return STONE_GUIDES;
}

export function getStoneGuideById(stone: StoneType): StoneGuideProfile | null {
  return STONE_GUIDES.find((s) => s.coreStone === stone || s.id === stone) ?? null;
}

export function getStoneGuideBySlug(slug: string): StoneGuideProfile | null {
  return STONE_GUIDES.find((s) => s.slug === slug) ?? null;
}

export function findStoneGuideByQuery(query: string): StoneGuideProfile[] {
  const normalized = query.trim().toLocaleLowerCase("fa-IR");
  if (!normalized) return STONE_GUIDES;
  return STONE_GUIDES.filter((stone) => {
    const haystack = [
      stone.name,
      stone.shortTagline,
      stone.scientificFamily,
      stone.historicalOrigin,
      ...stone.searchTags,
    ]
      .join(" ")
      .toLocaleLowerCase("fa-IR");
    return haystack.includes(normalized);
  });
}

