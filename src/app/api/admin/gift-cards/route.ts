export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, created, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import {
  clampGiftCardPurchaseAmount,
  GIFT_CARD_MAX_PURCHASE_AMOUNT,
  GIFT_CARD_MIN_PURCHASE_AMOUNT,
} from "@/lib/server/gift-card/gift-card";
import { createGiftCard, listAdminGiftCards } from "@/lib/server/gift-card/gift-card-service";

type Body = {
  amount?: number;
  note?: string;
  recipientName?: string;
  recipientContact?: string;
};

export async function GET() {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;
    const giftCards = await listAdminGiftCards();
    return ok({ giftCards });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/gift-cards" });
  }
}

export async function POST(request: Request) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const body = (await request.json()) as Body;
    const amount = clampGiftCardPurchaseAmount(Number(body.amount ?? 0));
    if (!amount) {
      return badRequest(
        `مبلغ کارت هدیه باید بین ${GIFT_CARD_MIN_PURCHASE_AMOUNT.toLocaleString("fa-IR")} و ${GIFT_CARD_MAX_PURCHASE_AMOUNT.toLocaleString("fa-IR")} تومان باشد.`
      );
    }
    const giftCard = await createGiftCard({
      amount,
      note: body.note ?? null,
      recipientName: body.recipientName ?? null,
      recipientContact: body.recipientContact ?? null,
      purchaserUserId: user?.id ?? null,
    });
    return created({ giftCard });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/gift-cards" });
  }
}
