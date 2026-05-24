import { prisma } from "@/lib/server/prisma";
import type { ProductUgcMedia, ProductUgcMediaAdmin, ProductUgcMediaStatus, ProductUgcMediaType } from "@/lib/types";

export type CreateProductUgcInput = {
  productId: string;
  userId: string;
  orderId?: string;
  mediaUrl: string;
  mediaType: ProductUgcMediaType;
  caption?: string;
};

function toDto(row: {
  id: string;
  productId: string;
  userId: string;
  orderId: string | null;
  mediaUrl: string;
  mediaType: string;
  caption: string | null;
  status: string;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): ProductUgcMedia {
  return {
    id: row.id,
    productId: row.productId,
    userId: row.userId,
    orderId: row.orderId ?? undefined,
    mediaUrl: row.mediaUrl,
    mediaType: row.mediaType as ProductUgcMediaType,
    caption: row.caption ?? undefined,
    status: row.status as ProductUgcMediaStatus,
    approvedAt: row.approvedAt?.toISOString(),
    rejectedAt: row.rejectedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listApprovedProductUgc(productId: string): Promise<ProductUgcMedia[]> {
  const rows = await prisma.productUgcMedia.findMany({
    where: { productId, status: "approved" },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return rows.map(toDto);
}

export async function listUserUgc(userId: string): Promise<ProductUgcMedia[]> {
  const rows = await prisma.productUgcMedia.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 80,
  });
  return rows.map(toDto);
}

export async function createProductUgc(input: CreateProductUgcInput): Promise<ProductUgcMedia> {
  const created = await prisma.productUgcMedia.create({
    data: {
      productId: input.productId,
      userId: input.userId,
      orderId: input.orderId ?? null,
      mediaUrl: input.mediaUrl,
      mediaType: input.mediaType,
      caption: input.caption?.trim() || null,
      status: "pending",
    },
  });
  return toDto(created);
}

export async function listPendingUgcForAdmin(): Promise<ProductUgcMediaAdmin[]> {
  const rows = await prisma.productUgcMedia.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { name: true, namePersian: true, image: true } },
      user: { select: { name: true, phone: true } },
    },
  });

  return rows.map((row) => ({
    ...toDto(row),
    productName: row.product.name,
    productNamePersian: row.product.namePersian,
    productImage: row.product.image,
    userName: row.user.name,
    userPhone: row.user.phone,
  }));
}

export async function moderateUgc(
  id: string,
  action: "approve" | "reject"
): Promise<ProductUgcMediaAdmin | null> {
  const updated = await prisma.productUgcMedia.update({
    where: { id },
    data:
      action === "approve"
        ? { status: "approved", approvedAt: new Date(), rejectedAt: null }
        : { status: "rejected", rejectedAt: new Date(), approvedAt: null },
    include: {
      product: { select: { name: true, namePersian: true, image: true } },
      user: { select: { name: true, phone: true } },
    },
  });
  if (!updated) return null;
  return {
    ...toDto(updated),
    productName: updated.product.name,
    productNamePersian: updated.product.namePersian,
    productImage: updated.product.image,
    userName: updated.user.name,
    userPhone: updated.user.phone,
  };
}
