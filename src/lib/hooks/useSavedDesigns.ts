"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { calculateCustomizerPrice } from "@/lib/customizer-pricing";
import type { CustomizerState } from "../types";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  saveDesign,
  removeDesign,
  selectSavedDesigns,
} from "../store/slices/designsSlice";

export function useSavedDesigns() {
  const dispatch = useAppDispatch();
  const designs = useAppSelector(selectSavedDesigns);

  const saveDesignFn = useCallback(
    (name: string, customizerState: CustomizerState, _clientPrice?: number) => {
      const price = calculateCustomizerPrice(customizerState);
      dispatch(saveDesign({ name, customizerState, price }));
      toast.success("طرح سفارشی ذخیره شد.");
    },
    [dispatch]
  );

  const removeDesignFn = useCallback(
    (id: string) => {
      dispatch(removeDesign(id));
      toast.info("طرح ذخیره‌شده حذف شد.");
    },
    [dispatch]
  );

  return {
    designs,
    saveDesign: saveDesignFn,
    removeDesign: removeDesignFn,
  };
}
