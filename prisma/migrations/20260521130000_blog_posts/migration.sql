-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "body" TEXT NOT NULL,
    "coverImage" TEXT,
    "authorName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Post_slug_key" ON "Post"("slug");

-- CreateIndex
CREATE INDEX "Post_status_publishedAt_idx" ON "Post"("status", "publishedAt");

-- Seed sample published posts
INSERT INTO "Post" ("id", "slug", "title", "excerpt", "body", "coverImage", "authorName", "status", "publishedAt", "metaTitle", "metaDescription", "updatedAt") VALUES
(
    'post-gem-guide',
    'how-to-choose-gemstone',
    'چگونه نگین انگشتر را انتخاب کنیم؟',
    'راهنمای کوتاه برای انتخاب نگین متناسب با بودجه، استایل روزمره و ماندگاری اثر در گالری ابراهیم آذری.',
    'انتخاب نگین، نقطهٔ شروع هر انگشتر اختصاصی است. ابتدا کاربرد را مشخص کنید: انگشتر روزمره، اثر رسمی یا هدیهٔ ماندگار.

برای استفادهٔ روزمره، سخت‌گیری نگین و رنگ فلز باید با سبک زندگی شما هم‌خوان باشد. الماس و یاقوت از مقاومت بالایی برخوردارند؛ فیروزه و عقیق نیاز به مراقبت بیشتری دارند اما شخصیت بصری قوی‌تری می‌دهند.

در کارگاه ابراهیم آذری، پس از انتخاب نگین، رکاب و قلم‌کاری با همان استاندارد ساخت هماهنگ می‌شود تا اثر نهایی یکپارچه بماند.',
    '/Picsart_26-04-26_15-15-33-128.jpg',
    'کارگاه ابراهیم آذری',
    'published',
    CURRENT_TIMESTAMP,
    'انتخاب نگین انگشتر | بلاگ ابراهیم آذری',
    'راهنمای انتخاب نگین برای انگشتر دست‌ساز — الماس، یاقوت، فیروزه و عقیق.',
    CURRENT_TIMESTAMP
),
(
    'post-engraving',
    'engraving-and-calligraphy',
    'قلم‌کاری و خوشنویسی روی رکاب',
    'داستان فنی و هنری خوشنویسی روی انگشتر؛ از انتخاب خط تا ماندگاری در طلا و نقره.',
    'قلم‌کاری روی رکاب، هویت اثر را ماندگار می‌کند. در گالری ابراهیم آذری خطوط نستعلیق، نسخ و مدرن با ابزار دستی و کنترل عمق اجرا می‌شود.

قبل از سفارش، متن نهایی و اندازهٔ سطح رکاب بررسی می‌شود تا خوانایی و تعادل بصری حفظ شود. برای هدایای خاص، تاریخ یا نام با فاصلهٔ مناسب از نگین طراحی می‌شود.

اگر انگشتر را برای نسل بعد می‌سازید، انتخاب فلز و نوع پرداخت سطح در دوام خط نقش مستقیم دارد.',
    '/Picsart_26-04-26_15-15-33-128.jpg',
    'کارگاه ابراهیم آذری',
    'published',
    CURRENT_TIMESTAMP,
    'قلم‌کاری انگشتر | بلاگ ابراهیم آذری',
    'خوشنویسی و قلم‌کاری روی رکاب انگشتر دست‌ساز در کارگاه ابراهیم آذری.',
    CURRENT_TIMESTAMP
);
