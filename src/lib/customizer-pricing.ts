import type {
  BandStyle,
  CarvingStyle,
  CustomizerState,
  EngravingStyle,
  MetalType,
  StoneShape,
  StoneType,
  TextureStyle,
} from "./types";
import {
  getCatalogStone,
  getEngravingMaster,
  getShankModel,
  getStoneInscription,
} from "./customizer/catalog";

export const defaultCustomizerState: CustomizerState = {
  bandStyle: "classic",
  thickness: 2.2,
  size: 7,
  metal: "sterling",
  stone: "turquoise",
  stoneColor: "#2A9D8F",
  stoneShape: "round",
  engravingText: "",
  engravingStyle: "nastaliq",
  texture: "polished",
  carving: "none",
  shankMaster: "ebrahim-azari",
  shankModelId: "eb-classic",
  bandCarvingEnabled: false,
  bandEngravingEnabled: false,
  bandEngravingMasterId: null,
  stoneCategory: "religious",
  stoneEngravingEnabled: false,
  stoneEngravingMasterId: null,
  stoneInscriptionId: null,
};

const BASE_ATELIER_PRICE = 48_000_000;

const METAL_ADD: Record<MetalType, number> = {
  sterling: 0,
  oxidized: 4_000_000,
  rhodium: 8_000_000,
  "matte-silver": 3_000_000,
};

const STONE_ADD: Record<StoneType, number> = {
  diamond: 42_000_000,
  emerald: 38_000_000,
  sapphire: 34_000_000,
  ruby: 36_000_000,
  turquoise: 12_000_000,
  onyx: 8_000_000,
  zabarjad: 28_000_000,
  "yemen-aqeeq": 18_000_000,
  "durr-najaf": 22_000_000,
  moral: 10_000_000,
};

const BAND_ADD: Record<BandStyle, number> = {
  classic: 0,
  twisted: 5_000_000,
  pave: 14_000_000,
  filigree: 11_000_000,
  hammered: 6_000_000,
  channel: 9_000_000,
};

const SHAPE_ADD: Record<StoneShape, number> = {
  round: 0,
  oval: 2_000_000,
  cushion: 3_000_000,
  princess: 5_000_000,
  pear: 4_000_000,
  marquise: 4_500_000,
};

const CARVING_ADD: Record<CarvingStyle, number> = {
  none: 0,
  minimal: 3_000_000,
  geometric: 6_000_000,
  floral: 8_000_000,
  khatai: 12_000_000,
  eslimi: 15_000_000,
};

const ENGRAVING_ADD: Record<EngravingStyle, number> = {
  nastaliq: 5_000_000,
  naskh: 4_000_000,
  thuluth: 6_000_000,
  kufic: 4_500_000,
  modern: 3_000_000,
};

const TEXTURE_ADD: Record<TextureStyle, number> = {
  polished: 0,
  brushed: 2_000_000,
  matte: 2_500_000,
  hammered: 3_500_000,
  sandblasted: 3_000_000,
};

export function calculateCustomizerPrice(state: CustomizerState): number {
  let total = BASE_ATELIER_PRICE;
  total += METAL_ADD[state.metal];
  const catalogStone = getCatalogStone(state.stone);
  total += catalogStone?.priceAdd ?? STONE_ADD[state.stone];
  const shankModel = getShankModel(state.shankModelId);
  total += shankModel?.priceAdd ?? BAND_ADD[state.bandStyle];
  total += SHAPE_ADD[state.stoneShape];
  if (state.bandCarvingEnabled) {
    total += CARVING_ADD[state.carving];
  }
  total += TEXTURE_ADD[state.texture];
  if (state.bandEngravingEnabled && state.bandEngravingMasterId) {
    const master = getEngravingMaster(state.bandEngravingMasterId);
    total += master?.priceAdd ?? ENGRAVING_ADD[state.engravingStyle];
  }
  if (state.stoneEngravingEnabled && state.stoneEngravingMasterId) {
    const master = getEngravingMaster(state.stoneEngravingMasterId);
    total += master?.priceAdd ?? 0;
    if (state.stoneInscriptionId) {
      total += getStoneInscription(state.stoneInscriptionId)?.priceAdd ?? 0;
    }
  }
  total += Math.max(0, state.thickness - 2) * 2_500_000;
  total += Math.max(0, state.size - 7) * 800_000;
  if (state.engravingText.trim().length > 0 && !state.stoneInscriptionId) {
    total += 2_000_000 + state.engravingText.trim().length * 400_000;
  }
  return Math.round(total);
}
