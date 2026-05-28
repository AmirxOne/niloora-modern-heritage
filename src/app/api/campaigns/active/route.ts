import { ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { listActivePublicCampaigns } from "@/lib/server/campaigns/discount-campaign-service";

export async function GET() {
  try {
    const campaigns = await listActivePublicCampaigns();
    return ok(
      { campaigns },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    return handleRouteError(error, { route: "/api/campaigns/active" });
  }
}
