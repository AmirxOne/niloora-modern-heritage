import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { writeAdminAuditLog } from "@/lib/server/audit-log";
import {
  getAdminSiteSettings,
  updateSiteSettings,
  type UpdateSiteSettingsInput,
} from "@/lib/server/site-settings/site-settings";

export async function GET() {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const settings = await getAdminSiteSettings();
    return ok({ settings });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/site-settings" });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const body = (await request.json()) as UpdateSiteSettingsInput;

    try {
      const settings = await updateSiteSettings(body);

      await writeAdminAuditLog({
        user,
        request,
        action: "admin.site-settings.update",
        route: "/api/admin/site-settings",
        entityType: "site_settings",
        entityId: "default",
        summary: "update site settings",
        payload: { keys: Object.keys(body) },
      });

      return ok({ settings });
    } catch (err) {
      const message = err instanceof Error ? err.message : "ذخیره تنظیمات انجام نشد.";
      return badRequest(message);
    }
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/site-settings" });
  }
}
