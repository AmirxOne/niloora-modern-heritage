"use client";

import { useEffect, useRef } from "react";

type UseInfiniteScrollOptions = {
  enabled?: boolean;
  rootMargin?: string;
  /** Change this when content height/count changes so a still-visible sentinel rechecks. */
  recheckKey?: string | number | boolean;
  onLoadMore: () => void;
};

/** Fires `onLoadMore` when the sentinel enters the viewport. */
export function useInfiniteScroll({
  enabled = true,
  rootMargin = "400px 0px",
  recheckKey,
  onLoadMore,
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  useEffect(() => {
    const node = sentinelRef.current;
    if (!enabled || !node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onLoadMoreRef.current();
        }
      },
      { root: null, rootMargin, threshold: 0 }
    );

    observer.observe(node);

    // Recheck after content changes — IntersectionObserver won't re-fire if
    // the sentinel never left the viewport.
    const rect = node.getBoundingClientRect();
    const marginPx = Number.parseInt(rootMargin, 10) || 0;
    if (rect.top < window.innerHeight + marginPx) {
      onLoadMoreRef.current();
    }

    return () => observer.disconnect();
  }, [enabled, rootMargin, recheckKey]);

  return sentinelRef;
}
