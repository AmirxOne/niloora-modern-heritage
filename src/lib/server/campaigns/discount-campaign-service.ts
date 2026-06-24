import type { Prisma } from "@prisma/client";
import {
  pickBestCampaignForCart,
  type CampaignLineInput,
} from "@/lib/campaign/campaign-discount";
import { prisma } from "@/lib/server/prisma";
import {
  isCampaignInSchedule,
  toCampaignDiscountRule,
  toPublicCampaignDto,
  validateCampaignInput,
  type AdminCampaignDetailRecord,
  type AdminCampaignRecord,
  type CampaignUpsertInput,
} from "./discount-campaign";

const campaignInclude = {
  linkedPromoCode: { select: { code: true } },
} as const;

function activeCampaignWhere(at = new Date()): Prisma.DiscountCampaignWhereInput {
  return {
    active: true,
    AND: [
      { OR: [{ startsAt: null }, { startsAt: { lte: at } }] },
      { OR: [{ endsAt: null }, { endsAt: { gte: at } }] },
    ],
  };
}

export async function listActivePublicCampaigns() {
  const rows = await prisma.discountCampaign.findMany({
    where: activeCampaignWhere(),
    include: campaignInclude,
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });
  return rows
    .filter((row) => isCampaignInSchedule(row))
    .map(toPublicCampaignDto);
}

export async function getPublicCampaignBySlug(slug: string) {
  const row = await prisma.discountCampaign.findUnique({
    where: { slug },
    include: campaignInclude,
  });
  if (!row || !row.active || !isCampaignInSchedule(row)) return null;
  return toPublicCampaignDto(row);
}

export async function listAdminCampaigns(): Promise<AdminCampaignRecord[]> {
  const rows = await prisma.discountCampaign.findMany({
    include: campaignInclude,
    orderBy: { createdAt: "desc" },
  });
  const ids = rows.map((r) => r.id);
  const stats =
    ids.length > 0
      ? await prisma.discountCampaignUsage.groupBy({
          by: ["campaignId"],
          where: { campaignId: { in: ids } },
          _count: { _all: true },
          _sum: { discountAmount: true },
        })
      : [];
  const statById = new Map(
    stats.map((s) => [
      s.campaignId,
      { count: s._count._all, total: s._sum.discountAmount ?? 0 },
    ])
  );

  return rows.map((row) => {
    const stat = statById.get(row.id);
    const pub = toPublicCampaignDto(row);
    return {
      ...pub,
      active: row.active,
      linkedPromoCodeId: row.linkedPromoCodeId,
      usageCount: stat?.count ?? 0,
      totalDiscountGiven: stat?.total ?? 0,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  });
}

export async function getAdminCampaignDetail(id: string): Promise<AdminCampaignDetailRecord | null> {
  const row = await prisma.discountCampaign.findUnique({
    where: { id },
    include: campaignInclude,
  });
  if (!row) return null;

  const [usageCount, discountSum, recentUsages] = await Promise.all([
    prisma.discountCampaignUsage.count({ where: { campaignId: id } }),
    prisma.discountCampaignUsage.aggregate({
      where: { campaignId: id },
      _sum: { discountAmount: true },
    }),
    prisma.discountCampaignUsage.findMany({
      where: { campaignId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const pub = toPublicCampaignDto(row);
  return {
    ...pub,
    active: row.active,
    linkedPromoCodeId: row.linkedPromoCodeId,
    usageCount,
    totalDiscountGiven: discountSum._sum.discountAmount ?? 0,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    recentUsages: recentUsages.map((u) => ({
      id: u.id,
      orderId: u.orderId,
      userId: u.userId,
      discountAmount: u.discountAmount,
      orderSubtotal: u.orderSubtotal,
      createdAt: u.createdAt.toISOString(),
    })),
  };
}

function toPrismaData(input: CampaignUpsertInput): Prisma.DiscountCampaignUncheckedCreateInput {
  return {
    slug: input.slug,
    title: input.title,
    description: input.description,
    discountType: input.discountType,
    discountValue: input.discountValue,
    minSubtotal: input.minSubtotal,
    targetScope: input.targetScope,
    targetProductIds: input.targetProductIds,
    targetCollectionIds: input.targetCollectionIds,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    active: input.active,
    priority: input.priority,
    replacesSiteWide: input.replacesSiteWide,
    linkedPromoCodeId: input.linkedPromoCodeId,
    bannerEnabled: input.bannerEnabled,
    bannerBadge: input.bannerBadge,
    bannerTitle: input.bannerTitle,
    bannerSubtitle: input.bannerSubtitle,
    bannerCtaLabel: input.bannerCtaLabel,
    bannerCtaHref: input.bannerCtaHref,
    bannerImageUrl: input.bannerImageUrl,
  };
}

export async function createDiscountCampaign(input: CampaignUpsertInput) {
  const error = validateCampaignInput(input);
  if (error) throw new Error(error);
  return prisma.discountCampaign.create({
    data: toPrismaData(input),
    include: campaignInclude,
  });
}

export async function updateDiscountCampaign(id: string, input: CampaignUpsertInput) {
  const error = validateCampaignInput(input);
  if (error) throw new Error(error);
  return prisma.discountCampaign.update({
    where: { id },
    data: toPrismaData(input),
    include: campaignInclude,
  });
}

export async function deleteDiscountCampaign(id: string) {
  await prisma.discountCampaign.delete({ where: { id } });
}

export type CampaignCheckoutResult = {
  campaignId: string | null;
  campaignSlug: string | null;
  campaignTitle: string | null;
  amount: number;
  replacesSiteWide: boolean;
};

export async function calcCampaignForCheckout(
  lines: CampaignLineInput[],
  subtotalSale: number,
  promoCode: string | null
): Promise<CampaignCheckoutResult> {
  const rows = await prisma.discountCampaign.findMany({
    where: activeCampaignWhere(),
    include: campaignInclude,
  });

  const rules = rows
    .filter((row) => isCampaignInSchedule(row))
    .map((row) => {
      const rule = toCampaignDiscountRule(row);
      return {
        ...rule,
        linkedPromoCode: row.linkedPromoCode?.code ?? null,
      };
    });

  const best = pickBestCampaignForCart(rules, lines, subtotalSale, promoCode);
  if (!best) {
    return {
      campaignId: null,
      campaignSlug: null,
      campaignTitle: null,
      amount: 0,
      replacesSiteWide: false,
    };
  }

  return {
    campaignId: best.campaign.id,
    campaignSlug: best.campaign.slug,
    campaignTitle: best.campaign.title,
    amount: best.amount,
    replacesSiteWide: best.campaign.replacesSiteWide,
  };
}

export async function recordCampaignUsage(input: {
  campaignId: string;
  orderId: string;
  userId: string;
  discountAmount: number;
  orderSubtotal: number;
  tx?: import("@prisma/client").Prisma.TransactionClient;
}) {
  if (input.discountAmount <= 0) return;
  const client = input.tx ?? prisma;
  await client.discountCampaignUsage.upsert({
    where: {
      orderId_campaignId: {
        orderId: input.orderId,
        campaignId: input.campaignId,
      },
    },
    create: {
      campaignId: input.campaignId,
      orderId: input.orderId,
      userId: input.userId,
      discountAmount: input.discountAmount,
      orderSubtotal: input.orderSubtotal,
    },
    update: {
      discountAmount: input.discountAmount,
      orderSubtotal: input.orderSubtotal,
    },
  });
}
