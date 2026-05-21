"use client";

import { useCallback, useEffect } from "react";
import type { CustomizerState } from "../types";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  initCustomizer,
  updateCustomizerField,
  updateCustomizerPatch,
  dismissCompatibilityChanges,
  resetCustomizer,
  loadCustomizerState,
  selectCustomizerState,
  selectCustomizerPrice,
  selectCompatibilityNotices,
} from "../store/slices/customizerSlice";
import { customizerLabelMaps } from "../store/customizer-utils";

export { customizerLabelMaps };

export function useCustomizer(initial?: Partial<CustomizerState>) {
  const dispatch = useAppDispatch();
  const state = useAppSelector(selectCustomizerState);
  const price = useAppSelector(selectCustomizerPrice);
  const recentChanges = useAppSelector(selectCompatibilityNotices);

  useEffect(() => {
    dispatch(initCustomizer(initial));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once on mount
  }, [dispatch]);

  const update = useCallback(
    <K extends keyof CustomizerState>(key: K, value: CustomizerState[K]) => {
      dispatch(updateCustomizerField({ key, value }));
    },
    [dispatch]
  );

  const batchUpdate = useCallback(
    (patch: Partial<CustomizerState>) => {
      dispatch(updateCustomizerPatch(patch));
    },
    [dispatch]
  );

  const dismissChanges = useCallback(() => {
    dispatch(dismissCompatibilityChanges());
  }, [dispatch]);

  const reset = useCallback(() => {
    dispatch(resetCustomizer());
  }, [dispatch]);

  const loadState = useCallback(
    (newState: CustomizerState) => {
      dispatch(loadCustomizerState(newState));
    },
    [dispatch]
  );

  return {
    state,
    update,
    batchUpdate,
    reset,
    loadState,
    price,
    recentChanges,
    dismissChanges,
    labelMaps: customizerLabelMaps,
  };
}
