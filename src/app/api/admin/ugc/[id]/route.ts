import { badRequest, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { moderateUgc } from "@/lib/server/ugc/ugc-media";

type PatchBody = {
  action?: "approve" | "reject";
};

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const body = (await request.json()) as PatchBody;
    if (body.action !== "approve" && body.action !== "reject") return badRequest("Invalid action");
    const { id } = await context.params;
    const item = await moderateUgc(id, body.action);
    return ok({ item });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/ugc/[id]" });
  }
}
