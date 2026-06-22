import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

dotenv.config({ path: ".env.local" });
dotenv.config();

const SAMPLE_DISCOUNTS = [15, 20, 25, 10, 30, 18, 12, 22] as const;

function resolveProductPricing(input: {
  price: number;
  listPrice: number | null;
  discountPercent: number | null;
}): { price: number; listPrice: number | null; discountPercent: number | null } {
  const price = input.price;
  let listPrice = input.listPrice;
  let discountPercent = input.discountPercent;

  if (discountPercent != null && discountPercent > 0) {
    if (listPrice == null || listPrice < price) {
      listPrice = Math.round(price / (1 - discountPercent / 100));
    }
  } else if (listPrice != null && listPrice > price) {
    discountPercent = Math.round(((listPrice - price) / listPrice) * 100);
  } else {
    listPrice = null;
    discountPercent = null;
  }

  if (listPrice != null && listPrice < price) {
    listPrice = price;
    discountPercent = null;
  }

  return { price, listPrice, discountPercent };
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "",
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const candidates = await prisma.product.findMany({
    where: {
      price: { gt: 0 },
      availability: { not: "sold" },
      OR: [{ discountPercent: null }, { discountPercent: 0 }],
    },
    select: { id: true, name: true, price: true },
    orderBy: [{ initialSalesCount: "desc" }, { bestseller: "desc" }, { id: "desc" }],
    take: SAMPLE_DISCOUNTS.length,
  });

  if (candidates.length === 0) {
    console.log("No eligible products without discounts were found.");
    return;
  }

  const updated: Array<{ id: string; name: string; discountPercent: number | null }> = [];

  for (let index = 0; index < candidates.length; index += 1) {
    const product = candidates[index]!;
    const discountPercent = SAMPLE_DISCOUNTS[index % SAMPLE_DISCOUNTS.length]!;
    const pricing = resolveProductPricing({
      price: product.price,
      listPrice: null,
      discountPercent,
    });

    await prisma.product.update({
      where: { id: product.id },
      data: {
        price: pricing.price,
        listPrice: pricing.listPrice,
        discountPercent: pricing.discountPercent,
        discountEndsAt: new Date("2026-07-15T23:59:59+03:30"),
      },
    });

    updated.push({
      id: product.id,
      name: product.name,
      discountPercent: pricing.discountPercent,
    });
  }

  console.log(`Applied sample discounts to ${updated.length} products:`);
  for (const item of updated) {
    console.log(`- ${item.id} (${item.discountPercent}%) — ${item.name}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
