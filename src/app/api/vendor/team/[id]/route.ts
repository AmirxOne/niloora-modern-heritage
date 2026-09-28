export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ok, unauthorized } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { mapMarketplaceError } from "@/lib/server/marketplace/route-errors";
import { requireActiveVendorOwner } from "@/lib/server/vendor/vendor-guards";
import { removeVendorStaffMember } from "@/lib/server/vendor/vendor-team-service";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await readSessionUser();
    if (!user) return unauthorized();
    const membership = await requireActiveVendorOwner(user.id);

    const { id } = await context.params;
    const removed = await removeVendorStaffMember({
      vendorId: membership.vendorId,
      memberId: id,
    });
    return ok({ member: removed });
  } catch (error) {
    const mapped = mapMarketplaceError(error);
    if (mapped) return mapped;
    return handleRouteError(error, { route: "/api/vendor/team/[id]" });
  }
}
