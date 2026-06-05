export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import {
  canCreateContent,
  editablePostStatusesForRole,
  ensureContentWorkflowAccess,
} from "@/lib/server/auth/guards";
import { badRequest, created, ok, conflict, forbidden } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { mapAdminPost, createPost, listAdminPosts, parseAdminPostBody } from "@/lib/server/blog/post-service";
import { writeAdminAuditLog } from "@/lib/server/audit-log";

export async function GET() {
  try {
    const user = await readSessionUser();
    const denied = ensureContentWorkflowAccess(user);
    if (denied) return denied;

    const posts = await listAdminPosts(editablePostStatusesForRole(user?.role));
    return ok({ posts });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/posts" });
  }
}

export async function POST(request: Request) {
  try {
    const user = await readSessionUser();
    const denied = ensureContentWorkflowAccess(user);
    if (denied) return denied;
    if (!canCreateContent(user)) return forbidden("اجازه ایجاد مقاله ندارید.");

    const parsed = parseAdminPostBody(await request.json());
    if (!parsed.ok) return badRequest(parsed.message);

    try {
      const row = await createPost(parsed.data);
      await writeAdminAuditLog({
        user,
        request,
        action: "admin.posts.create",
        route: "/api/admin/posts",
        entityType: "post",
        entityId: row.id,
        summary: `create post ${row.slug}`,
        payload: { id: row.id, slug: row.slug, title: row.title, status: row.status },
      });
      return created({ post: mapAdminPost(row) });
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
    return handleRouteError(error, { route: "/api/admin/posts" });
  }
}
