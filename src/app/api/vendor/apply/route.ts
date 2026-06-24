export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { badRequest, created, ok, unauthorized } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { mapMarketplaceError } from "@/lib/server/marketplace/route-errors";
import { applyVendor } from "@/lib/server/vendor/vendor-service";

export async function POST(request: Request) {
  try {
    const user = await readSessionUser();
    if (!user) return unauthorized();

    const body = (await request.json()) as {
      displayName?: string;
      displayNameFa?: string;
      description?: string;
      contactPhone?: string;
      contactEmail?: string;
      slug?: string;
    };

    if (!body.displayName?.trim()) {
      return badRequest("نام نمایش فروشنده الزامی است.");
    }

    const vendor = await applyVendor({
      userId: user.id,
      displayName: body.displayName,
      displayNameFa: body.displayNameFa,
      description: body.description,
      contactPhone: body.contactPhone,
      contactEmail: body.contactEmail,
      slug: body.slug,
    });

    return created({ vendor });
  } catch (error) {
    const mapped = mapMarketplaceError(error);
    if (mapped) return mapped;
    return handleRouteError(error, { route: "/api/vendor/apply" });
  }
}
