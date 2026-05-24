import type { User } from "@prisma/client";

export type SessionUser = {
  id: string;
  name: string;
  phone: string;
  referralCode: string;
  referralCredit: number;
  referralEarnedTotal: number;
  loyaltyPoints: number;
  loyaltyTier: "bronze" | "silver" | "gold" | "platinum";
  loyaltyLifetimeSpend: number;
  firstName: string | null;
  lastName: string | null;
  birthDate: string | null;
  postalCode: string | null;
  addressLine: string | null;
  province: string | null;
  city: string | null;
  nationalCode: string | null;
  landlinePhone: string | null;
  gender: "male" | "female" | "other" | null;
  favoriteStone: import("@/lib/types").StoneType | null;
  favoriteStyle: import("@/lib/types").RingStyle | null;
  favoriteBudgetBand: import("@/lib/types").ShopBudgetBand | null;
  role: "user" | "editor" | "reviewer" | "admin";
  memberSince: string;
  tier: "gold" | "platinum" | "royal";
};

export function toSessionUser(user: User): SessionUser {
  // PURPOSE: normalize DB user shape into safe session DTO for API responses.
  // CONTRACT: username is always phone; account profile names are carried separately.
  const tier = user.tier === "gold" || user.tier === "platinum" || user.tier === "royal"
    ? user.tier
    : "royal";
  const loyaltyTier =
    user.loyaltyTier === "silver" ||
    user.loyaltyTier === "gold" ||
    user.loyaltyTier === "platinum" ||
    user.loyaltyTier === "bronze"
      ? user.loyaltyTier
      : "bronze";
  const role =
    user.role === "admin" || user.role === "editor" || user.role === "reviewer"
      ? user.role
      : "user";
  const username = user.phone;
  return {
    id: user.id,
    name: username,
    phone: user.phone,
    referralCode: user.referralCode,
    referralCredit: user.referralCredit ?? 0,
    referralEarnedTotal: user.referralEarnedTotal ?? 0,
    loyaltyPoints: user.loyaltyPoints ?? 0,
    loyaltyTier,
    loyaltyLifetimeSpend: user.loyaltyLifetimeSpend ?? 0,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    birthDate: user.birthDate ? user.birthDate.toISOString() : null,
    postalCode: user.postalCode ?? null,
    addressLine: user.addressLine ?? null,
    province: user.province ?? null,
    city: user.city ?? null,
    nationalCode: user.nationalCode ?? null,
    landlinePhone: user.landlinePhone ?? null,
    gender: user.gender === "male" || user.gender === "female" || user.gender === "other"
      ? user.gender
      : null,
    favoriteStone:
      user.favoriteStone === "diamond" ||
      user.favoriteStone === "emerald" ||
      user.favoriteStone === "sapphire" ||
      user.favoriteStone === "ruby" ||
      user.favoriteStone === "turquoise" ||
      user.favoriteStone === "onyx" ||
      user.favoriteStone === "zabarjad" ||
      user.favoriteStone === "yemen-aqeeq" ||
      user.favoriteStone === "durr-najaf" ||
      user.favoriteStone === "moral"
        ? user.favoriteStone
        : null,
    favoriteStyle:
      user.favoriteStyle === "solitaire" ||
      user.favoriteStyle === "halo" ||
      user.favoriteStyle === "vintage" ||
      user.favoriteStyle === "signet" ||
      user.favoriteStyle === "eternity" ||
      user.favoriteStyle === "stackable"
        ? user.favoriteStyle
        : null,
    favoriteBudgetBand:
      user.favoriteBudgetBand === "entry" ||
      user.favoriteBudgetBand === "mid" ||
      user.favoriteBudgetBand === "premium" ||
      user.favoriteBudgetBand === "luxury"
        ? user.favoriteBudgetBand
        : null,
    role,
    memberSince: user.memberSince.toISOString(),
    tier,
  };
}
