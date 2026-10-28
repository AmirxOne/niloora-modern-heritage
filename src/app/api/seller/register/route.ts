import { readSessionUser } from "@/lib/server/auth/session";
import { badRequest, created, ok, unauthorized } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { registerSeller } from "@/lib/server/sellers/seller-service";

type Body = {
  shopName?: string;
  slug?: string;
  bio?: string;
  phone?: string;
};

/** Register a seller shop for the logged-in user (goes to admin approval). */
export async function POST(request: Request) {
  try {
    const user = await readSessionUser();
    if (!user) return unauthorized();

    const body = (await request.json()) as Body;
    const result = await registerSeller({
      userId: user.id,
      shopName: body.shopName ?? "",
      slug: body.slug ?? "",
      bio: body.bio ?? null,
      phone: body.phone ?? null,
    });

    if (!result.ok) {
      if (result.reason === "slug_taken") {
        return badRequest("این آدرس فروشگاه قبلاً گرفته شده است.");
      }
      if (result.reason === "already_seller") {
        return badRequest("برای این حساب قبلاً فروشگاه ثبت شده است.");
      }
      return badRequest("نام فروشگاه یا آدرس معتبر نیست (حداقل ۳ کاراکتر).");
    }

    return created({
      seller: result.seller,
      message:
        "درخواست شما ثبت شد. پس از بررسی کارگاه، فروشگاه شما فعال می‌شود.",
    });
  } catch (error) {
    return handleRouteError(error, { route: "/api/seller/register" });
  }
}
