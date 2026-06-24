import type { ProductPublicationStatus } from "@/lib/types/marketplace";
import type { VendorProfileDto } from "@/lib/types/vendor";
import { prisma } from "@/lib/server/prisma";
import { getVendorForUser } from "@/lib/server/vendor/vendor-service";
import {
  countVendorOrdersSince,
  listVendorOrderLines,
  sumVendorGrossSince,
  vendorOrdersSince,
  type VendorOrderLineDto,
} from "@/lib/server/vendor/vendor-order-lines";
import { sumVendorPayoutTotals } from "@/lib/server/marketplace/payout/vendor-payout-service";

export type VendorDashboardProducts = {
  total: number;
  draft: number;
  pending_review: number;
  published: number;
  rejected: number;
  archived: number;
};

export type VendorDashboardQuota = {
  maxActiveProducts: number;
  maxPendingSubmissions: number;
  draftLike: number;
  pending: number;
  published: number;
  atCreateLimit: boolean;
  atSubmitLimit: boolean;
};

export type VendorDashboardDto = {
  vendor: VendorProfileDto | null;
  products: VendorDashboardProducts;
  quota: VendorDashboardQuota;
  orders: {
    count30d: number;
    recent: VendorOrderLineDto[];
  };
  revenue: {
    gross30d: number;
    pendingPayout: number;
    paidTotal: number;
  };
};

const EMPTY_PRODUCTS: VendorDashboardProducts = {
  total: 0,
  draft: 0,
  pending_review: 0,
  published: 0,
  rejected: 0,
  archived: 0,
};

const EMPTY_QUOTA: VendorDashboardQuota = {
  maxActiveProducts: 0,
  maxPendingSubmissions: 0,
  draftLike: 0,
  pending: 0,
  published: 0,
  atCreateLimit: false,
  atSubmitLimit: false,
};

function emptyDashboard(vendor: VendorProfileDto | null): VendorDashboardDto {
  return {
    vendor,
    products: { ...EMPTY_PRODUCTS },
    quota: { ...EMPTY_QUOTA },
    orders: { count30d: 0, recent: [] },
    revenue: { gross30d: 0, pendingPayout: 0, paidTotal: 0 },
  };
}

function countForStatus(
  grouped: Array<{ publicationStatus: ProductPublicationStatus; _count: number }>,
  status: ProductPublicationStatus
): number {
  return grouped.find((row) => row.publicationStatus === status)?._count ?? 0;
}

async function loadProductCounts(vendorId: string): Promise<VendorDashboardProducts> {
  const grouped = await prisma.product.groupBy({
    by: ["publicationStatus"],
    where: { vendorId },
    _count: true,
  });

  const rows = grouped.map((row) => ({
    publicationStatus: row.publicationStatus as ProductPublicationStatus,
    _count: row._count,
  }));

  const draft = countForStatus(rows, "draft");
  const pending_review = countForStatus(rows, "pending_review");
  const published = countForStatus(rows, "published");
  const rejected = countForStatus(rows, "rejected");
  const archived = countForStatus(rows, "archived");
  const approved = countForStatus(rows, "approved");
  const total = rows.reduce((sum, row) => sum + row._count, 0);

  return {
    total,
    draft,
    pending_review,
    published: published + approved,
    rejected,
    archived,
  };
}

function buildQuota(
  settings: { maxActiveProducts: number; maxPendingSubmissions: number; quotaMode: string },
  products: VendorDashboardProducts
): VendorDashboardQuota {
  const draftLike = products.draft + products.rejected;
  const pending = products.pending_review;
  const published = products.published;
  const quotaTotal = draftLike + pending + published;

  const atSubmitLimit = pending >= settings.maxPendingSubmissions;
  const atCreateLimit =
    settings.quotaMode !== "unlimited" &&
    quotaTotal >= settings.maxActiveProducts + settings.maxPendingSubmissions;

  return {
    maxActiveProducts: settings.maxActiveProducts,
    maxPendingSubmissions: settings.maxPendingSubmissions,
    draftLike,
    pending,
    published,
    atCreateLimit,
    atSubmitLimit,
  };
}

export async function getVendorDashboard(userId: string): Promise<VendorDashboardDto> {
  const vendor = await getVendorForUser(userId);
  if (!vendor) return emptyDashboard(null);

  const products = await loadProductCounts(vendor.id);
  const settings = vendor.settings;
  const quota = buildQuota(
    {
      maxActiveProducts: settings.maxActiveProducts,
      maxPendingSubmissions: settings.maxPendingSubmissions,
      quotaMode: settings.quotaMode,
    },
    products
  );

  if (vendor.status !== "active") {
    return {
      vendor,
      products,
      quota,
      orders: { count30d: 0, recent: [] },
      revenue: { gross30d: 0, pendingPayout: 0, paidTotal: 0 },
    };
  }

  const since30d = vendorOrdersSince(30);
  const [count30d, recent, gross30d, payoutTotals] = await Promise.all([
    countVendorOrdersSince(vendor.id, since30d),
    listVendorOrderLines(vendor.id, 10),
    sumVendorGrossSince(vendor.id, since30d),
    sumVendorPayoutTotals(vendor.id),
  ]);

  return {
    vendor,
    products,
    quota,
    orders: { count30d, recent },
    revenue: {
      gross30d,
      pendingPayout: payoutTotals.pendingTotal,
      paidTotal: payoutTotals.paidTotal,
    },
  };
}
