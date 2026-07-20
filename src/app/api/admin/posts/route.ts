export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import {
  canCreateContent,
  editablePostStatusesForRole,
  ensureContentWorkflowAccess,
} from "@/lib/server/auth/guards";
import { badRequest, created, ok, conflict, forbidden } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import {
  mapAdminPost,
  createPost,
  listAdminPosts,
  parseAdminPostBody,
  validatePrePublishRequirements,
} from "@/lib/server/blog/post-service";
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
    if (denied) {
      await writeAdminAuditLog({
        user,
        request,
        action: "admin.posts.create.denied",
        route: "/api/admin/posts",
        entityType: "post",
        summary: "deny create post by role",
        payload: { reason: "workflow_access_denied" },
      });
      return denied;
    }
    if (!canCreateContent(user)) {
      await writeAdminAuditLog({
        user,
        request,
        action: "admin.posts.create.denied",
        route: "/api/admin/posts",
        entityType: "post",
        summary: "deny create post by role",
        payload: { reason: "create_permission_denied", role: user?.role },
      });
      return forbidden("نقش شما اجازه ایجاد مقاله را ندارد.");
    }

    const parsed = parseAdminPostBody(await request.json());
    if (!parsed.ok) {
      await writeAdminAuditLog({
        user,
        request,
        action: "admin.posts.create.denied",
        route: "/api/admin/posts",
        entityType: "post",
        summary: "deny create post by validation",
        payload: { reason: "body_validation_failed", message: parsed.message },
      });
      return badRequest(parsed.message);
    }
    const publishValidation = validatePrePublishRequirements(parsed.data);
    if (!publishValidation.ok) {
      await writeAdminAuditLog({
        user,
        request,
        action: "admin.posts.create.denied",
        route: "/api/admin/posts",
        entityType: "post",
        summary: "deny create post by prepublish policy",
        payload: {
          reason: "prepublish_requirements_failed",
          missing: publishValidation.missing,
        },
      });
      return badRequest(publishValidation.message);
    }

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
