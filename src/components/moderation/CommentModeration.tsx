"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { ProductComment } from "@/lib/types";
import { fa } from "@/lib/i18n/fa";
import { useApp } from "@/lib/context/AppContext";
import { Button } from "@/components/ui/Button";
import { StarRating } from "@/components/product/StarRating";
import { Pagination } from "@/components/ui/Pagination";
import { usePagination } from "@/lib/hooks/usePagination";
import { MODERATION_PAGE_SIZE } from "@/lib/pagination";
import { useCatalogProducts } from "@/lib/hooks/useCatalogProducts";
import Image from "next/image";

function formatCommentDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PendingCommentCard({
  comment,
  index,
  onApprove,
  onReject,
  productName,
}: {
  comment: ProductComment;
  index: number;
  onApprove: (id: string) => Promise<boolean> | void;
  onReject: (id: string) => Promise<boolean> | void;
  productName?: string;
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
              <Link href={`/product/${comment.productId}`} className="comment-moderation-product-link">
                {productName}
              </Link>
            ) : (
              comment.productId
            )}
          </p>
          <p className="comment-moderation-author">{comment.authorName}</p>
          <p className="comment-moderation-date">{formatCommentDate(comment.createdAt)}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StarRating value={comment.rating} size="sm" />
        </div>
      </div>
      <p className="comment-moderation-body">{comment.body}</p>
      {comment.mediaUrl ? (
        <div className="comment-moderation-media">
          {comment.mediaType === "video" ? (
            <video src={comment.mediaUrl} controls playsInline preload="metadata" />
          ) : (
            <Image
              src={comment.mediaUrl}
              alt={comment.body.slice(0, 60)}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 460px"
            />
          )}
        </div>
      ) : null}
      <div className="comment-moderation-actions">
        <Button type="button" size="sm" onClick={() => onApprove(comment.id)}>
          {fa.dashboard.commentApprove}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => onReject(comment.id)}>
          {fa.dashboard.commentReject}
        </Button>
      </div>
    </motion.article>
  );
}

export function CommentModeration() {
  const { comments } = useApp();
  const { products } = useCatalogProducts();
  const pending = comments.pendingComments;
  const productNameById = new Map(products.map((product) => [product.id, product.name]));

  const {
    paginatedItems: pagedPending,
    page,
    setPage,
    totalPages,
    from,
    to,
    totalItems,
  } = usePagination(pending, MODERATION_PAGE_SIZE, pending.length);

  const handleApprove = async (id: string): Promise<boolean> => {
    const ok = await comments.approve(id);
    if (ok) {
      toast.success("نظر با موفقیت تایید شد.");
    } else {
      toast.error("تایید نظر انجام نشد.");
    }
    return Boolean(ok);
  };

  const handleReject = async (id: string): Promise<boolean> => {
    const ok = await comments.reject(id);
    if (ok) {
      toast.success("نظر رد شد.");
    } else {
      toast.error("رد نظر انجام نشد.");
    }
    return Boolean(ok);
  };

  return (
    <div className="comment-moderation">
      <div className="comment-moderation-header">
        <div>
          <h2 className="font-display text-2xl text-ivory md:text-3xl">{fa.dashboard.commentModeration}</h2>
          <p className="mt-2 text-sm text-silver">{fa.dashboard.commentModerationHint}</p>
          {pending.length > 0 ? (
            <p className="mt-2 text-xs font-medium text-gold-dark">
              {fa.dashboard.commentModerationPending(pending.length)}
            </p>
          ) : null}
        </div>
      </div>

      {comments.isPendingLoading ? (
        <div className="comment-moderation-list space-y-4" aria-busy="true" aria-live="polite">
          {Array.from({ length: 3 }).map((_, idx) => (
            <article key={idx} className="comment-moderation-card">
              <div className="comment-moderation-card-top">
                <div>
                  <div className="sk h-3 w-44" />
                  <div className="sk mt-3 h-4 w-28" />
                  <div className="sk mt-2 h-3 w-36" />
                </div>
                <div className="sk h-4 w-24" />
              </div>
              <div className="sk mt-4 h-3 w-full" />
              <div className="sk mt-2 h-3 w-11/12" />
              <div className="comment-moderation-actions">
                <div className="sk h-9 w-28 rounded-heritage" />
                <div className="sk h-9 w-28 rounded-heritage" />
              </div>
            </article>
          ))}
        </div>
      ) : !comments.canModerate ? (
        <div className="comment-moderation-empty">
          <p className="text-silver">{fa.dashboard.commentModerationForbidden}</p>
        </div>
      ) : pending.length === 0 ? (
        <div className="comment-moderation-empty">
          <p className="text-silver">{fa.dashboard.commentModerationEmpty}</p>
        </div>
      ) : (
        <>
          <div className="comment-moderation-list">
            {pagedPending.map((comment, i) => (
              <PendingCommentCard
                key={comment.id}
                comment={comment}
                index={i}
                onApprove={handleApprove}
                onReject={handleReject}
                productName={productNameById.get(comment.productId)}
              />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={totalItems}
            from={from}
            to={to}
            scrollTargetId="comment-moderation"
            className="comment-moderation-pagination"
          />
        </>
      )}
    </div>
  );
}
