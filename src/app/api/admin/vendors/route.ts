export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import {
  listAdminVendors,
  type AdminVendorListStatus,
} from "@/lib/server/vendor/vendor-service";

function parseVendorStatus(raw: string | null): AdminVendorListStatus | null {
  if (!raw || raw === "all") return "all";
  if (raw === "pending_review" || raw === "active") return raw;
  return null;
}

export async function GET(request: Request) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const status = parseVendorStatus(searchParams.get("status"));
    if (status === null) {
      return badRequest("وضعیت فیلتر نامعتبر است.");
    }

    const vendors = await listAdminVendors(status);
    return ok({ vendors });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/vendors" });
  }
}
