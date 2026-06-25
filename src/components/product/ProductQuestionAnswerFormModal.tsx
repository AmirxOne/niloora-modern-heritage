"use client";

import { fa } from "@/lib/i18n/fa";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TextAreaBox, TextBox } from "@/components/inputs";

const ANSWER_BODY_MIN = 10;
const ANSWER_BODY_MAX = 600;

interface ProductQuestionAnswerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionBody: string;
  authorName: string;
  onAuthorNameChange: (value: string) => void;
  body: string;
  onBodyChange: (value: string) => void;
  nameError: string | null;
  bodyError: string | null;
  submitted: boolean;
  isSubmitting: boolean;
  onSubmittedReset: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ProductQuestionAnswerFormModal({
  isOpen,
  onClose,
  questionBody,
  authorName,
  onAuthorNameChange,
  body,
  onBodyChange,
  nameError,
  bodyError,
  submitted,
  isSubmitting,
  onSubmittedReset,
  onSubmit,
}: ProductQuestionAnswerFormModalProps) {
  const handleClose = () => {
    if (submitted) {
      onSubmittedReset();
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={fa.product.questionAnswerCta}
      size="lg"
      panelClassName="flex max-h-[min(92vh,720px)] flex-col"
    >
      <div className="product-question-form-modal overflow-y-auto px-5 py-5">
        {submitted ? (
          <div className="product-question-success" role="status">
            <p>{fa.product.questionAnswerSubmitted}</p>
          </div>
        ) : (
          <>
            <div className="product-question-answer-modal-context">
              <p className="product-question-answer-modal-label">{fa.product.questionBody}</p>
              <p className="product-question-answer-modal-question">{questionBody}</p>
            </div>

            <form onSubmit={onSubmit} className="product-question-form">
              <TextBox
                label={fa.product.questionAnswerName}
                placeholder={fa.product.commentNamePlaceholder}
                value={authorName}
                onChange={(e) => onAuthorNameChange(e.target.value)}
                error={nameError ?? undefined}
                touched={Boolean(nameError)}
                autoComplete="name"
              />
              <TextAreaBox
                id="question-answer-body-modal"
                label={fa.product.questionAnswerBody}
                value={body}
                onChange={(e) => onBodyChange(e.target.value.slice(0, ANSWER_BODY_MAX))}
                placeholder={fa.product.questionAnswerPlaceholder}
                maxLength={ANSWER_BODY_MAX}
                error={bodyError ?? undefined}
                touched={Boolean(bodyError)}
              />
              <div className="product-question-form-actions">
                <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                  {fa.product.questionAnswerSubmit}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </Modal>
  );
}

export { ANSWER_BODY_MIN, ANSWER_BODY_MAX };
