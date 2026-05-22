"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { fa } from "@/lib/i18n/fa";
import { useProductComments } from "@/lib/hooks/useComments";
import type { ProductComment } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { TextAreaBox, TextBox } from "@/components/inputs";
import { OrnamentalDivider } from "@/components/ui/OrnamentalDivider";
import { StarRating } from "@/components/product/StarRating";
import { ProductReviewSummary } from "@/components/product/ProductReviewSummary";
import { ProductCommentCard } from "@/components/product/ProductCommentCard";
import { cn } from "@/lib/utils";
import { usePagination } from "@/lib/hooks/usePagination";
import { COMMENTS_PAGE_SIZE } from "@/lib/pagination";
import { Pagination } from "@/components/ui/Pagination";

const COMMENT_BODY_MIN = 10;
const COMMENT_BODY_MAX = 600;

type CommentSort = "newest" | "highest" | "lowest";

interface ProductCommentsProps {
  productId: string;
}

function sortComments(comments: ProductComment[], sort: CommentSort): ProductComment[] {
  const copy = [...comments];
  switch (sort) {
    case "highest":
      return copy.sort(
        (a, b) =>
          b.rating - a.rating ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    case "lowest":
      return copy.sort(
        (a, b) =>
          a.rating - b.rating ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    default:
      return copy.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }
}

export function ProductComments({ productId }: ProductCommentsProps) {
  const { approved, submit: submitComment, isApprovedLoading } = useProductComments(productId);

  const [authorName, setAuthorName] = useState("");
  const [body, setBody] = useState("");
  const [rating, setRating] = useState(5);
  const [submitted, setSubmitted] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [bodyError, setBodyError] = useState<string | null>(null);
  const [sort, setSort] = useState<CommentSort>("newest");

  const sortedComments = useMemo(() => sortComments(approved, sort), [approved, sort]);

  const {
    paginatedItems: visibleComments,
    page,
    setPage,
    totalPages,
    from,
    to,
    totalItems,
  } = usePagination(sortedComments, COMMENTS_PAGE_SIZE, sort);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);
    setBodyError(null);

    const trimmedName = authorName.trim();
    const trimmedBody = body.trim();

    if (!trimmedName) {
      setNameError(fa.product.commentValidationName);
      return;
    }
    if (trimmedBody.length < COMMENT_BODY_MIN) {
      setBodyError(fa.product.commentValidationBody);
      return;
    }
    if (trimmedBody.length > COMMENT_BODY_MAX) {
      setBodyError(fa.product.commentValidationBodyMax);
      return;
    }

    const success = await submitComment(productId, trimmedName, trimmedBody, rating);
    if (!success) {
      toast.error("ارسال نظر انجام نشد. ابتدا وارد حساب شوید یا دوباره تلاش کنید.");
      return;
    }
    toast.success("نظر شما ثبت شد و بعد از تایید نمایش داده می‌شود.");
    setSubmitted(true);
    setBody("");
    setRating(5);
  };

  const sortOptions: { value: CommentSort; label: string }[] = [
    { value: "newest", label: fa.product.sortNewest },
    { value: "highest", label: fa.product.sortHighest },
    { value: "lowest", label: fa.product.sortLowest },
  ];

  return (
    <section className="product-reviews" aria-labelledby="product-comments-title">
      <header className="product-reviews-header">
        <div>
          <h2 id="product-comments-title" className="product-reviews-title">
            {fa.product.commentsTitle}
          </h2>
          <p className="product-reviews-subtitle">{fa.product.commentsSubtitle}</p>
        </div>
        <OrnamentalDivider className="max-w-[10rem] justify-start" />
      </header>

      <div className="product-reviews-layout">
        <aside className="product-reviews-aside">
          <ProductReviewSummary productId={productId} />

          <div className="product-comment-form-wrap">
            <h3 className="product-comment-form-title">{fa.product.commentFormTitle}</h3>
            <p className="product-comment-form-hint">{fa.product.commentFormHint}</p>

            {submitted ? (
              <div className="product-comment-success" role="status">
                <p>{fa.product.commentSubmitted}</p>
                <button
                  type="button"
                  className="product-comment-success-action"
                  onClick={() => setSubmitted(false)}
                >
                  {fa.product.commentWriteAnother}
                </button>
              </div>
            ) : (
              <>
                <ul className="product-comment-guidelines">
                  <li>{fa.product.commentGuideline1}</li>
                  <li>{fa.product.commentGuideline2}</li>
                  <li>{fa.product.commentGuideline3}</li>
                </ul>

                <form onSubmit={handleSubmit} className="product-comment-form">
                  <TextBox
                    label={fa.product.commentName}
                    placeholder={fa.product.commentNamePlaceholder}
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    error={nameError ?? undefined}
                    touched={Boolean(nameError)}
                    autoComplete="name"
                  />

                  <div className="product-comment-rating-field">
                    <p className="product-comment-field-label">{fa.product.commentRating}</p>
                    <StarRating value={rating} onChange={setRating} size="md" />
                  </div>

                  <div>
                    <TextAreaBox
                      id="comment-body"
                      label={fa.product.commentBody}
                      value={body}
                      onChange={(e) => setBody(e.target.value.slice(0, COMMENT_BODY_MAX))}
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

                  <Button type="submit" size="lg" className="w-full">
                    {fa.product.commentSubmit}
                  </Button>
                </form>
              </>
            )}
          </div>
        </aside>

        <div className="product-reviews-main">
          {isApprovedLoading ? (
            <div className="space-y-4" aria-busy="true" aria-live="polite">
              <div className="product-reviews-toolbar">
                <div className="sk h-4 w-28" />
                <div className="sk h-9 w-48 rounded-full" />
              </div>
              {Array.from({ length: 3 }).map((_, idx) => (
                <article key={idx} className="product-comment-card">
                  <header className="product-comment-card-header">
                    <div className="product-comment-author">
                      <span className="sk product-comment-avatar" style={{ color: "transparent" }}>.</span>
                      <div>
                        <div className="sk h-4 w-28" />
                        <div className="sk mt-2 h-3 w-24" />
                      </div>
                    </div>
                    <div className="sk h-4 w-24" />
                  </header>
                  <div className="sk mt-4 h-3 w-full" />
                  <div className="sk mt-2 h-3 w-11/12" />
                </article>
              ))}
            </div>
          ) : approved.length > 0 ? (
            <>
              <div className="product-reviews-toolbar">
                <p className="product-reviews-toolbar-count">
                  {fa.product.commentsCount(approved.length)}
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

              <ul id="product-comments-list" className="product-comments-list">
                {visibleComments.map((comment) => (
                  <li key={comment.id}>
                    <ProductCommentCard comment={comment} />
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
                scrollTargetId="product-comments-list"
                className="product-comments-pagination"
              />
            </>
          ) : (
            <div className="product-comments-empty">
              <p className="product-comments-empty-title">{fa.product.commentsEmpty}</p>
              <p className="product-comments-empty-text">{fa.product.commentsBeFirst}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
