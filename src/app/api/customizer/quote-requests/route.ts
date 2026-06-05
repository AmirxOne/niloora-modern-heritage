export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import {
  createCustomizerQuoteRequest,
  listCustomizerQuoteRequestsForUser,
} from "@/lib/server/customizer/quote-request-service";
import { badRequest, created, ok, serverError, unauthorized } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";

type PostBody = {
  configuration?: unknown;
  title?: string;
  customerNote?: string;
  estimateTotal?: number;
};

export async function GET() {
  try {
    const user = await readSessionUser();
    if (!user) return unauthorized();

    const quotes = await listCustomizerQuoteRequestsForUser(user.id);
    return ok({ quotes });
  } catch (error) {
    return handleRouteError(error, { route: "/api/customizer/quote-requests" });
  }
}

export async function POST(request: Request) {
  try {
    const user = await readSessionUser();
    if (!user) return unauthorized("برای ثبت درخواست برآورد وارد حساب شوید.");

    const body = (await request.json()) as PostBody;
    if (!body.configuration) {
      return badRequest("پیکربندی انگشتر ارسال نشده است.");
    }

    try {
      const quote = await createCustomizerQuoteRequest({
        userId: user.id,
        configuration: body.configuration,
        title: body.title,
        customerNote: body.customerNote,
        estimateTotal: body.estimateTotal,
      });
      return created({ quote });
    } catch (error) {
      if (error instanceof Error && error.message === "INVALID_CONFIGURATION") {
        return badRequest(
          "پیکربندی ناقص یا نامعتبر است. مراحل ویزارد را کامل کنید و دوباره تلاش کنید."
        );
      }
      throw error;
    }
  } catch (error) {
    return handleRouteError(error, { route: "/api/customizer/quote-requests" });
  }
}
