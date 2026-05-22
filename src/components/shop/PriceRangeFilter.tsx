"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fa } from "@/lib/i18n/fa";
import { TomanPrice } from "@/components/commerce/TomanPrice";

interface PriceRangeFilterProps {
  min: number;
  max: number;
  ceiling: number;
  onChange: (range: [number, number]) => void;
}

function filterStep(ceiling: number): number {
  if (ceiling <= 0) return 1;
  if (ceiling <= 50_000_000) return 1_000_000;
  return 5_000_000;
}

function dragStep(ceiling: number): number {
  if (ceiling <= 0) return 1;
  return Math.max(1, Math.round(ceiling / 500));
}

function snapToStep(value: number, step: number, ceiling: number): number {
  if (ceiling <= 0) return 0;
  const snapped = Math.round(value / step) * step;
  return Math.max(0, Math.min(snapped, ceiling));
}

function normalizeRange(min: number, max: number, step: number, ceiling: number): [number, number] {
  let snappedMin = snapToStep(min, step, ceiling);
  let snappedMax = snapToStep(max, step, ceiling);
  snappedMin = Math.min(snappedMin, Math.max(0, snappedMax - step));
  snappedMax = Math.max(snappedMax, Math.min(ceiling, snappedMin + step));
  return [snappedMin, snappedMax];
}

type ActiveThumb = "min" | "max" | null;

export function PriceRangeFilterSkeleton() {
  return (
    <div className="shop-price-filter shop-price-filter--skeleton" aria-busy="true" aria-hidden>
      <div className="shop-price-range-values">
        <div className="shop-price-range-value">
          <div className="sk h-2.5 w-7 rounded" />
          <div className="sk mt-1.5 h-3 w-full rounded" />
        </div>
        <div className="shop-price-range-value">
          <div className="sk h-2.5 w-6 rounded" />
          <div className="sk mt-1.5 h-3 w-full rounded" />
        </div>
      </div>
      <div className="shop-price-range-track shop-price-range-track--dual shop-price-range-track--skeleton">
        <div className="sk h-0.5 w-full rounded-full" />
      </div>
      <div className="shop-price-range-bounds">
        <div className="sk h-2 w-14 rounded" />
        <div className="sk h-2 w-16 rounded" />
      </div>
    </div>
  );
}

export function PriceRangeFilter({ min, max, ceiling, onChange }: PriceRangeFilterProps) {
  const step = useMemo(() => filterStep(ceiling), [ceiling]);
  const fineStep = useMemo(() => dragStep(ceiling), [ceiling]);
  const [activeThumb, setActiveThumb] = useState<ActiveThumb>(null);
  const [draftRange, setDraftRange] = useState<[number, number] | null>(null);
  const [pendingRange, setPendingRange] = useState<[number, number] | null>(null);
  const draftRef = useRef<[number, number] | null>(null);
  const draggingRef = useRef(false);

  const safeMin = Math.max(0, Math.min(min, max));
  const safeMax = Math.min(ceiling, Math.max(max, safeMin));

  useEffect(() => {
    if (!pendingRange) return;
    if (safeMin === pendingRange[0] && safeMax === pendingRange[1]) {
      setPendingRange(null);
    }
  }, [pendingRange, safeMin, safeMax]);

  const displayMin = draftRange?.[0] ?? pendingRange?.[0] ?? safeMin;
  const displayMax = draftRange?.[1] ?? pendingRange?.[1] ?? safeMax;
  const isDragging = activeThumb !== null;

  const minPercent = ceiling > 0 ? (displayMin / ceiling) * 100 : 0;
  const maxPercent = ceiling > 0 ? (displayMax / ceiling) * 100 : 100;

  const startDrag = useCallback(
    (thumb: ActiveThumb) => {
      const next: [number, number] = [safeMin, safeMax];
      draftRef.current = next;
      draggingRef.current = true;
      setActiveThumb(thumb);
      setDraftRange(next);
    },
    [safeMin, safeMax]
  );

  const endDrag = useCallback(() => {
    if (!draggingRef.current) return;

    const draft = draftRef.current;
    draggingRef.current = false;
    draftRef.current = null;
    setActiveThumb(null);
    setDraftRange(null);

    if (!draft) return;

    const normalized = normalizeRange(draft[0], draft[1], step, ceiling);
    setPendingRange(normalized);
    onChange(normalized);
  }, [ceiling, onChange, step]);

  const setMin = useCallback(
    (raw: number) => {
      const currentMax = draftRef.current?.[1] ?? safeMax;
      const next: [number, number] = [Math.max(0, Math.min(raw, currentMax)), currentMax];
      draftRef.current = next;
      setDraftRange(next);
    },
    [safeMax]
  );

  const setMax = useCallback(
    (raw: number) => {
      const currentMin = draftRef.current?.[0] ?? safeMin;
      const next: [number, number] = [currentMin, Math.min(ceiling, Math.max(raw, currentMin))];
      draftRef.current = next;
      setDraftRange(next);
    },
    [ceiling, safeMin]
  );

  if (ceiling <= 0) {
    return null;
  }

  /** در RTL: دستگیرهٔ «از» راست، «تا» چپ — اولویت z هنگام هم‌پوشانی */
  const minOnTop =
    activeThumb === "min" || (activeThumb !== "max" && displayMin <= ceiling * 0.5);

  return (
    <div className="shop-price-filter">
      <div className="shop-price-range-values">
        <div className="shop-price-range-value">
          <span className="shop-price-range-value-label">{fa.shop.priceFrom}</span>
          <span className="shop-price-range-value-amount"><TomanPrice amount={displayMin} size="xs" /></span>
        </div>
        <div className="shop-price-range-value">
          <span className="shop-price-range-value-label">{fa.shop.priceTo}</span>
          <span className="shop-price-range-value-amount"><TomanPrice amount={displayMax} size="xs" /></span>
        </div>
      </div>

      <div
        className={`shop-price-range-track shop-price-range-track--dual${isDragging || pendingRange ? " shop-price-range-track--dragging" : ""}`}
        dir="rtl"
      >
        <div className="shop-price-range-rail">
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
            step={fineStep}
            value={displayMin}
            onInput={(e) => setMin(Number(e.currentTarget.value))}
            onPointerDown={() => startDrag("min")}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onLostPointerCapture={endDrag}
            className="shop-price-range shop-price-range--min"
            style={{ zIndex: minOnTop ? 4 : 3 }}
            aria-label={fa.shop.priceFrom}
            aria-valuemin={0}
            aria-valuemax={displayMax}
            aria-valuenow={displayMin}
          />
          <input
            type="range"
            min={0}
            max={ceiling}
            step={fineStep}
            value={displayMax}
            onInput={(e) => setMax(Number(e.currentTarget.value))}
            onPointerDown={() => startDrag("max")}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onLostPointerCapture={endDrag}
            className="shop-price-range shop-price-range--max"
            style={{ zIndex: minOnTop ? 3 : 4 }}
            aria-label={fa.shop.priceTo}
            aria-valuemin={displayMin}
            aria-valuemax={ceiling}
            aria-valuenow={displayMax}
          />
        </div>
      </div>

      <div className="shop-price-range-bounds" dir="rtl">
        <span><TomanPrice amount={0} size="xs" /></span>
        <span><TomanPrice amount={ceiling} size="xs" /></span>
      </div>
    </div>
  );
}
