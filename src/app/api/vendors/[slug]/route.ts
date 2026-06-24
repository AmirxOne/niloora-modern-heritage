export { dynamic } from "@/lib/server/route-segment";

import { notFound, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { getPublicVendorStorefront } from "@/lib/server/vendor/public-vendor-storefront";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const storefront = await getPublicVendorStorefront(slug);
    if (!storefront) return notFound("Vendor not found");
    return ok({ vendor: storefront });
  } catch (error) {
    return handleRouteError(error, { route: "/api/vendors/[slug]" });
  }
}
