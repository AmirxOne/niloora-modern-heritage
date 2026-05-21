import type { Metadata } from "next";
import { ShopPageClient } from "./ShopPageClient";
import { fa } from "@/lib/i18n/fa";
import { buildPageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = buildPageMetadata({
  title: fa.shop.title,
  description: fa.seo.shopDescription,
  path: "/shop",
});

export default function ShopPage() {
  return <ShopPageClient />;
}
