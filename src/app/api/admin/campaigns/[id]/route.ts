import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, notFound, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { parseAdminCampaignBody } from "@/lib/server/campaigns/admin-campaign-parse";
import {
  deleteDiscountCampaign,
  getAdminCampaignDetail,
  updateDiscountCampaign,
} from "@/lib/server/campaigns/discount-campaign-service";
import { writeAdminAuditLog } from "@/lib/server/audit-log";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const { id } = await params;
    const campaign = await getAdminCampaignDetail(id);
    if (!campaign) return notFound("کمپین یافت نشد.");
    return ok({ campaign });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/campaigns/[id]" });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const { id } = await params;
    const parsed = parseAdminCampaignBody(await request.json());
    if (!parsed.ok) return badRequest(parsed.message);

    try {
      const row = await updateDiscountCampaign(id, parsed.data);
      await writeAdminAuditLog({
        user,
        request,
        action: "admin.campaign.update",
        route: "/api/admin/campaigns/[id]",
        entityType: "discount_campaign",
        entityId: id,
        summary: `update campaign ${row.slug}`,
        payload: { id, slug: row.slug },
      });
      const campaign = await getAdminCampaignDetail(id);
      return ok({ campaign });
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
    return handleRouteError(error, { route: "/api/admin/campaigns/[id]" });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const { id } = await params;
    await deleteDiscountCampaign(id);
    await writeAdminAuditLog({
      user,
      request,
      action: "admin.campaign.delete",
      route: "/api/admin/campaigns/[id]",
      entityType: "discount_campaign",
      entityId: id,
      summary: `delete campaign ${id}`,
    });
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/campaigns/[id]" });
  }
}
