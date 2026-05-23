import { readSessionUser } from "@/lib/server/auth/session";
import { prisma } from "@/lib/server/prisma";
import { badRequest, created, unauthorized } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";

type PostBody = {
  authorName?: string;
  body?: string;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await readSessionUser();
    if (!user) return unauthorized();

    const { id: questionId } = await context.params;
    const payload = (await request.json()) as PostBody;
    const authorName = payload.authorName?.trim() ?? "";
    const body = payload.body?.trim() ?? "";

    if (!authorName || body.length < 10 || body.length > 600) {
      return badRequest("Invalid answer payload");
    }

    const question = await prisma.productQuestion.findUnique({
      where: { id: questionId },
      select: { id: true, status: true },
    });

    if (!question || question.status !== "approved") {
      return badRequest("Question not found");
    }

    const isOfficial = user.role === "admin";

    const answer = await prisma.productQuestionAnswer.create({
      data: {
        questionId,
        userId: user.id,
        authorName,
        body,
        status: "pending",
        isOfficial,
      },
    });

    return created({
      answer: {
        id: answer.id,
        questionId: answer.questionId,
        authorName: answer.authorName,
        body: answer.body,
        status: answer.status,
        isOfficial: answer.isOfficial,
        createdAt: answer.createdAt.toISOString(),
      },
    });
  } catch (error) {
    return handleRouteError(error, { route: "/api/product-questions/[id]/answers" });
  }
}
