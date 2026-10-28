import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

/**
 * E2E test seed — runs ONLY against the niloora_test database.
 * Creates isolated, recognizable test users and a minimal catalog.
 * Idempotent: safe to run before every suite.
 */

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "",
});
const prisma = new PrismaClient({ adapter });

// Test users — all phones in the 0999 range (never a real customer number)
export const TEST_ADMIN_PHONE = "09990000001";
export const TEST_CUSTOMER_PHONE = "09990000002";
export const TEST_CUSTOMER2_PHONE = "09990000003";
export const TEST_SELLER_PHONE = "09990000004";
export const TEST_SELLER2_PHONE = "09990000005";
const TEST_PASSWORD = "Test@1234";

const TEST_PRODUCTS = [
  {
    id: "e2e-ring-alpha",
    name: "E2E Ring Alpha",
    namePersian: "انگشتر تست آلفا",
    price: 60_000_000,
    category: "solitaire",
    metal: "sterling",
    stone: "diamond",
    stoneShape: "round",
    engravingType: "none",
    availability: "ready",
    stock: 3,
  },
  {
    id: "e2e-ring-lastunit",
    name: "E2E Ring Last Unit",
    namePersian: "انگشتر تست آخرین موجودی",
    price: 40_000_000,
    category: "signet",
    metal: "oxidized",
    stone: "onyx",
    stoneShape: "cushion",
    engravingType: "none",
    availability: "ready",
    stock: 1,
  },
  {
    id: "e2e-ring-soldout",
    name: "E2E Ring Sold Out",
    namePersian: "انگشتر تست ناموجود",
    price: 30_000_000,
    category: "vintage",
    metal: "rhodium",
    stone: "emerald",
    stoneShape: "oval",
    engravingType: "none",
    availability: "sold",
    stock: 0,
  },
];

async function main() {
  if (!process.env.DATABASE_URL?.includes("niloora_test")) {
    throw new Error("SAFETY: refusing to seed a non-test database");
  }

  const passwordHash = await hash(TEST_PASSWORD, 4);

  // users
  const admin = await prisma.user.upsert({
    where: { phone: TEST_ADMIN_PHONE },
    create: { name: "E2E مدیر", phone: TEST_ADMIN_PHONE, role: "admin", passwordHash },
    update: { role: "admin", passwordHash },
  });
  const customer = await prisma.user.upsert({
    where: { phone: TEST_CUSTOMER_PHONE },
    create: { name: "E2E مشتری یک", phone: TEST_CUSTOMER_PHONE, role: "user", passwordHash },
    update: { role: "user", passwordHash },
  });
  const customer2 = await prisma.user.upsert({
    where: { phone: TEST_CUSTOMER2_PHONE },
    create: { name: "E2E مشتری دو", phone: TEST_CUSTOMER2_PHONE, role: "user", passwordHash },
    update: { role: "user", passwordHash },
  });

  // marketplace sellers
  const sellerUser = await prisma.user.upsert({
    where: { phone: TEST_SELLER_PHONE },
    create: { name: "E2E فروشنده یک", phone: TEST_SELLER_PHONE, role: "user", passwordHash },
    update: { passwordHash },
  });
  const seller2User = await prisma.user.upsert({
    where: { phone: TEST_SELLER2_PHONE },
    create: { name: "E2E فروشنده دو", phone: TEST_SELLER2_PHONE, role: "user", passwordHash },
    update: { passwordHash },
  });

  const seller = await prisma.seller.upsert({
    where: { userId: sellerUser.id },
    create: {
      userId: sellerUser.id,
      shopName: "غرفه تست الف",
      slug: "e2e-shop-a",
      status: "active",
      commissionPercent: 10,
    },
    update: { status: "active", commissionPercent: 10 },
  });
  const seller2 = await prisma.seller.upsert({
    where: { userId: seller2User.id },
    create: {
      userId: seller2User.id,
      shopName: "غرفه تست ب",
      slug: "e2e-shop-b",
      status: "active",
      commissionPercent: 15,
    },
    update: { status: "active", commissionPercent: 15 },
  });

  // clean slate for transactional entities created by previous runs
  await prisma.orderNotification.deleteMany();
  await prisma.paymentLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.sellerLedgerEntry.deleteMany();
  await prisma.sellerPayout.deleteMany();
  await prisma.order.deleteMany({ where: { userId: { in: [admin.id, customer.id, customer2.id] } } });
  await prisma.session.deleteMany({ where: { userId: { in: [admin.id, customer.id, customer2.id] } } });
  // seller-owned test products from previous runs
  await prisma.product.deleteMany({ where: { sellerId: { in: [seller.id, seller2.id] } } });

  // catalog
  for (const p of TEST_PRODUCTS) {
    await prisma.product.upsert({
      where: { id: p.id },
      create: { ...p, image: "/Picsart_26-04-26_15-15-33-128.jpg", condition: "new" },
      update: { ...p, condition: "new" },
    });
    await prisma.productListing.upsert({
      where: { productId: p.id },
      create: {
        productId: p.id,
        tier: "premium",
        headline: "E2E تست",
        details: ["رکاب تست", `سایز: ۵۴`],
      },
      update: { headline: "E2E تست" },
    });
  }

  console.log(
    `E2E seed done: 5 users (admin=${TEST_ADMIN_PHONE}, customer=${TEST_CUSTOMER_PHONE}, customer2=${TEST_CUSTOMER2_PHONE}), ${TEST_PRODUCTS.length} products`
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
