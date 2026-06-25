"use client";

import Image from "next/image";
import { fa } from "@/lib/i18n/fa";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TextAreaBox, TextBox } from "@/components/inputs";
import { CommentPublishIdentitySelect } from "@/components/product/CommentPublishIdentitySelect";
import { StarRating } from "@/components/product/StarRating";

const COMMENT_BODY_MIN = 10;
const COMMENT_BODY_MAX = 600;

interface ProductCommentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName?: string;
  productImage?: string;
  isLoggedIn: boolean;
  accountDisplayName: string;
  publishAnonymously: boolean;
  onPublishAnonymouslyChange: (value: boolean) => void;
  authorName: string;
  onAuthorNameChange: (value: string) => void;
  body: string;
  onBodyChange: (value: string) => void;
  rating: number;
  onRatingChange: (value: number) => void;
  nameError: string | null;
  bodyError: string | null;
  submitted: boolean;
  onSubmittedReset: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ProductCommentFormModal({
  isOpen,
  onClose,
  productName,
  productImage,
  isLoggedIn,
  accountDisplayName,
  publishAnonymously,
  onPublishAnonymouslyChange,
  authorName,
  onAuthorNameChange,
  body,
  onBodyChange,
  rating,
  onRatingChange,
  nameError,
  bodyError,
  submitted,
  onSubmittedReset,
  onSubmit,
}: ProductCommentFormModalProps) {
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
      title={fa.product.commentCtaButton}
      size="lg"
      panelClassName="flex max-h-[min(92vh,820px)] flex-col"
    >
      <div className="product-comment-form-modal overflow-y-auto px-5 py-5">
        {submitted ? (
          <div className="product-comment-success" role="status">
            <p>{fa.product.commentSubmitted}</p>
            <button
              type="button"
              className="product-comment-success-action"
              onClick={onSubmittedReset}
            >
              {fa.product.commentWriteAnother}
            </button>
          </div>
        ) : (
          <>
            {(productName || productImage) ? (
              <div className="product-comment-form-product-header">
                {productImage ? (
                  <div className="product-comment-form-product-image">
                    <Image
                      src={productImage}
                      alt={productName ?? ""}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                ) : null}
                <div className="product-comment-form-product-copy">
                  {productName ? (
                    <p className="product-comment-form-product-name">{productName}</p>
                  ) : null}
                  <p className="product-comment-form-hint">{fa.product.commentFormHint}</p>
                </div>
              </div>
            ) : (
              <p className="product-comment-form-hint">{fa.product.commentFormHint}</p>
            )}

            <form onSubmit={onSubmit} className="product-comment-form">
              {isLoggedIn && accountDisplayName ? (
                <CommentPublishIdentitySelect
                  className="product-comment-form-full"
                  accountDisplayName={accountDisplayName}
                  publishAnonymously={publishAnonymously}
                  onChange={onPublishAnonymouslyChange}
                />
              ) : (
                <TextBox
                  label={fa.product.commentName}
                  placeholder={fa.product.commentNamePlaceholder}
                  value={authorName}
                  onChange={(e) => onAuthorNameChange(e.target.value)}
                  error={nameError ?? undefined}
                  touched={Boolean(nameError)}
                  autoComplete="name"
                />
              )}

              <div className="product-comment-rating-field product-comment-form-full">
                <p className="product-comment-field-label">{fa.product.commentRating}</p>
                <StarRating value={rating} onChange={onRatingChange} size="md" />
              </div>

              <div className="product-comment-form-full">
                <TextAreaBox
                  id="comment-body-modal"
                  label={fa.product.commentBody}
                  value={body}
                  onChange={(e) => onBodyChange(e.target.value.slice(0, COMMENT_BODY_MAX))}
                  placeholder={fa.product.commentBodyPlaceholder}
                  maxLength={COMMENT_BODY_MAX}
                  error={bodyError ?? undefined}
                  touched={Boolean(bodyError)}
                />
                <div className="product-comment-textarea-footer">
                  {bodyError ? (
                    <p className="product-comment-field-error">{bodyError}</p>
                  ) : (
                    <span />
                  )}
                  <span className="product-comment-char-count">
                    {fa.product.commentCharCount(body.length, COMMENT_BODY_MAX)}
                  </span>
                </div>
              </div>

              <Button type="submit" className="product-comment-form-full w-full sm:w-auto">
                {fa.product.commentSubmit}
              </Button>
            </form>
          </>
        )}
      </div>
    </Modal>
  );
}

export { COMMENT_BODY_MIN, COMMENT_BODY_MAX };
