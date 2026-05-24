import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";
import { toBundleOfferDefinition } from "@/lib/server/bundle/bundle-offer";
import type { BundleOfferDefinition } from "@/lib/types";

export type BundleOfferUpsertInput = {
  title: string;
  description: string | null;
  discountType: "percent" | "fixed";
  discountValue: number;
  requiredProductIds: string[];
  active: boolean;
};

export async function listAdminBundleOffers(): Promise<BundleOfferDefinition[]> {
  const rows = await prisma.bundleOffer.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(toBundleOfferDefinition);
}

export async function listActiveBundleOffers(): Promise<BundleOfferDefinition[]> {
  const rows = await prisma.bundleOffer.findMany({
    where: { active: true },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(toBundleOfferDefinition);
}

export async function createBundleOffer(input: BundleOfferUpsertInput) {
  const row = await prisma.bundleOffer.create({
    data: {
      title: input.title.trim(),
      description: input.description?.trim() || null,
      discountType: input.discountType,
      discountValue: input.discountValue,
      requiredProductIds: input.requiredProductIds as unknown as Prisma.InputJsonValue,
      active: input.active,
    },
  });
  return toBundleOfferDefinition(row);
}

export async function updateBundleOffer(id: string, input: BundleOfferUpsertInput) {
  const row = await prisma.bundleOffer.update({
    where: { id },
    data: {
      title: input.title.trim(),
      description: input.description?.trim() || null,
      discountType: input.discountType,
      discountValue: input.discountValue,
      requiredProductIds: input.requiredProductIds as unknown as Prisma.InputJsonValue,
      active: input.active,
    },
  });
  return toBundleOfferDefinition(row);
}

export async function deleteBundleOffer(id: string) {
  await prisma.bundleOffer.delete({ where: { id } });
}
