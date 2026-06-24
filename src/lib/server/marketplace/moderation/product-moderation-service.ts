import type { Prisma, ProductPublicationStatus } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";
import { logProductStateChange } from "@/lib/server/marketplace/log-product-state-change";
import { syncProductSearchIndexSafe } from "@/lib/search/sync-product-search";
import {
  adminApproveTargetStatus,
  adminRejectTargetStatus,
  assertAdminModerationTransition,
} from "@/lib/server/marketplace/publication-workflow";
import { adminProductInclude, toAdminProductDto } from "@/lib/server/products/admin-product-dto";

type PrismaTx = Prisma.TransactionClient;

export async function getPendingProducts() {
  const rows = await prisma.product.findMany({
    where: {
      publicationStatus: "pending_review",
      vendorId: { not: null },
    },
    include: {
      ...adminProductInclude,
      vendor: { select: { id: true, slug: true, displayName: true, status: true } },
    },
    orderBy: { updatedAt: "asc" },
  });

  return rows.map((row) => ({
    ...toAdminProductDto(row),
    vendor: row.vendor
      ? {
          id: row.vendor.id,
          slug: row.vendor.slug,
          displayName: row.vendor.displayName,
          status: row.vendor.status,
        }
      : null,
  }));
}

export async function approveProduct(input: {
  productId: string;
  actorUserId: string;
  actorRole: string;
  note?: string | null;
}) {
  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product) throw new Error("PRODUCT_NOT_FOUND");

  const toStatus = adminApproveTargetStatus();
  assertAdminModerationTransition(product.publicationStatus, toStatus);

  const row = await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: input.productId },
      data: { publicationStatus: toStatus },
    });
    await logProductStateChange(tx, {
      productId: input.productId,
      vendorId: product.vendorId,
      actorUserId: input.actorUserId,
      actorRole: input.actorRole,
      fromStatus: product.publicationStatus,
      toStatus,
      action: "approved",
      note: input.note,
    });
    return tx.product.findUniqueOrThrow({
      where: { id: input.productId },
      include: adminProductInclude,
    });
  });

  await syncProductSearchIndexSafe(input.productId);
  return toAdminProductDto(row);
}

export async function rejectProduct(input: {
  productId: string;
  actorUserId: string;
  actorRole: string;
  reason: string;
}) {
  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product) throw new Error("PRODUCT_NOT_FOUND");

  const toStatus = adminRejectTargetStatus();
  assertAdminModerationTransition(product.publicationStatus, toStatus);

  const row = await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: input.productId },
      data: { publicationStatus: toStatus },
    });
    await logProductStateChange(tx, {
      productId: input.productId,
      vendorId: product.vendorId,
      actorUserId: input.actorUserId,
      actorRole: input.actorRole,
      fromStatus: product.publicationStatus,
      toStatus,
      action: "rejected",
      note: input.reason,
    });
    return tx.product.findUniqueOrThrow({
      where: { id: input.productId },
      include: adminProductInclude,
    });
  });

  await syncProductSearchIndexSafe(input.productId);
  return toAdminProductDto(row);
}

export type EditAndApproveProductInput = {
  productId: string;
  actorUserId: string;
  actorRole: string;
  note?: string | null;
  patch: Prisma.ProductUpdateInput;
};

export async function editAndApproveProduct(input: EditAndApproveProductInput) {
  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product) throw new Error("PRODUCT_NOT_FOUND");

  const toStatus = adminApproveTargetStatus();
  assertAdminModerationTransition(product.publicationStatus, toStatus);

  const row = await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: input.productId },
      data: {
        ...input.patch,
        publicationStatus: toStatus,
      },
    });
    await logProductStateChange(tx, {
      productId: input.productId,
      vendorId: product.vendorId,
      actorUserId: input.actorUserId,
      actorRole: input.actorRole,
      fromStatus: product.publicationStatus,
      toStatus,
      action: "edited_by_admin",
      note: input.note,
    });
    return tx.product.findUniqueOrThrow({
      where: { id: input.productId },
      include: adminProductInclude,
    });
  });

  await syncProductSearchIndexSafe(input.productId);
  return toAdminProductDto(row);
}
