export type RingCustomizationSizePricingMode = "free" | "fixed" | "step";
export type RingCustomizationOptState = "unchanged" | "customized" | "opted_out";

export interface RingPurchaseSizeSelection {
  enabled: boolean;
  base: number;
  min: number;
  max: number;
  selected: number;
  priceDelta: number;
}

export interface RingPurchaseShankSelection {
  state: RingCustomizationOptState;
  artisanId?: string;
  patternId?: string;
  priceDelta: number;
}

export interface RingPurchaseStoneSelection {
  state: RingCustomizationOptState;
  artisanId?: string;
  textId?: string;
  scriptStyleId?: string;
  priceDelta: number;
}

export interface RingPurchaseCustomization {
  version: 1;
  productId: string;
  size?: RingPurchaseSizeSelection;
  shank?: RingPurchaseShankSelection;
  stone?: RingPurchaseStoneSelection;
  leadTimeDaysDelta: number;
  totalCustomizationDelta: number;
}

export interface RingCustomizationConfigDto {
  id: string;
  productId: string;
  enabled: boolean;
  sizeBase: number | null;
  sizeMin: number | null;
  sizeMax: number | null;
  sizePricingMode: RingCustomizationSizePricingMode;
  sizeFixedDelta: number;
  sizeStepAmount: number;
  shankEnabled: boolean;
  shankDefaultIncluded: boolean;
  shankDefaultRemovalCredit: number;
  stoneEnabled: boolean;
  stoneDefaultIncluded: boolean;
  stoneDefaultRemovalCredit: number;
  baseLeadTimeDays: number;
  sizeLeadTimeDays: number;
  shankLeadTimeDays: number;
  stoneLeadTimeDays: number;
}

export interface RingCustomizationCatalogItemDto {
  id: string;
  name: string;
  active: boolean;
  priceAdd: number;
  imageUrl?: string | null;
  description?: string | null;
}

export interface RingCustomizationPublicCatalogDto {
  shankArtisans: RingCustomizationCatalogItemDto[];
  shankPatterns: RingCustomizationCatalogItemDto[];
  stoneArtisans: RingCustomizationCatalogItemDto[];
  stoneTexts: Array<RingCustomizationCatalogItemDto & { meaning?: string | null }>;
  scriptStyles: RingCustomizationCatalogItemDto[];
}

export interface RingCustomizationPublicConfigDto {
  config: RingCustomizationConfigDto;
  catalog: RingCustomizationPublicCatalogDto;
}

export interface RingCustomizationAdminCatalogDto {
  artisans: Array<
    RingCustomizationCatalogItemDto & {
      scope: "shank" | "stone" | "both";
      priceMode: "fixed" | "multiplier";
      priceMultiplier: number;
    }
  >;
  shankPatterns: Array<RingCustomizationCatalogItemDto & { complexityLevel: number; imageUrl?: string | null }>;
  stoneTexts: Array<RingCustomizationCatalogItemDto & { meaning?: string | null; previewImageUrl?: string | null }>;
  scriptStyles: Array<RingCustomizationCatalogItemDto & { previewImageUrl?: string | null }>;
}

export interface RingCustomizationAdminConfigDto extends RingCustomizationPublicConfigDto {
  adminCatalog: RingCustomizationAdminCatalogDto;
  whitelist: {
    shankArtisanIds: string[];
    shankPatternIds: string[];
    stoneArtisanIds: string[];
    stoneTextIds: string[];
    scriptStyleIds: string[];
  };
}

