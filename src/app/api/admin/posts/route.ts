import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, created, ok, serverError, conflict } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { mapAdminPost, createPost, listAdminPosts, parseAdminPostBody } from "@/lib/server/blog/post-service";

export async function GET() {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const posts = await listAdminPosts();
    return ok({ posts });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/posts" });
  }
}

export async function POST(request: Request) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const parsed = parseAdminPostBody(await request.json());
    if (!parsed.ok) return badRequest(parsed.message);

    try {
      const row = await createPost(parsed.data);
      return created({ post: mapAdminPost(row) });
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code: string }).code === "P2002"
      ) {
        return conflict("نامک (slug) تکراری است.");
      }
      throw error;
    }
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/posts" });
  }
}
