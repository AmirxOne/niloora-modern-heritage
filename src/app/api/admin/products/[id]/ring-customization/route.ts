import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { getOrCreateRingCustomizationConfig, updateRingCustomizationConfig } from "@/lib/server/ring-customization/service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const { id } = await context.params;
    const data = await getOrCreateRingCustomizationConfig(id);
    return ok({ ringCustomization: data });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/products/[id]/ring-customization" });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const { id } = await context.params;
    const body = (await request.json()) as {
      config?: Record<string, unknown>;
      whitelist?: Record<string, unknown>;
    };
    if (!body || typeof body !== "object") return badRequest("بدنه درخواست نامعتبر است.");

    const toNum = (value: unknown) => (value == null ? undefined : Number(value));
    const toBool = (value: unknown) => (typeof value === "boolean" ? value : undefined);
    const toStr = (value: unknown) => (typeof value === "string" ? value : undefined);
    const toIds = (value: unknown) =>
      Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : undefined;

    const updated = await updateRingCustomizationConfig(id, {
      config: body.config
        ? {
            enabled: toBool(body.config.enabled),
            sizeBase: toNum(body.config.sizeBase) ?? null,
            sizeMin: toNum(body.config.sizeMin) ?? null,
            sizeMax: toNum(body.config.sizeMax) ?? null,
            sizePricingMode:
              toStr(body.config.sizePricingMode) === "fixed" || toStr(body.config.sizePricingMode) === "step"
                ? (toStr(body.config.sizePricingMode) as "fixed" | "step")
                : "free",
            sizeFixedDelta: toNum(body.config.sizeFixedDelta) ?? 0,
            sizeStepAmount: toNum(body.config.sizeStepAmount) ?? 0,
            shankEnabled: toBool(body.config.shankEnabled),
            shankDefaultIncluded: toBool(body.config.shankDefaultIncluded),
            shankDefaultRemovalCredit: toNum(body.config.shankDefaultRemovalCredit) ?? 0,
            stoneEnabled: toBool(body.config.stoneEnabled),
            stoneDefaultIncluded: toBool(body.config.stoneDefaultIncluded),
            stoneDefaultRemovalCredit: toNum(body.config.stoneDefaultRemovalCredit) ?? 0,
            baseLeadTimeDays: toNum(body.config.baseLeadTimeDays) ?? 0,
            sizeLeadTimeDays: toNum(body.config.sizeLeadTimeDays) ?? 0,
            shankLeadTimeDays: toNum(body.config.shankLeadTimeDays) ?? 0,
            stoneLeadTimeDays: toNum(body.config.stoneLeadTimeDays) ?? 0,
          }
        : undefined,
      whitelist: body.whitelist
        ? {
            shankArtisanIds: toIds(body.whitelist.shankArtisanIds),
            shankPatternIds: toIds(body.whitelist.shankPatternIds),
            stoneArtisanIds: toIds(body.whitelist.stoneArtisanIds),
            stoneTextIds: toIds(body.whitelist.stoneTextIds),
            scriptStyleIds: toIds(body.whitelist.scriptStyleIds),
          }
        : undefined,
    });

    return ok({ ringCustomization: updated });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/products/[id]/ring-customization" });
  }
}

