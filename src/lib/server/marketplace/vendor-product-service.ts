import { randomBytes } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";
import {
  assertVendorSubmitTransition,
  canVendorEditProduct,
} from "@/lib/server/marketplace/publication-workflow";
import { logProductStateChange } from "@/lib/server/marketplace/log-product-state-change";
import { requireActiveVendor } from "@/lib/server/vendor/vendor-guards";
import { listVendorOrderLines } from "@/lib/server/vendor/vendor-order-lines";
import { adminProductInclude, toAdminProductDto } from "@/lib/server/products/admin-product-dto";
import { PRODUCT_AVAILABILITY_OPTIONS } from "@/lib/product-status";
import type { ProductAvailability } from "@/lib/types";

export type VendorProductInput = {
  name: string;
  namePersian: string;
  price: number;
  image: string;
  category?: string;
  metal?: string;
  stone?: string;
  stoneShape?: string;
  engravingType?: string;
  availability?: ProductAvailability;
  stock?: number;
  listingHeadline?: string;
};

function newVendorProductId(vendorSlug: string): string {
  const suffix = randomBytes(4).toString("hex");
  return `v-${vendorSlug}-${suffix}`.slice(0, 64);
}

async function countVendorProducts(vendorId: string) {
  const [draftLike, pending, published] = await Promise.all([
    prisma.product.count({
      where: {
        vendorId,
        publicationStatus: { in: ["draft", "rejected"] },
      },
    }),
    prisma.product.count({
      where: { vendorId, publicationStatus: "pending_review" },
    }),
    prisma.product.count({
      where: { vendorId, publicationStatus: "published" },
    }),
  ]);
  return { draftLike, pending, published, total: draftLike + pending + published };
}

async function assertVendorQuota(vendorId: string, mode: "create" | "submit") {
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    include: { settings: true },
  });
  if (!vendor?.settings) return;

  const counts = await countVendorProducts(vendorId);
  const settings = vendor.settings;

  if (mode === "submit" && counts.pending >= settings.maxPendingSubmissions) {
    throw new Error("VENDOR_QUOTA_PENDING_LIMIT");
  }

  if (
    mode === "create" &&
    settings.quotaMode !== "unlimited" &&
    counts.total >= settings.maxActiveProducts + settings.maxPendingSubmissions
  ) {
    throw new Error("VENDOR_QUOTA_PRODUCTS_LIMIT");
  }
}

function normalizeAvailability(value?: string): ProductAvailability {
  if (value && PRODUCT_AVAILABILITY_OPTIONS.includes(value as ProductAvailability)) {
    return value as ProductAvailability;
  }
  return "ready";
}

export async function listVendorProducts(userId: string) {
  const membership = await requireActiveVendor(userId);
  const rows = await prisma.product.findMany({
    where: { vendorId: membership.vendorId },
    include: adminProductInclude,
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(toAdminProductDto);
}

export async function createVendorProduct(userId: string, input: VendorProductInput) {
  const membership = await requireActiveVendor(userId);
  await assertVendorQuota(membership.vendorId, "create");

  const productId = newVendorProductId(membership.vendor.slug);

  const row = await prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        id: productId,
        vendorId: membership.vendorId,
        publicationStatus: "draft",
        name: input.name.trim(),
        namePersian: input.namePersian.trim(),
        price: Math.max(0, Math.round(input.price)),
        image: input.image.trim(),
        category: input.category?.trim() || "signet",
        metal: input.metal?.trim() || "sterling",
        stone: input.stone?.trim() || "turquoise",
        stoneShape: input.stoneShape?.trim() || "round",
        engravingType: input.engravingType?.trim() || "none",
        availability: normalizeAvailability(input.availability),
        stock: Math.max(0, Math.round(input.stock ?? 1)),
        condition: "new",
        featured: false,
        bestseller: false,
      },
    });

    await tx.productListing.create({
      data: {
        productId: product.id,
        tier: "premium",
        headline: input.listingHeadline?.trim() || input.namePersian.trim(),
        details: [],
      },
    });

    await tx.productImage.create({
      data: { productId: product.id, url: input.image.trim(), sortOrder: 0 },
    });

    await logProductStateChange(tx, {
      productId: product.id,
      vendorId: membership.vendorId,
      actorUserId: userId,
      actorRole: "vendor",
      fromStatus: null,
      toStatus: "draft",
      action: "submitted",
      note: "vendor_create",
    });

    return tx.product.findUniqueOrThrow({
      where: { id: product.id },
      include: adminProductInclude,
    });
  });

  return toAdminProductDto(row);
}

export async function updateVendorProduct(
  userId: string,
  productId: string,
  input: Partial<VendorProductInput>
) {
  const membership = await requireActiveVendor(userId);
  const existing = await prisma.product.findUnique({ where: { id: productId } });
  if (!existing) throw new Error("PRODUCT_NOT_FOUND");
  if (existing.vendorId !== membership.vendorId) throw new Error("VENDOR_PRODUCT_FORBIDDEN");
  if (!canVendorEditProduct(existing.publicationStatus)) {
    throw new Error("PRODUCT_NOT_EDITABLE");
  }

  const row = await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: productId },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.namePersian !== undefined ? { namePersian: input.namePersian.trim() } : {}),
        ...(input.price !== undefined ? { price: Math.max(0, Math.round(input.price)) } : {}),
        ...(input.image !== undefined ? { image: input.image.trim() } : {}),
        ...(input.category !== undefined ? { category: input.category.trim() } : {}),
        ...(input.metal !== undefined ? { metal: input.metal.trim() } : {}),
        ...(input.stone !== undefined ? { stone: input.stone.trim() } : {}),
        ...(input.stoneShape !== undefined ? { stoneShape: input.stoneShape.trim() } : {}),
        ...(input.engravingType !== undefined ? { engravingType: input.engravingType.trim() } : {}),
        ...(input.availability !== undefined
          ? { availability: normalizeAvailability(input.availability) }
          : {}),
        ...(input.stock !== undefined ? { stock: Math.max(0, Math.round(input.stock)) } : {}),
      },
    });

    if (input.listingHeadline !== undefined) {
      await tx.productListing.upsert({
        where: { productId },
        create: {
          productId,
          tier: "premium",
          headline: input.listingHeadline.trim(),
          details: [],
        },
        update: { headline: input.listingHeadline.trim() },
      });
    }

    return tx.product.findUniqueOrThrow({
      where: { id: productId },
      include: adminProductInclude,
    });
  });

  return toAdminProductDto(row);
}

export async function submitVendorProduct(userId: string, productId: string) {
  const membership = await requireActiveVendor(userId);

  const existing = await prisma.product.findUnique({ where: { id: productId } });
  if (!existing) throw new Error("PRODUCT_NOT_FOUND");
  if (existing.vendorId !== membership.vendorId) throw new Error("VENDOR_PRODUCT_FORBIDDEN");

  if (existing.publicationStatus === "pending_review") {
    const current = await prisma.product.findUniqueOrThrow({
      where: { id: productId },
      include: adminProductInclude,
    });
    return { product: toAdminProductDto(current), deduped: true };
  }

  await assertVendorQuota(membership.vendorId, "submit");
  const toStatus = assertVendorSubmitTransition(existing.publicationStatus);

  const row = await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: productId },
      data: { publicationStatus: toStatus },
    });
    await logProductStateChange(tx, {
      productId,
      vendorId: membership.vendorId,
      actorUserId: userId,
      actorRole: "vendor",
      fromStatus: existing.publicationStatus,
      toStatus,
      action: "submitted",
    });
    return tx.product.findUniqueOrThrow({
      where: { id: productId },
      include: adminProductInclude,
    });
  });

  return { product: toAdminProductDto(row), deduped: false };
}

export async function listVendorOrders(userId: string) {
  const membership = await requireActiveVendor(userId);
  return listVendorOrderLines(membership.vendorId, 100);
}
