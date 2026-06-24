import { getProductListingTags, getVisibleListingDetails } from "@/lib/product-listing";
import type { ProductListing } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ProductContentBriefProps {
  listing: ProductListing;
  className?: string;
  /** اسلایدر و نگاه سریع — فشرده‌تر */
  compact?: boolean;
}

export function ProductContentBrief({ listing, className, compact }: ProductContentBriefProps) {
  const tags = getProductListingTags(listing);
  const details = getVisibleListingDetails(listing.details);

  return (
    <div className={cn("product-content-brief", compact && "product-content-brief--compact", className)}>
      <div className="product-content-brief-tags">
        {tags.map((tag) => (
          <span key={tag} className="product-content-brief-tag">
            #{tag}
          </span>
        ))}
      </div>
      <p className="product-content-brief-headline">{listing.headline}</p>
      <div className="product-content-brief-details">
        {details.map((line, index) => (
          <p key={index}>{line}</p>
        ))}
      </div>
    </div>
  );
}
