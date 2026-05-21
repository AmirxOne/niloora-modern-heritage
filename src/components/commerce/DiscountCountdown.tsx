"use client";

import { useEffect, useMemo, useState } from "react";
import { getDiscountRemaining, resolveDiscountEndsAt } from "@/lib/discount-countdown";

type Props = {
  productId?: string;
  className?: string;
};

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

export function DiscountCountdown({ productId, className }: Props) {
  const endsAt = useMemo(() => resolveDiscountEndsAt(productId), [productId]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!endsAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [endsAt]);

  if (!endsAt) return null;
  const remaining = getDiscountRemaining(endsAt, now);
  if (remaining.expired) return null;

  return (
    <p className={className ?? "discount-countdown"}>
      <span className="discount-countdown__time">
        {remaining.days > 0 ? `${remaining.days} روز ` : ""}
        {pad(remaining.hours)}:{pad(remaining.minutes)}:{pad(remaining.seconds)}
      </span>
    </p>
  );
}
