import { readSessionUser } from "@/lib/server/auth/session";
import { prisma } from "@/lib/server/prisma";
import { badRequest, created, ok, unauthorized } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";

type PostBody = {
  productId?: string;
  authorName?: string;
  body?: string;
};

function mapAnswer(answer: {
  id: string;
  questionId: string;
  authorName: string;
  body: string;
  status: string;
  isOfficial: boolean;
  createdAt: Date;
}) {
  return {
    id: answer.id,
    questionId: answer.questionId,
    authorName: answer.authorName,
    body: answer.body,
    status: answer.status,
    isOfficial: answer.isOfficial,
    createdAt: answer.createdAt.toISOString(),
  };
}

function mapQuestion(
  question: {
    id: string;
    productId: string;
    authorName: string;
    body: string;
    status: string;
    createdAt: Date;
    answers: Array<{
      id: string;
      questionId: string;
      authorName: string;
      body: string;
      status: string;
      isOfficial: boolean;
      createdAt: Date;
    }>;
  }
) {
  return {
    id: question.id,
    productId: question.productId,
    authorName: question.authorName,
    body: question.body,
    status: question.status,
    createdAt: question.createdAt.toISOString(),
    answers: question.answers.map(mapAnswer),
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const status = searchParams.get("status");

    if (!productId) return badRequest("Missing productId");

    const where: { productId: string; status?: string } = { productId };
    where.status = status ?? "approved";

    const questions = await prisma.productQuestion.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        answers: {
          where: { status: "approved" },
          orderBy: [{ isOfficial: "desc" }, { createdAt: "asc" }],
        },
      },
    });

    return ok({ questions: questions.map(mapQuestion) });
  } catch (error) {
    return handleRouteError(error, { route: "/api/product-questions" });
  }
}

export async function POST(request: Request) {
  try {
    const user = await readSessionUser();
    if (!user) return unauthorized();

    const payload = (await request.json()) as PostBody;
    const productId = payload.productId?.trim() ?? "";
    const authorName = payload.authorName?.trim() ?? "";
    const body = payload.body?.trim() ?? "";

    if (!productId || !authorName || body.length < 10 || body.length > 400) {
      return badRequest("Invalid question payload");
    }

    const question = await prisma.productQuestion.create({
      data: {
        productId,
        userId: user.id,
        authorName,
        body,
        status: "pending",
      },
      include: { answers: true },
    });

    return created({ question: mapQuestion(question) });
  } catch (error) {
    return handleRouteError(error, { route: "/api/product-questions" });
  }
}
