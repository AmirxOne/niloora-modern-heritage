import { ok, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import {
  clearSessionCookie,
  destroyCurrentSession,
} from "@/lib/server/auth/session";

export async function POST() {
  try {
    await destroyCurrentSession();
    await clearSessionCookie();
    return ok({ success: true });
  } catch (error) {
    return handleRouteError(error, { route: "/api/auth/logout" });
  }
}
