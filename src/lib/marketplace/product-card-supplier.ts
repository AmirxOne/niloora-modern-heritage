import type { Product } from "@/lib/types";
import { fa } from "@/lib/i18n/fa";
import { getVendorDisplayName, vendorDisplayInitial } from "@/lib/vendor/display-name";

export type ProductCardSupplier = {
  name: string;
  initial: string;
  href: string;
  isPlatform: boolean;
};

/** عرضه‌کنندهٔ نمایش‌داده‌شده در فوتر کارت — فروشندهٔ مارکت‌پلیس یا گالری پلتفرم. */
export function getProductCardSupplier(product: Pick<Product, "vendor">): ProductCardSupplier {
  if (product.vendor) {
    return {
      name: getVendorDisplayName(product.vendor),
      initial: vendorDisplayInitial(product.vendor),
      href: `/vendor/${product.vendor.slug}`,
      isPlatform: false,
    };
  }

  const name = fa.shop.platformGallerySupplier;
  return {
    name,
    initial: name.charAt(0) || "؟",
    href: "/shop",
    isPlatform: true,
  };
}
