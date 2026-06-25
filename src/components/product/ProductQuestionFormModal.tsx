"use client";

import Image from "next/image";
import { fa } from "@/lib/i18n/fa";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TextAreaBox, TextBox } from "@/components/inputs";

const QUESTION_BODY_MIN = 10;
const QUESTION_BODY_MAX = 400;

interface ProductQuestionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName?: string;
  productImage?: string;
  authorName: string;
  onAuthorNameChange: (value: string) => void;
  body: string;
  onBodyChange: (value: string) => void;
  nameError: string | null;
  bodyError: string | null;
  submitted: boolean;
  onSubmittedReset: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ProductQuestionFormModal({
  isOpen,
  onClose,
  productName,
  productImage,
  authorName,
  onAuthorNameChange,
  body,
  onBodyChange,
  nameError,
  bodyError,
  submitted,
  onSubmittedReset,
  onSubmit,
}: ProductQuestionFormModalProps) {
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
      title={fa.product.questionFormTitle}
      size="lg"
      panelClassName="flex max-h-[min(92vh,720px)] flex-col"
    >
      <div className="product-question-form-modal overflow-y-auto px-5 py-5">
        {submitted ? (
          <div className="product-question-success" role="status">
            <p>{fa.product.questionSubmitted}</p>
            <button
              type="button"
              className="product-question-success-action"
              onClick={onSubmittedReset}
            >
              {fa.product.questionWriteAnother}
            </button>
          </div>
        ) : (
          <>
            {productName || productImage ? (
              <div className="product-question-form-product-header">
                {productImage ? (
                  <div className="product-question-form-product-image">
                    <Image
                      src={productImage}
                      alt={productName ?? ""}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                ) : null}
                <div className="product-question-form-product-copy">
                  {productName ? (
                    <p className="product-question-form-product-name">{productName}</p>
                  ) : null}
                  <p className="product-question-form-hint">{fa.product.questionFormHint}</p>
                </div>
              </div>
            ) : (
              <p className="product-question-form-hint">{fa.product.questionFormHint}</p>
            )}

            <form onSubmit={onSubmit} className="product-question-form">
              <TextBox
                label={fa.product.commentName}
                placeholder={fa.product.commentNamePlaceholder}
                value={authorName}
                onChange={(e) => onAuthorNameChange(e.target.value)}
                error={nameError ?? undefined}
                touched={Boolean(nameError)}
                autoComplete="name"
              />
              <TextAreaBox
                id="question-body-modal"
                label={fa.product.questionBody}
                value={body}
                onChange={(e) => onBodyChange(e.target.value.slice(0, QUESTION_BODY_MAX))}
                placeholder={fa.product.questionBodyPlaceholder}
                maxLength={QUESTION_BODY_MAX}
                error={bodyError ?? undefined}
                touched={Boolean(bodyError)}
              />
              <div className="product-question-form-actions">
                <Button type="submit" className="w-full sm:w-auto">
                  {fa.product.questionSubmit}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </Modal>
  );
}

export { QUESTION_BODY_MIN, QUESTION_BODY_MAX };
