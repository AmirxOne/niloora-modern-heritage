import { readSessionUser } from "@/lib/server/auth/session";
import { badRequest, ok, serverError, unauthorized } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { normalizeSavedDesigns } from "@/lib/preferences/saved-designs";
import {
  readUserPreferences,
  writeUserPreferences,
  type UserPreferencesDto,
} from "@/lib/server/preferences";

type Body = Partial<UserPreferencesDto>;

export async function GET() {
  // PURPOSE: hydrate client preferences from server for multi-device continuity.
  try {
    const user = await readSessionUser();
    if (!user) return unauthorized();
    const data = await readUserPreferences(user.id);
    return ok(data);
  } catch (error) {
    return handleRouteError(error, { route: "/api/user/preferences" });
  }
}

export async function PUT(request: Request) {
  // FLOW: sanitize incoming partial payload -> write normalized full DTO.
  try {
    const user = await readSessionUser();
    if (!user) return unauthorized();
    const body = (await request.json()) as Body;
    if (!body) return badRequest("invalid_payload");

    const current = await readUserPreferences(user.id);
    const payload: UserPreferencesDto = {
      cartItems: Array.isArray(body.cartItems) ? body.cartItems : [],
      wishlistIds: Array.isArray(body.wishlistIds) ? body.wishlistIds : [],
      wishlistPriceWatch:
        body.wishlistPriceWatch && typeof body.wishlistPriceWatch === "object"
          ? (body.wishlistPriceWatch as Record<string, number>)
          : current.wishlistPriceWatch,
      savedDesigns: normalizeSavedDesigns(body.savedDesigns),
      compareProductIds: Array.isArray(body.compareProductIds) ? body.compareProductIds : [],
      recentlyViewedIds: Array.isArray(body.recentlyViewedIds) ? body.recentlyViewedIds : [],
      promoCode: typeof body.promoCode === "string" ? body.promoCode : null,
    };

    await writeUserPreferences(user.id, payload);
    return ok({ saved: true });
  } catch (error) {
    return handleRouteError(error, { route: "/api/user/preferences" });
  }
}
