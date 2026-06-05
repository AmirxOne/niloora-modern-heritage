export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { badRequest, created, ok, unauthorized } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import {
  createCustomerReturnRequest,
  listCustomerOrderReturns,
} from "@/lib/server/returns/customer-return-service";
import type { OrderReturnItemInput } from "@/lib/types";

type PostBody = {
  orderId?: string;
  reason?: string;
  reasonDetail?: string | null;
  refundableAmount?: number;
  items?: OrderReturnItemInput[];
  message?: string | null;
};

export async function GET(request: Request) {
  try {
    const user = await readSessionUser();
    if (!user) return unauthorized();

    const orderId = new URL(request.url).searchParams.get("orderId")?.trim() ?? "";
    if (!orderId) return badRequest("شناسه سفارش الزامی است.");

    try {
      const returns = await listCustomerOrderReturns(user.id, orderId);
      return ok({ returns });
    } catch (err) {
      const message = err instanceof Error ? err.message : "دریافت مرجوعی‌ها انجام نشد.";
      return badRequest(message);
    }
  } catch (error) {
    return handleRouteError(error, { route: "/api/returns" });
  }
}

export async function POST(request: Request) {
  try {
    const user = await readSessionUser();
    if (!user) return unauthorized("برای ثبت مرجوعی ابتدا وارد شوید.");

    const body = (await request.json()) as PostBody;
    if (!body.orderId?.trim()) return badRequest("شناسه سفارش الزامی است.");
    if (!body.reason?.trim()) return badRequest("دلیل مرجوعی الزامی است.");
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return badRequest("حداقل یک قلم برای مرجوعی انتخاب کنید.");
    }

    try {
      const result = await createCustomerReturnRequest({
        userId: user.id,
        orderId: body.orderId.trim(),
        reason: body.reason.trim(),
        reasonDetail: body.reasonDetail,
        refundableAmount: body.refundableAmount,
        items: body.items,
        extraMessage: body.message,
        profile: {
          name: user.name,
          phone: user.phone,
          email: user.email,
        },
      });

      return created({
        return: result.return,
        supportRequestId: result.supportRequestId,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "ثبت درخواست مرجوعی انجام نشد.";
      return badRequest(message);
    }
  } catch (error) {
    return handleRouteError(error, { route: "/api/returns" });
  }
}
