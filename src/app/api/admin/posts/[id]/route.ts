export { dynamic } from "@/lib/server/route-segment";

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
  validatePrePublishRequirements,
} from "@/lib/server/blog/post-service";
import { prisma } from "@/lib/server/prisma";
import { writeAdminAuditLog } from "@/lib/server/audit-log";
import {
  createCriticalFlowContext,
  logCriticalOutcome,
  logCriticalStart,
  withCorrelationId,
  type CriticalRole,
} from "@/lib/observability/critical-flow";

function toCriticalRole(role: string | null | undefined): CriticalRole {
  if (role === "admin" || role === "editor" || role === "reviewer") return role;
  return "system";
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await readSessionUser();
    const critical = createCriticalFlowContext(request, {
      route: "/api/admin/posts/[id]",
      role: toCriticalRole(user?.role),
      journey: "content_workflow",
      action: "post_update",
      userId: user?.id ?? null,
    });
    logCriticalStart(critical);
    const denied = ensureContentWorkflowAccess(user);
    if (denied) {
      await writeAdminAuditLog({
        user,
        request,
        action: "admin.posts.update.denied",
        route: "/api/admin/posts/[id]",
        entityType: "post",
        summary: "deny update post by role",
        payload: { reason: "workflow_access_denied" },
      });
      logCriticalOutcome(critical, "blocked", { code: "workflow_access_denied" });
      return withCorrelationId(denied, critical.correlationId);
    }

    const { id } = await context.params;
    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) {
      logCriticalOutcome(critical, "blocked", { code: "post_not_found", entityId: id });
      return withCorrelationId(notFound("مقاله یافت نشد."), critical.correlationId);
    }
    if (!isPostEditableByRole(user?.role, existing.status)) {
      await writeAdminAuditLog({
        user,
        request,
        action: "admin.posts.update.denied",
        route: "/api/admin/posts/[id]",
        entityType: "post",
        entityId: id,
        summary: "deny update post status by role",
        payload: {
          reason: "editability_denied",
          role: user?.role,
          status: existing.status,
        },
      });
      logCriticalOutcome(critical, "blocked", { code: "editability_denied", entityId: id });
      return withCorrelationId(
        forbidden("نقش شما اجازه ویرایش این وضعیت مقاله را ندارد."),
        critical.correlationId
      );
    }

    const parsed = parseAdminPostBody(await request.json());
    if (!parsed.ok) {
      await writeAdminAuditLog({
        user,
        request,
        action: "admin.posts.update.denied",
        route: "/api/admin/posts/[id]",
        entityType: "post",
        entityId: id,
        summary: "deny update post by validation",
        payload: { reason: "body_validation_failed", message: parsed.message },
      });
      logCriticalOutcome(critical, "blocked", { code: "body_validation_failed", entityId: id });
      return withCorrelationId(badRequest(parsed.message), critical.correlationId);
    }
    if (!canTransitionPostStatus(user?.role, existing.status, parsed.data.status)) {
      await writeAdminAuditLog({
        user,
        request,
        action: "admin.posts.update.denied",
        route: "/api/admin/posts/[id]",
        entityType: "post",
        entityId: id,
        summary: "deny transition by role policy",
        payload: {
          reason: "transition_denied",
          role: user?.role,
          from: existing.status,
          to: parsed.data.status,
        },
      });
      logCriticalOutcome(critical, "blocked", { code: "transition_denied", entityId: id });
      return withCorrelationId(
        badRequest(
          `تغییر وضعیت از «${existing.status}» به «${parsed.data.status}» برای نقش شما مجاز نیست.`
        ),
        critical.correlationId
      );
    }

    const publishValidation = validatePrePublishRequirements(parsed.data);
    if (!publishValidation.ok) {
      await writeAdminAuditLog({
        user,
        request,
        action: "admin.posts.update.denied",
        route: "/api/admin/posts/[id]",
        entityType: "post",
        entityId: id,
        summary: "deny publish by prepublish policy",
        payload: {
          reason: "prepublish_requirements_failed",
          missing: publishValidation.missing,
        },
      });
      logCriticalOutcome(critical, "blocked", { code: "prepublish_requirements_failed", entityId: id });
      return withCorrelationId(badRequest(publishValidation.message), critical.correlationId);
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
      logCriticalOutcome(critical, "success", { entityId: id, status: row.status });
      return withCorrelationId(ok({ post: mapAdminPost(row) }), critical.correlationId);
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code: string }).code === "P2002"
      ) {
        logCriticalOutcome(critical, "blocked", { code: "slug_conflict", entityId: id });
        return withCorrelationId(conflict("نامک (slug) تکراری است."), critical.correlationId);
      }
      throw error;
    }
  } catch (error) {
    return handleRouteError(error, {
      route: "/api/admin/posts/[id]",
      request,
      role: "editor",
      journey: "content_workflow",
      action: "post_update",
    });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await readSessionUser();
    const critical = createCriticalFlowContext(_request, {
      route: "/api/admin/posts/[id]",
      role: toCriticalRole(user?.role),
      journey: "content_workflow",
      action: "post_delete",
      userId: user?.id ?? null,
    });
    logCriticalStart(critical);
    const denied = ensureContentWorkflowAccess(user);
    if (denied) {
      await writeAdminAuditLog({
        user,
        request: _request,
        action: "admin.posts.delete.denied",
        route: "/api/admin/posts/[id]",
        entityType: "post",
        summary: "deny delete post by role",
        payload: { reason: "workflow_access_denied" },
      });
      logCriticalOutcome(critical, "blocked", { code: "workflow_access_denied" });
      return withCorrelationId(denied, critical.correlationId);
    }
    if (!canDeleteContent(user)) {
      await writeAdminAuditLog({
        user,
        request: _request,
        action: "admin.posts.delete.denied",
        route: "/api/admin/posts/[id]",
        entityType: "post",
        summary: "deny delete post by role",
        payload: { reason: "delete_permission_denied", role: user?.role },
      });
      logCriticalOutcome(critical, "blocked", { code: "delete_permission_denied" });
      return withCorrelationId(
        forbidden("حذف مقاله فقط برای مدیر مجاز است."),
        critical.correlationId
      );
    }

    const { id } = await context.params;
    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) {
      logCriticalOutcome(critical, "blocked", { code: "post_not_found", entityId: id });
      return withCorrelationId(notFound("مقاله یافت نشد."), critical.correlationId);
    }

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
    logCriticalOutcome(critical, "success", { entityId: id });
    return withCorrelationId(ok({ deleted: true }), critical.correlationId);
  } catch (error) {
    return handleRouteError(error, {
      route: "/api/admin/posts/[id]",
      request: _request,
      role: "editor",
      journey: "content_workflow",
      action: "post_delete",
    });
  }
}
