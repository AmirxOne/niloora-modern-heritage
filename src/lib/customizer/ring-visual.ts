import type { CustomizerState, StoneShape } from "@/lib/types";
import { METAL_OPTIONS } from "@/lib/constants";
import { getCatalogStone } from "@/lib/customizer/catalog";

export interface RingVisualParams {
  metalColor: string;
  metalRoughness: number;
  metalMetalness: number;
  bandRadius: number;
  bandTube: number;
  bandStyle: CustomizerState["bandStyle"];
  texture: CustomizerState["texture"];
  stoneColor: string;
  stoneShape: StoneShape;
  stoneScale: [number, number, number];
  carving: CustomizerState["carving"];
  bandCarvingEnabled: boolean;
  hasPave: boolean;
  engravingText: string;
  stoneEngravingText: string;
}

const STONE_SCALE: Record<StoneShape, [number, number, number]> = {
  round: [0.22, 0.22, 0.22],
  oval: [0.17, 0.26, 0.17],
  cushion: [0.24, 0.2, 0.18],
  princess: [0.22, 0.22, 0.16],
  pear: [0.15, 0.28, 0.15],
  marquise: [0.28, 0.14, 0.14],
};

function textureToRoughness(texture: CustomizerState["texture"]): number {
  switch (texture) {
    case "matte":
      return 0.52;
    case "brushed":
      return 0.38;
    case "hammered":
      return 0.72;
    case "sandblasted":
      return 0.65;
    default:
      return 0.14;
  }
}

function bandStyleRoughnessBoost(bandStyle: CustomizerState["bandStyle"], base: number): number {
  switch (bandStyle) {
    case "hammered":
      return Math.max(base, 0.58);
    case "filigree":
      return base + 0.06;
    case "twisted":
      return base + 0.04;
    case "channel":
      return Math.max(0.1, base - 0.04);
    case "pave":
      return Math.max(0.08, base - 0.02);
    default:
      return base;
  }
}

export function getRingVisualParams(state: CustomizerState): RingVisualParams {
  const metal = METAL_OPTIONS.find((m) => m.value === state.metal);
  const stone = getCatalogStone(state.stone);

  const inscription =
    state.stoneInscriptionId && state.stoneEngravingEnabled
      ? state.engravingText
      : "";

  const baseRoughness = textureToRoughness(state.texture);

  return {
    metalColor: metal?.color ?? "#C4C9CE",
    metalRoughness: bandStyleRoughnessBoost(state.bandStyle, baseRoughness),
    metalMetalness: 0.94,
    bandRadius: 0.38 + state.size * 0.011,
    bandTube: 0.028 + state.thickness * 0.014,
    bandStyle: state.bandStyle,
    texture: state.texture,
    stoneColor: state.stoneColor || stone?.color || "#E8F4F8",
    stoneShape: state.stoneShape,
    stoneScale: STONE_SCALE[state.stoneShape],
    carving: state.bandCarvingEnabled ? state.carving : "none",
    bandCarvingEnabled: state.bandCarvingEnabled,
    hasPave: state.bandStyle === "pave",
    engravingText: state.bandEngravingEnabled ? state.engravingText : "",
    stoneEngravingText: inscription,
  };
}
