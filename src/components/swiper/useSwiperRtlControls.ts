"use client";

import { useCallback, useRef, useState } from "react";
import type { Swiper as SwiperType } from "swiper";

function bindNavigation(swiper: SwiperType, prevEl: HTMLElement | null, nextEl: HTMLElement | null) {
  if (!prevEl || !nextEl) return;
  const nav = swiper.params.navigation;
  if (!nav || typeof nav !== "object") return;

  Object.assign(nav, { prevEl, nextEl, disabledClass: "hidden" });

  const navigation = swiper.navigation;
  if (!navigation) return;
  navigation.destroy?.();
  navigation.init();
  navigation.update();
}

function bindPagination(swiper: SwiperType, el: HTMLElement | null) {
  if (!el) return;
  const pag = swiper.params.pagination;
  if (!pag || typeof pag !== "object") return;

  Object.assign(pag, { el });

  const pagination = swiper.pagination;
  if (!pagination) return;
  pagination.destroy?.();
  pagination.init();
  pagination.render();
  pagination.update();
}

export function useSwiperRtlControls(showPagination: boolean) {
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const paginationRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const syncNavState = useCallback((swiper: SwiperType) => {
    setCanPrev(!swiper.isBeginning);
    setCanNext(!swiper.isEnd);
  }, []);

  const wireControls = useCallback(
    (swiper: SwiperType) => {
      bindNavigation(swiper, prevRef.current, nextRef.current);
      if (showPagination) {
        bindPagination(swiper, paginationRef.current);
      }
      syncNavState(swiper);
    },
    [showPagination, syncNavState]
  );

  const onBeforeInit = useCallback(
    (swiper: SwiperType) => {
      const nav = swiper.params.navigation;
      if (nav && typeof nav === "object") {
        Object.assign(nav, {
          prevEl: prevRef.current,
          nextEl: nextRef.current,
          disabledClass: "hidden",
        });
      }
      if (showPagination) {
        const pag = swiper.params.pagination;
        if (pag && typeof pag === "object") {
          Object.assign(pag, { el: paginationRef.current });
        }
      }
    },
    [showPagination]
  );

  const onSwiper = useCallback(
    (swiper: SwiperType) => {
      wireControls(swiper);
    },
    [wireControls]
  );

  return {
    prevRef,
    nextRef,
    paginationRef,
    canPrev,
    canNext,
    onBeforeInit,
    onSwiper,
    syncNavState,
    wireControls,
  };
}
