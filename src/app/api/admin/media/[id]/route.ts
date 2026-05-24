import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { notFound, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { deleteMediaAsset } from "@/lib/server/media/store";
import { writeAdminAuditLog } from "@/lib/server/audit-log";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const { id } = await context.params;
    const removed = await deleteMediaAsset(id);
    if (!removed) return notFound("رسانه یافت نشد.");
    await writeAdminAuditLog({
      user: { id: user?.id ?? "unknown-admin", name: user?.name, phone: user?.phone, role: user?.role },
      request: _request,
      action: "admin.media.delete",
      route: "/api/admin/media/[id]",
      entityType: "media",
      entityId: id,
      summary: `delete media ${id}`,
      payload: { id },
    });
    return ok({ deleted: true, id });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/media/[id]" });
  }
}
