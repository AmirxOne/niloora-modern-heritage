"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { ProductQuestion } from "@/lib/types";
import { fa } from "@/lib/i18n/fa";
import { resolveAccountDisplayName } from "@/lib/account/display-name";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  ProductQuestionAnswerFormModal,
  ANSWER_BODY_MAX,
  ANSWER_BODY_MIN,
} from "@/components/product/ProductQuestionAnswerFormModal";
import { cn } from "@/lib/utils";

function formatQuestionDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface ProductQuestionCardProps {
  question: ProductQuestion;
  onSubmitAnswer: (questionId: string, authorName: string, body: string) => Promise<boolean>;
}

export function ProductQuestionCard({ question, onSubmitAnswer }: ProductQuestionCardProps) {
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

  const [isAnswerModalOpen, setIsAnswerModalOpen] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [bodyError, setBodyError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const visibleAnswers = question.answers.filter((a) => a.status === "approved");
  const hasHiddenAnswers = visibleAnswers.length > 2;
  const [showAllAnswers, setShowAllAnswers] = useState(!hasHiddenAnswers);
  const displayedAnswers = showAllAnswers ? visibleAnswers : visibleAnswers.slice(0, 2);

  const resetAnswerForm = () => {
    setBody("");
    setNameError(null);
    setBodyError(null);
  };

  const openAnswerModal = () => {
    setSubmitted(false);
    if (isLoggedIn && accountDisplayName) {
      setAuthorName(accountDisplayName);
    }
    setIsAnswerModalOpen(true);
  };

  const closeAnswerModal = () => {
    setIsAnswerModalOpen(false);
    if (!submitted) {
      setNameError(null);
      setBodyError(null);
    }
  };

  const handleSubmittedReset = () => {
    setSubmitted(false);
    resetAnswerForm();
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
    if (trimmedBody.length < ANSWER_BODY_MIN) {
      setBodyError(fa.product.questionValidationAnswer);
      return;
    }
    if (trimmedBody.length > ANSWER_BODY_MAX) {
      setBodyError(fa.product.questionValidationAnswerMax);
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onSubmitAnswer(question.id, trimmedName, trimmedBody);
      if (!success) {
        toast.error(fa.product.questionAnswerSubmitError);
        return;
      }
      toast.success(fa.product.questionAnswerSubmitted);
      setSubmitted(true);
      resetAnswerForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <article className="product-question-card">
        <div className="product-question-card-top">
          <p className="product-question-body">{question.body}</p>
          {!submitted ? (
            <button
              type="button"
              className="product-question-answer-cta"
              onClick={openAnswerModal}
            >
              {fa.product.questionAnswerCta}
            </button>
          ) : null}
        </div>

        {displayedAnswers.length > 0 ? (
          <ul className="product-question-answers">
            {displayedAnswers.map((answer) => (
              <li
                key={answer.id}
                className={cn(
                  "product-question-answer",
                  answer.isOfficial && "product-question-answer--official"
                )}
              >
                <div className="product-question-answer-header">
                  <span className="product-question-answer-author">{answer.authorName}</span>
                  {answer.isOfficial ? (
                    <span className="product-question-official-badge">
                      {fa.product.questionOfficialAnswer}
                    </span>
                  ) : null}
                </div>
                <p className="product-question-answer-body">{answer.body}</p>
                <time className="product-question-answer-date" dateTime={answer.createdAt}>
                  {formatQuestionDate(answer.createdAt)}
                </time>
              </li>
            ))}
          </ul>
        ) : null}

        {hasHiddenAnswers && !showAllAnswers ? (
          <button
            type="button"
            className="product-question-more-answers"
            onClick={() => setShowAllAnswers(true)}
          >
            {fa.product.questionMoreAnswers(visibleAnswers.length - 2)}
          </button>
        ) : null}

        {submitted ? (
          <p className="product-question-answer-pending" role="status">
            {fa.product.questionAnswerSubmitted}
          </p>
        ) : null}
      </article>

      <ProductQuestionAnswerFormModal
        isOpen={isAnswerModalOpen}
        onClose={closeAnswerModal}
        questionBody={question.body}
        authorName={authorName}
        onAuthorNameChange={setAuthorName}
        body={body}
        onBodyChange={setBody}
        nameError={nameError}
        bodyError={bodyError}
        submitted={submitted}
        isSubmitting={isSubmitting}
        onSubmittedReset={handleSubmittedReset}
        onSubmit={handleSubmit}
      />
    </>
  );
}
