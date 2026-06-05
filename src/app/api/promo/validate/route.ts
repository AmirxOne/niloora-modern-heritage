export { dynamic } from "@/lib/server/route-segment";

import { badRequest, ok, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { validatePromoForCheckout } from "@/lib/server/promo/promo-code-service";

type Body = {
  code?: string;
  subtotalSale?: number;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const code = typeof body.code === "string" ? body.code : "";
    const subtotalSale = Number(body.subtotalSale ?? 0);

    if (!code.trim()) return badRequest("کد تخفیف الزامی است.");
    if (!Number.isFinite(subtotalSale) || subtotalSale < 0) {
      return badRequest("مبلغ سبد نامعتبر است.");
    }

    const result = await validatePromoForCheckout(code, subtotalSale);
    if (!result.ok) {
      return ok({ valid: false, reason: result.reason });
    }

    return ok({ valid: true, promo: result.promo });
  } catch (error) {
    return handleRouteError(error, { route: "/api/promo/validate" });
  }
}
