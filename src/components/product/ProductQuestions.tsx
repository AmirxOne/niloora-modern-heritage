"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { fa } from "@/lib/i18n/fa";
import { useProductQuestions } from "@/lib/hooks/useProductQuestions";
import type { ProductQuestion } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { TextAreaBox, TextBox } from "@/components/inputs";
import { OrnamentalDivider } from "@/components/ui/OrnamentalDivider";
import { ProductQuestionCard } from "@/components/product/ProductQuestionCard";
import { cn } from "@/lib/utils";
import { usePagination } from "@/lib/hooks/usePagination";
import { QUESTIONS_PAGE_SIZE } from "@/lib/pagination";
import { Pagination } from "@/components/ui/Pagination";
import { UnifiedEmptyState } from "@/components/ui/UnifiedEmptyState";

const QUESTION_BODY_MIN = 10;
const QUESTION_BODY_MAX = 400;

type QuestionSort = "newest" | "mostAnswers";

interface ProductQuestionsProps {
  productId: string;
}

function sortQuestions(questions: ProductQuestion[], sort: QuestionSort): ProductQuestion[] {
  const copy = [...questions];
  if (sort === "mostAnswers") {
    return copy.sort(
      (a, b) =>
        b.answers.length - a.answers.length ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  return copy.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function ProductQuestions({ productId }: ProductQuestionsProps) {
  const { approved, submitQuestion, submitAnswer, isLoading } = useProductQuestions(productId);

  const [authorName, setAuthorName] = useState("");
  const [body, setBody] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [bodyError, setBodyError] = useState<string | null>(null);
  const [sort, setSort] = useState<QuestionSort>("newest");

  const sortedQuestions = useMemo(() => sortQuestions(approved, sort), [approved, sort]);

  const {
    paginatedItems: visibleQuestions,
    page,
    setPage,
    totalPages,
    from,
    to,
    totalItems,
  } = usePagination(sortedQuestions, QUESTIONS_PAGE_SIZE, sort);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);
    setBodyError(null);

    const trimmedName = authorName.trim();
    const trimmedBody = body.trim();

    if (!trimmedName) {
      setNameError(fa.product.questionValidationName);
      return;
    }
    if (trimmedBody.length < QUESTION_BODY_MIN) {
      setBodyError(fa.product.questionValidationBody);
      return;
    }
    if (trimmedBody.length > QUESTION_BODY_MAX) {
      setBodyError(fa.product.questionValidationBodyMax);
      return;
    }

    const success = await submitQuestion(trimmedName, trimmedBody);
    if (!success) {
      toast.error(fa.product.questionSubmitError);
      return;
    }
    toast.success(fa.product.questionSubmitted);
    setSubmitted(true);
    setBody("");
  };

  const sortOptions: { value: QuestionSort; label: string }[] = [
    { value: "newest", label: fa.product.questionSortNewest },
    { value: "mostAnswers", label: fa.product.questionSortMostAnswers },
  ];

  return (
    <section className="product-questions" aria-labelledby="product-questions-title">
      <header className="product-questions-header">
        <div>
          <h2 id="product-questions-title" className="product-questions-title">
            {fa.product.questionsTitle}
          </h2>
          <p className="product-questions-subtitle">{fa.product.questionsSubtitle}</p>
        </div>
        <OrnamentalDivider className="max-w-[10rem] justify-start" />
      </header>

      <div className="product-questions-layout">
        <aside className="product-questions-aside">
          <div className="product-question-form-wrap">
            <h3 className="product-question-form-title">{fa.product.questionFormTitle}</h3>
            <p className="product-question-form-hint">{fa.product.questionFormHint}</p>

            {submitted ? (
              <div className="product-question-success" role="status">
                <p>{fa.product.questionSubmitted}</p>
                <button
                  type="button"
                  className="product-question-success-action"
                  onClick={() => setSubmitted(false)}
                >
                  {fa.product.questionWriteAnother}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="product-question-form">
                <TextBox
                  label={fa.product.commentName}
                  placeholder={fa.product.commentNamePlaceholder}
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  error={nameError ?? undefined}
                  touched={Boolean(nameError)}
                  autoComplete="name"
                />
                <TextAreaBox
                  id="question-body"
                  label={fa.product.questionBody}
                  value={body}
                  onChange={(e) => setBody(e.target.value.slice(0, QUESTION_BODY_MAX))}
                  placeholder={fa.product.questionBodyPlaceholder}
                  maxLength={QUESTION_BODY_MAX}
                  error={bodyError ?? undefined}
                  touched={Boolean(bodyError)}
                />
                <Button type="submit" size="lg" className="w-full">
                  {fa.product.questionSubmit}
                </Button>
              </form>
            )}
          </div>
        </aside>

        <div className="product-questions-main">
          {isLoading ? (
            <div className="space-y-4" aria-busy="true" aria-live="polite">
              <div className="product-questions-toolbar">
                <div className="sk h-4 w-28" />
                <div className="sk h-9 w-48 rounded-full" />
              </div>
              {Array.from({ length: 2 }).map((_, idx) => (
                <article key={idx} className="product-question-card">
                  <div className="sk h-4 w-full" />
                  <div className="sk mt-2 h-3 w-24" />
                </article>
              ))}
            </div>
          ) : approved.length > 0 ? (
            <>
              <div className="product-questions-toolbar">
                <p className="product-questions-toolbar-count">
                  {fa.product.questionsCount(approved.length)}
                </p>
                <div className="product-reviews-sort">
                  <span className="product-reviews-sort-label">{fa.product.commentsSortLabel}</span>
                  <div className="product-reviews-sort-options" role="group">
                    {sortOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={cn(
                          "product-reviews-sort-btn",
                          sort === opt.value && "product-reviews-sort-btn--active"
                        )}
                        onClick={() => setSort(opt.value)}
                        aria-pressed={sort === opt.value}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <ul id="product-questions-list" className="product-questions-list">
                {visibleQuestions.map((question) => (
                  <li key={question.id}>
                    <ProductQuestionCard question={question} onSubmitAnswer={submitAnswer} />
                  </li>
                ))}
              </ul>
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                totalItems={totalItems}
                from={from}
                to={to}
                scrollTargetId="product-questions-list"
                className="product-questions-pagination"
              />
            </>
          ) : (
            <UnifiedEmptyState
              visual="questions"
              title={fa.product.questionsEmpty}
              description={fa.product.questionsBeFirst}
              className="product-questions-empty"
            />
          )}
        </div>
      </div>
    </section>
  );
}
