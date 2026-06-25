import type { ProductComment, ProductQuestion } from "@/lib/types";

type DbComment = {
  id: string;
  productId: string;
  authorName: string;
  body: string;
  rating: number;
  ratingBuildQuality: number;
  ratingBeauty: number;
  ratingValue: number;
  ratingPackaging: number;
  mediaUrl: string | null;
  mediaType: string | null;
  isVerifiedBuyer: boolean;
  status: string;
  createdAt: Date;
};

type DbQuestion = {
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
};

export function mapDbProductComment(comment: DbComment): ProductComment {
  return {
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
    status: comment.status as ProductComment["status"],
    createdAt: comment.createdAt.toISOString(),
  };
}

export function mapDbProductQuestion(question: DbQuestion): ProductQuestion {
  return {
    id: question.id,
    productId: question.productId,
    authorName: question.authorName,
    body: question.body,
    status: question.status as ProductQuestion["status"],
    createdAt: question.createdAt.toISOString(),
    answers: question.answers.map((answer) => ({
      id: answer.id,
      questionId: answer.questionId,
      authorName: answer.authorName,
      body: answer.body,
      status: answer.status as ProductQuestion["answers"][number]["status"],
      isOfficial: answer.isOfficial,
      createdAt: answer.createdAt.toISOString(),
    })),
  };
}
