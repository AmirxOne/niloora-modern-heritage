import { readSessionUser } from "@/lib/server/auth/session";
import { prisma } from "@/lib/server/prisma";
import { badRequest, ok, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { ensureAdmin } from "@/lib/server/auth/guards";

type Body = {
  action?: "approve" | "reject";
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const { id } = await context.params;
    const body = (await request.json()) as Body;
    if (body.action !== "approve" && body.action !== "reject") {
      return badRequest("Invalid action");
    }

    const status = body.action === "approve" ? "approved" : "rejected";
    const comment = await prisma.productComment.update({
      where: { id },
      data: { status },
    });

    return ok({
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
    return handleRouteError(error, { route: "/api/comments/[id]" });
  }
}
