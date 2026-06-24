export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ok, unauthorized } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { mapMarketplaceError } from "@/lib/server/marketplace/route-errors";
import { listVendorPayouts } from "@/lib/server/marketplace/payout/vendor-payout-service";
import { requireActiveVendor } from "@/lib/server/vendor/vendor-guards";

function parsePagination(searchParams: URLSearchParams) {
  const pageRaw = searchParams.get("page");
  const pageSizeRaw = searchParams.get("pageSize");
  if (!pageRaw && !pageSizeRaw) return {};

  const page = pageRaw ? Number.parseInt(pageRaw, 10) : 1;
  const pageSize = pageSizeRaw ? Number.parseInt(pageSizeRaw, 10) : 20;

  return {
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : 20,
  };
}

export async function GET(request: Request) {
  try {
    const user = await readSessionUser();
    if (!user) return unauthorized();

    const membership = await requireActiveVendor(user.id);
    const { searchParams } = new URL(request.url);
    const payouts = await listVendorPayouts(membership.vendorId, parsePagination(searchParams));

    return ok({ payouts });
  } catch (error) {
    const mapped = mapMarketplaceError(error);
    if (mapped) return mapped;
    return handleRouteError(error, { route: "/api/vendor/payouts" });
  }
}
