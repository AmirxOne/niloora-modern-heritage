export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, created, ok, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import {
  createInstagramPost,
  listHomeInstagramPosts,
  mapInstagramPost,
} from "@/lib/server/home/home-instagram";

export async function GET() {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const posts = await listHomeInstagramPosts();
    return ok({ posts });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/home/instagram" });
  }
}

export async function POST(request: Request) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const body = (await request.json()) as Record<string, unknown>;
    const image = typeof body.image === "string" ? body.image : "";
    if (!image.trim()) return badRequest("آدرس تصویر الزامی است.");

    try {
      const row = await createInstagramPost({
        image,
        likes: Number(body.likes ?? 0),
        sortOrder: Number(body.sortOrder ?? 0),
      });
      return created({ post: mapInstagramPost(row) });
    } catch (error) {
      if (error instanceof Error && error.message === "IMAGE_REQUIRED") {
        return badRequest("آدرس تصویر الزامی است.");
      }
      throw error;
    }
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/home/instagram" });
  }
}
