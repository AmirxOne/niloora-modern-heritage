import { getProductListingTags, getVisibleListingDetails } from "@/lib/product-listing";
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
  const details = getVisibleListingDetails(listing.details);

  return (
    <div className={cn("product-content-brief", compact && "product-content-brief--compact", className)}>
      <div className="product-content-brief-body">
        <div className="product-content-brief-tags">
          {tags.map((tag) => (
            <span key={tag} className="product-content-brief-tag">
              #{tag}
            </span>
          ))}
        </div>
        <div className="product-content-brief-details">
          {details.map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>
      </div>
      {onViewMore ? (
        <div className="product-content-brief-view-more">
          <hr className="product-content-brief-view-more-line" aria-hidden="true" />
          <button
            type="button"
            onClick={onViewMore}
            className="flex w-fit shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-black/10 bg-transparent px-3 py-3 text-sm font-medium text-[#424750] transition-colors hover:text-[#2c2a29] [-webkit-tap-highlight-color:transparent]"
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
