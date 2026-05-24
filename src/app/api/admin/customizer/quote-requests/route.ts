import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { listAdminCustomizerQuotes } from "@/lib/server/customizer/admin-quote-requests";

export async function GET() {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;
    const quotes = await listAdminCustomizerQuotes();
    return ok({ quotes });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/customizer/quote-requests" });
  }
}
