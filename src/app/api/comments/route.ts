import { readSessionUser } from "@/lib/server/auth/session";
import { prisma } from "@/lib/server/prisma";
import { badRequest, created, ok, serverError, unauthorized } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";

type PostBody = {
  productId?: string;
  authorName?: string;
  body?: string;
  rating?: number;
  ratingBuildQuality?: number;
  ratingBeauty?: number;
  ratingValue?: number;
  ratingPackaging?: number;
  mediaUrl?: string;
  mediaType?: "image" | "video";
};

export async function GET(request: Request) {
  // PURPOSE: fetch comments for a product; default visibility is approved-only.
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const status = searchParams.get("status");

    if (!productId) return badRequest("Missing productId");

    const where: {
      productId: string;
      status?: string;
    } = { productId };

    if (status) {
      where.status = status;
    } else {
      where.status = "approved";
    }

    const comments = await prisma.productComment.findMany({
      where,
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
    return handleRouteError(error, { route: "/api/comments" });
  }
}

export async function POST(request: Request) {
  // FLOW: authenticated user submits comment -> stored as pending for moderation.
  try {
    const user = await readSessionUser();
    if (!user) return unauthorized();

    const payload = (await request.json()) as PostBody;
    const productId = payload.productId?.trim() ?? "";
    const authorName = payload.authorName?.trim() ?? "";
    const body = payload.body?.trim() ?? "";
    const rating = Math.min(5, Math.max(1, Math.round(payload.rating ?? 5)));
    const ratingBuildQuality = Math.min(5, Math.max(1, Math.round(payload.ratingBuildQuality ?? rating)));
    const ratingBeauty = Math.min(5, Math.max(1, Math.round(payload.ratingBeauty ?? rating)));
    const ratingValue = Math.min(5, Math.max(1, Math.round(payload.ratingValue ?? rating)));
    const ratingPackaging = Math.min(5, Math.max(1, Math.round(payload.ratingPackaging ?? rating)));
    const mediaUrl = payload.mediaUrl?.trim() ?? "";
    const mediaType = payload.mediaType;

    if (!productId || !authorName || body.length < 10 || body.length > 600) {
      return badRequest("Invalid comment payload");
    }
    if (mediaUrl) {
      if (!/^https?:\/\//i.test(mediaUrl)) return badRequest("Invalid mediaUrl");
      if (mediaType !== "image" && mediaType !== "video") return badRequest("Invalid mediaType");
    }

    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId: user.id,
          status: { in: ["processing", "crafting", "shipped", "delivered"] },
        },
      },
      select: { id: true },
    });

    const comment = await prisma.productComment.create({
      data: {
        productId,
        userId: user.id,
        authorName,
        body,
        rating,
        ratingBuildQuality,
        ratingBeauty,
        ratingValue,
        ratingPackaging,
        mediaUrl: mediaUrl || null,
        mediaType: mediaUrl ? mediaType : null,
        isVerifiedBuyer: Boolean(hasPurchased),
        status: "pending",
      },
    });

    return created({
      comment: {
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
      },
    });
  } catch (error) {
    return handleRouteError(error, { route: "/api/comments" });
  }
}
