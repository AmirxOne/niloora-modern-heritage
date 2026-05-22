"use client";

import { useEffect, useMemo, useState } from "react";
import { getDiscountRemaining } from "@/lib/discount-countdown-math";
import { resolveDiscountEndsAt } from "@/lib/discount-countdown";
import { useDiscountCountdownConfig } from "@/components/providers/DiscountCountdownProvider";

type Props = {
  productId?: string;
  endsAt?: string | null;
  className?: string;
};

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

export function DiscountCountdown({ endsAt, className }: Props) {
  const config = useDiscountCountdownConfig();
  const resolvedEndsAt = useMemo(
    () => resolveDiscountEndsAt({ productEndsAt: endsAt, config }),
    [config, endsAt]
  );
  /** null until mounted — avoids SSR/client clock drift hydration mismatch */
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (!resolvedEndsAt) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [resolvedEndsAt]);

  if (!resolvedEndsAt || now === null) return null;
  const remaining = getDiscountRemaining(resolvedEndsAt, now);
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
