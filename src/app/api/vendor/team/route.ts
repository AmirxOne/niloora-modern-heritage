export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { badRequest, created, ok, unauthorized } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { mapMarketplaceError } from "@/lib/server/marketplace/route-errors";
import { normalizeIranPhone } from "@/lib/auth/phone";
import { requireActiveVendor, requireActiveVendorOwner } from "@/lib/server/vendor/vendor-guards";
import {
  addVendorStaffMember,
  listVendorTeam,
} from "@/lib/server/vendor/vendor-team-service";

export async function GET() {
  try {
    const user = await readSessionUser();
    if (!user) return unauthorized();
    const membership = await requireActiveVendor(user.id);

    const members = await listVendorTeam(membership.vendorId);
    return ok({ members });
  } catch (error) {
    const mapped = mapMarketplaceError(error);
    if (mapped) return mapped;
    return handleRouteError(error, { route: "/api/vendor/team" });
  }
}

export async function POST(request: Request) {
  try {
    const user = await readSessionUser();
    if (!user) return unauthorized();
    const membership = await requireActiveVendorOwner(user.id);

    const body = (await request.json()) as { phone?: string };
    const phone = normalizeIranPhone(body.phone ?? "");
    if (!phone) {
      return badRequest("شماره موبایل معتبر ایران وارد کنید (۰۹xxxxxxxxx).", "invalid_phone");
    }

    const member = await addVendorStaffMember({
      vendorId: membership.vendorId,
      phone,
    });
    return created({ member });
  } catch (error) {
    const mapped = mapMarketplaceError(error);
    if (mapped) return mapped;
    return handleRouteError(error, { route: "/api/vendor/team" });
  }
}
