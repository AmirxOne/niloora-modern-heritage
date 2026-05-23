import type {
  MetalType,
  Product,
  ProductOccasion,
  RingStyle,
  StoneClarityGrade,
  StoneSettingType,
  StoneType,
} from "@/lib/types";
import {
  ENGRAVING_STYLES,
  METAL_OPTIONS,
  SHAPE_OPTIONS,
  STONE_OPTIONS,
} from "@/lib/constants";
import { fa } from "@/lib/i18n/fa";
import { resolvePieceCode } from "@/lib/products/piece-code";

/* -------------------------------------------------------------------------- */
/*  Smart defaults                                                            */
/* -------------------------------------------------------------------------- */

const DEFAULT_METAL_STAMP: Record<MetalType, string> = {
  sterling: "0.925",
  oxidized: "0.925",
  rhodium: "0.925",
  "matte-silver": "0.925",
};

const DEFAULT_SETTING_BY_STONE: Partial<Record<StoneType, StoneSettingType>> = {
  diamond: "prong",
  sapphire: "prong",
  emerald: "prong",
  ruby: "prong",
  turquoise: "bezel",
  onyx: "bezel",
  "yemen-aqeeq": "bezel",
  "durr-najaf": "bezel",
  zabarjad: "prong",
  moral: "bezel",
};

const DEFAULT_CLARITY_BY_STONE: Partial<Record<StoneType, StoneClarityGrade>> = {
  diamond: "VS",
  sapphire: "VS",
  emerald: "natural-inclusions",
  ruby: "VS",
  turquoise: "natural-inclusions",
  onyx: "eye-clean",
  "yemen-aqeeq": "natural-inclusions",
  "durr-najaf": "eye-clean",
  zabarjad: "VS",
  moral: "eye-clean",
};

const DEFAULT_OCCASIONS_BY_STYLE: Record<RingStyle, ProductOccasion[]> = {
  solitaire: ["engagement", "anniversary", "gift"],
  halo: ["engagement", "anniversary", "gift"],
  vintage: ["gift", "anniversary", "everyday"],
  signet: ["graduation", "gift", "everyday"],
  eternity: ["wedding", "anniversary"],
  stackable: ["gift", "birthday", "everyday"],
};

/* -------------------------------------------------------------------------- */
/*  Spec group output types                                                   */
/* -------------------------------------------------------------------------- */

export type SpecEntry = { key: string; value: string };
export type SpecGroup = { id: string; title: string; entries: SpecEntry[] };

/* -------------------------------------------------------------------------- */
/*  Label lookups                                                             */
/* -------------------------------------------------------------------------- */

const styleLabels: Record<RingStyle, string> = {
  solitaire: fa.shop.styles.solitaire,
  halo: fa.shop.styles.halo,
  vintage: fa.shop.styles.vintage,
  signet: fa.shop.styles.signet,
  eternity: fa.shop.styles.eternity,
  stackable: fa.shop.styles.stackable,
};

function metalLabel(metal: MetalType): string {
  return METAL_OPTIONS.find((m) => m.value === metal)?.label ?? "";
}

function stoneLabel(stone: StoneType): string {
  return STONE_OPTIONS.find((s) => s.value === stone)?.label ?? "";
}

function shapeLabel(shape: Product["stoneShape"]): string {
  return SHAPE_OPTIONS.find((s) => s.value === shape)?.label ?? "";
}

function engravingLabel(engraving: Product["engravingType"]): string {
  return engraving === "none"
    ? fa.shop.engravingOptions.none
    : (ENGRAVING_STYLES.find((e) => e.value === engraving)?.label ?? "");
}

/* -------------------------------------------------------------------------- */
/*  Resolver: produce a product with defaults applied                         */
/* -------------------------------------------------------------------------- */

export interface ResolvedProductSpecs {
  sku: string;
  metalStamp: string;
  metalColorLabel: string;
  stoneSettingType: StoneSettingType | null;
  stoneClarity: StoneClarityGrade | null;
  stoneColorLabel: string | null;
  ringSize: number;
  ringSizeRange: [number, number] | null;
  weightGrams: number | null;
  stoneDimensionsMm: string | null;
  stoneWeightCarat: number | null;
  bandWidthMm: number | null;
  occasions: ProductOccasion[];
  warrantyYears: number;
  isNickelFree: boolean;
  isHypoallergenic: boolean;
  freeResize: boolean;
  craftedIn: string;
  craftedBy: string | null;
  firstAvailableAt: string | null;
}

export function resolveProductSpecs(product: Product): ResolvedProductSpecs {
  // شمارهٔ اثر یکپارچهٔ پروژه — همیشه از resolvePieceCode بیاید تا فرمت
  // مشتری‌محور (مثلاً NL-RGM-0042) در همه‌جای سایت یکی باشد.
  const pieceCode = resolvePieceCode(product);

  return {
    sku: pieceCode,
    metalStamp: product.metalStamp ?? DEFAULT_METAL_STAMP[product.metal] ?? "0.925",
    metalColorLabel: product.metalColorLabel ?? metalLabel(product.metal),
    stoneSettingType:
      product.stoneSettingType ?? DEFAULT_SETTING_BY_STONE[product.stone] ?? null,
    stoneClarity:
      product.stoneClarity ?? DEFAULT_CLARITY_BY_STONE[product.stone] ?? null,
    stoneColorLabel: product.stoneColorLabel ?? null,
    ringSize: product.ringSize ?? 7,
    ringSizeRange: product.ringSizeRange ?? [4, 13],
    weightGrams: product.weightGrams ?? null,
    stoneDimensionsMm: product.stoneDimensionsMm ?? null,
    stoneWeightCarat: product.stoneWeightCarat ?? null,
    bandWidthMm: product.bandWidthMm ?? null,
    occasions: product.occasions ?? DEFAULT_OCCASIONS_BY_STYLE[product.category] ?? [],
    warrantyYears: product.warrantyYears ?? 1,
    isNickelFree: product.isNickelFree ?? true,
    isHypoallergenic: product.isHypoallergenic ?? true,
    freeResize: product.freeResize ?? true,
    craftedIn: product.craftedIn ?? "تهران، ایران",
    craftedBy: product.craftedBy ?? null,
    firstAvailableAt: product.firstAvailableAt ?? null,
  };
}

/* -------------------------------------------------------------------------- */
/*  Grouped spec builder                                                      */
/* -------------------------------------------------------------------------- */

const t = fa.productSpecs;
const settingLabels = fa.stoneSettings;
const clarityLabels = fa.stoneClarities;
const occasionLabels = fa.occasions;

export function getProductSpecGroups(product: Product): SpecGroup[] {
  const r = resolveProductSpecs(product);
  const groups: SpecGroup[] = [];

  // ——— مواد و عیار ———
  const materialEntries: SpecEntry[] = [
    { key: t.metalType, value: metalLabel(product.metal) },
    { key: t.metalStamp, value: r.metalStamp },
  ];
  if (r.metalColorLabel && r.metalColorLabel !== metalLabel(product.metal)) {
    materialEntries.push({ key: t.metalColor, value: r.metalColorLabel });
  }
  groups.push({ id: "material", title: t.groupMaterial, entries: materialEntries });

  // ——— نگین ———
  const stoneEntries: SpecEntry[] = [
    { key: t.stoneType, value: stoneLabel(product.stone) },
    { key: t.stoneShape, value: shapeLabel(product.stoneShape) },
  ];
  if (r.stoneColorLabel) {
    stoneEntries.push({ key: t.stoneColor, value: r.stoneColorLabel });
  }
  if (r.stoneSettingType) {
    stoneEntries.push({
      key: t.stoneSetting,
      value: settingLabels[r.stoneSettingType],
    });
  }
  if (r.stoneClarity) {
    stoneEntries.push({
      key: t.stoneClarity,
      value: clarityLabels[r.stoneClarity],
    });
  }
  groups.push({ id: "stone", title: t.groupStone, entries: stoneEntries });

  // ——— ابعاد و وزن ———
  const dimensionEntries: SpecEntry[] = [];
  if (r.weightGrams !== null) {
    dimensionEntries.push({ key: t.weight, value: t.weightUnit(r.weightGrams) });
  }
  if (r.stoneDimensionsMm) {
    dimensionEntries.push({ key: t.stoneDimensions, value: r.stoneDimensionsMm });
  }
  if (r.stoneWeightCarat !== null) {
    dimensionEntries.push({
      key: t.stoneWeight,
      value: t.stoneWeightUnit(r.stoneWeightCarat),
    });
  }
  if (r.bandWidthMm !== null) {
    dimensionEntries.push({
      key: t.bandWidth,
      value: t.millimeterUnit(r.bandWidthMm),
    });
  }
  if (r.ringSize) {
    dimensionEntries.push({
      key: t.ringSize,
      value: r.ringSize.toLocaleString("fa-IR"),
    });
  }
  if (r.ringSizeRange) {
    dimensionEntries.push({
      key: t.ringSizeRange,
      value: t.ringSizeRangeText(r.ringSizeRange[0], r.ringSizeRange[1]),
    });
  }
  if (dimensionEntries.length > 0) {
    groups.push({ id: "dimensions", title: t.groupDimensions, entries: dimensionEntries });
  }

  // ——— ساخت و سبک ———
  const craftEntries: SpecEntry[] = [
    { key: t.style, value: styleLabels[product.category] },
    { key: t.engraving, value: engravingLabel(product.engravingType) },
    { key: t.craftedIn, value: r.craftedIn },
  ];
  if (r.craftedBy) {
    craftEntries.push({ key: t.craftedBy, value: r.craftedBy });
  }
  groups.push({ id: "crafting", title: t.groupCrafting, entries: craftEntries });

  // ——— اطلاعات کلی ———
  const generalEntries: SpecEntry[] = [
    { key: t.sku, value: r.sku },
    { key: t.warranty, value: t.warrantyYearsText(r.warrantyYears) },
  ];
  if (r.occasions.length > 0) {
    generalEntries.push({
      key: t.occasion,
      value: r.occasions.map((o) => occasionLabels[o]).join("، "),
    });
  }
  if (r.firstAvailableAt) {
    try {
      const d = new Date(r.firstAvailableAt);
      const fmt = new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "long",
      });
      generalEntries.push({ key: t.firstAvailable, value: fmt.format(d) });
    } catch {
      /* ignore date format errors */
    }
  }
  groups.push({ id: "general", title: t.groupGeneral, entries: generalEntries });

  return groups;
}

/* -------------------------------------------------------------------------- */
/*  Flat list (used by ProductCompareTable for backwards compatibility)       */
/* -------------------------------------------------------------------------- */

export function getProductSpecEntriesFlat(product: Product): SpecEntry[] {
  return getProductSpecGroups(product).flatMap((g) => g.entries);
}

/* -------------------------------------------------------------------------- */
/*  Highlights (about-this-item bullet points)                                */
/* -------------------------------------------------------------------------- */

export interface ProductHighlight {
  id: string;
  groupTitle: string;
  body: string;
}

export function getProductHighlights(product: Product): ProductHighlight[] {
  const r = resolveProductSpecs(product);
  const highlights: ProductHighlight[] = [];

  if (r.isHypoallergenic || r.isNickelFree) {
    highlights.push({
      id: "material-safe",
      groupTitle: fa.productHighlights.metalSafetyTitle,
      body: fa.productHighlights.materialSafe,
    });
  }

  if (r.freeResize) {
    highlights.push({
      id: "free-resize",
      groupTitle: fa.productHighlights.serviceTitle,
      body: fa.productHighlights.freeResize,
    });
  }

  highlights.push({
    id: "handcrafted",
    groupTitle: fa.productHighlights.craftingTitle,
    body: fa.productHighlights.handcrafted,
  });

  if (r.warrantyYears > 0) {
    highlights.push({
      id: "warranty",
      groupTitle: fa.productHighlights.serviceTitle,
      body: fa.productHighlights.warrantyNote(r.warrantyYears),
    });
  }

  highlights.push({
    id: "gift",
    groupTitle: fa.productHighlights.serviceTitle,
    body: fa.productHighlights.giftReady,
  });

  return highlights;
}

export function getProductOccasionLabels(product: Product): string[] {
  const r = resolveProductSpecs(product);
  return r.occasions.map((o) => occasionLabels[o]);
}
