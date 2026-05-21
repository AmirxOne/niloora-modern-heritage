import { normalizeSavedDesigns } from "@/lib/preferences/saved-designs";
import type { CartItem, SavedDesign } from "@/lib/types";
import { prisma } from "@/lib/server/prisma";
import type { Prisma } from "@prisma/client";

export type UserPreferencesDto = {
  cartItems: CartItem[];
  wishlistIds: string[];
  savedDesigns: SavedDesign[];
  compareProductIds: string[];
  recentlyViewedIds: string[];
  promoCode: string | null;
};

function readStringArray(value: unknown): string[] {
  return Array.isArray(value) ? (value as string[]) : [];
}

export async function readUserPreferences(userId: string): Promise<UserPreferencesDto> {
  // PURPOSE: decode persisted JSON preferences into strongly-typed app DTO.
  const pref = await prisma.userPreference.findUnique({ where: { userId } });
  return {
    cartItems: Array.isArray(pref?.cartItems) ? (pref?.cartItems as unknown as CartItem[]) : [],
    wishlistIds: readStringArray(pref?.wishlistIds),
    savedDesigns: normalizeSavedDesigns(pref?.savedDesigns),
    compareProductIds: readStringArray(pref?.compareProductIds),
    recentlyViewedIds: readStringArray(pref?.recentlyViewedIds),
    promoCode: pref?.promoCode ?? null,
  };
}

export async function writeUserPreferences(userId: string, payload: UserPreferencesDto) {
  const savedDesigns = normalizeSavedDesigns(payload.savedDesigns);
  // FLOW: upsert by userId so preferences are always single-row per user.
  await prisma.userPreference.upsert({
    where: { userId },
    create: {
      userId,
      cartItems: payload.cartItems as unknown as Prisma.InputJsonValue,
      wishlistIds: payload.wishlistIds as unknown as Prisma.InputJsonValue,
      savedDesigns: savedDesigns as unknown as Prisma.InputJsonValue,
      compareProductIds: payload.compareProductIds as unknown as Prisma.InputJsonValue,
      recentlyViewedIds: payload.recentlyViewedIds as unknown as Prisma.InputJsonValue,
      promoCode: payload.promoCode,
    },
    update: {
      cartItems: payload.cartItems as unknown as Prisma.InputJsonValue,
      wishlistIds: payload.wishlistIds as unknown as Prisma.InputJsonValue,
      savedDesigns: savedDesigns as unknown as Prisma.InputJsonValue,
      compareProductIds: payload.compareProductIds as unknown as Prisma.InputJsonValue,
      recentlyViewedIds: payload.recentlyViewedIds as unknown as Prisma.InputJsonValue,
      promoCode: payload.promoCode,
    },
  });
}
