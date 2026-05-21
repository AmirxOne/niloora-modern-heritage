import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, ok, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { getHomeBannerSettings, upsertHomeBannerSettings } from "@/lib/server/home/home-banner";

export async function GET() {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const banner = await getHomeBannerSettings();
    return ok({ banner });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/home/banner" });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const body = (await request.json()) as Record<string, unknown>;
    const percent = body.percent !== undefined ? Number(body.percent) : undefined;
    if (percent !== undefined && (!Number.isFinite(percent) || percent < 0 || percent > 100)) {
      return badRequest("درصد بهاکاهی باید بین ۰ تا ۱۰۰ باشد.");
    }

    const banner = await upsertHomeBannerSettings({
      enabled: typeof body.enabled === "boolean" ? body.enabled : undefined,
      badge: typeof body.badge === "string" ? body.badge : undefined,
      title: typeof body.title === "string" ? body.title : undefined,
      subtitle: typeof body.subtitle === "string" ? body.subtitle : undefined,
      percent,
      ctaLabel: typeof body.ctaLabel === "string" ? body.ctaLabel : undefined,
      ctaHref: typeof body.ctaHref === "string" ? body.ctaHref : undefined,
    });

    return ok({ banner });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/home/banner" });
  }
}
