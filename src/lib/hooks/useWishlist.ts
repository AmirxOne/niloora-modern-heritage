"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  toggleWishlist,
  removeFromWishlist,
  selectWishlistIds,
} from "../store/slices/wishlistSlice";

export function useWishlist() {
  const dispatch = useAppDispatch();
  const ids = useAppSelector(selectWishlistIds);

  const isWishlisted = useCallback(
    (productId: string) => ids.includes(productId),
    [ids]
  );

  const toggle = useCallback(
    (productId: string) => {
      const exists = ids.includes(productId);
      dispatch(toggleWishlist(productId));
      if (exists) {
        toast.info("محصول از علاقه‌مندی‌ها حذف شد.");
      } else {
        toast.success("محصول به علاقه‌مندی‌ها اضافه شد.");
      }
    },
    [dispatch, ids]
  );

  const remove = useCallback(
    (productId: string) => {
      dispatch(removeFromWishlist(productId));
      toast.info("محصول از علاقه‌مندی‌ها حذف شد.");
    },
    [dispatch]
  );

  return {
    ids,
    isWishlisted,
    toggle,
    remove,
  };
}
