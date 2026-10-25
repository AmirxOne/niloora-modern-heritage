import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { listAdminUsers } from "@/lib/server/users/admin-user";

export async function GET(request: Request) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const page = Number(searchParams.get("page") ?? "1");

    const data = await listAdminUsers({
      q,
      page: Number.isFinite(page) ? page : 1,
    });
    return ok(data);
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/users" });
  }
}
