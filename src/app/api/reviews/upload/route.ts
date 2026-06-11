export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { badRequest, ok, unauthorized } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { REVIEW_IMAGE_MAX_BYTES, storeReviewImage } from "@/lib/server/media/review-upload";

export async function POST(request: Request) {
  try {
    const user = await readSessionUser();
    if (!user) {
      return unauthorized("برای آپلود تصویر ابتدا وارد حساب شوید.");
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return badRequest("فایلی ارسال نشده است.");
    }
    if (file.size <= 0) {
      return badRequest("فایل خالی است.");
    }
    if (!file.type.startsWith("image/")) {
      return badRequest("فقط تصویر مجاز است.");
    }
    if (file.size > REVIEW_IMAGE_MAX_BYTES) {
      return badRequest("حداکثر حجم تصویر ۵ مگابایت است.");
    }

    const { url } = await storeReviewImage(file);
    return ok({ url });
  } catch (error) {
    return handleRouteError(error, { route: "/api/reviews/upload" });
  }
}
