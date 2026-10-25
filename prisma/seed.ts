import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";
import {
  seedProducts as products,
  seedCollections as collections,
  seedTestimonials as testimonials,
  seedInstagramPosts as instagramPosts,
  getSeedImage,
  getSeedGalleryImages,
  getSeedListing,
} from "./seed-data";

const SLIDER_PRODUCT_IDS = [
  "shiraz-solitaire",
  "isfahan-halo",
  "tehran-diamond",
  "yazd-ruby",
];

const SEED_PROMO_CODES = [
  {
    code: "NILOORA20",
    label: "بیست درصد تخفیف فروش ویژه نیلورا",
    type: "percent",
    value: 20,
    minSubtotal: 50_000_000,
    replacesSiteWide: true,
    active: true,
    aliases: ["نیلورا۲۰", "NIL20"],
  },
  {
    code: "WELCOME10",
    label: "تخفیف خوش‌آمدگویی مشتریان جدید",
    type: "percent",
    value: 10,
    minSubtotal: 20_000_000,
    replacesSiteWide: false,
    active: true,
    aliases: ["W10"],
  },
  {
    code: "HERITAGE5M",
    label: "بخشش پنج میلیون تومانی از مجموعه میراث",
    type: "fixed",
    value: 5_000_000,
    minSubtotal: 100_000_000,
    replacesSiteWide: false,
    active: true,
    aliases: [],
  },
];

const SEED_POSTS = [
  {
    slug: "rahnamaye-entekhab-angoshtar-aroosi",
    title: "راهنمای انتخاب انگشتر عروسی؛ از سایز تا نگین",
    excerpt:
      "هر آنچه پیش از سفارش انگشتر عروسی باید بدانید: اندازه‌گیری سایز، انتخاب رکاب، نگین‌نشانی و خوشنویسی نام‌ها.",
    body: "انتخاب انگشتر عروسی یکی از حساس‌ترین تصمیم‌های یک زندگی مشترک است. در کارگاه نیلورا، این مسیر را به چهار گام شفاف تقسیم کرده‌ایم.\n\n## گام اول: اندازه‌گیری دقیق سایز\nسایز انگشتر را همیشه در دمای معمولی بدن و آخر روز بگیرید؛ صبح‌ها انگشتان باریک‌تر هستند. حلقهٔ کالیبره کارگاه ما با دقت نیم میلی‌متر سایز را مشخص می‌کند.\n\n## گام دوم: انتخاب رکاب\nرکاب استرلینگ ۹۲۵ با پرداخت آینه‌ای، مات برس‌خورده یا آبکاری تیره؛ هر پرداخت شخصیت متفاوتی به انگشتر می‌دهد. برای استفادهٔ روزمره، رکاب مات کمتر خط و خش نشان می‌دهد.\n\n## گام سوم: نگین‌نشانی\nاز فیروزهٔ نیشابوری تا الماس تک‌نگین، انتخاب نگین باید با سبک زندگی شما سازگار باشد. برای دست‌های پرکار، نگین‌های تراش‌خوردهٔ کم‌عمق توصیه می‌شود.\n\n## گام چهارم: خوشنویسی\nحک نام یا تاریخ به خط نستعلیق یا ثلث، امضای شخصی شما روی این یادگاری است. قلم‌کاران کارگاه، پیش از حک نهایی، پیش‌نمایش حروف را تأیید می‌گیرند.",
    coverImage: "/Picsart_26-04-26_15-15-33-128.jpg",
    authorName: "کارگاه نیلورا",
    status: "published",
    metaTitle: "راهنمای انتخاب انگشتر عروسی | کارگاه نیلورا",
    metaDescription:
      "اندازه‌گیری سایز، انتخاب رکاب، نگین و خوشنویسی — راهنمای کامل سفارش انگشتر عروسی از کارگاه نیلورا.",
  },
  {
    slug: "parvaz-firooze-nishabur",
    title: "فیروزهٔ نیشابور؛ آسمانِ کوه‌های ایران در یک نگین",
    excerpt:
      "چرا فیروزهٔ نیشابور در جهان بی‌رقیب است؟ نگاهی به معدن علی‌شاه، درجه‌بندی رنگ و نشانه‌های اصالت نگین.",
    body: "معدن علی‌شاه در دامنهٔ بینالود، هزاران سال است که آسمانِ آبی خود را به دست صنعتگران ایرانی سپرده است.\n\n## درجه‌بندی رنگ\nفیروزهٔ عجمی با رنگ آبی خالص و بدون رگه، گران‌ترین درجه است. سنگ‌های آبی‌مایل به سبز با رگه‌های تیره، درجهٔ عربی نامیده می‌شوند و دوام کاملاً یکسانی دارند.\n\n## نشانه‌های اصالت\nنگین طبیعی در برابر نور، مات و یکدست دیده می‌شود؛ نسخه‌های رزینی براقیت غیرعادی دارند. در کارگاه ما هر نگین با گواهی اصالت تحویل می‌شود.\n\n## مراقبت\nفیروزه سنگ نسبتاً نرمی است؛ از تماس با مواد شوینده و ضربه بپرهیزید و برای نظافت فقط از پارچهٔ نرم و آب استفاده کنید.",
    coverImage: "/Picsart_26-04-26_15-17-47-470.jpg",
    authorName: "کارگاه نیلورا",
    status: "published",
    metaTitle: "فیروزه نیشابور و نشانه‌های اصالت | نیلورا",
    metaDescription:
      "درجه‌بندی رنگ فیروزهٔ نیشابور، نشانه‌های اصالت نگین و اصول مراقبت — به قلم کارگاه نیلورا.",
  },
  {
    slug: "khoshnevisi-roye-rekab",
    title: "خوشنویسی روی رکاب؛ هنری که نام شما را ماندگار می‌کند",
    excerpt:
      "از نستعلیق تا کوفی — تفاوت قلم‌های حکاکی روی انگشتر و اینکه کدام خط برای چه سبکی می‌آید.",
    body: "حکاکی نام روی رکاب انگشتر، سنتی است که از دورهٔ صفویه در کارگاه‌های اصفهان جا افتاد.\n\n## نستعلیق\nقوس‌های نرم و کشیده؛ مناسب نام‌های فارسی و تاریخ‌های مهم. به‌دلیل پیچگی حروف، فقط روی رکاب‌های پهن (۶ میلی‌متر به بالا) انجام می‌شود.\n\n## ثلث\nحروف پرجزئیات و رسمی؛ برای عبارات کلاسیک و مهرهای نفیس.\n\n## کوفی\nخطی هندسی و مدرن که با طرح‌های مینیمال رکاب هم‌خوانی دارد.\n\n## خط معاصر\nتایپوگرافی سادهٔ امروزی برای کسانی که مینیمالیسم را ترجیح می‌دهند.\n\nدر سفارش‌های سفارشی، پیش‌نمایش حروف همیشه پیش از حک نهایی به تأیید مشتری می‌رسد.",
    coverImage: "/Picsart_26-04-26_15-15-33-128.jpg",
    authorName: "کارگاه نیلورا",
    status: "published",
    metaTitle: "خوشنویسی روی رکاب انگشتر | کارگاه نیلورا",
    metaDescription:
      "مقایسهٔ نستعلیق، ثلث، کوفی و خط معاصر در حکاکی رکاب انگشتر و راهنمای انتخاب قلم.",
  },
];

async function seedPromoCodes() {
  for (const promo of SEED_PROMO_CODES) {
    await prisma.promoCode.upsert({
      where: { code: promo.code },
      create: { ...promo, aliases: promo.aliases },
      update: { ...promo, aliases: promo.aliases },
    });
  }
}

async function seedHomeSlider() {
  await prisma.homeSliderItem.deleteMany();
  let sortOrder = 0;
  for (const productId of SLIDER_PRODUCT_IDS) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) continue;
    await prisma.homeSliderItem.create({
      data: { productId, sortOrder: sortOrder++, active: true },
    });
  }
}

async function seedHomeBanner() {
  await prisma.homeBannerSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      enabled: true,
      badge: "عرضهٔ تابستانی",
      title: "بیست درصد تخفیف مجموعهٔ میراث",
      subtitle:
        "برای سفارش‌های بالای ۵۰ میلیون تومان — با کد NILOORA20 در سبد خرید",
      percent: 20,
      ctaLabel: "مشاهدهٔ فروشگاه",
      ctaHref: "/shop",
    },
    update: {
      enabled: true,
      badge: "عرضهٔ تابستانی",
      title: "بیست درصد تخفیف مجموعهٔ میراث",
      subtitle:
        "برای سفارش‌های بالای ۵۰ میلیون تومان — با کد NILOORA20 در سبد خرید",
      percent: 20,
      ctaLabel: "مشاهدهٔ فروشگاه",
      ctaHref: "/shop",
    },
  });
}

async function seedPosts() {
  for (const post of SEED_POSTS) {
    await prisma.post.upsert({
      where: { slug: post.slug },
      create: {
        ...post,
        publishedAt: post.status === "published" ? new Date() : null,
      },
      update: { ...post },
    });
  }
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "",
});

const prisma = new PrismaClient({ adapter });
const jsonNull = Prisma.JsonNull;

async function seedCollections() {
  for (const collection of collections) {
    await prisma.collection.upsert({
      where: { id: collection.id },
      create: {
        id: collection.id,
        name: collection.name,
        namePersian: collection.namePersian,
      },
      update: {
        name: collection.name,
        namePersian: collection.namePersian,
      },
    });
  }
}

async function seedProducts() {
  for (const product of products) {
    const listing = getSeedListing(product.id);
    if (!listing) {
      throw new Error(`Missing listing for product: ${product.id}`);
    }
    const productId = product.id;
    const stock = product.availability === "sold" ? 0 : 1;

    await prisma.product.upsert({
      where: { id: productId },
      create: {
        id: productId,
        name: product.name,
        namePersian: product.namePersian,
        price: product.price,
        listPrice: product.listPrice ?? null,
        discountPercent: product.discountPercent ?? null,
        image: getSeedImage(product.id),
        category: product.category,
        metal: product.metal,
        stone: product.stone,
        stoneShape: product.stoneShape,
        engravingType: product.engravingType,
        availability: product.availability,
        stock,
        condition: product.condition ?? "new",
        featured: Boolean(product.featured),
        bestseller: Boolean(product.bestseller),
        initialSalesCount: product.initialSalesCount ?? 0,
        collectionId: product.collectionId ?? null,
      },
      update: {
        name: product.name,
        namePersian: product.namePersian,
        price: product.price,
        listPrice: product.listPrice ?? null,
        discountPercent: product.discountPercent ?? null,
        image: getSeedImage(product.id),
        category: product.category,
        metal: product.metal,
        stone: product.stone,
        stoneShape: product.stoneShape,
        engravingType: product.engravingType,
        availability: product.availability,
        stock,
        condition: product.condition ?? "new",
        featured: Boolean(product.featured),
        bestseller: Boolean(product.bestseller),
        initialSalesCount: product.initialSalesCount ?? 0,
        collectionId: product.collectionId ?? null,
      },
    });

    await prisma.productListing.upsert({
      where: { productId },
      create: {
        productId,
        tier: listing.tier,
        headline: listing.headline,
        details: listing.details,
        extraTags: listing.extraTags ?? jsonNull,
      },
      update: {
        tier: listing.tier,
        headline: listing.headline,
        details: listing.details,
        extraTags: listing.extraTags ?? jsonNull,
      },
    });

    await prisma.productImage.deleteMany({ where: { productId } });
    const images = getSeedGalleryImages();
    if (images.length > 0) {
      await prisma.productImage.createMany({
        data: images.map((url, index) => ({
          productId,
          url,
          sortOrder: index,
        })),
      });
    }

    if (product.preOwned) {
      await prisma.preOwnedInfo.upsert({
        where: { productId },
        create: {
          productId,
          originalPrice: product.preOwned.originalPrice,
          depreciationPercent: product.preOwned.depreciationPercent,
          grade: product.preOwned.grade,
          certifiedRefurbished: product.preOwned.certifiedRefurbished,
          canRemake: product.preOwned.canRemake,
          buybackRatePercent: product.preOwned.buybackRatePercent,
          story: product.preOwned.story ?? null,
        },
        update: {
          originalPrice: product.preOwned.originalPrice,
          depreciationPercent: product.preOwned.depreciationPercent,
          grade: product.preOwned.grade,
          certifiedRefurbished: product.preOwned.certifiedRefurbished,
          canRemake: product.preOwned.canRemake,
          buybackRatePercent: product.preOwned.buybackRatePercent,
          story: product.preOwned.story ?? null,
        },
      });
    } else {
      await prisma.preOwnedInfo.deleteMany({ where: { productId } });
    }
  }
}

async function main() {
  const adminPhone = process.env.ADMIN_PHONE ?? "";
  if (adminPhone) {
    await prisma.user.upsert({
      where: { phone: adminPhone },
      create: {
        name: "ادمین گالری",
        phone: adminPhone,
        role: "admin",
        passwordHash: "OTP_ONLY_ADMIN_SEEDED",
      },
      update: {
        role: "admin",
      },
    });
  }

  await seedCollections();
  await seedProducts();
  await seedPromoCodes();
  await seedHomeSlider();
  await seedHomeBanner();
  await seedPosts();
  await prisma.homeTestimonial.deleteMany();
  await prisma.homeInstagramPost.deleteMany();
  if (testimonials.length > 0) {
    await prisma.homeTestimonial.createMany({
      data: testimonials.map((item, index) => ({
        id: item.id,
        name: item.name,
        location: item.location,
        text: item.text,
        rating: item.rating,
        sortOrder: index,
      })),
    });
  }
  if (instagramPosts.length > 0) {
    await prisma.homeInstagramPost.createMany({
      data: instagramPosts.map((item, index) => ({
        id: item.id,
        image: item.image,
        likes: item.likes,
        sortOrder: index,
      })),
    });
  }

  console.log(
    `Seeded ${collections.length} collections, ${products.length} products, ${SEED_PROMO_CODES.length} promo codes, ${SEED_POSTS.length} posts, ${testimonials.length} testimonials and ${instagramPosts.length} instagram posts.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
