import { readSessionUser } from "@/lib/server/auth/session";
import { prisma } from "@/lib/server/prisma";
import { ok, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { ensureAdmin } from "@/lib/server/auth/guards";

export async function GET() {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const comments = await prisma.productComment.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "desc" },
    });

    return ok({
      comments: comments.map((comment) => ({
        id: comment.id,
        productId: comment.productId,
        authorName: comment.authorName,
        body: comment.body,
        rating: comment.rating,
        ratingBuildQuality: comment.ratingBuildQuality,
        ratingBeauty: comment.ratingBeauty,
        ratingValue: comment.ratingValue,
        ratingPackaging: comment.ratingPackaging,
        mediaUrl: comment.mediaUrl ?? undefined,
        mediaType: (comment.mediaType as "image" | "video" | null) ?? undefined,
        isVerifiedBuyer: comment.isVerifiedBuyer,
        status: comment.status,
        createdAt: comment.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return handleRouteError(error, { route: "/api/comments/pending" });
  }
}
