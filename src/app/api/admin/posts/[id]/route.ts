import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, notFound, ok, serverError, conflict } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import {
  deletePost,
  mapAdminPost,
  parseAdminPostBody,
  updatePost,
} from "@/lib/server/blog/post-service";
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
    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) return notFound("مقاله یافت نشد.");

    const parsed = parseAdminPostBody(await request.json());
    if (!parsed.ok) return badRequest(parsed.message);

    try {
      const row = await updatePost(id, parsed.data);
      return ok({ post: mapAdminPost(row) });
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code: string }).code === "P2002"
      ) {
        return conflict("نامک (slug) تکراری است.");
      }
      throw error;
    }
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/posts/[id]" });
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
    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) return notFound("مقاله یافت نشد.");

    await deletePost(id);
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/posts/[id]" });
  }
}
