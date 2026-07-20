export { dynamic } from "@/lib/server/route-segment";

import { prisma } from "@/lib/server/prisma";
import { readSessionUser } from "@/lib/server/auth/session";
import { badRequest, ok, serverError, unauthorized } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { toSessionUser } from "@/lib/server/auth/dto";
import { readUserPreferences } from "@/lib/server/preferences";
import { getUserLoyaltySummary } from "@/lib/server/loyalty/loyalty";
import type { ShopBudgetBand, RingStyle, StoneType } from "@/lib/types";
import {
  createCriticalFlowContext,
  logCriticalOutcome,
  logCriticalStart,
  withCorrelationId,
} from "@/lib/observability/critical-flow";

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

export async function GET(request: Request = new Request("http://localhost/api/account")) {
  // PURPOSE: provide account page core payload (user + computed stats).
  const critical = createCriticalFlowContext(request, {
    route: "/api/account",
    role: "user",
    journey: "account",
    action: "account_read",
  });
  logCriticalStart(critical);
  try {
    const user = await readSessionUser();
    if (!user) {
      logCriticalOutcome(critical, "blocked", { code: "unauthorized" });
      return withCorrelationId(unauthorized(), critical.correlationId);
    }

    const [prefs, orderStats, loyalty] = await Promise.all([
      readUserPreferences(user.id),
      prisma.order.aggregate({
        where: { userId: user.id },
        _count: { id: true },
        _sum: { total: true },
      }),
      getUserLoyaltySummary(user.id),
    ]);

    logCriticalOutcome(critical, "success", { userId: user.id });
    return withCorrelationId(
      ok({
      user: toSessionUser(user),
      stats: {
        orderCount: orderStats._count.id,
        totalSpent: orderStats._sum.total ?? 0,
        wishlistCount: prefs.wishlistIds.length,
        savedDesignsCount: prefs.savedDesigns.length,
        cartItemsCount: prefs.cartItems.reduce((sum, item) => sum + item.quantity, 0),
      },
      loyalty,
      }),
      critical.correlationId
    );
  } catch (error) {
    logCriticalOutcome(critical, "failed");
    return handleRouteError(error, {
      route: "/api/account",
      request,
      role: "user",
      journey: "account",
      action: "account_read",
    });
  }
}

export async function PATCH(request: Request) {
  // FLOW: validate editable profile fields -> normalize -> persist user profile.
  const critical = createCriticalFlowContext(request, {
    route: "/api/account",
    role: "user",
    journey: "account",
    action: "account_update",
  });
  logCriticalStart(critical);
  try {
    const user = await readSessionUser();
    if (!user) {
      logCriticalOutcome(critical, "blocked", { code: "unauthorized" });
      return withCorrelationId(unauthorized(), critical.correlationId);
    }
    const reject = (message: string, code = "bad_request") => {
      logCriticalOutcome(critical, "blocked", { code, userId: user.id });
      return withCorrelationId(badRequest(message, code), critical.correlationId);
    };

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

    if (firstName && (firstName.length < 2 || firstName.length > 50)) return reject("نام باید بین ۲ تا ۵۰ کاراکتر باشد.");
    if (lastName && (lastName.length < 2 || lastName.length > 60)) return reject("نام خانوادگی باید بین ۲ تا ۶۰ کاراکتر باشد.");
    if (addressLine && addressLine.length > 240) return reject("آدرس بیش از حد طولانی است.");
    if (province && province.length > 60) return reject("نام استان معتبر نیست.");
    if (city && city.length > 60) return reject("نام شهر معتبر نیست.");

    const postalDigits = postalCodeRaw.replace(/\D/g, "");
    if (postalDigits && postalDigits.length !== 10) return reject("کد پستی باید دقیقاً ۱۰ رقم باشد.");

    const nationalDigits = nationalCodeRaw.replace(/\D/g, "");
    if (nationalDigits && nationalDigits.length !== 10) return reject("کد ملی باید دقیقاً ۱۰ رقم باشد.");

    const landlineDigits = landlineRaw.replace(/\D/g, "");
    if (landlineDigits && !/^0\d{10}$/.test(landlineDigits)) return reject("شماره تلفن ثابت معتبر نیست.");

    if (gender && gender !== "male" && gender !== "female" && gender !== "other") {
      return reject("جنسیت انتخاب‌شده معتبر نیست.");
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
      return reject("سنگ مورد علاقه انتخاب‌شده معتبر نیست.");
    }
    if (
      favoriteStyle &&
      !["solitaire", "halo", "vintage", "signet", "eternity", "stackable"].includes(favoriteStyle)
    ) {
      return reject("سبک مورد علاقه انتخاب‌شده معتبر نیست.");
    }
    if (favoriteBudgetBand && !["entry", "mid", "premium", "luxury"].includes(favoriteBudgetBand)) {
      return reject("بازه بودجه مورد علاقه معتبر نیست.");
    }

    let birthDate: Date | null = null;
    if (body.birthDate) {
      const parsed = new Date(body.birthDate);
      if (Number.isNaN(parsed.getTime())) return reject("تاریخ تولد معتبر نیست.");
      const now = new Date();
      if (parsed.getTime() > now.getTime()) return reject("تاریخ تولد نمی‌تواند در آینده باشد.");
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

    logCriticalOutcome(critical, "success", { userId: user.id });
    return withCorrelationId(ok({ user: toSessionUser(updated) }), critical.correlationId);
  } catch (error) {
    logCriticalOutcome(critical, "failed");
    return handleRouteError(error, {
      route: "/api/account",
      request,
      role: "user",
      journey: "account",
      action: "account_update",
    });
  }
}
