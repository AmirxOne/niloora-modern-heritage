import type { RingStyle, ShopBudgetBand, StoneType } from "@/lib/types";

export type GuideOccasion = "engagement" | "wedding" | "anniversary" | "gift" | "everyday";
export type GuideVibe = "classic" | "modern" | "bold" | "spiritual";
export type GuideEnergy = "calm" | "power" | "focus" | "warmth";

export type GuideAnswers = {
  occasion: GuideOccasion | null;
  vibe: GuideVibe | null;
  energy: GuideEnergy | null;
  budget: ShopBudgetBand | null;
};

export const GUIDE_STYLE_VALUES: RingStyle[] = [
  "solitaire",
  "halo",
  "vintage",
  "signet",
  "eternity",
  "stackable",
];

export const GUIDE_STONE_VALUES: StoneType[] = [
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
];

const OCCASIONS: GuideOccasion[] = ["engagement", "wedding", "anniversary", "gift", "everyday"];
const VIBES: GuideVibe[] = ["classic", "modern", "bold", "spiritual"];
const ENERGIES: GuideEnergy[] = ["calm", "power", "focus", "warmth"];
const BUDGETS: ShopBudgetBand[] = ["entry", "mid", "premium", "luxury"];

function addScore<T extends string>(map: Map<T, number>, key: T, amount: number) {
  map.set(key, (map.get(key) ?? 0) + amount);
}

function topByScore<T extends string>(map: Map<T, number>, fallbackOrder: T[]): T {
  return Array.from(map.entries())
    .sort((a, b) => {
      if (b[1] === a[1]) return fallbackOrder.indexOf(a[0]) - fallbackOrder.indexOf(b[0]);
      return b[1] - a[1];
    })[0]?.[0] ?? fallbackOrder[0];
}

function isIn<T extends string>(value: string | null, list: readonly T[]): value is T {
  return Boolean(value && list.includes(value as T));
}

export function parseGuideAnswers(params: URLSearchParams): GuideAnswers {
  const occasionRaw = params.get("occasion");
  const vibeRaw = params.get("vibe");
  const energyRaw = params.get("energy");
  const budgetRaw = params.get("budget");

  return {
    occasion: isIn(occasionRaw, OCCASIONS) ? occasionRaw : null,
    vibe: isIn(vibeRaw, VIBES) ? vibeRaw : null,
    energy: isIn(energyRaw, ENERGIES) ? energyRaw : null,
    budget: isIn(budgetRaw, BUDGETS) ? budgetRaw : null,
  };
}

export function buildGuideSearchParams(answers: GuideAnswers, current?: URLSearchParams): URLSearchParams {
  const params = new URLSearchParams(current?.toString() ?? "");

  const setOrDelete = (key: string, value: string | null) => {
    if (!value) params.delete(key);
    else params.set(key, value);
  };

  setOrDelete("occasion", answers.occasion);
  setOrDelete("vibe", answers.vibe);
  setOrDelete("energy", answers.energy);
  setOrDelete("budget", answers.budget);

  return params;
}

export function resolveGuideRecommendation(answers: GuideAnswers): {
  style: RingStyle;
  stone: StoneType;
} {
  const styleScores = new Map<RingStyle, number>(GUIDE_STYLE_VALUES.map((style) => [style, 0]));
  const stoneScores = new Map<StoneType, number>(GUIDE_STONE_VALUES.map((stone) => [stone, 0]));

  if (answers.occasion === "engagement") {
    addScore(styleScores, "solitaire", 3);
    addScore(styleScores, "halo", 2);
    addScore(stoneScores, "diamond", 3);
    addScore(stoneScores, "sapphire", 1);
  }
  if (answers.occasion === "wedding") {
    addScore(styleScores, "eternity", 3);
    addScore(styleScores, "vintage", 2);
    addScore(stoneScores, "diamond", 2);
    addScore(stoneScores, "emerald", 1);
  }
  if (answers.occasion === "anniversary") {
    addScore(styleScores, "vintage", 3);
    addScore(styleScores, "halo", 1);
    addScore(stoneScores, "ruby", 2);
    addScore(stoneScores, "emerald", 2);
  }
  if (answers.occasion === "gift") {
    addScore(styleScores, "stackable", 3);
    addScore(styleScores, "vintage", 2);
    addScore(stoneScores, "ruby", 2);
    addScore(stoneScores, "turquoise", 2);
  }
  if (answers.occasion === "everyday") {
    addScore(styleScores, "signet", 3);
    addScore(styleScores, "stackable", 2);
    addScore(stoneScores, "onyx", 2);
    addScore(stoneScores, "yemen-aqeeq", 1);
  }

  if (answers.vibe === "classic") {
    addScore(styleScores, "vintage", 3);
    addScore(styleScores, "signet", 2);
    addScore(stoneScores, "onyx", 2);
    addScore(stoneScores, "yemen-aqeeq", 2);
  }
  if (answers.vibe === "modern") {
    addScore(styleScores, "solitaire", 2);
    addScore(styleScores, "halo", 2);
    addScore(styleScores, "stackable", 2);
    addScore(stoneScores, "sapphire", 2);
    addScore(stoneScores, "diamond", 1);
  }
  if (answers.vibe === "bold") {
    addScore(styleScores, "signet", 3);
    addScore(styleScores, "halo", 2);
    addScore(stoneScores, "ruby", 2);
    addScore(stoneScores, "onyx", 2);
  }
  if (answers.vibe === "spiritual") {
    addScore(styleScores, "vintage", 2);
    addScore(styleScores, "signet", 2);
    addScore(stoneScores, "yemen-aqeeq", 3);
    addScore(stoneScores, "durr-najaf", 2);
    addScore(stoneScores, "turquoise", 2);
  }

  if (answers.energy === "calm") {
    addScore(styleScores, "vintage", 1);
    addScore(stoneScores, "emerald", 2);
    addScore(stoneScores, "turquoise", 2);
    addScore(stoneScores, "durr-najaf", 2);
  }
  if (answers.energy === "power") {
    addScore(styleScores, "solitaire", 2);
    addScore(stoneScores, "diamond", 3);
    addScore(stoneScores, "ruby", 2);
    addScore(stoneScores, "onyx", 2);
  }
  if (answers.energy === "focus") {
    addScore(styleScores, "signet", 1);
    addScore(stoneScores, "sapphire", 3);
    addScore(stoneScores, "onyx", 2);
  }
  if (answers.energy === "warmth") {
    addScore(styleScores, "stackable", 1);
    addScore(stoneScores, "ruby", 2);
    addScore(stoneScores, "zabarjad", 2);
    addScore(stoneScores, "moral", 1);
  }

  if (answers.budget === "entry") {
    addScore(styleScores, "stackable", 2);
    addScore(styleScores, "signet", 1);
    addScore(stoneScores, "onyx", 2);
    addScore(stoneScores, "turquoise", 1);
  }
  if (answers.budget === "mid") {
    addScore(styleScores, "vintage", 2);
    addScore(styleScores, "halo", 1);
    addScore(stoneScores, "zabarjad", 2);
    addScore(stoneScores, "yemen-aqeeq", 1);
    addScore(stoneScores, "sapphire", 1);
  }
  if (answers.budget === "premium") {
    addScore(styleScores, "solitaire", 2);
    addScore(styleScores, "halo", 2);
    addScore(stoneScores, "emerald", 2);
    addScore(stoneScores, "sapphire", 2);
    addScore(stoneScores, "diamond", 1);
  }
  if (answers.budget === "luxury") {
    addScore(styleScores, "solitaire", 3);
    addScore(styleScores, "eternity", 2);
    addScore(styleScores, "halo", 1);
    addScore(stoneScores, "diamond", 3);
    addScore(stoneScores, "ruby", 2);
  }

  return {
    style: topByScore(styleScores, GUIDE_STYLE_VALUES),
    stone: topByScore(stoneScores, GUIDE_STONE_VALUES),
  };
}
