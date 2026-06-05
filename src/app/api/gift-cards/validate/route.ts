export { dynamic } from "@/lib/server/route-segment";

import { badRequest, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { validateGiftCardForCheckout } from "@/lib/server/gift-card/gift-card-service";

type Body = {
  code?: string;
  payable?: number;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Body;
    const code = payload.code?.trim() ?? "";
    const payable = Number(payload.payable ?? 0);
    if (!code) return badRequest("کد کارت هدیه را وارد کنید.");
    if (!Number.isFinite(payable) || payable < 0) return badRequest("مبلغ سبد نامعتبر است.");

    const result = await validateGiftCardForCheckout(code, payable);
    if (!result.valid) {
      return ok({
        valid: false,
        reason: result.reason,
      });
    }
    return ok({
      valid: true,
      giftCard: result.giftCard,
      appliedAmount: result.appliedAmount,
      payableAfter: result.payableAfter,
    });
  } catch (error) {
    return handleRouteError(error, { route: "/api/gift-cards/validate" });
  }
}
