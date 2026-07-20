import { prisma } from "@/lib/server/prisma";
import { getVendorTrustScore } from "@/lib/server/marketplace/vendor-trust-service";
import { mapDbProduct } from "@/lib/server/products";
import type { Product } from "@/lib/types";
import { VENDOR_PORTAL_SEGMENTS } from "@/lib/vendor/portal-paths";

const vendorProductInclude = {
  listing: true,
  preOwnedInfo: true,
  images: { orderBy: { sortOrder: "asc" as const } },
  collection: true,
  vendor: { select: { id: true, slug: true, displayName: true, status: true } },
} as const;

export type PublicVendorStorefront = {
  id: string;
  slug: string;
  displayName: string;
  displayNameFa?: string;
  description?: string;
  profileImageUrl?: string;
  bannerImageUrl?: string;
  trustScore?: number;
  products: Product[];
};

export async function getPublicVendorStorefront(
  slug: string
): Promise<PublicVendorStorefront | null> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized || VENDOR_PORTAL_SEGMENTS.has(normalized)) return null;

  const vendor = await prisma.vendor.findUnique({
    where: { slug: normalized },
    select: {
      id: true,
      slug: true,
      displayName: true,
      displayNameFa: true,
      description: true,
      profileImageUrl: true,
      bannerImageUrl: true,
      status: true,
    },
  });

  if (!vendor || vendor.status !== "active") return null;

  const rows = await prisma.product.findMany({
    where: {
      vendorId: vendor.id,
      publicationStatus: "published",
    },
    include: vendorProductInclude,
    orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
  });

  const products = rows.map((row) => mapDbProduct(row));
  const trustScore = await getVendorTrustScore(vendor.id);

  return {
    id: vendor.id,
    slug: vendor.slug,
    displayName: vendor.displayName,
    displayNameFa: vendor.displayNameFa ?? undefined,
    description: vendor.description ?? undefined,
    profileImageUrl: vendor.profileImageUrl ?? undefined,
    bannerImageUrl: vendor.bannerImageUrl ?? undefined,
    trustScore,
    products,
  };
}
