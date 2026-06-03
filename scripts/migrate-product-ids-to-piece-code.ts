import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { isValidPieceCode, resolvePieceCode } from "@/lib/products/piece-code";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "",
});

const prisma = new PrismaClient({ adapter });

type ProductIdRow = {
  id: string;
};

function computeTargetId(sourceId: string): string {
  if (isValidPieceCode(sourceId)) return sourceId;
  return resolvePieceCode({
    id: sourceId,
    productType: "ring-men",
    pieceCode: null,
    sku: null,
  });
}

function nextPieceCode(code: string): string {
  const match = /^([A-Z]{2}-[A-Z]{3}-)(\d{4})$/.exec(code);
  if (!match) return code;
  const prefix = match[1];
  const current = Number.parseInt(match[2] ?? "1", 10);
  const next = current >= 9999 ? 1 : current + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

async function main() {
  const products = (await prisma.product.findMany({
    select: { id: true },
    orderBy: { id: "asc" },
  })) as ProductIdRow[];

  if (products.length === 0) {
    console.info("[migrate-product-ids-to-piece-code] no products found");
    return;
  }

  const preservedIds = new Set(products.filter((p) => isValidPieceCode(p.id)).map((p) => p.id));
  const mappings: Array<{ from: string; to: string }> = [];
  const usedTargets = new Set<string>(preservedIds);

  for (const product of products) {
    if (isValidPieceCode(product.id)) continue;
    let candidate = computeTargetId(product.id);
    let guard = 0;
    while (usedTargets.has(candidate)) {
      candidate = nextPieceCode(candidate);
      guard += 1;
      if (guard > 10000) {
        throw new Error(
          `[migrate-product-ids-to-piece-code] could not resolve unique piece code for ${product.id}`
        );
      }
    }
    usedTargets.add(candidate);
    if (candidate !== product.id) {
      mappings.push({ from: product.id, to: candidate });
    }
  }

  if (mappings.length === 0) {
    console.info("[migrate-product-ids-to-piece-code] all product ids are already piece codes");
    return;
  }

  await prisma.$transaction(async (tx) => {
    for (const m of mappings) {
      const tempId = `tmp-piece-${m.from}`;
      await tx.$executeRawUnsafe(
        `UPDATE "Product" SET "id" = $1 WHERE "id" = $2`,
        tempId,
        m.from
      );
    }

    for (const m of mappings) {
      const tempId = `tmp-piece-${m.from}`;
      await tx.$executeRawUnsafe(
        `UPDATE "Product" SET "id" = $1 WHERE "id" = $2`,
        m.to,
        tempId
      );
    }
  });

  console.info(
    `[migrate-product-ids-to-piece-code] migrated ${mappings.length.toLocaleString("en-US")} product id(s)`
  );
}

main()
  .catch((error) => {
    console.error("[migrate-product-ids-to-piece-code] failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

