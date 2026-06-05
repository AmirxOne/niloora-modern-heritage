export type AbEventType = "exposure" | "conversion";

export type AbExperimentDefinition = {
  id: string;
  variants: Array<{ id: string; weight: number }>;
};

export const AB_EXPERIMENTS: Record<string, AbExperimentDefinition> = {
  hero_cta_v1: {
    id: "hero_cta_v1",
    variants: [
      { id: "control", weight: 50 },
      { id: "customize_first", weight: 50 },
    ],
  },
  shop_card_layout_v1: {
    id: "shop_card_layout_v1",
    variants: [
      { id: "control", weight: 50 },
      { id: "compact_grid", weight: 50 },
    ],
  },
};

export function getExperimentDefinition(experimentId: string): AbExperimentDefinition | null {
  return AB_EXPERIMENTS[experimentId] ?? null;
}

/** Experiments surfaced in the admin A/B results dashboard */
export const ADMIN_AB_EXPERIMENT_IDS = ["hero_cta_v1", "shop_card_layout_v1"] as const;

export type AdminAbExperimentId = (typeof ADMIN_AB_EXPERIMENT_IDS)[number];
