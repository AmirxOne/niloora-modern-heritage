"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

type StickyPhase = "static" | "fixed" | "bottom";

function readHeaderOffset(extraRem = 1.5) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--header-height");
  const headerHeight = Number.parseFloat(raw);
  const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  return (Number.isFinite(headerHeight) ? headerHeight : 120) + extraRem * rootFontSize;
}

export function useStickyWithinContainer(enabled = true, extraTopRem = 1.5) {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<StickyPhase>("static");
  const [targetStyle, setTargetStyle] = useState<CSSProperties>({});
  const [placeholderHeight, setPlaceholderHeight] = useState<number | undefined>();

  useEffect(() => {
    if (!enabled) return;

    const mq = window.matchMedia("(min-width: 1024px)");
    let raf = 0;

    const reset = () => {
      setPhase("static");
      setTargetStyle({});
      setPlaceholderHeight(undefined);
    };

    const update = () => {
      if (!mq.matches) {
        reset();
        return;
      }

      const container = containerRef.current;
      const target = targetRef.current;
      if (!container || !target) return;

      const top = readHeaderOffset(extraTopRem);
      const containerRect = container.getBoundingClientRect();
      const targetHeight = target.offsetHeight;
      const targetWidth = target.offsetWidth;

      if (containerRect.top >= top) {
        setPhase("static");
        setTargetStyle({});
        setPlaceholderHeight(undefined);
        return;
      }

      if (containerRect.bottom <= top + targetHeight) {
        setPhase("bottom");
        setTargetStyle({ width: targetWidth });
        setPlaceholderHeight(targetHeight);
        return;
      }

      setPhase("fixed");
      setTargetStyle({
        position: "fixed",
        top,
        left: target.getBoundingClientRect().left,
        width: targetWidth,
        zIndex: 1,
      });
      setPlaceholderHeight(targetHeight);
    };

    const scheduleUpdate = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    mq.addEventListener("change", scheduleUpdate);

    const container = containerRef.current;
    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(scheduleUpdate) : null;
    if (observer && container) observer.observe(container);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      mq.removeEventListener("change", scheduleUpdate);
      observer?.disconnect();
    };
  }, [enabled, extraTopRem]);

  return { containerRef, targetRef, phase, targetStyle, placeholderHeight };
}
