import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, notFound, ok, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import {
  deleteInstagramPost,
  mapInstagramPost,
  updateInstagramPost,
} from "@/lib/server/home/home-instagram";
import { prisma } from "@/lib/server/prisma";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const { id } = await context.params;
    const existing = await prisma.homeInstagramPost.findUnique({ where: { id } });
    if (!existing) return notFound("پست یافت نشد.");

    const body = (await request.json()) as Record<string, unknown>;
    const row = await updateInstagramPost(id, {
      image: typeof body.image === "string" ? body.image : undefined,
      likes: body.likes !== undefined ? Number(body.likes) : undefined,
      sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : undefined,
    });

    return ok({ post: mapInstagramPost(row) });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/home/instagram/[id]" });
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
    const existing = await prisma.homeInstagramPost.findUnique({ where: { id } });
    if (!existing) return notFound("پست یافت نشد.");

    await deleteInstagramPost(id);
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/home/instagram/[id]" });
  }
}
