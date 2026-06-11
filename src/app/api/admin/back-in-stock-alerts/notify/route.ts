export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { dispatchBackInStockAlerts } from "@/lib/server/notifications/back-in-stock-dispatch";

type Body = {
  alertIds?: string[];
  productId?: string;
};

export async function POST(request: Request) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const payload = (await request.json()) as Body;
    const alertIds = Array.isArray(payload.alertIds)
      ? payload.alertIds.map((id) => String(id).trim()).filter(Boolean)
      : [];
    const productId = payload.productId?.trim();

    if (alertIds.length === 0 && !productId) {
      return badRequest("شناسه اعلان یا شناسه محصول را ارسال کنید.");
    }

    // محصول آماده/سفارشی شده؛ اعلان‌های باقی‌مانده کنسل نمی‌شوند تا در صورت نیاز دستی دوباره ارسال شوند.
    const result = await dispatchBackInStockAlerts({ alertIds, productId });
    return ok(result);
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/back-in-stock-alerts/notify" });
  }
}
