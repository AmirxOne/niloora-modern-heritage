import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { prisma } from "@/lib/server/prisma";
import { ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";

export async function GET() {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const [questions, answers] = await Promise.all([
      prisma.productQuestion.findMany({
        where: { status: "pending" },
        orderBy: { createdAt: "desc" },
      }),
      prisma.productQuestionAnswer.findMany({
        where: { status: "pending" },
        orderBy: [{ isOfficial: "desc" }, { createdAt: "desc" }],
        include: {
          question: {
            select: {
              id: true,
              productId: true,
              body: true,
              authorName: true,
            },
          },
        },
      }),
    ]);

    return ok({
      questions: questions.map((question) => ({
        id: question.id,
        productId: question.productId,
        authorName: question.authorName,
        body: question.body,
        status: question.status,
        createdAt: question.createdAt.toISOString(),
        answers: [],
      })),
      answers: answers.map((answer) => ({
        id: answer.id,
        questionId: answer.questionId,
        authorName: answer.authorName,
        body: answer.body,
        status: answer.status,
        isOfficial: answer.isOfficial,
        createdAt: answer.createdAt.toISOString(),
        productId: answer.question.productId,
        questionBody: answer.question.body,
        questionAuthorName: answer.question.authorName,
      })),
    });
  } catch (error) {
    return handleRouteError(error, { route: "/api/product-questions/pending" });
  }
}
