"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { fa } from "@/lib/i18n/fa";
import { resolveAccountDisplayName } from "@/lib/account/display-name";
import { useAuth } from "@/lib/hooks/useAuth";
import { useProductComments } from "@/lib/hooks/useComments";
import { useStickyWithinContainer } from "@/lib/hooks/useStickyWithinContainer";
import type { ProductComment } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { ProductCommentFormModal, COMMENT_BODY_MAX, COMMENT_BODY_MIN } from "@/components/product/ProductCommentFormModal";
import {
  ProductReviewScoreBlock,
} from "@/components/product/ProductReviewSummary";
import { ProductCommentCard } from "@/components/product/ProductCommentCard";
import { cn } from "@/lib/utils";
import { usePagination } from "@/lib/hooks/usePagination";
import { COMMENTS_PAGE_SIZE } from "@/lib/pagination";
import { Pagination } from "@/components/ui/Pagination";
import { UnifiedEmptyState } from "@/components/ui/UnifiedEmptyState";

type CommentSort = "newest" | "highest" | "lowest";

interface ProductCommentsProps {
  productId: string;
  productName?: string;
  productImage?: string;
  initialApproved?: ProductComment[];
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

export function ProductComments({
  productId,
  productName,
  productImage,
  initialApproved,
}: ProductCommentsProps) {
  const { user, isLoggedIn } = useAuth();
  const { approved, submit: submitComment, isApprovedLoading, ratingSummary } =
    useProductComments(productId, initialApproved);
  const mediaTrackRef = useRef<HTMLDivElement>(null);
  const {
    containerRef: reviewsLayoutRef,
    targetRef: reviewsSummaryRef,
    phase: reviewsSummaryPhase,
    targetStyle: reviewsSummaryStyle,
    placeholderHeight: reviewsSummaryPlaceholderHeight,
  } = useStickyWithinContainer(true, 3.25);

  const accountDisplayName = useMemo(() => {
    if (!user) return "";
    return resolveAccountDisplayName({
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name,
      phone: user.phone,
    });
  }, [user]);

  const [authorName, setAuthorName] = useState("");
  const [publishAnonymously, setPublishAnonymously] = useState(false);
  const [body, setBody] = useState("");
  const [rating, setRating] = useState(5);
  const [submitted, setSubmitted] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [bodyError, setBodyError] = useState<string | null>(null);
  const [sort, setSort] = useState<CommentSort>("newest");

  const sortedComments = useMemo(() => sortComments(approved, sort), [approved, sort]);
  const commentsWithMedia = useMemo(
    () => approved.filter((comment) => Boolean(comment.mediaUrl)),
    [approved]
  );

  const {
    paginatedItems: visibleComments,
    page,
    setPage,
    totalPages,
    from,
    to,
    totalItems,
  } = usePagination(sortedComments, COMMENTS_PAGE_SIZE, sort);

  const resetFormFields = () => {
    setBody("");
    setRating(5);
    setPublishAnonymously(false);
    setNameError(null);
    setBodyError(null);
  };

  const openFormModal = () => {
    setSubmitted(false);
    if (isLoggedIn && accountDisplayName) {
      setAuthorName(accountDisplayName);
    }
    setPublishAnonymously(false);
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

    const trimmedBody = body.trim();
    const resolvedName = isLoggedIn
      ? publishAnonymously
        ? fa.product.commentAnonymousName
        : accountDisplayName
      : authorName.trim();

    if (!resolvedName) {
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

    const success = await submitComment(productId, resolvedName, trimmedBody, rating);
    if (!success) {
      toast.error("ارسال نظر انجام نشد. ابتدا وارد حساب شوید یا دوباره تلاش کنید.");
      return;
    }
    toast.success("نظر شما ثبت شد و بعد از تایید نمایش داده می‌شود.");
    setSubmitted(true);
    resetFormFields();
  };

  const scrollMediaStrip = () => {
    const track = mediaTrackRef.current;
    track?.lastElementChild?.scrollIntoView({ behavior: "smooth", inline: "end", block: "nearest" });
  };

  const sortOptions: { value: CommentSort; label: string }[] = [
    { value: "newest", label: fa.product.sortNewest },
    { value: "highest", label: fa.product.sortHighest },
    { value: "lowest", label: fa.product.sortLowest },
  ];

  const sharedSummaryProps = {
    productId,
    approved,
    ratingSummary,
    isApprovedLoading,
  };

  return (
    <section className="product-reviews" aria-labelledby="product-comments-title">
      <div className="product-reviews-section">
        <header className="product-reviews-section-header">
          <h2 id="product-comments-title" className="product-reviews-title">
            {fa.product.commentsTitle}
          </h2>
        </header>

        <div ref={reviewsLayoutRef} className="product-reviews-layout">
          <aside
            className="product-reviews-summary"
            style={
              reviewsSummaryPlaceholderHeight
                ? { minHeight: reviewsSummaryPlaceholderHeight }
                : undefined
            }
          >
            <div
              ref={reviewsSummaryRef}
              className={cn(
                "product-reviews-summary-sticky",
                reviewsSummaryPhase === "bottom" && "product-reviews-summary-sticky--bottom"
              )}
              style={reviewsSummaryStyle}
            >
              <ProductReviewScoreBlock {...sharedSummaryProps} compact />
              <div className="product-reviews-cta">
                <p className="product-reviews-cta-text">{fa.product.commentCtaPrompt}</p>
                <Button
                  type="button"
                  variant="outline"
                  className="product-reviews-cta-btn"
                  onClick={openFormModal}
                >
                  {fa.product.commentCtaButton}
                </Button>
              </div>
            </div>
          </aside>

          <div className="product-reviews-main">
        {commentsWithMedia.length > 0 ? (
          <div
            className="product-reviews-media-strip"
            aria-label={fa.product.commentsMediaStripAria}
          >
            <div className="product-reviews-media-strip-header">
              <h3 className="product-reviews-media-strip-title">
                {fa.product.commentsMediaStripTitle}
              </h3>
              {commentsWithMedia.length > 4 ? (
                <button
                  type="button"
                  className="product-reviews-media-strip-more"
                  onClick={scrollMediaStrip}
                >
                  {fa.product.commentsMediaViewAll}
                </button>
              ) : null}
            </div>
            <div ref={mediaTrackRef} className="product-reviews-media-strip-track">
              {commentsWithMedia.map((comment) => (
                <div key={comment.id} className="product-reviews-media-item">
                  {comment.mediaType === "video" ? (
                    <>
                      <video
                        src={comment.mediaUrl}
                        controls
                        playsInline
                        preload="metadata"
                        className="product-reviews-media-video"
                      />
                      <span className="product-reviews-media-play" aria-hidden>
                        <span className="product-reviews-media-play-icon" />
                      </span>
                    </>
                  ) : (
                    <Image
                      src={comment.mediaUrl!}
                      alt={comment.body.slice(0, 60)}
                      fill
                      className="object-cover"
                      sizes="120px"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="product-reviews-body">
          {isApprovedLoading ? (
            <div className="space-y-3" aria-busy="true" aria-live="polite">
              <div className="product-reviews-toolbar">
                <div className="sk h-4 w-28" />
                <div className="sk h-8 w-48 rounded-full" />
              </div>
              {Array.from({ length: 2 }).map((_, idx) => (
                <article key={idx} className="product-comment-card">
                  <header className="product-comment-card-header">
                    <div className="product-comment-author">
                      <span className="sk product-comment-avatar" style={{ color: "transparent" }}>.</span>
                      <div>
                        <div className="sk h-4 w-28" />
                        <div className="sk mt-1.5 h-3 w-24" />
                      </div>
                    </div>
                    <div className="sk h-4 w-24" />
                  </header>
                  <div className="sk mt-3 h-3 w-full" />
                  <div className="sk mt-1.5 h-3 w-11/12" />
                </article>
              ))}
            </div>
          ) : approved.length > 0 ? (
            <>
              <div className="product-reviews-body-header">
                <h3 className="product-reviews-body-title">{fa.product.commentsListTitle}</h3>
                <p className="product-reviews-toolbar-count">
                  {fa.product.commentsCount(approved.length)}
                </p>
              </div>

              <div className="product-reviews-toolbar">
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
            <UnifiedEmptyState
              visual="reviews"
              title={fa.product.commentsEmpty}
              description={fa.product.commentsBeFirst}
              className="product-comments-empty"
            />
          )}
        </div>
          </div>
        </div>
      </div>

      <ProductCommentFormModal
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        productName={productName}
        productImage={productImage}
        isLoggedIn={isLoggedIn}
        accountDisplayName={accountDisplayName}
        publishAnonymously={publishAnonymously}
        onPublishAnonymouslyChange={setPublishAnonymously}
        authorName={authorName}
        onAuthorNameChange={setAuthorName}
        body={body}
        onBodyChange={setBody}
        rating={rating}
        onRatingChange={setRating}
        nameError={nameError}
        bodyError={bodyError}
        submitted={submitted}
        onSubmittedReset={handleSubmittedReset}
        onSubmit={handleSubmit}
      />
    </section>
  );
}
