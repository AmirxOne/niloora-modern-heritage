import type {
  RingCustomizationConfigDto,
  RingCustomizationOptState,
  RingPurchaseCustomization,
} from "@/lib/types/ring-customization";

export type RingCustomizationPriceInput = {
  productId: string;
  size?: { selected: number };
  shank?: {
    state: RingCustomizationOptState;
    artisanId?: string;
    patternId?: string;
    artisanPriceAdd?: number;
    patternPriceAdd?: number;
  };
  stone?: {
    state: RingCustomizationOptState;
    artisanId?: string;
    textId?: string;
    scriptStyleId?: string;
    artisanPriceAdd?: number;
    textPriceAdd?: number;
    scriptStylePriceAdd?: number;
  };
};

function calcSizeDelta(config: RingCustomizationConfigDto, selected?: number) {
  if (!config.sizeBase || !config.sizeMin || !config.sizeMax || selected == null) {
    return { enabled: false, priceDelta: 0, leadTimeDaysDelta: 0 };
  }
  const normalized = Math.max(config.sizeMin, Math.min(config.sizeMax, selected));
  if (config.sizePricingMode === "fixed") {
    return { enabled: true, priceDelta: config.sizeFixedDelta, leadTimeDaysDelta: config.sizeLeadTimeDays, selected: normalized };
  }
  if (config.sizePricingMode === "step") {
    const steps = Math.abs(normalized - config.sizeBase);
    return {
      enabled: true,
      priceDelta: steps * config.sizeStepAmount,
      leadTimeDaysDelta: config.sizeLeadTimeDays,
      selected: normalized,
    };
  }
  return { enabled: true, priceDelta: 0, leadTimeDaysDelta: config.sizeLeadTimeDays, selected: normalized };
}

export function calculateRingPurchaseCustomization(
  config: RingCustomizationConfigDto,
  input: RingCustomizationPriceInput
): RingPurchaseCustomization {
  const sizeResult = calcSizeDelta(config, input.size?.selected);

  let shankDelta = 0;
  let shankLead = 0;
  const shankState = input.shank?.state ?? "unchanged";
  if (config.shankEnabled) {
    if (shankState === "customized") {
      shankDelta = (input.shank?.artisanPriceAdd ?? 0) + (input.shank?.patternPriceAdd ?? 0);
      shankLead = config.shankLeadTimeDays;
    } else if (shankState === "opted_out" && config.shankDefaultIncluded) {
      shankDelta = -Math.abs(config.shankDefaultRemovalCredit);
    }
  }

  let stoneDelta = 0;
  let stoneLead = 0;
  const stoneState = input.stone?.state ?? "unchanged";
  if (config.stoneEnabled) {
    if (stoneState === "customized") {
      stoneDelta =
        (input.stone?.artisanPriceAdd ?? 0) +
        (input.stone?.textPriceAdd ?? 0) +
        (input.stone?.scriptStylePriceAdd ?? 0);
      stoneLead = config.stoneLeadTimeDays;
    } else if (stoneState === "opted_out" && config.stoneDefaultIncluded) {
      stoneDelta = -Math.abs(config.stoneDefaultRemovalCredit);
    }
  }

  const totalCustomizationDelta = sizeResult.priceDelta + shankDelta + stoneDelta;

  return {
    version: 1,
    productId: input.productId,
    size: sizeResult.enabled && sizeResult.selected != null
      ? {
          enabled: true,
          base: config.sizeBase!,
          min: config.sizeMin!,
          max: config.sizeMax!,
          selected: sizeResult.selected,
          priceDelta: sizeResult.priceDelta,
        }
      : undefined,
    shank: config.shankEnabled
      ? {
          state: shankState,
          artisanId: shankState === "customized" ? input.shank?.artisanId : undefined,
          patternId: shankState === "customized" ? input.shank?.patternId : undefined,
          priceDelta: shankDelta,
        }
      : undefined,
    stone: config.stoneEnabled
      ? {
          state: stoneState,
          artisanId: stoneState === "customized" ? input.stone?.artisanId : undefined,
          textId: stoneState === "customized" ? input.stone?.textId : undefined,
          scriptStyleId: stoneState === "customized" ? input.stone?.scriptStyleId : undefined,
          priceDelta: stoneDelta,
        }
      : undefined,
    leadTimeDaysDelta: config.baseLeadTimeDays + sizeResult.leadTimeDaysDelta + shankLead + stoneLead,
    totalCustomizationDelta,
  };
}

