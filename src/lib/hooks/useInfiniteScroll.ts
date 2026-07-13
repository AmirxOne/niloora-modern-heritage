"use client";

import { useEffect, useRef } from "react";

type UseInfiniteScrollOptions = {
  enabled?: boolean;
  rootMargin?: string;
  recheckKey?: string | number | boolean;
  onLoadMore: () => void;
};

/** Fires `onLoadMore` once per unlock when the sentinel nears the viewport. */
export function useInfiniteScroll({
  enabled = true,
  rootMargin = "480px 0px",
  recheckKey,
  onLoadMore,
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const onLoadMoreRef = useRef(onLoadMore);
  const armedRef = useRef(true);
  onLoadMoreRef.current = onLoadMore;

  useEffect(() => {
    if (enabled) armedRef.current = true;
  }, [enabled, recheckKey]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!enabled || !node) return;

    const trigger = () => {
      if (!armedRef.current) return;
      armedRef.current = false;
      onLoadMoreRef.current();
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) trigger();
      },
      { root: null, rootMargin, threshold: 0 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, rootMargin, recheckKey]);

  return sentinelRef;
}
