export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { badRequest, ok, unauthorized } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { mapMarketplaceError } from "@/lib/server/marketplace/route-errors";
import { updateVendorProfile } from "@/lib/server/vendor/vendor-service";
import { requireVendorOwner } from "@/lib/server/vendor/vendor-guards";

function isSafeMediaUrl(value: string): boolean {
  return (
    value.startsWith("/uploads/") ||
    value.startsWith("http://") ||
    value.startsWith("https://")
  );
}

export async function PATCH(request: Request) {
  try {
    const user = await readSessionUser();
    if (!user) return unauthorized();
    await requireVendorOwner(user.id);

    const body = (await request.json()) as {
      displayName?: string;
      displayNameFa?: string | null;
      description?: string | null;
      profileImageUrl?: string | null;
      bannerImageUrl?: string | null;
      contactPhone?: string | null;
      contactEmail?: string | null;
    };
    const profileImageUrl = body.profileImageUrl?.trim();
    if (profileImageUrl && !isSafeMediaUrl(profileImageUrl)) {
      return badRequest("آدرس تصویر پروفایل نامعتبر است.");
    }
    const bannerImageUrl = body.bannerImageUrl?.trim();
    if (bannerImageUrl && !isSafeMediaUrl(bannerImageUrl)) {
      return badRequest("آدرس بنر فروشگاه نامعتبر است.");
    }

    const vendor = await updateVendorProfile(user.id, body);
    return ok({ vendor });
  } catch (error) {
    const mapped = mapMarketplaceError(error);
    if (mapped) return mapped;
    return handleRouteError(error, { route: "/api/vendor/profile" });
  }
}
