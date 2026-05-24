import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, notFound, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { parseAdminBundleBody } from "@/lib/server/bundle/admin-bundle-parse";
import { prisma } from "@/lib/server/prisma";
import { deleteBundleOffer, updateBundleOffer } from "@/lib/server/bundle/bundle-offer-service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const { id } = await context.params;
    const existing = await prisma.bundleOffer.findUnique({ where: { id } });
    if (!existing) return notFound("باندل یافت نشد.");

    const parsed = parseAdminBundleBody(await request.json());
    if (!parsed.ok) return badRequest(parsed.message);

    const bundle = await updateBundleOffer(id, parsed.data);
    return ok({ bundle });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/bundles/[id]" });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const { id } = await context.params;
    const existing = await prisma.bundleOffer.findUnique({ where: { id } });
    if (!existing) return notFound("باندل یافت نشد.");

    await deleteBundleOffer(id);
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/bundles/[id]" });
  }
}
