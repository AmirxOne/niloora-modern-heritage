import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";
import { normalizeCatalogProductPricing } from "../src/lib/catalog/product-catalog";
import { DISCOUNT_COUNTDOWN } from "../src/lib/discounts-config";
import {
  seedProducts as products,
  seedCollections as collections,
  seedTestimonials as testimonials,
  seedInstagramPosts as instagramPosts,
  getSeedImage,
  getSeedGalleryImages,
  getSeedListing,
} from "./seed-data";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "",
});

const prisma = new PrismaClient({ adapter });
const jsonNull = Prisma.JsonNull;

function seedReferralCode(phone: string): string {
  return createHash("sha256")
    .update(phone)
    .digest("hex")
    .slice(0, 8)
    .toUpperCase();
}

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
    const pricing = normalizeCatalogProductPricing({
      price: product.price,
      listPrice: product.listPrice,
      discountPercent: product.discountPercent,
    });

    await prisma.product.upsert({
      where: { id: productId },
      create: {
        id: productId,
        name: product.name,
        namePersian: product.namePersian,
        price: pricing.price,
        listPrice: pricing.listPrice ?? null,
        discountPercent: pricing.discountPercent ?? null,
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
        discountEndsAt: product.discountEndsAt ? new Date(product.discountEndsAt) : null,
      },
      update: {
        name: product.name,
        namePersian: product.namePersian,
        price: pricing.price,
        listPrice: pricing.listPrice ?? null,
        discountPercent: pricing.discountPercent ?? null,
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
        discountEndsAt: product.discountEndsAt ? new Date(product.discountEndsAt) : null,
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

async function seedHomeBannerCountdown() {
  await prisma.homeBannerSettings.updateMany({
    data: {
      countdownEnabled: DISCOUNT_COUNTDOWN.enabled,
      countdownEndsAt: DISCOUNT_COUNTDOWN.defaultEndsAt
        ? new Date(DISCOUNT_COUNTDOWN.defaultEndsAt)
        : null,
    },
  });
}

const PLATFORM_DEFAULT_COMMISSION_RULE_ID = "platform-default-commission";

async function seedVendorFinance() {
  const effectiveFrom = new Date("2026-01-01T00:00:00.000Z");
  await prisma.vendorCommissionRule.upsert({
    where: { id: PLATFORM_DEFAULT_COMMISSION_RULE_ID },
    create: {
      id: PLATFORM_DEFAULT_COMMISSION_RULE_ID,
      vendorId: null,
      commissionType: "percentage",
      value: 1000,
      effectiveFrom,
      label: "Platform default 10%",
    },
    update: {
      commissionType: "percentage",
      value: 1000,
      effectiveFrom,
      label: "Platform default 10%",
    },
  });
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
        referralCode: seedReferralCode(adminPhone),
      },
      update: {
        role: "admin",
      },
    });
  }

  await seedCollections();
  await seedProducts();
  await seedHomeBannerCountdown();
  await seedVendorFinance();
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
    `Seeded ${collections.length} collections, ${products.length} products, ${testimonials.length} testimonials and ${instagramPosts.length} instagram posts.`
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
