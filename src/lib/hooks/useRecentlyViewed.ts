"use client";

import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  clearRecentlyViewed,
  recordProductView,
  removeRecentlyViewed,
  selectRecentlyViewedIds,
} from "../store/slices/recentlyViewedSlice";

export function useRecentlyViewed() {
  const dispatch = useAppDispatch();
  const ids = useAppSelector(selectRecentlyViewedIds);

  const trackView = useCallback(
    (productId: string) => {
      if (!productId) return;
      dispatch(recordProductView(productId));
    },
    [dispatch]
  );

  const remove = useCallback(
    (productId: string) => {
      dispatch(removeRecentlyViewed(productId));
    },
    [dispatch]
  );

  const clear = useCallback(() => {
    dispatch(clearRecentlyViewed());
  }, [dispatch]);

  return {
    ids,
    trackView,
    remove,
    clear,
  };
}
