import { BadgeCheck } from "@/components/icons";
import type { ProductComment } from "@/lib/types";
import { StarRating } from "@/components/product/StarRating";
import { fa } from "@/lib/i18n/fa";
import { ICON_VARIANT, iconSizes } from "@/lib/icons";
import Image from "next/image";

function formatCommentDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface ProductCommentCardProps {
  comment: ProductComment;
}

export function ProductCommentCard({ comment }: ProductCommentCardProps) {
  const initial = comment.authorName.trim().charAt(0) || "؟";
  const buildQuality = comment.ratingBuildQuality ?? comment.rating;
  const beauty = comment.ratingBeauty ?? comment.rating;
  const value = comment.ratingValue ?? comment.rating;
  const packaging = comment.ratingPackaging ?? comment.rating;

  return (
    <article className="product-comment-card">
      <header className="product-comment-card-header">
        <div className="product-comment-author">
          <span className="product-comment-avatar" aria-hidden>
            {initial}
          </span>
          <div>
            <div className="product-comment-name-row">
              <p className="product-comment-name">{comment.authorName}</p>
              {comment.isVerifiedBuyer ? (
                <span className="product-comment-verified">
                  <BadgeCheck size={iconSizes.xs} variant={ICON_VARIANT} aria-hidden />
                  {fa.product.verifiedBuyer}
                </span>
              ) : null}
            </div>
            <p className="product-comment-date">{formatCommentDate(comment.createdAt)}</p>
          </div>
        </div>
        <div className="product-comment-rating-block">
          <StarRating value={comment.rating} size="sm" />
          <span className="product-comment-rating-value">
            {comment.rating.toLocaleString("fa-IR")} / ۵
          </span>
        </div>
      </header>
      <p className="product-comment-body">{comment.body}</p>
      {comment.mediaUrl ? (
        <div className="product-comment-media">
          {comment.mediaType === "video" ? (
            <video src={comment.mediaUrl} controls playsInline preload="metadata" />
          ) : (
            <Image
              src={comment.mediaUrl}
              alt={comment.body.slice(0, 60)}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 480px"
            />
          )}
        </div>
      ) : null}
      <div className="product-comment-dimensions">
        <span className="product-comment-dimension-chip">
          {fa.product.commentRatingBuildQuality}: {buildQuality.toLocaleString("fa-IR")}
        </span>
        <span className="product-comment-dimension-chip">
          {fa.product.commentRatingBeauty}: {beauty.toLocaleString("fa-IR")}
        </span>
        <span className="product-comment-dimension-chip">
          {fa.product.commentRatingValue}: {value.toLocaleString("fa-IR")}
        </span>
        <span className="product-comment-dimension-chip">
          {fa.product.commentRatingPackaging}: {packaging.toLocaleString("fa-IR")}
        </span>
      </div>
    </article>
  );
}
