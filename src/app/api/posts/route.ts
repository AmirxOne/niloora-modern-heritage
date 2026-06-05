export { dynamic } from "@/lib/server/route-segment";

import { ok, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { listPublishedPosts } from "@/lib/server/blog/post-service";

export async function GET() {
  try {
    const posts = await listPublishedPosts();
    return ok({ posts });
  } catch (error) {
    return handleRouteError(error, { route: "/api/posts" });
  }
}
