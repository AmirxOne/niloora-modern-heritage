import type {
  BandStyle,
  CarvingStyle,
  CustomizerState,
  EngravingMasterId,
  EngravingStyle,
  MetalType,
  ShankMasterId,
  StoneCategory,
  StoneType,
  TextureStyle,
} from "@/lib/types";
import { pickSiteImageByKey, pickTestArtisanImageByKey } from "@/lib/images";
import { fa } from "@/lib/i18n/fa";

export interface ShankMaster {
  id: ShankMasterId;
  name: string;
  title: string;
  description: string;
  image: string;
  defaultMetal: MetalType;
}

export interface ShankModel {
  id: string;
  masterId: ShankMasterId;
  name: string;
  description: string;
  image: string;
  bandStyle: BandStyle;
  defaultThickness: number;
  defaultTexture: TextureStyle;
  supportsCarving: boolean;
  allowedCarvings: CarvingStyle[];
  supportsBandEngraving: boolean;
  priceAdd: number;
}

export interface EngravingMaster {
  id: EngravingMasterId;
  name: string;
  specialty: string;
  description: string;
  image: string;
  /** حک روی رکاب یا سنگ */
  scope: "band" | "stone";
  engravingStyle: EngravingStyle;
  priceAdd: number;
}

export interface CatalogStone {
  id: StoneType;
  category: StoneCategory;
  name: string;
  description: string;
  color: string;
  image: string;
  supportsEngraving: boolean;
  priceAdd: number;
}

export interface StoneInscription {
  id: string;
  text: string;
  meaning: string;
  priceAdd: number;
}

export const SHANK_MASTERS: ShankMaster[] = [
  {
    id: "ebrahim-azari",
    name: fa.customize.wizard.masters.ebrahim.name,
    title: fa.customize.wizard.masters.ebrahim.title,
    description: fa.customize.wizard.masters.ebrahim.description,
    image: pickTestArtisanImageByKey("master-ebrahim"),
    defaultMetal: "sterling",
  },
  {
    id: "tehrani-azari",
    name: fa.customize.wizard.masters.tehrani.name,
    title: fa.customize.wizard.masters.tehrani.title,
    description: fa.customize.wizard.masters.tehrani.description,
    image: pickTestArtisanImageByKey("master-tehrani", 1),
    defaultMetal: "oxidized",
  },
  {
    id: "heritage-atelier",
    name: fa.customize.wizard.masters.heritage.name,
    title: fa.customize.wizard.masters.heritage.title,
    description: fa.customize.wizard.masters.heritage.description,
    image: pickTestArtisanImageByKey("master-heritage"),
    defaultMetal: "rhodium",
  },
];

export const SHANK_MODELS: ShankModel[] = [
  {
    id: "eb-classic",
    masterId: "ebrahim-azari",
    name: fa.customize.wizard.shanks.ebClassic.name,
    description: fa.customize.wizard.shanks.ebClassic.description,
    image: pickSiteImageByKey("eb-classic"),
    bandStyle: "classic",
    defaultThickness: 2.2,
    defaultTexture: "polished",
    supportsCarving: true,
    allowedCarvings: ["none", "minimal", "geometric", "floral", "khatai", "eslimi"],
    supportsBandEngraving: true,
    priceAdd: 0,
  },
  {
    id: "eb-filigree",
    masterId: "ebrahim-azari",
    name: fa.customize.wizard.shanks.ebFiligree.name,
    description: fa.customize.wizard.shanks.ebFiligree.description,
    image: pickSiteImageByKey("eb-filigree", 1),
    bandStyle: "filigree",
    defaultThickness: 2.4,
    defaultTexture: "matte",
    supportsCarving: true,
    allowedCarvings: ["none", "minimal", "geometric", "floral", "khatai"],
    supportsBandEngraving: true,
    priceAdd: 11_000_000,
  },
  {
    id: "eb-hammered",
    masterId: "ebrahim-azari",
    name: fa.customize.wizard.shanks.ebHammered.name,
    description: fa.customize.wizard.shanks.ebHammered.description,
    image: pickSiteImageByKey("eb-hammered"),
    bandStyle: "hammered",
    defaultThickness: 2.6,
    defaultTexture: "hammered",
    supportsCarving: true,
    allowedCarvings: ["none", "minimal", "geometric", "eslimi"],
    supportsBandEngraving: true,
    priceAdd: 6_000_000,
  },
  {
    id: "te-classic",
    masterId: "tehrani-azari",
    name: fa.customize.wizard.shanks.teClassic.name,
    description: fa.customize.wizard.shanks.teClassic.description,
    image: pickSiteImageByKey("te-classic", 1),
    bandStyle: "classic",
    defaultThickness: 2,
    defaultTexture: "brushed",
    supportsCarving: true,
    allowedCarvings: ["none", "minimal", "geometric", "floral"],
    supportsBandEngraving: true,
    priceAdd: 0,
  },
  {
    id: "te-twisted",
    masterId: "tehrani-azari",
    name: fa.customize.wizard.shanks.teTwisted.name,
    description: fa.customize.wizard.shanks.teTwisted.description,
    image: pickSiteImageByKey("te-twisted"),
    bandStyle: "twisted",
    defaultThickness: 2.3,
    defaultTexture: "polished",
    supportsCarving: false,
    allowedCarvings: ["none"],
    supportsBandEngraving: true,
    priceAdd: 5_000_000,
  },
  {
    id: "te-channel",
    masterId: "tehrani-azari",
    name: fa.customize.wizard.shanks.teChannel.name,
    description: fa.customize.wizard.shanks.teChannel.description,
    image: pickSiteImageByKey("te-channel", 1),
    bandStyle: "channel",
    defaultThickness: 2.5,
    defaultTexture: "polished",
    supportsCarving: false,
    allowedCarvings: ["none"],
    supportsBandEngraving: false,
    priceAdd: 9_000_000,
  },
  {
    id: "eb-pave",
    masterId: "ebrahim-azari",
    name: fa.customize.wizard.shanks.ebPave.name,
    description: fa.customize.wizard.shanks.ebPave.description,
    image: pickSiteImageByKey("eb-pave"),
    bandStyle: "pave",
    defaultThickness: 2.4,
    defaultTexture: "polished",
    supportsCarving: false,
    allowedCarvings: ["none"],
    supportsBandEngraving: true,
    priceAdd: 14_000_000,
  },
  {
    id: "eb-channel",
    masterId: "ebrahim-azari",
    name: fa.customize.wizard.shanks.ebChannel.name,
    description: fa.customize.wizard.shanks.ebChannel.description,
    image: pickSiteImageByKey("eb-channel", 1),
    bandStyle: "channel",
    defaultThickness: 2.5,
    defaultTexture: "polished",
    supportsCarving: false,
    allowedCarvings: ["none"],
    supportsBandEngraving: false,
    priceAdd: 9_500_000,
  },
  {
    id: "te-pave",
    masterId: "tehrani-azari",
    name: fa.customize.wizard.shanks.tePave.name,
    description: fa.customize.wizard.shanks.tePave.description,
    image: pickSiteImageByKey("te-pave"),
    bandStyle: "pave",
    defaultThickness: 2.2,
    defaultTexture: "brushed",
    supportsCarving: false,
    allowedCarvings: ["none"],
    supportsBandEngraving: true,
    priceAdd: 12_000_000,
  },
  {
    id: "te-filigree",
    masterId: "tehrani-azari",
    name: fa.customize.wizard.shanks.teFiligree.name,
    description: fa.customize.wizard.shanks.teFiligree.description,
    image: pickSiteImageByKey("te-filigree", 1),
    bandStyle: "filigree",
    defaultThickness: 2.3,
    defaultTexture: "matte",
    supportsCarving: true,
    allowedCarvings: ["none", "minimal", "geometric", "floral"],
    supportsBandEngraving: true,
    priceAdd: 10_000_000,
  },
  {
    id: "te-hammered",
    masterId: "tehrani-azari",
    name: fa.customize.wizard.shanks.teHammered.name,
    description: fa.customize.wizard.shanks.teHammered.description,
    image: pickSiteImageByKey("te-hammered"),
    bandStyle: "hammered",
    defaultThickness: 2.5,
    defaultTexture: "hammered",
    supportsCarving: true,
    allowedCarvings: ["none", "minimal"],
    supportsBandEngraving: true,
    priceAdd: 5_500_000,
  },
  {
    id: "hg-royal",
    masterId: "heritage-atelier",
    name: fa.customize.wizard.shanks.hgRoyal.name,
    description: fa.customize.wizard.shanks.hgRoyal.description,
    image: pickSiteImageByKey("hg-royal", 1),
    bandStyle: "classic",
    defaultThickness: 2.8,
    defaultTexture: "polished",
    supportsCarving: true,
    allowedCarvings: ["none", "minimal", "geometric", "khatai", "eslimi"],
    supportsBandEngraving: true,
    priceAdd: 8_000_000,
  },
  {
    id: "hg-signet",
    masterId: "heritage-atelier",
    name: fa.customize.wizard.shanks.hgSignet.name,
    description: fa.customize.wizard.shanks.hgSignet.description,
    image: pickSiteImageByKey("hg-signet"),
    bandStyle: "hammered",
    defaultThickness: 3,
    defaultTexture: "matte",
    supportsCarving: true,
    allowedCarvings: ["none", "geometric", "floral"],
    supportsBandEngraving: true,
    priceAdd: 7_000_000,
  },
];

export const ENGRAVING_MASTERS: EngravingMaster[] = [
  {
    id: "kourosh",
    name: fa.customize.wizard.engravingMasters.kourosh.name,
    specialty: fa.customize.wizard.engravingMasters.kourosh.specialty,
    description: fa.customize.wizard.engravingMasters.kourosh.description,
    image: pickTestArtisanImageByKey("engraver-kourosh"),
    scope: "band",
    engravingStyle: "nastaliq",
    priceAdd: 9_000_000,
  },
  {
    id: "naderi",
    name: fa.customize.wizard.engravingMasters.naderi.name,
    specialty: fa.customize.wizard.engravingMasters.naderi.specialty,
    description: fa.customize.wizard.engravingMasters.naderi.description,
    image: pickTestArtisanImageByKey("engraver-naderi", 1),
    scope: "band",
    engravingStyle: "thuluth",
    priceAdd: 8_000_000,
  },
  {
    id: "rahimi",
    name: fa.customize.wizard.engravingMasters.rahimi.name,
    specialty: fa.customize.wizard.engravingMasters.rahimi.specialty,
    description: fa.customize.wizard.engravingMasters.rahimi.description,
    image: pickTestArtisanImageByKey("engraver-rahimi"),
    scope: "band",
    engravingStyle: "kufic",
    priceAdd: 7_500_000,
  },
  {
    id: "lotif",
    name: fa.customize.wizard.engravingMasters.lotif.name,
    specialty: fa.customize.wizard.engravingMasters.lotif.specialty,
    description: fa.customize.wizard.engravingMasters.lotif.description,
    image: pickTestArtisanImageByKey("engraver-lotif", 1),
    scope: "stone",
    engravingStyle: "nastaliq",
    priceAdd: 12_000_000,
  },
  {
    id: "sadeghi",
    name: fa.customize.wizard.engravingMasters.sadeghi.name,
    specialty: fa.customize.wizard.engravingMasters.sadeghi.specialty,
    description: fa.customize.wizard.engravingMasters.sadeghi.description,
    image: pickTestArtisanImageByKey("engraver-sadeghi"),
    scope: "band",
    engravingStyle: "naskh",
    priceAdd: 8_500_000,
  },
  {
    id: "hakhamaneshi",
    name: fa.customize.wizard.engravingMasters.hakhamaneshi.name,
    specialty: fa.customize.wizard.engravingMasters.hakhamaneshi.specialty,
    description: fa.customize.wizard.engravingMasters.hakhamaneshi.description,
    image: pickTestArtisanImageByKey("engraver-hakhamaneshi", 1),
    scope: "stone",
    engravingStyle: "kufic",
    priceAdd: 11_000_000,
  },
];

export const CATALOG_STONES: CatalogStone[] = [
  {
    id: "turquoise",
    category: "religious",
    name: fa.stones.turquoise,
    description: fa.customize.wizard.stones.turquoiseDesc,
    color: "#2A9D8F",
    image: pickSiteImageByKey("stone-turquoise"),
    supportsEngraving: true,
    priceAdd: 12_000_000,
  },
  {
    id: "yemen-aqeeq",
    category: "religious",
    name: fa.customize.wizard.stones.yemenAqeeq,
    description: fa.customize.wizard.stones.yemenAqeeqDesc,
    color: "#8B2635",
    image: pickSiteImageByKey("stone-yemen-aqeeq", 1),
    supportsEngraving: true,
    priceAdd: 18_000_000,
  },
  {
    id: "durr-najaf",
    category: "religious",
    name: fa.customize.wizard.stones.durrNajaf,
    description: fa.customize.wizard.stones.durrNajafDesc,
    color: "#6EC4E8",
    image: pickSiteImageByKey("stone-durr-najaf"),
    supportsEngraving: true,
    priceAdd: 22_000_000,
  },
  {
    id: "moral",
    category: "religious",
    name: fa.customize.wizard.stones.moral,
    description: fa.customize.wizard.stones.moralDesc,
    color: "#4A5568",
    image: pickSiteImageByKey("stone-moral", 1),
    supportsEngraving: false,
    priceAdd: 10_000_000,
  },
  {
    id: "zabarjad",
    category: "collection",
    name: fa.customize.wizard.stones.zabarjad,
    description: fa.customize.wizard.stones.zabarjadDesc,
    color: "#7CB342",
    image: pickSiteImageByKey("stone-zabarjad"),
    supportsEngraving: true,
    priceAdd: 28_000_000,
  },
  {
    id: "emerald",
    category: "collection",
    name: fa.stones.emerald,
    description: fa.customize.wizard.stones.emeraldDesc,
    color: "#50C878",
    image: pickSiteImageByKey("stone-emerald", 1),
    supportsEngraving: true,
    priceAdd: 38_000_000,
  },
  {
    id: "sapphire",
    category: "collection",
    name: fa.stones.sapphire,
    description: fa.customize.wizard.stones.sapphireDesc,
    color: "#0F52BA",
    image: pickSiteImageByKey("stone-sapphire"),
    supportsEngraving: true,
    priceAdd: 34_000_000,
  },
  {
    id: "diamond",
    category: "collection",
    name: fa.stones.diamond,
    description: fa.customize.wizard.stones.diamondDesc,
    color: "#E8F4F8",
    image: pickSiteImageByKey("stone-diamond", 1),
    supportsEngraving: false,
    priceAdd: 42_000_000,
  },
  {
    id: "ruby",
    category: "collection",
    name: fa.stones.ruby,
    description: fa.customize.wizard.stones.rubyDesc,
    color: "#E0115F",
    image: pickSiteImageByKey("stone-ruby"),
    supportsEngraving: true,
    priceAdd: 36_000_000,
  },
  {
    id: "onyx",
    category: "collection",
    name: fa.stones.onyx,
    description: fa.customize.wizard.stones.onyxDesc,
    color: "#353935",
    image: pickSiteImageByKey("stone-onyx", 1),
    supportsEngraving: true,
    priceAdd: 8_000_000,
  },
];

export const STONE_INSCRIPTIONS: StoneInscription[] = [
  {
    id: "ya-zahra",
    text: fa.customize.wizard.inscriptions.yaZahra.text,
    meaning: fa.customize.wizard.inscriptions.yaZahra.meaning,
    priceAdd: 2_500_000,
  },
  {
    id: "ya-ali",
    text: fa.customize.wizard.inscriptions.yaAli.text,
    meaning: fa.customize.wizard.inscriptions.yaAli.meaning,
    priceAdd: 2_500_000,
  },
  {
    id: "bismillah",
    text: fa.customize.wizard.inscriptions.bismillah.text,
    meaning: fa.customize.wizard.inscriptions.bismillah.meaning,
    priceAdd: 3_000_000,
  },
  {
    id: "la-ilaha",
    text: fa.customize.wizard.inscriptions.laIlaha.text,
    meaning: fa.customize.wizard.inscriptions.laIlaha.meaning,
    priceAdd: 3_500_000,
  },
  {
    id: "custom-name",
    text: fa.customize.wizard.inscriptions.customName.text,
    meaning: fa.customize.wizard.inscriptions.customName.meaning,
    priceAdd: 4_000_000,
  },
  {
    id: "salavat",
    text: fa.customize.wizard.inscriptions.salavat.text,
    meaning: fa.customize.wizard.inscriptions.salavat.meaning,
    priceAdd: 3_200_000,
  },
  {
    id: "tasbih",
    text: fa.customize.wizard.inscriptions.tasbih.text,
    meaning: fa.customize.wizard.inscriptions.tasbih.meaning,
    priceAdd: 2_800_000,
  },
  {
    id: "tawhid",
    text: fa.customize.wizard.inscriptions.tawhid.text,
    meaning: fa.customize.wizard.inscriptions.tawhid.meaning,
    priceAdd: 2_800_000,
  },
  {
    id: "fatiha",
    text: fa.customize.wizard.inscriptions.fatiha.text,
    meaning: fa.customize.wizard.inscriptions.fatiha.meaning,
    priceAdd: 4_500_000,
  },
];

export function getShankMaster(id: ShankMasterId): ShankMaster | undefined {
  return SHANK_MASTERS.find((m) => m.id === id);
}

export function getShankModelsForMaster(masterId: ShankMasterId): ShankModel[] {
  return SHANK_MODELS.filter((m) => m.masterId === masterId);
}

export function getShankModel(id: string): ShankModel | undefined {
  return SHANK_MODELS.find((m) => m.id === id);
}

export function getEngravingMaster(id: EngravingMasterId): EngravingMaster | undefined {
  return ENGRAVING_MASTERS.find((m) => m.id === id);
}

export function getBandEngravingMasters(): EngravingMaster[] {
  return ENGRAVING_MASTERS.filter((m) => m.scope === "band");
}

export function getStoneEngravingMasters(): EngravingMaster[] {
  return ENGRAVING_MASTERS.filter((m) => m.scope === "stone");
}

export function getCatalogStone(id: StoneType): CatalogStone | undefined {
  return CATALOG_STONES.find((s) => s.id === id);
}

export function getStonesByCategory(category: StoneCategory): CatalogStone[] {
  return CATALOG_STONES.filter((s) => s.category === category);
}

export function getStoneInscription(id: string): StoneInscription | undefined {
  return STONE_INSCRIPTIONS.find((i) => i.id === id);
}

/** اعمال انتخاب مدل رکاب روی state */
export function applyShankModelSelection(
  state: CustomizerState,
  modelId: string
): Partial<CustomizerState> {
  const model = getShankModel(modelId);
  const master = model ? getShankMaster(model.masterId) : undefined;
  if (!model || !master) return {};

  return {
    shankModelId: modelId,
    shankMaster: model.masterId,
    bandStyle: model.bandStyle,
    thickness: model.defaultThickness,
    texture: model.defaultTexture,
    metal: master.defaultMetal,
    bandCarvingEnabled: false,
    carving: "none",
    bandEngravingEnabled: false,
    bandEngravingMasterId: null,
    engravingText: "",
    engravingStyle: "nastaliq",
  };
}

export function applyStoneSelection(
  state: CustomizerState,
  stoneId: StoneType
): Partial<CustomizerState> {
  const stone = getCatalogStone(stoneId);
  if (!stone) return {};

  return {
    stone: stoneId,
    stoneColor: stone.color,
    stoneCategory: stone.category,
    stoneEngravingEnabled: false,
    stoneEngravingMasterId: null,
    stoneInscriptionId: null,
    engravingText: "",
  };
}
