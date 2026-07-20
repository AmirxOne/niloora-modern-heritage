export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { badRequest, ok, unauthorized } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { mapMarketplaceError } from "@/lib/server/marketplace/route-errors";
import { listVendorPayouts } from "@/lib/server/marketplace/payout/vendor-payout-service";
import { requireActiveVendor, requireActiveVendorOwner } from "@/lib/server/vendor/vendor-guards";
import {
  requestPayout,
  PayoutError,
} from "@/lib/server/marketplace/payout/payout-service";
import { toPayoutDto } from "@/lib/server/marketplace/payout/payout-dto";

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

type PayoutRequestBody = {
  reference?: string;
  settlementIds?: string[];
};

export async function POST(request: Request) {
  try {
    const user = await readSessionUser();
    if (!user) return unauthorized();

    const membership = await requireActiveVendorOwner(user.id);

    const body = (await request.json().catch(() => ({}))) as PayoutRequestBody;
    const reference = body.reference?.trim();
    const settlementIds = Array.isArray(body.settlementIds)
      ? body.settlementIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0)
      : undefined;

    if (!reference) {
      return badRequest("کلید یکتای درخواست (reference) الزامی است.");
    }

    try {
      const { payout, deduped, settlementIds: claimed } = await requestPayout({
        vendorId: membership.vendorId,
        userId: membership.userId,
        reference,
        settlementIds,
        requestedById: user.id,
      });
      return ok({ payout: toPayoutDto(payout), deduped, settlementIds: claimed });
    } catch (err) {
      if (err instanceof PayoutError) {
        return badRequest(err.message, err.code);
      }
      throw err;
    }
  } catch (error) {
    const mapped = mapMarketplaceError(error);
    if (mapped) return mapped;
    return handleRouteError(error, { route: "/api/vendor/payouts" });
  }
}
