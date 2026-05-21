import type {
  BandStyle,
  CarvingStyle,
  EngravingStyle,
  MetalType,
  StoneShape,
  StoneType,
  TextureStyle,
} from "./types";
import { fa } from "./i18n/fa";

export const METAL_OPTIONS: { value: MetalType; label: string; color: string }[] = [
  { value: "sterling", label: fa.metals.sterling, color: "#C4C9CE" },
  { value: "oxidized", label: fa.metals.oxidized, color: "#7A848C" },
  { value: "rhodium", label: fa.metals.rhodium, color: "#E4E8EC" },
  { value: "matte-silver", label: fa.metals["matte-silver"], color: "#9DA5AD" },
];

export const STONE_OPTIONS: { value: StoneType; label: string; color: string }[] = [
  { value: "diamond", label: fa.stones.diamond, color: "#E8F4F8" },
  { value: "emerald", label: fa.stones.emerald, color: "#50C878" },
  { value: "sapphire", label: fa.stones.sapphire, color: "#0F52BA" },
  { value: "ruby", label: fa.stones.ruby, color: "#E0115F" },
  { value: "turquoise", label: fa.stones.turquoise, color: "#2A9D8F" },
  { value: "onyx", label: fa.stones.onyx, color: "#353935" },
];

export const SHAPE_OPTIONS: { value: StoneShape; label: string }[] = [
  { value: "round", label: fa.shapes.round },
  { value: "oval", label: fa.shapes.oval },
  { value: "cushion", label: fa.shapes.cushion },
  { value: "princess", label: fa.shapes.princess },
  { value: "pear", label: fa.shapes.pear },
  { value: "marquise", label: fa.shapes.marquise },
];

export const BAND_OPTIONS: { value: BandStyle; label: string }[] = [
  { value: "classic", label: fa.bands.classic },
  { value: "twisted", label: fa.bands.twisted },
  { value: "pave", label: fa.bands.pave },
  { value: "filigree", label: fa.bands.filigree },
  { value: "hammered", label: fa.bands.hammered },
  { value: "channel", label: fa.bands.channel },
];

export const ENGRAVING_STYLES: { value: EngravingStyle; label: string; sample: string }[] = [
  { value: "nastaliq", label: fa.engravings.nastaliq, sample: "نستعلیق" },
  { value: "naskh", label: fa.engravings.naskh, sample: "نسخ" },
  { value: "thuluth", label: fa.engravings.thuluth, sample: "ثلث" },
  { value: "kufic", label: fa.engravings.kufic, sample: "کوفی" },
  { value: "modern", label: fa.engravings.modern, sample: "آ" },
];

export const CARVING_OPTIONS: { value: CarvingStyle; label: string }[] = [
  { value: "none", label: fa.carvings.none },
  { value: "minimal", label: fa.carvings.minimal },
  { value: "geometric", label: fa.carvings.geometric },
  { value: "floral", label: fa.carvings.floral },
  { value: "khatai", label: fa.carvings.khatai },
  { value: "eslimi", label: fa.carvings.eslimi },
];

export const TEXTURE_OPTIONS: { value: TextureStyle; label: string }[] = [
  { value: "polished", label: fa.textures.polished },
  { value: "brushed", label: fa.textures.brushed },
  { value: "matte", label: fa.textures.matte },
  { value: "hammered", label: fa.textures.hammered },
  { value: "sandblasted", label: fa.textures.sandblasted },
];

export const RING_SIZES = [4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12];
