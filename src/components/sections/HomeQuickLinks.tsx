"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  HOME_QUICK_LINK_MORE,
  HOME_QUICK_LINKS,
  type HomeQuickLink,
} from "@/lib/home/home-quick-links";
import { fa } from "@/lib/i18n/fa";
import { ICON_VARIANT } from "@/lib/icons";
import { cn } from "@/lib/utils";

const ICON_PX = 16;

function getScrollRatio(el: HTMLDivElement): number {
  const max = el.scrollWidth - el.clientWidth;
  if (max <= 0) return 0;

  const isRtl = getComputedStyle(el).direction === "rtl";
  const { scrollLeft } = el;

  if (isRtl) {
    if (scrollLeft <= 0) {
      return Math.min(1, Math.max(0, -scrollLeft / max));
    }
    return Math.min(1, Math.max(0, (max - scrollLeft) / max));
  }

  return Math.min(1, Math.max(0, scrollLeft / max));
}

function QuickLinkItem({ item, more }: { item: HomeQuickLink; more?: boolean }) {
  const { Icon, href, label, id } = item;

  return (
    <Link href={href} className="home-quick-links__item" data-quick-link={id}>
      <span
        className={cn(
          "home-quick-links__icon",
          more && "home-quick-links__icon--more"
        )}
        aria-hidden
      >
        <Icon size={ICON_PX} variant={ICON_VARIANT} />
      </span>
      <span className="home-quick-links__label">{label}</span>
    </Link>
  );
}

export function HomeQuickLinks() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);
  const [thumb, setThumb] = useState({ width: 50, offset: 0 });

  const syncScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const scrollable = max > 4;
    setCanScroll(scrollable);
    if (!scrollable) return;

    const ratio = getScrollRatio(el);
    const widthPct = (el.clientWidth / el.scrollWidth) * 100;
    const offsetPct = ratio * (100 - widthPct);
    setThumb({ width: widthPct, offset: offsetPct });
  }, []);

  useEffect(() => {
    syncScroll();
    const el = trackRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => syncScroll());
    observer.observe(el);
    return () => observer.disconnect();
  }, [syncScroll]);

  return (
    <section className="home-quick-links" aria-label={fa.home.quickLinksAria}>
      <div className="home-quick-links__container">
        <div
          ref={trackRef}
          dir="rtl"
          className={cn(
            "home-quick-links__track",
            !canScroll && "home-quick-links__track--fit"
          )}
          onScroll={syncScroll}
        >
          {HOME_QUICK_LINKS.map((item) => (
            <QuickLinkItem key={item.id} item={item} />
          ))}
          <QuickLinkItem item={HOME_QUICK_LINK_MORE} more />
        </div>

        {canScroll ? (
          <div className="home-quick-links__scroll-hint" aria-hidden>
            <div
              className="home-quick-links__scroll-thumb"
              style={{
                width: `${thumb.width}%`,
                insetInlineStart: `${thumb.offset}%`,
              }}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
