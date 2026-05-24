import { ok, unauthorized } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { readSessionUser } from "@/lib/server/auth/session";
import { listUserUgc } from "@/lib/server/ugc/ugc-media";

export async function GET() {
  try {
    const user = await readSessionUser();
    if (!user) return unauthorized();
    const items = await listUserUgc(user.id);
    return ok({ items });
  } catch (error) {
    return handleRouteError(error, { route: "/api/ugc/my" });
  }
}
