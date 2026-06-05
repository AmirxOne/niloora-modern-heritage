export { dynamic } from "@/lib/server/route-segment";

import { badRequest, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { getGiftCardByCode } from "@/lib/server/gift-card/gift-card-service";
import { giftCardIsExpired } from "@/lib/server/gift-card/gift-card";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code")?.trim() ?? "";
    if (!code) return badRequest("کد کارت هدیه الزامی است.");
    const card = await getGiftCardByCode(code);
    if (!card) return ok({ found: false });
    return ok({
      found: true,
      giftCard: {
        ...card,
        expired: giftCardIsExpired(card.expiresAt ? new Date(card.expiresAt) : null),
      },
    });
  } catch (error) {
    return handleRouteError(error, { route: "/api/gift-cards/balance" });
  }
}
