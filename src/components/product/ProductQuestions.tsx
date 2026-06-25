"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { fa } from "@/lib/i18n/fa";
import { resolveAccountDisplayName } from "@/lib/account/display-name";
import { useAuth } from "@/lib/hooks/useAuth";
import { useProductQuestions } from "@/lib/hooks/useProductQuestions";
import { useStickyWithinContainer } from "@/lib/hooks/useStickyWithinContainer";
import type { ProductQuestion } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { ProductQuestionCard } from "@/components/product/ProductQuestionCard";
import {
  ProductQuestionFormModal,
  QUESTION_BODY_MAX,
  QUESTION_BODY_MIN,
} from "@/components/product/ProductQuestionFormModal";
import { cn } from "@/lib/utils";
import { usePagination } from "@/lib/hooks/usePagination";
import { QUESTIONS_PAGE_SIZE } from "@/lib/pagination";
import { Pagination } from "@/components/ui/Pagination";
import { UnifiedEmptyState } from "@/components/ui/UnifiedEmptyState";

type QuestionSort = "newest" | "mostAnswers";

interface ProductQuestionsProps {
  productId: string;
  productName?: string;
  productImage?: string;
  initialApproved?: ProductQuestion[];
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

export function ProductQuestions({
  productId,
  productName,
  productImage,
  initialApproved,
}: ProductQuestionsProps) {
  const { approved, submitQuestion, submitAnswer, isLoading } = useProductQuestions(
    productId,
    initialApproved
  );
  const { user, isLoggedIn } = useAuth();
  const accountDisplayName = useMemo(() => {
    if (!user) return "";
    return resolveAccountDisplayName({
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name,
      phone: user.phone,
    });
  }, [user]);
  const {
    containerRef: questionsLayoutRef,
    targetRef: questionsSummaryRef,
    phase: questionsSummaryPhase,
    targetStyle: questionsSummaryStyle,
    placeholderHeight: questionsSummaryPlaceholderHeight,
  } = useStickyWithinContainer(true, 3.25);

  const [authorName, setAuthorName] = useState("");
  const [body, setBody] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
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

  const resetFormFields = () => {
    setBody("");
    setNameError(null);
    setBodyError(null);
  };

  const openFormModal = () => {
    setSubmitted(false);
    if (isLoggedIn && accountDisplayName) {
      setAuthorName(accountDisplayName);
    }
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setSubmitted(false);
  };

  const handleSubmittedReset = () => {
    setSubmitted(false);
    resetFormFields();
    if (isLoggedIn && accountDisplayName) {
      setAuthorName(accountDisplayName);
    }
  };

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
    resetFormFields();
  };

  const sortOptions: { value: QuestionSort; label: string }[] = [
    { value: "newest", label: fa.product.questionSortNewest },
    { value: "mostAnswers", label: fa.product.questionSortMostAnswers },
  ];

  return (
    <section className="product-questions" aria-labelledby="product-questions-title">
      <div className="product-questions-section">
        <header className="product-questions-section-header">
          <h2 id="product-questions-title" className="product-questions-title">
            {fa.product.questionsTitle}
          </h2>
        </header>

        <div ref={questionsLayoutRef} className="product-questions-layout">
          <aside
            className="product-questions-summary"
            style={
              questionsSummaryPlaceholderHeight
                ? { minHeight: questionsSummaryPlaceholderHeight }
                : undefined
            }
          >
            <div
              ref={questionsSummaryRef}
              className={cn(
                "product-questions-summary-sticky",
                questionsSummaryPhase === "bottom" && "product-questions-summary-sticky--bottom"
              )}
              style={questionsSummaryStyle}
            >
              <div className="product-reviews-cta">
                <p className="product-reviews-cta-text">{fa.product.questionCtaPrompt}</p>
                <Button
                  type="button"
                  variant="outline"
                  className="product-reviews-cta-btn"
                  onClick={openFormModal}
                >
                  {fa.product.questionSubmit}
                </Button>
              </div>
            </div>
          </aside>

          <div className="product-questions-main">
        <div className="product-questions-body">
          {isLoading ? (
            <div className="space-y-3" aria-busy="true" aria-live="polite">
              <div className="product-questions-toolbar">
                <div className="sk h-8 w-48 rounded-full" />
                <div className="sk h-4 w-20" />
              </div>
              {Array.from({ length: 2 }).map((_, idx) => (
                <article key={idx} className="product-question-card">
                  <div className="sk h-4 w-full" />
                  <div className="sk mt-3 h-3 w-3/4" />
                </article>
              ))}
            </div>
          ) : approved.length > 0 ? (
            <>
              <div className="product-questions-toolbar">
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
                <p className="product-questions-toolbar-count">
                  {fa.product.questionsCount(approved.length)}
                </p>
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
        </div>
      </div>

      <ProductQuestionFormModal
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        productName={productName}
        productImage={productImage}
        authorName={authorName}
        onAuthorNameChange={setAuthorName}
        body={body}
        onBodyChange={setBody}
        nameError={nameError}
        bodyError={bodyError}
        submitted={submitted}
        onSubmittedReset={handleSubmittedReset}
        onSubmit={handleSubmit}
      />
    </section>
  );
}
