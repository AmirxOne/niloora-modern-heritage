"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { fa } from "@/lib/i18n/fa";
import { MAX_COMPARE_PRODUCTS } from "@/lib/product-lists/constants";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  addToCompareList,
  clearCompareList,
  removeFromCompareList,
  selectCompareListHydrated,
  selectCompareListIds,
} from "../store/slices/compareListSlice";

export function useCompareList() {
  const dispatch = useAppDispatch();
  const ids = useAppSelector(selectCompareListIds);
  const hydrated = useAppSelector(selectCompareListHydrated);

  const isInCompare = useCallback(
    (productId: string) => ids.includes(productId),
    [ids]
  );

  const toggle = useCallback(
    (productId: string) => {
      if (ids.includes(productId)) {
        dispatch(removeFromCompareList(productId));
        toast.info(fa.compare.removed);
        return;
      }
      if (ids.length >= MAX_COMPARE_PRODUCTS) {
        toast.error(fa.compare.limitReached(MAX_COMPARE_PRODUCTS));
        return;
      }
      dispatch(addToCompareList(productId));
      toast.success(fa.compare.added);
    },
    [dispatch, ids]
  );

  const remove = useCallback(
    (productId: string) => {
      dispatch(removeFromCompareList(productId));
      toast.info(fa.compare.removed);
    },
    [dispatch]
  );

  const clear = useCallback(() => {
    dispatch(clearCompareList());
    toast.info(fa.compare.cleared);
  }, [dispatch]);

  return {
    ids,
    count: ids.length,
    max: MAX_COMPARE_PRODUCTS,
    hydrated,
    isInCompare,
    toggle,
    remove,
    clear,
  };
}
