import type { User } from "@prisma/client";

export type SessionUser = {
  id: string;
  name: string;
  phone: string;
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
  role: "user" | "admin";
  memberSince: string;
  tier: "gold" | "platinum" | "royal";
};

export function toSessionUser(user: User): SessionUser {
  // PURPOSE: normalize DB user shape into safe session DTO for API responses.
  // CONTRACT: username is always phone; account profile names are carried separately.
  const tier = user.tier === "gold" || user.tier === "platinum" || user.tier === "royal"
    ? user.tier
    : "royal";
  const role = user.role === "admin" ? "admin" : "user";
  const username = user.phone;
  return {
    id: user.id,
    name: username,
    phone: user.phone,
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
    role,
    memberSince: user.memberSince.toISOString(),
    tier,
  };
}
