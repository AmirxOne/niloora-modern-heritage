import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, created, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { parseAdminCampaignBody } from "@/lib/server/campaigns/admin-campaign-parse";
import {
  createDiscountCampaign,
  listAdminCampaigns,
} from "@/lib/server/campaigns/discount-campaign-service";
import { toPublicCampaignDto } from "@/lib/server/campaigns/discount-campaign";
import { writeAdminAuditLog } from "@/lib/server/audit-log";

export async function GET() {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const campaigns = await listAdminCampaigns();
    return ok({ campaigns });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/campaigns" });
  }
}

export async function POST(request: Request) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const parsed = parseAdminCampaignBody(await request.json());
    if (!parsed.ok) return badRequest(parsed.message);

    try {
      const row = await createDiscountCampaign(parsed.data);
      await writeAdminAuditLog({
        user,
        request,
        action: "admin.campaign.create",
        route: "/api/admin/campaigns",
        entityType: "discount_campaign",
        entityId: row.id,
        summary: `create campaign ${row.slug}`,
        payload: { id: row.id, slug: row.slug, title: row.title },
      });
      const campaign = {
        ...toPublicCampaignDto(row),
        active: row.active,
        linkedPromoCodeId: row.linkedPromoCodeId,
        usageCount: 0,
        totalDiscountGiven: 0,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
      return created({ campaign });
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code: string }).code === "P2002"
      ) {
        return badRequest("شناسهٔ URL (slug) تکراری است.");
      }
      if (error instanceof Error && error.message) {
        return badRequest(error.message);
      }
      throw error;
    }
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/campaigns" });
  }
}
