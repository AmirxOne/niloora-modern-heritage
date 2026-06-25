/**
 * تولید دیدگاه و پرسش تأییدشده برای یک محصول.
 * npx tsx prisma/scripts/seed-product-reviews-questions.ts NL-RGM-2900
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";

const PRODUCT_ID = process.argv[2]?.trim() || "NL-RGM-2900";
const TEMPLATE_PRODUCT_ID = "NL-RGM-0014";
const COMMENT_COUNT = 16;
const QUESTION_COUNT = 13;

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "",
});
const prisma = new PrismaClient({ adapter });

const PERSIAN_NAMES = [
  "امیرحسین سحرخیز",
  "سارا محمدی",
  "رضا کریمی",
  "مریم احمدی",
  "علی رضایی",
  "فاطمه موسوی",
  "مهدی نوری",
  "زهرا حسینی",
  "پویا جعفری",
  "نرگس صادقی",
  "حامد اکبری",
  "لیلا باقری",
  "کامران شریفی",
  "نیلوفر قاسمی",
  "بهرام ملکی",
  "آرزو حیدری",
  "سینا مرادی",
  "مینا فرهادی",
  "دانیال رحیمی",
  "الهام کاظمی",
];

const COMMENT_BODIES = [
  "کیفیت ساخت انگشتر واقعاً بالاست. سنگ عقیق یمنی رنگ عمیق و یکداست و بعد از چند هفته استفاده هنوز جلوهٔ اولیه را حفظ کرده.",
  "بسته‌بندی بسیار شیک و محکم بود. جعبهٔ مخصوص و گواهی اصالت داخل بسته حس اعتماد می‌دهد.",
  "سایزبندی دقیق بود و روی دست خیلی راحت می‌نشیند. وزن انگشتر هم متعادل است، نه سنگین و نه سبک.",
  "برای هدیه خریدم و طرف مقابل خیلی راضی بود. جزئیات حکاکی و پرداخت فلز قابل تحسین است.",
  "رنگ طلای کار بسیار زیباست و با سنگ عقیق هماهنگی خوبی دارد. از خرید پشیمان نیستم.",
  "ارسال سریع بود و محصول دقیقاً مطابق تصاویر سایت رسید. پشتیبانی هم پاسخگو بود.",
  "انگشتر مردانهٔ شیکی است؛ هم برای مهمانی مناسب است هم استفادهٔ روزمره. پیشنهاد می‌کنم.",
  "کیفیت سنگ و نشست آن روی رین عالی است. بعد از چند ماه هنوز درخشش اولیه را دارد.",
  "قیمت نسبت به کیفیت دست‌سازی و اصالت سنگ منصفانه است. تجربهٔ خرید خوبی بود.",
  "جعبه و مهر اصالت حرفه‌ای بود. حس یک اثر خاص و ماندگار را منتقل می‌کند.",
  "طراحی کلاسیک و در عین حال امروزی دارد. با کت و شلوار و استایل رسمی خیلی خوب می‌نشیند.",
  "سنگ عقیق بدون ترک و خط دیده نمی‌شود. انگشتانم حساس است ولی مشکلی ایجاد نکرد.",
  "از نظر ظاهری با عکس‌ها یکی بود. فقط کاش راهنمای نگهداری سنگ هم داخل بسته بود.",
  "برای مراسم رسمی خریدم و بازخورد خیلی خوبی گرفتم. ساخت داخلی رین هم تمیز است.",
  "دو هفته است مداوم استفاده می‌کنم. رنگ سنگ ثابت مانده و خط و خش غیرعادی ندیدم.",
  "فروشنده راهنمایی سایز را دقیق انجام داد. انگشتر نه گشاد است نه تنگ.",
  "بسته‌بندی ضد ضربه بود و هیچ آسیبی ندید. جزئیات کار هنری روی بند قابل توجه است.",
  "یکی از بهترین خریدهای من از گالری بود. کیفیت با محصولات مشابه بازار فرق دارد.",
  "سنگ در نور طبیعی و مصنوعی هر دو زیبا دیده می‌شود. امتیاز کامل از نظر زیبایی.",
  "ارسال به شهرستان سریع انجام شد. محصول سالم رسید و با انتظاراتم همخوان بود.",
];

const QUESTION_BODIES = [
  "آیا این انگشتر برای استفادهٔ روزمره مناسب است یا بیشتر مناسب مهمانی است؟",
  "سایز ۱۹ را دارید یا فقط سایزبندی سفارشی انجام می‌شود؟",
  "سنگ عقیق یمنی این مدل اصل است؟ گواهی اصالت همراه محصول ارسال می‌شود؟",
  "آیا امکان تعویض سایز بعد از خرید وجود دارد؟",
  "وزن تقریبی این انگشتر چقدر است؟",
  "رنگ طلا ۱۸ عیار است یا ۲۱ عیار؟",
  "برای هدیه آقایان میان‌سال مناسب است؟",
  "آیا این مدل در سایز دیگر هم موجود است؟",
  "نگهداری سنگ عقیق برای این انگشتر چطور باید باشد؟",
  "زمان آماده‌سازی و ارسال برای تهران چند روز است؟",
  "آیا حکاکی نام روی داخل رین امکان‌پذیر است؟",
  "تفاوت این مدل با NL-RGM-2800 در چیست؟",
  "آیا امکان پرداخت در محل برای این اثر وجود دارد؟",
  "ضمانت یا مهلت مرجوعی برای این انگشتر چگونه است؟",
  "آیا بسته‌بندی مخصوص هدیه دارید؟",
  "این انگشتر با دستمال مرطوب تمیز می‌شود یا نیاز به جلا دارد؟",
  "برای انگشت سبک مناسب است؟ نگران سنگینی آن هستم.",
  "آیا عکس‌های سایت دقیقاً از همین قطعه است یا نمونه مشابه؟",
];

const ANSWER_BODIES = [
  "بله، این مدل برای استفادهٔ روزمره هم طراحی شده؛ با رعایت نگهداری ساده مشکلی ایجاد نمی‌کند.",
  "سایز ۱۹ در حال حاضر موجود است. در صورت نیاز سایزبندی سفارشی هم انجام می‌شود.",
  "سنگ عقیق یمنی اصل است و گواهی اصالت همراه محصول ارسال می‌گردد.",
  "تا ۷ روز پس از تحویل، در صورت سالم بودن محصول، امکان تعویض سایز وجود دارد.",
  "وزن تقریبی این مدل حدود ۸ تا ۹ گرم است؛ بسته به سایز کمی متغیر است.",
  "این انگشتر با طلای ۱۸ عیار ساخته شده است.",
  "بله، طراحی کلاسیک آن برای هدیه آقایان بسیار مناسب است.",
  "برای موجودی سایر سایزها با پشتیبانی تماس بگیرید.",
  "از تماس سنگ با مواد شیمیایی و ضربهٔ شدید خودداری کنید؛ با پارچهٔ نرم تمیز کنید.",
  "برای تهران معمولاً ۲ تا ۴ روز کاری زمان می‌برد.",
  "بله، حکاکی نام روی داخل رین با هماهنگی قبلی انجام می‌شود.",
  "این مدل سنگ بزرگ‌تر و طرح بند پهن‌تری نسبت به NL-RGM-2800 دارد.",
  "بله، پرداخت در محل برای این محصول فعال است.",
  "مهلت ۷ روزه برای بازگشت کالا در صورت سالم بودن بسته و محصول وجود دارد.",
];

function pick<T>(items: T[], index: number): T {
  return items[index % items.length]!;
}

function ratingForIndex(index: number): number {
  const weights = [5, 5, 5, 4, 5, 4, 5, 3, 5, 4, 5, 5, 4, 5, 4];
  return weights[index % weights.length] ?? 5;
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(10 + (days % 8), (days * 7) % 60, 0, 0);
  return date;
}

async function ensureProduct(productId: string) {
  const existing = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, namePersian: true, name: true },
  });
  if (existing) return existing;

  const template = await prisma.product.findUnique({
    where: { id: TEMPLATE_PRODUCT_ID },
    include: {
      listing: true,
      images: { orderBy: { sortOrder: "asc" }, take: 5 },
    },
  });
  if (!template) {
    throw new Error(`Template product not found: ${TEMPLATE_PRODUCT_ID}`);
  }

  const suffix = productId.split("-").pop() ?? "2900";
  const created = await prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        id: productId,
        name: `seed-${suffix}`,
        namePersian: template.namePersian,
        introVideoUrl: template.introVideoUrl,
        price: template.price,
        listPrice: template.listPrice,
        discountPercent: template.discountPercent,
        discountEndsAt: template.discountEndsAt,
        image: template.image,
        category: template.category,
        metal: template.metal,
        stone: template.stone,
        stoneShape: template.stoneShape,
        engravingType: template.engravingType,
        availability: template.availability,
        stock: template.stock,
        condition: template.condition,
        featured: false,
        bestseller: false,
        initialSalesCount: template.initialSalesCount,
        collectionId: template.collectionId,
        vendorId: template.vendorId,
        publicationStatus: template.publicationStatus,
      },
    });

    if (template.listing) {
      await tx.productListing.create({
        data: {
          productId: product.id,
          tier: template.listing.tier,
          headline: template.listing.headline,
          details: template.listing.details as Prisma.InputJsonValue,
          extraTags: template.listing.extraTags as Prisma.InputJsonValue | undefined,
        },
      });
    }

    if (template.images.length > 0) {
      await tx.productImage.createMany({
        data: template.images.map((image) => ({
          productId: product.id,
          url: image.url,
          sortOrder: image.sortOrder,
        })),
      });
    }

    return product;
  });

  console.log(`Created missing product ${created.id} (${created.namePersian}) from template.`);
  return created;
}

async function main() {
  const product = await ensureProduct(PRODUCT_ID);
  console.log(`Seeding reviews & questions for ${product.id} (${product.namePersian ?? product.name})`);

  await prisma.productQuestionAnswer.deleteMany({
    where: { question: { productId: PRODUCT_ID } },
  });
  await prisma.productQuestion.deleteMany({ where: { productId: PRODUCT_ID } });
  await prisma.productComment.deleteMany({ where: { productId: PRODUCT_ID } });

  for (let i = 0; i < COMMENT_COUNT; i += 1) {
    const rating = ratingForIndex(i);
    await prisma.productComment.create({
      data: {
        productId: PRODUCT_ID,
        authorName: pick(PERSIAN_NAMES, i + 2),
        body: pick(COMMENT_BODIES, i),
        rating,
        ratingBuildQuality: Math.min(5, rating + (i % 2 === 0 ? 0 : 1)),
        ratingBeauty: rating,
        ratingValue: Math.max(3, rating - (i % 5 === 0 ? 1 : 0)),
        ratingPackaging: Math.min(5, rating + 1),
        isVerifiedBuyer: i % 3 !== 2,
        status: "approved",
        createdAt: daysAgo(i * 3 + 1),
      },
    });
  }

  for (let i = 0; i < QUESTION_COUNT; i += 1) {
    const question = await prisma.productQuestion.create({
      data: {
        productId: PRODUCT_ID,
        authorName: pick(PERSIAN_NAMES, i + 5),
        body: pick(QUESTION_BODIES, i),
        status: "approved",
        createdAt: daysAgo(i * 4 + 2),
      },
    });

    const answerCount = i % 4 === 0 ? 2 : 1;
    for (let j = 0; j < answerCount; j += 1) {
      await prisma.productQuestionAnswer.create({
        data: {
          questionId: question.id,
          authorName: j === 0 ? "پشتیبانی نیلورا" : pick(PERSIAN_NAMES, i + j + 11),
          body: pick(ANSWER_BODIES, i + j),
          status: "approved",
          isOfficial: j === 0,
          createdAt: daysAgo(i * 4 + j),
        },
      });
    }
  }

  const [comments, questions] = await Promise.all([
    prisma.productComment.count({ where: { productId: PRODUCT_ID, status: "approved" } }),
    prisma.productQuestion.count({ where: { productId: PRODUCT_ID, status: "approved" } }),
  ]);

  console.log(`Done. Approved comments: ${comments}, approved questions: ${questions}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
