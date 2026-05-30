"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import type { CartItem } from "@/lib/types";

interface RingCustomizationEditorProps {
  item: CartItem;
  onClear: () => void;
}

export function RingCustomizationEditor({ item, onClear }: RingCustomizationEditorProps) {
  if (!item.productId || item.customizerState) return null;
  const href = `/customize?productId=${encodeURIComponent(item.productId)}&cartItemId=${encodeURIComponent(item.id)}`;

  return (
    <div className="mt-3 rounded-heritage border border-gold/15 bg-parchment/20 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Link href={href}>
          <Button size="sm" variant="outline">
          {item.ringPurchaseCustomization ? "ویرایش شخصی‌سازی خرید" : "شخصی‌سازی خرید"}
          </Button>
        </Link>
        {item.ringPurchaseCustomization ? (
          <Button size="sm" variant="ghost" onClick={onClear}>
            حذف شخصی‌سازی
          </Button>
        ) : null}
      </div>

      {item.ringPurchaseCustomization ? (
        <p className="mt-2 text-xs text-silver">
          دلتا فعلی: {item.ringPurchaseCustomization.totalCustomizationDelta.toLocaleString("fa-IR")} تومان
        </p>
      ) : null}
    </div>
  );
}

