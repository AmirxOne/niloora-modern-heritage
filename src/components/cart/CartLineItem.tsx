"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Minus, Plus } from "@/components/icons";
import { fa } from "@/lib/i18n/fa";
import { ICON_VARIANT, iconSizes } from "@/lib/icons";
import { TomanPrice, TomanPriceWithSuffix } from "@/components/commerce/TomanPrice";
import { getProductStatusConfig } from "@/lib/product-status";
import type { CartItem, ProductAvailability } from "@/lib/types";
import { ProductAvailabilityBadge } from "@/components/product/ProductAvailabilityBadge";

interface CartLineItemProps {
  item: CartItem;
  onDecrease: () => void;
  onIncrease: () => void;
  onRemove: () => void;
}

export function CartLineItem({ item, onDecrease, onIncrease, onRemove }: CartLineItemProps) {
  const lineList = (item.listPrice ?? item.price) * item.quantity;
  const lineTotal = item.price * item.quantity;
  const lineFurooh = Math.max(0, lineList - lineTotal);
  const isCustom = Boolean(item.customizerState);
  const availability: ProductAvailability | undefined = item.availability;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="cart-line-item"
    >
      <div className="cart-line-image">
        {item.productId && !isCustom ? (
          <Link href={`/product/${item.productId}`} className="relative block h-full w-full">
            <Image src={item.image} alt={item.name} fill className="object-cover" sizes="120px" />
          </Link>
        ) : (
          <Image src={item.image} alt={item.name} fill className="object-cover" sizes="120px" />
        )}
      </div>

      <div className="cart-line-body">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            {isCustom ? <span className="cart-line-badge">{fa.cart.customDesign}</span> : null}
            {item.productId && !isCustom ? (
              <Link href={`/product/${item.productId}`}>
                <h3 className="cart-line-title">{item.name}</h3>
              </Link>
            ) : (
              <h3 className="cart-line-title">{item.name}</h3>
            )}
            <p className="cart-line-unit">
              <TomanPrice amount={item.price} size="xs" />
              {item.listPrice != null && item.listPrice > item.price ? (
                <span className="ms-2 inline-flex">
                  <TomanPrice amount={item.listPrice} size="xs" variant="list" />
                </span>
              ) : null}
            </p>
            {lineFurooh > 0 ? (
              <p className="mt-1 text-[11px] discount-text">
                <TomanPriceWithSuffix
                  amount={lineFurooh}
                  suffix={fa.bahakahi.productSavedSuffix}
                  size="xs"
                />
              </p>
            ) : null}
            {availability ? (
              <div className="mt-2">
                <ProductAvailabilityBadge availability={availability} />
                <p className="mt-1 text-[11px] text-silver">
                  {getProductStatusConfig(availability).deliveryHint}
                </p>
              </div>
            ) : null}
          </div>
          <TomanPrice amount={lineTotal} size="sm" />
        </div>

        <div className="cart-line-actions">
          <div className="cart-qty-control" role="group" aria-label="تعداد">
            <button type="button" onClick={onDecrease} disabled={item.quantity <= 1} className="cart-qty-btn">
              <Minus size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />
            </button>
            <span className="cart-qty-value">{item.quantity.toLocaleString("fa-IR")}</span>
            <button type="button" onClick={onIncrease} className="cart-qty-btn">
              <Plus size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />
            </button>
          </div>
          <button type="button" onClick={onRemove} className="cart-line-remove">
            {fa.common.remove}
          </button>
        </div>
      </div>
    </motion.li>
  );
}
