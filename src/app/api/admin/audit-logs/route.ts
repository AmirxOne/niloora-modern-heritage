import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { queryAdminAuditLogs } from "@/lib/server/audit-log";

export async function GET(request: Request) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const limitRaw = searchParams.get("limit");
    const limit = limitRaw ? Number(limitRaw) : undefined;
    if (limitRaw && (!Number.isFinite(limit!) || limit! <= 0)) {
      return badRequest("limit نامعتبر است.");
    }

    const logs = await queryAdminAuditLogs({
      q: searchParams.get("q") ?? undefined,
      action: searchParams.get("action") ?? undefined,
      entityType: searchParams.get("entityType") ?? undefined,
      actorId: searchParams.get("actorId") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      limit,
    });
    return ok({ logs });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/audit-logs" });
  }
}
