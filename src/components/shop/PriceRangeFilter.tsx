"use client";

import { useCallback, useMemo, useState } from "react";
import { fa } from "@/lib/i18n/fa";
import { formatPrice } from "@/lib/utils";

interface PriceRangeFilterProps {
  min: number;
  max: number;
  ceiling: number;
  onChange: (range: [number, number]) => void;
}

function priceStep(ceiling: number): number {
  if (ceiling <= 0) return 1;
  if (ceiling <= 50_000_000) return 1_000_000;
  return 5_000_000;
}

function snapToStep(value: number, step: number, ceiling: number): number {
  if (ceiling <= 0) return 0;
  const snapped = Math.round(value / step) * step;
  return Math.max(0, Math.min(snapped, ceiling));
}

type ActiveThumb = "min" | "max" | null;

export function PriceRangeFilter({ min, max, ceiling, onChange }: PriceRangeFilterProps) {
  const step = useMemo(() => priceStep(ceiling), [ceiling]);
  const [activeThumb, setActiveThumb] = useState<ActiveThumb>(null);

  const safeMin = Math.max(0, Math.min(min, max));
  const safeMax = Math.min(ceiling, Math.max(max, safeMin));

  const minPercent = ceiling > 0 ? (safeMin / ceiling) * 100 : 0;
  const maxPercent = ceiling > 0 ? (safeMax / ceiling) * 100 : 100;

  const setMin = useCallback(
    (raw: number) => {
      const nextMin = snapToStep(raw, step, ceiling);
      const capped = Math.min(nextMin, Math.max(0, safeMax - step));
      onChange([capped, safeMax]);
    },
    [ceiling, onChange, safeMax, step]
  );

  const setMax = useCallback(
    (raw: number) => {
      const nextMax = snapToStep(raw, step, ceiling);
      const capped = Math.max(nextMax, Math.min(ceiling, safeMin + step));
      onChange([safeMin, capped]);
    },
    [ceiling, onChange, safeMin, step]
  );

  if (ceiling <= 0) {
    return null;
  }

  /** در RTL: دستگیرهٔ «از» راست، «تا» چپ — اولویت z هنگام هم‌پوشانی */
  const minOnTop =
    activeThumb === "min" || (activeThumb !== "max" && safeMin <= ceiling * 0.5);

  return (
    <div className="shop-price-filter">
      <div className="shop-price-range-values">
        <div className="shop-price-range-value">
          <span className="shop-price-range-value-label">{fa.shop.priceFrom}</span>
          <span className="shop-price-range-value-amount">{formatPrice(safeMin)}</span>
        </div>
        <div className="shop-price-range-value">
          <span className="shop-price-range-value-label">{fa.shop.priceTo}</span>
          <span className="shop-price-range-value-amount">{formatPrice(safeMax)}</span>
        </div>
      </div>

      <div className="shop-price-range-track shop-price-range-track--dual" dir="rtl">
        <div
          className="shop-price-range-fill"
          style={{
            insetInlineStart: `${minPercent}%`,
            width: `${Math.max(0, maxPercent - minPercent)}%`,
          }}
          aria-hidden
        />
        <input
          type="range"
          min={0}
          max={ceiling}
          step={step}
          value={safeMin}
          onInput={(e) => setMin(Number(e.currentTarget.value))}
          onChange={(e) => setMin(Number(e.currentTarget.value))}
          onPointerDown={() => setActiveThumb("min")}
          onPointerUp={() => setActiveThumb(null)}
          onPointerCancel={() => setActiveThumb(null)}
          onLostPointerCapture={() => setActiveThumb(null)}
          className="shop-price-range shop-price-range--min"
          style={{ zIndex: minOnTop ? 4 : 3 }}
          aria-label={fa.shop.priceFrom}
          aria-valuemin={0}
          aria-valuemax={safeMax}
          aria-valuenow={safeMin}
        />
        <input
          type="range"
          min={0}
          max={ceiling}
          step={step}
          value={safeMax}
          onInput={(e) => setMax(Number(e.currentTarget.value))}
          onChange={(e) => setMax(Number(e.currentTarget.value))}
          onPointerDown={() => setActiveThumb("max")}
          onPointerUp={() => setActiveThumb(null)}
          onPointerCancel={() => setActiveThumb(null)}
          onLostPointerCapture={() => setActiveThumb(null)}
          className="shop-price-range shop-price-range--max"
          style={{ zIndex: minOnTop ? 3 : 4 }}
          aria-label={fa.shop.priceTo}
          aria-valuemin={safeMin}
          aria-valuemax={ceiling}
          aria-valuenow={safeMax}
        />
      </div>

      <div className="shop-price-range-bounds" dir="rtl">
        <span>{formatPrice(0)}</span>
        <span>{formatPrice(ceiling)}</span>
      </div>
    </div>
  );
}
