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

    const headerStripMode =
      body.headerStripMode === "image" || body.headerStripMode === "text"
        ? body.headerStripMode
        : undefined;

    const banner = await upsertHomeBannerSettings({
      enabled: typeof body.enabled === "boolean" ? body.enabled : undefined,
      badge: typeof body.badge === "string" ? body.badge : undefined,
      title: typeof body.title === "string" ? body.title : undefined,
      subtitle: typeof body.subtitle === "string" ? body.subtitle : undefined,
      percent,
      countdownEnabled:
        typeof body.countdownEnabled === "boolean" ? body.countdownEnabled : undefined,
      countdownEndsAt:
        body.countdownEndsAt === null
          ? null
          : typeof body.countdownEndsAt === "string"
            ? body.countdownEndsAt
            : undefined,
      ctaLabel: typeof body.ctaLabel === "string" ? body.ctaLabel : body.ctaLabel === null ? null : undefined,
      ctaHref: typeof body.ctaHref === "string" ? body.ctaHref : undefined,
      headerStripEnabled:
        typeof body.headerStripEnabled === "boolean" ? body.headerStripEnabled : undefined,
      headerStripMode,
      headerStripImageUrl:
        body.headerStripImageUrl === null
          ? null
          : typeof body.headerStripImageUrl === "string"
            ? body.headerStripImageUrl
            : undefined,
      headerStripBadge:
        typeof body.headerStripBadge === "string" ? body.headerStripBadge : undefined,
      headerStripTitle:
        typeof body.headerStripTitle === "string" ? body.headerStripTitle : undefined,
      headerStripSubtitle:
        typeof body.headerStripSubtitle === "string" ? body.headerStripSubtitle : undefined,
      headerStripCtaLabel:
        typeof body.headerStripCtaLabel === "string"
          ? body.headerStripCtaLabel
          : body.headerStripCtaLabel === null
            ? null
            : undefined,
      headerStripCtaHref:
        typeof body.headerStripCtaHref === "string" ? body.headerStripCtaHref : undefined,
    });

    return ok({ banner });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/home/banner" });
  }
}
