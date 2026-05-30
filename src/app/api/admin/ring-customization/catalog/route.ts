import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { listRingCustomizationCatalog, upsertRingCustomizationCatalog } from "@/lib/server/ring-customization/service";

export async function GET() {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const catalog = await listRingCustomizationCatalog();
    return ok({ catalog });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/ring-customization/catalog" });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const body = (await request.json()) as Record<string, unknown>;
    if (!body || typeof body !== "object") return badRequest("درخواست نامعتبر است.");

    const catalog = await upsertRingCustomizationCatalog({
      artisans: Array.isArray(body.artisans)
        ? body.artisans
            .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
            .map((item) => ({
              id: typeof item.id === "string" ? item.id : undefined,
              name: typeof item.name === "string" ? item.name : "",
              scope:
                item.scope === "shank" || item.scope === "stone" || item.scope === "both"
                  ? item.scope
                  : "both",
              active: item.active !== false,
              priceMode: item.priceMode === "multiplier" ? "multiplier" : "fixed",
              priceAdd: Number(item.priceAdd ?? 0),
              priceMultiplier: Number(item.priceMultiplier ?? 1),
            }))
        : undefined,
      shankPatterns: Array.isArray(body.shankPatterns)
        ? body.shankPatterns
            .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
            .map((item) => ({
              id: typeof item.id === "string" ? item.id : undefined,
              title: typeof item.title === "string" ? item.title : "",
              active: item.active !== false,
              complexityLevel: Number(item.complexityLevel ?? 1),
              priceAdd: Number(item.priceAdd ?? 0),
              imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : null,
            }))
        : undefined,
      stoneTexts: Array.isArray(body.stoneTexts)
        ? body.stoneTexts
            .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
            .map((item) => ({
              id: typeof item.id === "string" ? item.id : undefined,
              text: typeof item.text === "string" ? item.text : "",
              active: item.active !== false,
              meaning: typeof item.meaning === "string" ? item.meaning : null,
              priceAdd: Number(item.priceAdd ?? 0),
              previewImageUrl: typeof item.previewImageUrl === "string" ? item.previewImageUrl : null,
            }))
        : undefined,
      scriptStyles: Array.isArray(body.scriptStyles)
        ? body.scriptStyles
            .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
            .map((item) => ({
              id: typeof item.id === "string" ? item.id : undefined,
              title: typeof item.title === "string" ? item.title : "",
              active: item.active !== false,
              priceAdd: Number(item.priceAdd ?? 0),
              previewImageUrl: typeof item.previewImageUrl === "string" ? item.previewImageUrl : null,
            }))
        : undefined,
    });
    return ok({ catalog });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/ring-customization/catalog" });
  }
}

