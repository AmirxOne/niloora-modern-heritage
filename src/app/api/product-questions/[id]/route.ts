import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { prisma } from "@/lib/server/prisma";
import { badRequest, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";

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
    const question = await prisma.productQuestion.update({
      where: { id },
      data: { status },
    });

    return ok({
      question: {
        id: question.id,
        productId: question.productId,
        authorName: question.authorName,
        body: question.body,
        status: question.status,
        createdAt: question.createdAt.toISOString(),
      },
    });
  } catch (error) {
    return handleRouteError(error, { route: "/api/product-questions/[id]" });
  }
}
