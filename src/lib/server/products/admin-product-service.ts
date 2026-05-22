import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";
import type { AdminProductPayload } from "@/lib/server/products/admin-product";
import {
  adminProductInclude,
  toAdminProductDto,
  type DbProductAdmin,
} from "@/lib/server/products/admin-product-dto";

async function assertCollectionExists(collectionId: string | null) {
  if (!collectionId) return;
  const found = await prisma.collection.findUnique({ where: { id: collectionId } });
  if (!found) throw new Error("COLLECTION_NOT_FOUND");
}

function productDataFromPayload(data: AdminProductPayload): Prisma.ProductCreateInput {
  return {
    id: data.id,
    name: data.name,
    namePersian: data.namePersian,
    price: data.price,
    listPrice: data.listPrice,
    discountPercent: data.discountPercent,
    image: data.image,
    category: data.category,
    metal: data.metal,
    stone: data.stone,
    stoneShape: data.stoneShape,
    engravingType: data.engravingType,
    availability: data.availability,
    stock: data.stock,
    condition: "new",
    discountEndsAt: data.discountEndsAt ? new Date(data.discountEndsAt) : null,
    featured: data.featured,
    bestseller: data.bestseller,
    collection: data.collectionId
      ? { connect: { id: data.collectionId } }
      : undefined,
  };
}

export async function listAdminProducts(): Promise<ReturnType<typeof toAdminProductDto>[]> {
  const rows = await prisma.product.findMany({
    include: adminProductInclude,
    orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
  });
  return rows.map(toAdminProductDto);
}

export async function getAdminProductById(id: string) {
  const row = await prisma.product.findUnique({
    where: { id },
    include: adminProductInclude,
  });
  return row ? toAdminProductDto(row) : null;
}

export async function createAdminProduct(data: AdminProductPayload) {
  await assertCollectionExists(data.collectionId);

  const existing = await prisma.product.findUnique({ where: { id: data.id } });
  if (existing) throw new Error("PRODUCT_EXISTS");

  const row = await prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: productDataFromPayload(data),
    });

    await tx.productListing.create({
      data: {
        productId: product.id,
        tier: data.listingTier,
        headline: data.listingHeadline,
        details: [],
      },
    });

    const gallery = [data.image, ...data.images];
    if (gallery.length > 0) {
      await tx.productImage.createMany({
        data: gallery.map((url, index) => ({
          productId: product.id,
          url,
          sortOrder: index,
        })),
        skipDuplicates: true,
      });
    }

    return tx.product.findUniqueOrThrow({
      where: { id: product.id },
      include: adminProductInclude,
    });
  });

  return toAdminProductDto(row);
}

export async function updateAdminProduct(id: string, data: AdminProductPayload) {
  if (data.id !== id) throw new Error("ID_MISMATCH");
  await assertCollectionExists(data.collectionId);

  const row = await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id },
      data: {
        name: data.name,
        namePersian: data.namePersian,
        price: data.price,
        listPrice: data.listPrice,
        discountPercent: data.discountPercent,
        image: data.image,
        category: data.category,
        metal: data.metal,
        stone: data.stone,
        stoneShape: data.stoneShape,
        engravingType: data.engravingType,
        availability: data.availability,
        stock: data.stock,
        featured: data.featured,
        bestseller: data.bestseller,
        collectionId: data.collectionId,
        ...(data.discountEndsAt !== undefined
          ? { discountEndsAt: data.discountEndsAt ? new Date(data.discountEndsAt) : null }
          : {}),
      },
    });

    await tx.productListing.upsert({
      where: { productId: id },
      create: {
        productId: id,
        tier: data.listingTier,
        headline: data.listingHeadline,
        details: [],
      },
      update: {
        tier: data.listingTier,
        headline: data.listingHeadline,
      },
    });

    await tx.productImage.deleteMany({ where: { productId: id } });
    const gallery = [data.image, ...data.images.filter((u) => u !== data.image)];
    if (gallery.length > 0) {
      await tx.productImage.createMany({
        data: gallery.map((url, index) => ({
          productId: id,
          url,
          sortOrder: index,
        })),
        skipDuplicates: true,
      });
    }

    return tx.product.findUniqueOrThrow({
      where: { id },
      include: adminProductInclude,
    });
  });

  return toAdminProductDto(row);
}

export async function deleteAdminProduct(id: string) {
  await prisma.product.delete({ where: { id } });
}
