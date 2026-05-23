"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { usePagination } from "@/lib/hooks/usePagination";
import {
  useProductQuestionsModeration,
  type PendingProductQuestionAnswer,
} from "@/lib/hooks/useProductQuestions";
import type { ProductQuestion } from "@/lib/types";
import { MODERATION_PAGE_SIZE } from "@/lib/pagination";
import { useCatalogProducts } from "@/lib/hooks/useCatalogProducts";
import { fa } from "@/lib/i18n/fa";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PendingQuestionCard({
  question,
  index,
  productName,
  onApprove,
  onReject,
}: {
  question: ProductQuestion;
  index: number;
  productName?: string;
  onApprove: (id: string) => Promise<boolean>;
  onReject: (id: string) => Promise<boolean>;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4 }}
      className="comment-moderation-card"
    >
      <div className="comment-moderation-card-top">
        <div>
          <p className="comment-moderation-meta">
            {fa.dashboard.commentOnProduct}{" "}
            {productName ? (
              <Link href={`/product/${question.productId}`} className="comment-moderation-product-link">
                {productName}
              </Link>
            ) : (
              question.productId
            )}
          </p>
          <p className="comment-moderation-author">{question.authorName}</p>
          <p className="comment-moderation-date">{formatDate(question.createdAt)}</p>
        </div>
      </div>
      <p className="comment-moderation-body">{question.body}</p>
      <div className="comment-moderation-actions">
        <Button type="button" size="sm" onClick={() => onApprove(question.id)}>
          {fa.dashboard.commentApprove}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => onReject(question.id)}>
          {fa.dashboard.commentReject}
        </Button>
      </div>
    </motion.article>
  );
}

function PendingAnswerCard({
  answer,
  index,
  productName,
  onApprove,
  onReject,
}: {
  answer: PendingProductQuestionAnswer;
  index: number;
  productName?: string;
  onApprove: (id: string) => Promise<boolean>;
  onReject: (id: string) => Promise<boolean>;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4 }}
      className="comment-moderation-card"
    >
      <div className="comment-moderation-card-top">
        <div>
          <p className="comment-moderation-meta">
            {fa.dashboard.commentOnProduct}{" "}
            {productName ? (
              <Link href={`/product/${answer.productId}`} className="comment-moderation-product-link">
                {productName}
              </Link>
            ) : (
              answer.productId
            )}
          </p>
          <p className="comment-moderation-author">{answer.authorName}</p>
          <p className="comment-moderation-date">{formatDate(answer.createdAt)}</p>
        </div>
      </div>
      <p className="comment-moderation-body">
        <strong>{fa.product.questionsTitle}: </strong>
        {answer.questionBody}
      </p>
      <p className="comment-moderation-body">{answer.body}</p>
      <div className="comment-moderation-actions">
        <Button type="button" size="sm" onClick={() => onApprove(answer.id)}>
          {fa.dashboard.commentApprove}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => onReject(answer.id)}>
          {fa.dashboard.commentReject}
        </Button>
      </div>
    </motion.article>
  );
}

export function ProductQuestionsModeration() {
  const moderation = useProductQuestionsModeration();
  const { products } = useCatalogProducts();
  const productNameById = new Map(products.map((product) => [product.id, product.name]));

  const {
    paginatedItems: pagedQuestions,
    page: questionsPage,
    setPage: setQuestionsPage,
    totalPages: questionsPages,
    from: questionsFrom,
    to: questionsTo,
    totalItems: questionsTotal,
  } = usePagination(
    moderation.pendingQuestions,
    MODERATION_PAGE_SIZE,
    moderation.pendingQuestions.length
  );

  const {
    paginatedItems: pagedAnswers,
    page: answersPage,
    setPage: setAnswersPage,
    totalPages: answersPages,
    from: answersFrom,
    to: answersTo,
    totalItems: answersTotal,
  } = usePagination(
    moderation.pendingAnswers,
    MODERATION_PAGE_SIZE,
    moderation.pendingAnswers.length
  );

  const handleApproveQuestion = async (id: string): Promise<boolean> => {
    const ok = await moderation.approveQuestion(id);
    if (ok) toast.success("پرسش تایید شد.");
    else toast.error("تایید پرسش انجام نشد.");
    return ok;
  };

  const handleRejectQuestion = async (id: string): Promise<boolean> => {
    const ok = await moderation.rejectQuestion(id);
    if (ok) toast.success("پرسش رد شد.");
    else toast.error("رد پرسش انجام نشد.");
    return ok;
  };

  const handleApproveAnswer = async (id: string): Promise<boolean> => {
    const ok = await moderation.approveAnswer(id);
    if (ok) toast.success("پاسخ تایید شد.");
    else toast.error("تایید پاسخ انجام نشد.");
    return ok;
  };

  const handleRejectAnswer = async (id: string): Promise<boolean> => {
    const ok = await moderation.rejectAnswer(id);
    if (ok) toast.success("پاسخ رد شد.");
    else toast.error("رد پاسخ انجام نشد.");
    return ok;
  };

  return (
    <div className="comment-moderation space-y-8">
      <div className="comment-moderation-header">
        <div>
          <h2 className="font-display text-2xl text-ivory md:text-3xl">
            {fa.dashboard.questionModeration}
          </h2>
          <p className="mt-2 text-sm text-silver">{fa.dashboard.questionModerationHint}</p>
          {moderation.pendingTotal > 0 ? (
            <p className="mt-2 text-xs font-medium text-gold-dark">
              {fa.dashboard.questionModerationPending(moderation.pendingTotal)}
            </p>
          ) : null}
        </div>
      </div>

      {moderation.isPendingLoading ? (
        <div className="comment-moderation-list space-y-4" aria-busy="true" aria-live="polite">
          {Array.from({ length: 3 }).map((_, idx) => (
            <article key={idx} className="comment-moderation-card">
              <div className="comment-moderation-card-top">
                <div>
                  <div className="sk h-3 w-44" />
                  <div className="sk mt-3 h-4 w-28" />
                  <div className="sk mt-2 h-3 w-36" />
                </div>
              </div>
              <div className="sk mt-4 h-3 w-full" />
              <div className="sk mt-2 h-3 w-11/12" />
            </article>
          ))}
        </div>
      ) : !moderation.canModerate ? (
        <div className="comment-moderation-empty">
          <p className="text-silver">{fa.dashboard.questionModerationForbidden}</p>
        </div>
      ) : (
        <>
          <section>
            <h3 className="mb-3 text-lg font-semibold text-ivory">{fa.product.questionsTitle}</h3>
            {moderation.pendingQuestions.length === 0 ? (
              <div className="comment-moderation-empty">
                <p className="text-silver">{fa.dashboard.questionModerationQuestionsEmpty}</p>
              </div>
            ) : (
              <>
                <div className="comment-moderation-list">
                  {pagedQuestions.map((question, i) => (
                    <PendingQuestionCard
                      key={question.id}
                      question={question}
                      index={i}
                      productName={productNameById.get(question.productId)}
                      onApprove={handleApproveQuestion}
                      onReject={handleRejectQuestion}
                    />
                  ))}
                </div>
                <Pagination
                  page={questionsPage}
                  totalPages={questionsPages}
                  onPageChange={setQuestionsPage}
                  totalItems={questionsTotal}
                  from={questionsFrom}
                  to={questionsTo}
                  scrollTargetId="comment-moderation"
                  className="comment-moderation-pagination"
                />
              </>
            )}
          </section>

          <section>
            <h3 className="mb-3 text-lg font-semibold text-ivory">{fa.product.questionAnswerCta}</h3>
            {moderation.pendingAnswers.length === 0 ? (
              <div className="comment-moderation-empty">
                <p className="text-silver">{fa.dashboard.questionModerationAnswersEmpty}</p>
              </div>
            ) : (
              <>
                <div className="comment-moderation-list">
                  {pagedAnswers.map((answer, i) => (
                    <PendingAnswerCard
                      key={answer.id}
                      answer={answer}
                      index={i}
                      productName={productNameById.get(answer.productId)}
                      onApprove={handleApproveAnswer}
                      onReject={handleRejectAnswer}
                    />
                  ))}
                </div>
                <Pagination
                  page={answersPage}
                  totalPages={answersPages}
                  onPageChange={setAnswersPage}
                  totalItems={answersTotal}
                  from={answersFrom}
                  to={answersTo}
                  scrollTargetId="comment-moderation"
                  className="comment-moderation-pagination"
                />
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
