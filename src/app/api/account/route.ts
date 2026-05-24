import { prisma } from "@/lib/server/prisma";
import { readSessionUser } from "@/lib/server/auth/session";
import { badRequest, ok, serverError, unauthorized } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { toSessionUser } from "@/lib/server/auth/dto";
import { readUserPreferences } from "@/lib/server/preferences";
import { getUserLoyaltySummary } from "@/lib/server/loyalty/loyalty";
import type { ShopBudgetBand, RingStyle, StoneType } from "@/lib/types";

type PatchBody = {
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  postalCode?: string;
  addressLine?: string;
  province?: string;
  city?: string;
  nationalCode?: string;
  landlinePhone?: string;
  gender?: "male" | "female" | "other";
  favoriteStone?: StoneType;
  favoriteStyle?: RingStyle;
  favoriteBudgetBand?: ShopBudgetBand;
};

export async function GET() {
  // PURPOSE: provide account page core payload (user + computed stats).
  try {
    const user = await readSessionUser();
    if (!user) return unauthorized();

    const [prefs, orderStats, loyalty] = await Promise.all([
      readUserPreferences(user.id),
      prisma.order.aggregate({
        where: { userId: user.id },
        _count: { id: true },
        _sum: { total: true },
      }),
      getUserLoyaltySummary(user.id),
    ]);

    return ok({
      user: toSessionUser(user),
      stats: {
        orderCount: orderStats._count.id,
        totalSpent: orderStats._sum.total ?? 0,
        wishlistCount: prefs.wishlistIds.length,
        savedDesignsCount: prefs.savedDesigns.length,
        cartItemsCount: prefs.cartItems.reduce((sum, item) => sum + item.quantity, 0),
      },
      loyalty,
    });
  } catch (error) {
    return handleRouteError(error, { route: "/api/account" });
  }
}

export async function PATCH(request: Request) {
  // FLOW: validate editable profile fields -> normalize -> persist user profile.
  try {
    const user = await readSessionUser();
    if (!user) return unauthorized();

    const body = (await request.json()) as PatchBody;
    const firstName = body.firstName?.trim() ?? "";
    const lastName = body.lastName?.trim() ?? "";
    const addressLine = body.addressLine?.trim() ?? "";
    const province = body.province?.trim() ?? "";
    const city = body.city?.trim() ?? "";
    const postalCodeRaw = body.postalCode?.trim() ?? "";
    const nationalCodeRaw = body.nationalCode?.trim() ?? "";
    const landlineRaw = body.landlinePhone?.trim() ?? "";
    const gender = body.gender;
    const favoriteStone = body.favoriteStone;
    const favoriteStyle = body.favoriteStyle;
    const favoriteBudgetBand = body.favoriteBudgetBand;

    if (firstName && (firstName.length < 2 || firstName.length > 50)) return badRequest("invalid_first_name");
    if (lastName && (lastName.length < 2 || lastName.length > 60)) return badRequest("invalid_last_name");
    if (addressLine && addressLine.length > 240) return badRequest("invalid_address");
    if (province && province.length > 60) return badRequest("invalid_province");
    if (city && city.length > 60) return badRequest("invalid_city");

    const postalDigits = postalCodeRaw.replace(/\D/g, "");
    if (postalDigits && postalDigits.length !== 10) return badRequest("invalid_postal_code");

    const nationalDigits = nationalCodeRaw.replace(/\D/g, "");
    if (nationalDigits && nationalDigits.length !== 10) return badRequest("invalid_national_code");

    const landlineDigits = landlineRaw.replace(/\D/g, "");
    if (landlineDigits && !/^0\d{10}$/.test(landlineDigits)) return badRequest("invalid_landline");

    if (gender && gender !== "male" && gender !== "female" && gender !== "other") {
      return badRequest("invalid_gender");
    }
    if (
      favoriteStone &&
      ![
        "diamond",
        "emerald",
        "sapphire",
        "ruby",
        "turquoise",
        "onyx",
        "zabarjad",
        "yemen-aqeeq",
        "durr-najaf",
        "moral",
      ].includes(favoriteStone)
    ) {
      return badRequest("invalid_favorite_stone");
    }
    if (
      favoriteStyle &&
      !["solitaire", "halo", "vintage", "signet", "eternity", "stackable"].includes(favoriteStyle)
    ) {
      return badRequest("invalid_favorite_style");
    }
    if (favoriteBudgetBand && !["entry", "mid", "premium", "luxury"].includes(favoriteBudgetBand)) {
      return badRequest("invalid_favorite_budget");
    }

    let birthDate: Date | null = null;
    if (body.birthDate) {
      const parsed = new Date(body.birthDate);
      if (Number.isNaN(parsed.getTime())) return badRequest("invalid_birth_date");
      const now = new Date();
      if (parsed.getTime() > now.getTime()) return badRequest("invalid_birth_date");
      birthDate = parsed;
    }

    const fullName = `${firstName} ${lastName}`.trim();
    const fallbackName = user.phone;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: fullName || fallbackName,
        firstName: firstName || null,
        lastName: lastName || null,
        birthDate,
        postalCode: postalDigits || null,
        addressLine: addressLine || null,
        province: province || null,
        city: city || null,
        nationalCode: nationalDigits || null,
        landlinePhone: landlineDigits || null,
        gender: gender ?? null,
        favoriteStone: favoriteStone ?? null,
        favoriteStyle: favoriteStyle ?? null,
        favoriteBudgetBand: favoriteBudgetBand ?? null,
      },
    });

    return ok({ user: toSessionUser(updated) });
  } catch (error) {
    return handleRouteError(error, { route: "/api/account" });
  }
}
