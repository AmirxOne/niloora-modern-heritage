import { readSessionUser } from "@/lib/server/auth/session";
import { prisma } from "@/lib/server/prisma";
import { badRequest, created, ok, serverError, unauthorized } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";

type PostBody = {
  productId?: string;
  authorName?: string;
  body?: string;
  rating?: number;
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

    if (!productId || !authorName || body.length < 10 || body.length > 600) {
      return badRequest("Invalid comment payload");
    }

    const comment = await prisma.productComment.create({
      data: {
        productId,
        userId: user.id,
        authorName,
        body,
        rating,
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
        status: comment.status,
        createdAt: comment.createdAt.toISOString(),
      },
    });
  } catch (error) {
    return handleRouteError(error, { route: "/api/comments" });
  }
}
