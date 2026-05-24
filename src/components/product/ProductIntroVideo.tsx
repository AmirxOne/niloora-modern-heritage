import { ShortEducationalVideoBlock } from "@/components/media/ShortEducationalVideoBlock";
import { fa } from "@/lib/i18n/fa";
import { cn } from "@/lib/utils";

interface ProductIntroVideoProps {
  url: string;
  title: string;
  className?: string;
}

export function ProductIntroVideo({ url, title, className }: ProductIntroVideoProps) {
  return (
    <ShortEducationalVideoBlock
      url={url}
      title={`${fa.product.introVideoTitle} ${title}`}
      caption="ویدیوی کوتاه آموزشی این محصول"
      className={cn("product-intro-video", className)}
    />
  );
}
