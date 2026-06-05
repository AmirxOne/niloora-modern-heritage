export { dynamic } from "@/lib/server/route-segment";

import { notFound, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { getPublicCampaignBySlug } from "@/lib/server/campaigns/discount-campaign-service";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { slug } = await params;
    const campaign = await getPublicCampaignBySlug(slug);
    if (!campaign) return notFound("کمپین یافت نشد یا فعال نیست.");
    return ok({ campaign });
  } catch (error) {
    return handleRouteError(error, { route: "/api/campaigns/[slug]" });
  }
}
