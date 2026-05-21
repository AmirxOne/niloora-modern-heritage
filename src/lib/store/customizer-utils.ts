import type { CustomizerState } from "../types";
import { defaultCustomizerState, calculateCustomizerPrice } from "../customizer-pricing";
import {
  sanitizeCustomizerState,
  type CompatibilityChange,
} from "../customizer/compatibility";
import { fa } from "../i18n/fa";
import {
  BAND_OPTIONS,
  STONE_OPTIONS,
  SHAPE_OPTIONS,
  CARVING_OPTIONS,
  ENGRAVING_STYLES,
  TEXTURE_OPTIONS,
  METAL_OPTIONS,
} from "../constants";

export const customizerLabelMaps = {
  band: (b: CustomizerState["bandStyle"]) =>
    BAND_OPTIONS.find((o) => o.value === b)?.label ?? b,
  stone: (s: CustomizerState["stone"]) =>
    STONE_OPTIONS.find((o) => o.value === s)?.label ?? s,
  carving: (c: CustomizerState["carving"]) =>
    CARVING_OPTIONS.find((o) => o.value === c)?.label ?? c,
  engraving: (e: CustomizerState["engravingStyle"]) =>
    ENGRAVING_STYLES.find((o) => o.value === e)?.label ?? e,
  texture: (t: CustomizerState["texture"]) =>
    TEXTURE_OPTIONS.find((o) => o.value === t)?.label ?? t,
  metal: (m: CustomizerState["metal"]) =>
    METAL_OPTIONS.find((o) => o.value === m)?.label ?? m,
  shape: (s: CustomizerState["stoneShape"]) =>
    SHAPE_OPTIONS.find((o) => o.value === s)?.label ?? s,
};

const LEGACY_METAL_MAP: Record<string, CustomizerState["metal"]> = {
  gold: "sterling",
  "rose-gold": "oxidized",
  silver: "sterling",
  platinum: "rhodium",
};

export function coerceMetalType(metal: string): CustomizerState["metal"] {
  if (METAL_OPTIONS.some((o) => o.value === metal)) {
    return metal as CustomizerState["metal"];
  }
  return LEGACY_METAL_MAP[metal] ?? "sterling";
}

export function withCustomizerDefaults(
  state: Partial<CustomizerState> | CustomizerState
): CustomizerState {
  return { ...defaultCustomizerState, ...state };
}

export function sanitizeCustomizer(state: CustomizerState) {
  const merged = withCustomizerDefaults(state);
  return sanitizeCustomizerState(
    { ...merged, metal: coerceMetalType(merged.metal) },
    customizerLabelMaps
  );
}

export function resolveChangeLabel(
  field: keyof CustomizerState,
  raw: string
): string {
  switch (field) {
    case "bandStyle":
      return customizerLabelMaps.band(raw as CustomizerState["bandStyle"]);
    case "stone":
      return customizerLabelMaps.stone(raw as CustomizerState["stone"]);
    case "stoneShape":
      return customizerLabelMaps.shape(raw as CustomizerState["stoneShape"]);
    case "carving":
      return customizerLabelMaps.carving(raw as CustomizerState["carving"]);
    case "engravingStyle":
      return customizerLabelMaps.engraving(raw as CustomizerState["engravingStyle"]);
    case "texture":
      return customizerLabelMaps.texture(raw as CustomizerState["texture"]);
    case "metal":
      return customizerLabelMaps.metal(raw as CustomizerState["metal"]);
    case "thickness":
      return `${raw} میلی‌متر`;
    default:
      return raw;
  }
}

const fieldLabels: Partial<Record<keyof CustomizerState, string>> = {
  bandStyle: fa.customize.labels.bandStyle,
  carving: fa.customize.labels.traditionalCarving,
  engravingStyle: fa.customize.labels.calligraphyStyle,
  stoneShape: fa.customize.labels.stoneShape,
  stone: fa.customize.labels.stoneType,
  texture: fa.customize.labels.surfaceTexture,
  metal: fa.customize.labels.metalType,
  thickness: fa.customize.labels.bandThickness,
};

export function mapCompatibilityChanges(changes: CompatibilityChange[]) {
  return changes.map((c) => ({
    fieldLabel: fieldLabels[c.field] ?? c.field,
    fromLabel: resolveChangeLabel(c.field, c.from),
    toLabel: resolveChangeLabel(c.field, c.to),
    reason: c.reason,
  }));
}

export function getCustomizerPrice(state: CustomizerState): number {
  return calculateCustomizerPrice(state);
}

export { defaultCustomizerState };
