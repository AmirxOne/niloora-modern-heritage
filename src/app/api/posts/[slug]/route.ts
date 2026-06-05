export { dynamic } from "@/lib/server/route-segment";

import { notFound, ok, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { getPublishedPostBySlug } from "@/lib/server/blog/post-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const post = await getPublishedPostBySlug(slug);
    if (!post) return notFound("مقاله یافت نشد.");
    return ok({ post });
  } catch (error) {
    return handleRouteError(error, { route: "/api/posts/[slug]" });
  }
}
