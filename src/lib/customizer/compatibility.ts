import type {
  BandStyle,
  CarvingStyle,
  CustomizerState,
  EngravingStyle,
  MetalType,
  StoneShape,
  StoneType,
  TextureStyle,
} from "../types";

export interface CompatibilityChange {
  field: keyof CustomizerState;
  from: string;
  to: string;
  reason: string;
}

/** رکاب → حکاکی سنتی (قلم‌کاری) مجاز */
export const BAND_CARVING: Record<BandStyle, readonly CarvingStyle[]> = {
  classic: ["none", "minimal", "geometric", "floral", "khatai", "eslimi"],
  twisted: ["none", "minimal"],
  pave: ["none", "minimal"],
  filigree: ["none", "minimal", "geometric", "floral", "khatai"],
  hammered: ["none", "minimal", "geometric", "floral", "khatai", "eslimi"],
  channel: ["none", "minimal"],
};

/** رکاب → سبک خوشنویسی مجاز (وقتی متن حکاکی وجود دارد) */
export const BAND_ENGRAVING: Record<BandStyle, readonly EngravingStyle[]> = {
  classic: ["nastaliq", "naskh", "thuluth", "kufic", "modern"],
  twisted: ["naskh", "modern"],
  pave: ["naskh", "modern"],
  filigree: ["nastaliq", "naskh", "thuluth", "modern"],
  hammered: ["nastaliq", "naskh", "kufic", "modern"],
  channel: ["naskh", "modern"],
};

/** رکاب → شکل نگین */
export const BAND_STONE_SHAPE: Record<BandStyle, readonly StoneShape[]> = {
  classic: ["round", "oval", "cushion", "princess", "pear", "marquise"],
  twisted: ["round", "oval", "pear"],
  pave: ["round", "cushion"],
  filigree: ["round", "oval", "cushion", "pear"],
  hammered: ["round", "oval", "cushion", "marquise"],
  channel: ["round", "princess"],
};

/** نگین → شکل‌های مجاز (محدودیت ظرفیت نگین) */
export const STONE_SHAPES: Record<StoneType, readonly StoneShape[]> = {
  diamond: ["round", "oval", "cushion", "princess", "pear", "marquise"],
  emerald: ["oval", "cushion", "round"],
  sapphire: ["round", "oval", "cushion", "princess"],
  ruby: ["round", "oval", "pear", "cushion"],
  turquoise: ["round", "oval", "cushion"],
  onyx: ["round", "cushion", "oval"],
  zabarjad: ["oval", "cushion", "round"],
  "yemen-aqeeq": ["oval", "round", "cushion"],
  "durr-najaf": ["oval", "round"],
  moral: ["round", "oval", "cushion"],
};

/** رکاب → نوع نگین (برخی رکاب‌ها نگین بزرگ نمی‌پذیرند) */
export const BAND_STONE: Record<BandStyle, readonly StoneType[]> = {
  classic: [
    "diamond",
    "emerald",
    "sapphire",
    "ruby",
    "turquoise",
    "onyx",
    "zabarjad",
    "yemen-aqeeq",
    "durr-najaf",
    "moral",
  ],
  twisted: ["diamond", "ruby", "sapphire", "turquoise", "yemen-aqeeq"],
  pave: ["diamond", "sapphire", "ruby"],
  filigree: ["diamond", "emerald", "turquoise", "sapphire", "durr-najaf"],
  hammered: ["diamond", "emerald", "ruby", "onyx", "turquoise", "zabarjad", "moral"],
  channel: ["diamond", "sapphire", "ruby"],
};

/** رکاب → بافت سطح */
export const BAND_TEXTURE: Record<BandStyle, readonly TextureStyle[]> = {
  classic: ["polished", "brushed", "matte", "hammered", "sandblasted"],
  twisted: ["polished", "brushed", "matte"],
  pave: ["polished", "brushed"],
  filigree: ["polished", "matte", "brushed"],
  hammered: ["hammered", "matte", "brushed"],
  channel: ["polished", "brushed", "matte"],
};

/** فلز → رکاب (مثلاً نقره برای رکاب‌های ظریف توصیه می‌شود) */
export const METAL_BAND: Record<MetalType, readonly BandStyle[]> = {
  sterling: ["classic", "twisted", "pave", "filigree", "hammered", "channel"],
  oxidized: ["classic", "twisted", "filigree", "hammered"],
  rhodium: ["classic", "pave", "channel", "filigree", "hammered"],
  "matte-silver": ["classic", "twisted", "hammered", "filigree"],
};

export const REASONS = {
  carvingOnBand: (bandLabel: string) =>
    `این قلم‌کاری روی رکاب «${bandLabel}» قابل اجرا نیست.`,
  engravingOnBand: (bandLabel: string) =>
    `این سبک خوشنویسی روی رکاب «${bandLabel}» مناسب نیست.`,
  shapeOnBand: (bandLabel: string) =>
    `این شکل نگین با رکاب «${bandLabel}» سازگار نیست.`,
  stoneOnBand: (bandLabel: string) =>
    `این نگین برای رکاب «${bandLabel}» پیشنهاد نمی‌شود.`,
  shapeForStone: (stoneLabel: string) =>
    `این شکل برای نگین «${stoneLabel}» در دسترس نیست.`,
  textureOnBand: (bandLabel: string) =>
    `این بافت با رکاب «${bandLabel}» هم‌خوان نیست.`,
  bandForMetal: (metalLabel: string) =>
    `این رکاب با فلز «${metalLabel}» در کارگاه ما ساخته نمی‌شود.`,
  thicknessFiligree:
    "رکاب ملیله‌کاری (فیلنگری) حداکثر ضخامت ۳ میلی‌متر دارد.",
  thicknessChannel:
    "رکاب کانال‌سِت ضخامت مجاز بین ۲ تا ۳.۲ میلی‌متر است.",
} as const;

function intersect<T extends string>(a: readonly T[], b: readonly T[]): T[] {
  const set = new Set(b);
  return a.filter((x) => set.has(x));
}

export function getAllowedCarvings(state: CustomizerState): CarvingStyle[] {
  return [...BAND_CARVING[state.bandStyle]];
}

export function getAllowedEngravingStyles(state: CustomizerState): EngravingStyle[] {
  return [...BAND_ENGRAVING[state.bandStyle]];
}

export function getAllowedStoneShapes(state: CustomizerState): StoneShape[] {
  return intersect(BAND_STONE_SHAPE[state.bandStyle], STONE_SHAPES[state.stone]);
}

export function getAllowedStones(state: CustomizerState): StoneType[] {
  return [...BAND_STONE[state.bandStyle]];
}

export function getAllowedTextures(state: CustomizerState): TextureStyle[] {
  return [...BAND_TEXTURE[state.bandStyle]];
}

export function getAllowedBands(state: CustomizerState): BandStyle[] {
  return [...METAL_BAND[state.metal]];
}

export function getThicknessRange(state: CustomizerState): { min: number; max: number } {
  switch (state.bandStyle) {
    case "filigree":
      return { min: 1.5, max: 3 };
    case "channel":
      return { min: 2, max: 3.2 };
    case "pave":
      return { min: 1.8, max: 3.5 };
    case "twisted":
      return { min: 2, max: 3.5 };
    default:
      return { min: 1.5, max: 4 };
  }
}

function pickFirst<T extends string>(allowed: readonly T[], current: T, fallback: T): T {
  if (allowed.includes(current)) return current;
  return allowed.includes(fallback) ? fallback : allowed[0] ?? fallback;
}

/** پس از هر تغییر، state را با قوانین سازگاری اصلاح می‌کند */
export function sanitizeCustomizerState(
  state: CustomizerState,
  labels: {
    band: (b: BandStyle) => string;
    stone: (s: StoneType) => string;
    carving: (c: CarvingStyle) => string;
    engraving: (e: EngravingStyle) => string;
    texture: (t: TextureStyle) => string;
    metal: (m: MetalType) => string;
  }
): { state: CustomizerState; changes: CompatibilityChange[] } {
  const changes: CompatibilityChange[] = [];
  let next = { ...state };

  const allowedBands = getAllowedBands(next);
  const newBand = pickFirst(allowedBands, next.bandStyle, "classic");
  if (newBand !== next.bandStyle) {
    changes.push({
      field: "bandStyle",
      from: next.bandStyle,
      to: newBand,
      reason: REASONS.bandForMetal(labels.metal(next.metal)),
    });
    next.bandStyle = newBand;
  }

  const thicknessRange = getThicknessRange(next);
  if (next.thickness < thicknessRange.min || next.thickness > thicknessRange.max) {
    const clamped = Math.min(thicknessRange.max, Math.max(thicknessRange.min, next.thickness));
    changes.push({
      field: "thickness",
      from: String(next.thickness),
      to: String(clamped),
      reason:
        next.bandStyle === "filigree"
          ? REASONS.thicknessFiligree
          : next.bandStyle === "channel"
            ? REASONS.thicknessChannel
            : "ضخامت با نوع رکاب هماهنگ شد.",
    });
    next.thickness = clamped;
  }

  const allowedStones = getAllowedStones(next);
  const newStone = pickFirst(allowedStones, next.stone, "diamond");
  if (newStone !== next.stone) {
    changes.push({
      field: "stone",
      from: next.stone,
      to: newStone,
      reason: REASONS.stoneOnBand(labels.band(next.bandStyle)),
    });
    next.stone = newStone;
  }

  const allowedShapes = getAllowedStoneShapes(next);
  const newShape = pickFirst(allowedShapes, next.stoneShape, "round");
  if (newShape !== next.stoneShape) {
    changes.push({
      field: "stoneShape",
      from: next.stoneShape,
      to: newShape,
      reason:
        !BAND_STONE_SHAPE[next.bandStyle].includes(next.stoneShape)
          ? REASONS.shapeOnBand(labels.band(next.bandStyle))
          : REASONS.shapeForStone(labels.stone(next.stone)),
    });
    next.stoneShape = newShape;
  }

  const allowedTextures = getAllowedTextures(next);
  const newTexture = pickFirst(allowedTextures, next.texture, "polished");
  if (newTexture !== next.texture) {
    changes.push({
      field: "texture",
      from: next.texture,
      to: newTexture,
      reason: REASONS.textureOnBand(labels.band(next.bandStyle)),
    });
    next.texture = newTexture;
  }

  const allowedCarvings = getAllowedCarvings(next);
  const newCarving = pickFirst(allowedCarvings, next.carving, "none");
  if (newCarving !== next.carving) {
    changes.push({
      field: "carving",
      from: next.carving,
      to: newCarving,
      reason: REASONS.carvingOnBand(labels.band(next.bandStyle)),
    });
    next.carving = newCarving;
  }

  if (next.engravingText.trim().length > 0) {
    const allowedEng = getAllowedEngravingStyles(next);
    const newEng = pickFirst(allowedEng, next.engravingStyle, "naskh");
    if (newEng !== next.engravingStyle) {
      changes.push({
        field: "engravingStyle",
        from: next.engravingStyle,
        to: newEng,
        reason: REASONS.engravingOnBand(labels.band(next.bandStyle)),
      });
      next.engravingStyle = newEng;
    }
  }

  return { state: next, changes };
}

export function isOptionAllowed(
  state: CustomizerState,
  field: keyof CustomizerState,
  value: string
): boolean {
  switch (field) {
    case "bandStyle":
      return getAllowedBands(state).includes(value as BandStyle);
    case "carving":
      return getAllowedCarvings(state).includes(value as CarvingStyle);
    case "engravingStyle":
      return getAllowedEngravingStyles(state).includes(value as EngravingStyle);
    case "stoneShape":
      return getAllowedStoneShapes(state).includes(value as StoneShape);
    case "stone":
      return getAllowedStones(state).includes(value as StoneType);
    case "texture":
      return getAllowedTextures(state).includes(value as TextureStyle);
    default:
      return true;
  }
}

export function getDisabledReason(
  state: CustomizerState,
  field: keyof CustomizerState,
  value: string,
  labels: {
    band: (b: BandStyle) => string;
    stone: (s: StoneType) => string;
    metal: (m: MetalType) => string;
  }
): string | undefined {
  if (isOptionAllowed(state, field, value)) return undefined;

  const bandLabel = labels.band(state.bandStyle);
  switch (field) {
    case "carving":
      return REASONS.carvingOnBand(bandLabel);
    case "engravingStyle":
      return REASONS.engravingOnBand(bandLabel);
    case "stoneShape":
      return BAND_STONE_SHAPE[state.bandStyle].includes(value as StoneShape)
        ? REASONS.shapeForStone(labels.stone(state.stone))
        : REASONS.shapeOnBand(bandLabel);
    case "stone":
      return REASONS.stoneOnBand(bandLabel);
    case "texture":
      return REASONS.textureOnBand(bandLabel);
    case "bandStyle":
      return REASONS.bandForMetal(labels.metal(state.metal));
    default:
      return "این ترکیب در کارگاه ما قابل ساخت نیست.";
  }
}
