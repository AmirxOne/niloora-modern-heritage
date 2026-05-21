"use client";

import { useMemo } from "react";
import type { CustomizerState } from "../types";
import {
  getAllowedBands,
  getAllowedCarvings,
  getAllowedEngravingStyles,
  getAllowedStoneShapes,
  getAllowedStones,
  getAllowedTextures,
  getThicknessRange,
  getDisabledReason,
  isOptionAllowed,
} from "../customizer/compatibility";

type LabelMaps = {
  band: (b: CustomizerState["bandStyle"]) => string;
  stone: (s: CustomizerState["stone"]) => string;
  metal: (m: CustomizerState["metal"]) => string;
};

export function useCustomizerCompatibility(
  state: CustomizerState,
  labelMaps: LabelMaps
) {
  return useMemo(() => {
    const thicknessRange = getThicknessRange(state);

    return {
      allowed: {
        bandStyle: new Set(getAllowedBands(state)),
        carving: new Set(getAllowedCarvings(state)),
        engravingStyle: new Set(getAllowedEngravingStyles(state)),
        stoneShape: new Set(getAllowedStoneShapes(state)),
        stone: new Set(getAllowedStones(state)),
        texture: new Set(getAllowedTextures(state)),
      },
      thicknessRange,
      isAllowed: (field: keyof CustomizerState, value: string) =>
        isOptionAllowed(state, field, value),
      getReason: (field: keyof CustomizerState, value: string) =>
        getDisabledReason(state, field, value, labelMaps),
    };
  }, [state, labelMaps]);
}
