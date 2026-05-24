import { readSessionUser } from "@/lib/server/auth/session";
import {
  canDeleteContent,
  canTransitionPostStatus,
  ensureContentWorkflowAccess,
  isPostEditableByRole,
} from "@/lib/server/auth/guards";
import { badRequest, forbidden, notFound, ok, conflict } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import {
  deletePost,
  mapAdminPost,
  parseAdminPostBody,
  updatePost,
} from "@/lib/server/blog/post-service";
import { prisma } from "@/lib/server/prisma";
import { writeAdminAuditLog } from "@/lib/server/audit-log";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await readSessionUser();
    const denied = ensureContentWorkflowAccess(user);
    if (denied) return denied;

    const { id } = await context.params;
    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) return notFound("مقاله یافت نشد.");
    if (!isPostEditableByRole(user?.role, existing.status)) {
      return forbidden("اجازه ویرایش این مقاله را ندارید.");
    }

    const parsed = parseAdminPostBody(await request.json());
    if (!parsed.ok) return badRequest(parsed.message);
    if (!canTransitionPostStatus(user?.role, existing.status, parsed.data.status)) {
      return badRequest("تغییر وضعیت برای نقش شما مجاز نیست.");
    }

    try {
      const row = await updatePost(id, parsed.data);
      await writeAdminAuditLog({
        user,
        request,
        action: "admin.posts.update",
        route: "/api/admin/posts/[id]",
        entityType: "post",
        entityId: id,
        summary: `update post ${row.slug}`,
        payload: { id, slug: row.slug, title: row.title, status: row.status },
      });
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
    const denied = ensureContentWorkflowAccess(user);
    if (denied) return denied;
    if (!canDeleteContent(user)) return forbidden("حذف مقاله فقط برای مدیر مجاز است.");

    const { id } = await context.params;
    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) return notFound("مقاله یافت نشد.");

    await deletePost(id);
    await writeAdminAuditLog({
      user,
      request: _request,
      action: "admin.posts.delete",
      route: "/api/admin/posts/[id]",
      entityType: "post",
      entityId: id,
      summary: `delete post ${existing.slug}`,
      payload: { id, slug: existing.slug, title: existing.title },
    });
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/posts/[id]" });
  }
}
