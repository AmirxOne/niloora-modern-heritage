export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { writeAdminAuditLog } from "@/lib/server/audit-log";
import { mapMarketplaceError } from "@/lib/server/marketplace/route-errors";
import {
  VENDOR_MEDIA_MAX_BYTES,
  storeVendorMediaAsset,
} from "@/lib/server/media/vendor-upload";
import { badRequest, ok, unauthorized } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { requireVendorMembership } from "@/lib/server/vendor/vendor-guards";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export async function POST(request: Request) {
  try {
    const user = await readSessionUser();
    if (!user) return unauthorized();

    const membership = await requireVendorMembership(user.id);

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return badRequest("فایلی ارسال نشده است.");
    }
    if (file.size <= 0) {
      return badRequest("فایل خالی است.");
    }
    if (file.size > VENDOR_MEDIA_MAX_BYTES) {
      return badRequest("حداکثر حجم تصویر ۸ مگابایت است.");
    }
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return badRequest("فرمت تصویر مجاز نیست. فقط JPG/PNG/WEBP/AVIF مجاز است.");
    }

    let asset;
    try {
      asset = await storeVendorMediaAsset({
        vendorId: membership.vendorId,
        uploadedByUserId: user.id,
        file,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "VENDOR_MEDIA_INVALID_DIMENSIONS") {
        return badRequest("ابعاد تصویر نامعتبر است. حداقل 64x64 و حداکثر 8000x8000.");
      }
      throw error;
    }

    await writeAdminAuditLog({
      user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
      request,
      action: "vendor.media.upload",
      route: "/api/vendor/media",
      entityType: "media",
      entityId: asset.id,
      summary: `vendor media upload ${asset.id}`,
      payload: {
        id: asset.id,
        vendorId: asset.vendorId,
        uploadedByUserId: asset.uploadedByUserId,
        url: asset.url,
        width: asset.width,
        height: asset.height,
        sizeBytes: asset.sizeBytes,
      },
    });

    return ok({
      asset: {
        id: asset.id,
        url: asset.url,
        canonicalUrl: asset.url,
        width: asset.width,
        height: asset.height,
        sizeBytes: asset.sizeBytes,
        mimeType: asset.mimeType,
        createdAt: asset.createdAt,
      },
    });
  } catch (error) {
    const mapped = mapMarketplaceError(error);
    if (mapped) return mapped;
    return handleRouteError(error, { route: "/api/vendor/media" });
  }
}
