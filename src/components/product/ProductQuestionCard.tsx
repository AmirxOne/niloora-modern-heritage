"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { ProductQuestion } from "@/lib/types";
import { fa } from "@/lib/i18n/fa";
import { Button } from "@/components/ui/Button";
import { TextAreaBox, TextBox } from "@/components/inputs";
import { cn } from "@/lib/utils";

const ANSWER_BODY_MIN = 10;
const ANSWER_BODY_MAX = 600;

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
  const [showAnswerForm, setShowAnswerForm] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [bodyError, setBodyError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const visibleAnswers = question.answers.filter((a) => a.status === "approved");
  const hasHiddenAnswers = question.answers.length > 2;
  const [showAllAnswers, setShowAllAnswers] = useState(!hasHiddenAnswers);
  const displayedAnswers = showAllAnswers ? visibleAnswers : visibleAnswers.slice(0, 2);

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
      setBody("");
      setShowAnswerForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <article className="product-question-card">
      <header className="product-question-card-header">
        <p className="product-question-body">{question.body}</p>
        <p className="product-question-meta">
          <span>{question.authorName}</span>
          <span aria-hidden> · </span>
          <time dateTime={question.createdAt}>{formatQuestionDate(question.createdAt)}</time>
        </p>
      </header>

      {displayedAnswers.length > 0 ? (
        <ul className="product-question-answers">
          {displayedAnswers.map((answer) => (
            <li key={answer.id} className="product-question-answer">
              <div className="product-question-answer-header">
                <span className="product-question-answer-author">{answer.authorName}</span>
                {answer.isOfficial ? (
                  <span className="product-question-official-badge">{fa.product.questionOfficialAnswer}</span>
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
      ) : showAnswerForm ? (
        <form onSubmit={handleSubmit} className="product-question-answer-form">
          <TextBox
            label={fa.product.questionAnswerName}
            placeholder={fa.product.commentNamePlaceholder}
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            error={nameError ?? undefined}
            touched={Boolean(nameError)}
            autoComplete="name"
          />
          <TextAreaBox
            id={`answer-${question.id}`}
            label={fa.product.questionAnswerBody}
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, ANSWER_BODY_MAX))}
            placeholder={fa.product.questionAnswerPlaceholder}
            maxLength={ANSWER_BODY_MAX}
            error={bodyError ?? undefined}
            touched={Boolean(bodyError)}
          />
          <div className="product-question-answer-form-actions">
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {fa.product.questionAnswerSubmit}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAnswerForm(false)}
            >
              {fa.product.questionAnswerCancel}
            </Button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          className={cn("product-question-answer-cta")}
          onClick={() => setShowAnswerForm(true)}
        >
          {fa.product.questionAnswerCta}
        </button>
      )}
    </article>
  );
}
