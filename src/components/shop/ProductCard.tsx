"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Product } from "@/lib/types";
import { getProductPricing } from "@/lib/pricing";
import { fa } from "@/lib/i18n/fa";
import { useApp } from "@/lib/context/AppContext";
import { ProductAvailabilityBadge } from "@/components/product/ProductAvailabilityBadge";
import { Heart, Export, Gem, PenTool, Category, Sparkles } from "@/components/icons";
import { ProductCompareButton } from "@/components/product/ProductCompareButton";
import { PreOwnedBadge } from "@/components/pre-owned/PreOwnedBadge";
import { isPreOwnedProduct } from "@/lib/pre-owned";
import { ICON_VARIANT, iconSizes } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { DiscountCountdown } from "@/components/commerce/DiscountCountdown";

interface ProductCardProps {
  product: Product;
  index?: number;
  /** داخل اسلایدر افقی — بدون انیمیشن ورود */
  variant?: "grid" | "carousel";
}

export function ProductCard({
  product,
  index = 0,
  variant = "grid",
}: ProductCardProps) {
  const styleLabels: Record<Product["category"], string> = {
    solitaire: "تک نگین",
    halo: "هاله",
    vintage: "کلاسیک",
    signet: "مهر",
    eternity: "ابدیت",
    stackable: "چندتایی",
  };
  const metalLabels: Record<Product["metal"], string> = {
    sterling: "نقره استرلینگ",
    oxidized: "نقره اکسید",
    rhodium: "رودیوم",
    "matte-silver": "نقره مات",
  };
  const stoneLabels: Record<Product["stone"], string> = {
    diamond: "الماس",
    emerald: "زمرد",
    sapphire: "یاقوت کبود",
    ruby: "یاقوت سرخ",
    turquoise: "فیروزه",
    onyx: "عقیق سیاه",
    zabarjad: "زبرجد",
    "yemen-aqeeq": "عقیق یمنی",
    "durr-najaf": "در نجف",
    moral: "مرمر هندی",
  };
  const engravingLabels: Record<Exclude<Product["engravingType"], "none">, string> = {
    nastaliq: "نستعلیق",
    naskh: "نسخ",
    thuluth: "ثلث",
    kufic: "کوفی",
    modern: "معاصر",
  };
  const { wishlist } = useApp();
  const wished = wishlist.isWishlisted(product.id);
  const isSold = product.availability === "sold";
  const pricing = getProductPricing(product);
  const formatTomanAmount = (value: number) =>
    new Intl.NumberFormat("fa-IR", {
      maximumFractionDigits: 0,
    }).format(value);
  const description = product.listing.headline || product.listing.details[0] || product.name;
  const attributes: Array<{ label: string; value: string; icon: JSX.Element }> = [
    {
      label: "جنس",
      value: metalLabels[product.metal] ?? "نقره",
      icon: <Gem size={iconSizes.xs} variant={ICON_VARIANT} aria-hidden />,
    },
    {
      label: "نگین",
      value: stoneLabels[product.stone] ?? "—",
      icon: <Sparkles size={iconSizes.xs} variant={ICON_VARIANT} aria-hidden />,
    },
    {
      label: "حکاکی",
      value: product.engravingType === "none" ? "بدون حکاکی" : engravingLabels[product.engravingType],
      icon: <PenTool size={iconSizes.xs} variant={ICON_VARIANT} aria-hidden />,
    },
    {
      label: "سبک",
      value: styleLabels[product.category],
      icon: <Category size={iconSizes.xs} variant={ICON_VARIANT} aria-hidden />,
    },
  ];

  const content = (
    <>
      <div className="shop-product-card-thumbnail-stack">
        <Link
          href={`/product/${product.id}`}
          className="shop-product-card-image-link"
          aria-label={product.name}
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="shop-product-card-thumb"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </Link>
        {isSold ? <div className="shop-product-card-sold-veil" aria-hidden /> : null}
      </div>

      <div className="shop-product-card-body">
        <div className="shop-product-card-heading-row">
          <Link href={`/product/${product.id}`} className="shop-product-card-title-link">
            <h3 className="shop-product-card-title">{product.name}</h3>
          </Link>
        </div>

        <p className="shop-product-card-description">{description}</p>

        <dl className="shop-product-card-attributes" aria-label="ویژگی‌های محصول">
          {attributes.map((item) => (
            <div key={item.label} className="shop-product-card-attribute-item">
              <dt className="shop-product-card-attribute-label">
                <span className="shop-product-card-attribute-icon">{item.icon}</span>
                <span className="sr-only">{item.label}</span>
              </dt>
              <dd className="shop-product-card-attribute-value">{item.value}</dd>
            </div>
          ))}
        </dl>

        <div className="shop-product-card-meta-row">
          <div className="shop-product-card-toolbar">
            <ProductCompareButton productId={product.id} variant="card" />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (typeof window !== "undefined") {
                  void navigator.clipboard?.writeText(`${window.location.origin}/product/${product.id}`);
                }
              }}
              className="shop-product-card-share"
              aria-label="اشتراک‌گذاری محصول"
              title="اشتراک‌گذاری محصول"
            >
              <Export size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                wishlist.toggle(product.id);
              }}
              className={cn(
                "shop-product-card-wishlist",
                wished && "shop-product-card-wishlist--active"
              )}
              aria-label={wished ? fa.product.wishlistRemoveAria : fa.product.wishlistAddAria}
              aria-pressed={wished}
            >
              <Heart
                className="shop-product-card-wishlist-icon"
                fill={wished ? "currentColor" : "none"}
                size={iconSizes.sm}
                variant={ICON_VARIANT}
                aria-hidden
              />
            </button>
          </div>
          <div className="shop-product-card-status">
            {isPreOwnedProduct(product) ? <PreOwnedBadge /> : null}
            <ProductAvailabilityBadge availability={product.availability} short />
          </div>
        </div>

        <div className="shop-product-card-pricing-row">
          {pricing.hasProductFurooh ? (
            <span
              className="shop-product-card-discount-tag"
              aria-label={fa.bahakahi.percentOff(pricing.furoohPercent)}
            >
              {fa.bahakahi.cardTag(pricing.furoohPercent)}
            </span>
          ) : null}
          <div className="shop-product-card-pricing-values">
            {pricing.hasProductFurooh ? (
              <p className="shop-product-card-price-old">
                <span className="shop-product-card-price-old-amount">{formatTomanAmount(pricing.listPrice)}</span>
              </p>
            ) : null}
            <p className="shop-product-card-price-main">
              <span className="shop-product-card-price-amount">
                {formatTomanAmount(pricing.salePrice)}
              </span>
              <span className="shop-product-card-price-currency">تومان</span>
            </p>
          </div>
        </div>
        {pricing.hasProductFurooh ? (
          <DiscountCountdown productId={product.id} className="shop-product-card-discount-countdown" />
        ) : null}
      </div>
    </>
  );

  if (variant === "carousel") {
    return <article className="shop-product-card group">{content}</article>;
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-32px" }}
      transition={{ duration: 0.4, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="shop-product-card group"
    >
      {content}
    </motion.article>
  );
}
