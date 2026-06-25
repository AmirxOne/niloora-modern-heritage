import {
  getListingDetailPreview,
  getProductListingTags,
  LISTING_DETAIL_PREVIEW_COUNT,
} from "@/lib/product-listing";
import type { ProductListing } from "@/lib/types";
import { cn } from "@/lib/utils";
import { fa } from "@/lib/i18n/fa";
import { ChevronLeft } from "@/components/icons";
import { ICON_VARIANT } from "@/lib/icons";

interface ProductContentBriefProps {
  listing: ProductListing;
  className?: string;
  /** اسلایدر و نگاه سریع — فشرده‌تر */
  compact?: boolean;
  /** کلیک روی «مشاهده همه ویژگی‌ها» */
  onViewMore?: () => void;
}

export function ProductContentBrief({ listing, className, compact, onViewMore }: ProductContentBriefProps) {
  const tags = getProductListingTags(listing);
  const previewCount = compact ? 2 : LISTING_DETAIL_PREVIEW_COUNT;
  const previewEntries = getListingDetailPreview(listing.details, previewCount);

  return (
    <div className={cn("product-content-brief", compact && "product-content-brief--compact", className)}>
      <div className="product-content-brief-body">
        {tags.length > 0 ? (
          <div className="product-content-brief-tags">
            {tags.map((tag) => (
              <span key={tag} className="product-content-brief-tag">
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
        {previewEntries.length > 0 ? (
          <ul
            className={cn(
              "product-content-brief-specs",
              compact && "product-content-brief-specs--compact"
            )}
            aria-label={fa.product.featuresTitle}
          >
            {previewEntries.map(({ key, value }) => (
              <li key={key} className="product-content-brief-spec">
                <span className="product-content-brief-spec__key">{key}</span>
                <span className="product-content-brief-spec__val">{value || "—"}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {onViewMore ? (
        <div className="product-content-brief-view-more">
          <hr className="product-content-brief-view-more-line" aria-hidden="true" />
          <button
            type="button"
            onClick={onViewMore}
            className="product-content-brief-view-more-btn"
            aria-label={fa.product.viewMoreSpecsAria}
          >
            <span>{fa.product.viewMore}</span>
            <ChevronLeft size={16} variant={ICON_VARIANT} className="shrink-0 opacity-80" aria-hidden />
          </button>
          <hr className="product-content-brief-view-more-line" aria-hidden="true" />
        </div>
      ) : null}
    </div>
  );
}
