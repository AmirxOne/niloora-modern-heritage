import type { Product } from "@/lib/types";
import type { HomeSliderItemDto } from "@/lib/types/home-content";
import {
  HOME_SLIDER_BANNER_PRODUCT_IDS,
  resolveSliderBannerUrl,
} from "@/lib/home/slider-banner-images";
import { prisma } from "@/lib/server/prisma";
import { getSliderProducts, mapDbProduct } from "@/lib/server/products";
import type { Prisma } from "@prisma/client";

function resolveDefaultHomeSliderProducts(catalog: Product[], limit = 6): Product[] {
  const catalogById = new Map(catalog.map((product) => [product.id, product]));
  const fromBanners = HOME_SLIDER_BANNER_PRODUCT_IDS.map((id) => catalogById.get(id)).filter(
    (product): product is Product => product !== undefined
  );
  if (fromBanners.length > 0) {
    return fromBanners.slice(0, limit).map((product) => attachSliderBanner(product, null));
  }
  return getSliderProducts(catalog, limit);
}

function attachSliderBanner(product: Product, bannerImageUrl: string | null | undefined): Product {
  const resolved = resolveSliderBannerUrl(product.id, bannerImageUrl);
  if (!resolved) return product;
  return { ...product, sliderBannerImageUrl: resolved };
}

const sliderProductInclude = {
  listing: true,
  preOwnedInfo: true,
  images: { orderBy: { sortOrder: "asc" as const } },
  collection: true,
  vendor: { select: { id: true, slug: true, displayName: true, status: true } },
} satisfies Prisma.ProductInclude;

function normalizeBannerImageUrl(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function listAdminSliderItems(): Promise<HomeSliderItemDto[]> {
  const rows = await prisma.homeSliderItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { product: { select: { namePersian: true, name: true, image: true } } },
  });
  return rows.map((row) => ({
    id: row.id,
    productId: row.productId,
    bannerImageUrl: row.bannerImageUrl,
    sortOrder: row.sortOrder,
    active: row.active,
    productName: row.product.namePersian || row.product.name,
    productImage:
      resolveSliderBannerUrl(row.productId, row.bannerImageUrl) ?? row.product.image,
  }));
}

export async function resolveHomeSliderProducts(
  catalog: Product[],
  limit = 6
): Promise<Product[]> {
  const rows = await prisma.homeSliderItem.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    take: limit,
  });

  if (rows.length === 0) return resolveDefaultHomeSliderProducts(catalog, limit);

  const products = await prisma.product.findMany({
    where: { id: { in: rows.map((row) => row.productId) } },
    include: sliderProductInclude,
  });
  const productById = new Map(products.map((p) => [p.id, p]));
  const catalogById = new Map(catalog.map((p) => [p.id, p]));

  const fromDb = rows
    .map((row) => {
      const dbProduct = productById.get(row.productId);
      if (!dbProduct) return null;
      const mapped = mapDbProduct(dbProduct);
      const base = catalogById.get(mapped.id) ?? mapped;
      return attachSliderBanner(base, row.bannerImageUrl);
    })
    .filter((p): p is Product => p !== null);

  return fromDb.slice(0, limit);
}

export async function createSliderItem(input: {
  productId: string;
  bannerImageUrl?: string | null;
  sortOrder?: number;
  active?: boolean;
}) {
  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product) throw new Error("PRODUCT_NOT_FOUND");

  const bannerImageUrl =
    normalizeBannerImageUrl(input.bannerImageUrl) ??
    resolveSliderBannerUrl(input.productId, null) ??
    null;

  return prisma.homeSliderItem.create({
    data: {
      productId: input.productId,
      bannerImageUrl,
      sortOrder: input.sortOrder ?? 0,
      active: input.active ?? true,
    },
  });
}

export async function updateSliderItem(
  id: string,
  input: Partial<{
    productId: string;
    bannerImageUrl: string | null;
    sortOrder: number;
    active: boolean;
  }>
) {
  if (input.productId) {
    const product = await prisma.product.findUnique({ where: { id: input.productId } });
    if (!product) throw new Error("PRODUCT_NOT_FOUND");
  }

  const bannerImageUrl = normalizeBannerImageUrl(input.bannerImageUrl);

  return prisma.homeSliderItem.update({
    where: { id },
    data: {
      ...(input.productId !== undefined ? { productId: input.productId } : {}),
      ...(bannerImageUrl !== undefined ? { bannerImageUrl } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
    },
  });
}

export async function deleteSliderItem(id: string) {
  return prisma.homeSliderItem.delete({ where: { id } });
}
