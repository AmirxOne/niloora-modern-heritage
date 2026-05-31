import { prisma } from "@/lib/server/prisma";
import { pickSiteImageByKey, pickTestArtisanImageByKey, pickTestCarvingPatternImage } from "@/lib/images";
import type {
  RingCustomizationAdminCatalogDto,
  RingCustomizationAdminConfigDto,
  RingCustomizationConfigDto,
  RingCustomizationPublicCatalogDto,
  RingCustomizationPublicConfigDto,
} from "@/lib/types/ring-customization";

function toConfigDto(row: {
  id: string;
  productId: string;
  enabled: boolean;
  sizeBase: number | null;
  sizeMin: number | null;
  sizeMax: number | null;
  sizePricingMode: string;
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
}): RingCustomizationConfigDto {
  return {
    id: row.id,
    productId: row.productId,
    enabled: row.enabled,
    sizeBase: row.sizeBase,
    sizeMin: row.sizeMin,
    sizeMax: row.sizeMax,
    sizePricingMode:
      row.sizePricingMode === "fixed" || row.sizePricingMode === "step" ? row.sizePricingMode : "free",
    sizeFixedDelta: row.sizeFixedDelta,
    sizeStepAmount: row.sizeStepAmount,
    shankEnabled: row.shankEnabled,
    shankDefaultIncluded: row.shankDefaultIncluded,
    shankDefaultRemovalCredit: row.shankDefaultRemovalCredit,
    stoneEnabled: row.stoneEnabled,
    stoneDefaultIncluded: row.stoneDefaultIncluded,
    stoneDefaultRemovalCredit: row.stoneDefaultRemovalCredit,
    baseLeadTimeDays: row.baseLeadTimeDays,
    sizeLeadTimeDays: row.sizeLeadTimeDays,
    shankLeadTimeDays: row.shankLeadTimeDays,
    stoneLeadTimeDays: row.stoneLeadTimeDays,
  };
}

export async function listRingCustomizationCatalog(): Promise<RingCustomizationAdminCatalogDto> {
  const [artisans, shankPatterns, stoneTexts, scriptStyles] = await Promise.all([
    prisma.ringCustomizationArtisan.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.ringCustomizationShankPattern.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.ringCustomizationStoneText.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.ringCustomizationScriptStyle.findMany({ orderBy: { updatedAt: "desc" } }),
  ]);
  return {
    artisans: artisans.map((item) => ({
      id: item.id,
      name: item.name,
      active: item.active,
      scope: item.scope as "shank" | "stone" | "both",
      priceMode: item.priceMode === "multiplier" ? "multiplier" : "fixed",
      priceAdd: item.priceAdd,
      priceMultiplier: item.priceMultiplier,
    })),
    shankPatterns: shankPatterns.map((item) => ({
      id: item.id,
      name: item.title,
      active: item.active,
      priceAdd: item.priceAdd,
      complexityLevel: item.complexityLevel,
      imageUrl: item.imageUrl,
    })),
    stoneTexts: stoneTexts.map((item) => ({
      id: item.id,
      name: item.text,
      active: item.active,
      priceAdd: item.priceAdd,
      meaning: item.meaning,
      previewImageUrl: item.previewImageUrl,
    })),
    scriptStyles: scriptStyles.map((item) => ({
      id: item.id,
      name: item.title,
      active: item.active,
      priceAdd: item.priceAdd,
      previewImageUrl: item.previewImageUrl,
    })),
  };
}

function toPublicCatalog(config: RingCustomizationAdminConfigDto): RingCustomizationPublicCatalogDto {
  const onlyAllowed = <T extends { id: string }>(items: T[], ids: string[]) =>
    ids.length > 0 ? items.filter((item) => ids.includes(item.id)) : items;

  return {
    shankArtisans: onlyAllowed(config.catalog.shankArtisans, config.whitelist.shankArtisanIds).filter(
      (item) => item.active
    ),
    shankPatterns: onlyAllowed(config.catalog.shankPatterns, config.whitelist.shankPatternIds).filter(
      (item) => item.active
    ),
    stoneArtisans: onlyAllowed(config.catalog.stoneArtisans, config.whitelist.stoneArtisanIds).filter(
      (item) => item.active
    ),
    stoneTexts: onlyAllowed(config.catalog.stoneTexts, config.whitelist.stoneTextIds).filter(
      (item) => item.active
    ),
    scriptStyles: onlyAllowed(config.catalog.scriptStyles, config.whitelist.scriptStyleIds).filter(
      (item) => item.active
    ),
  };
}

export async function getOrCreateRingCustomizationConfig(
  productId: string
): Promise<RingCustomizationAdminConfigDto> {
  const config = await prisma.productRingCustomizationConfig.upsert({
    where: { productId },
    create: { productId },
    update: {},
    include: {
      allowedShankArtisans: true,
      allowedShankPatterns: true,
      allowedStoneArtisans: true,
      allowedStoneTexts: true,
      allowedScriptStyles: true,
    },
  });
  const catalog = await listRingCustomizationCatalog();
  const whitelist = {
    shankArtisanIds: config.allowedShankArtisans.map((item) => item.artisanId),
    shankPatternIds: config.allowedShankPatterns.map((item) => item.patternId),
    stoneArtisanIds: config.allowedStoneArtisans.map((item) => item.artisanId),
    stoneTextIds: config.allowedStoneTexts.map((item) => item.textId),
    scriptStyleIds: config.allowedScriptStyles.map((item) => item.styleId),
  };
  const adminConfig: RingCustomizationAdminConfigDto = {
    config: toConfigDto(config),
    catalog: {
      shankArtisans: catalog.artisans
        .filter((item) => item.scope === "shank" || item.scope === "both")
        .map((item) => ({
          id: item.id,
          name: item.name,
          active: item.active,
          priceAdd: item.priceAdd,
          imageUrl: pickTestArtisanImageByKey(`ring-custom-shank-artisan-${item.id}`),
        })),
      shankPatterns: catalog.shankPatterns.map((item, index) => ({
        id: item.id,
        name: item.name,
        active: item.active,
        priceAdd: item.priceAdd,
        imageUrl: pickTestCarvingPatternImage(index),
      })),
      stoneArtisans: catalog.artisans
        .filter((item) => item.scope === "stone" || item.scope === "both")
        .map((item) => ({
          id: item.id,
          name: item.name,
          active: item.active,
          priceAdd: item.priceAdd,
          imageUrl: pickTestArtisanImageByKey(`ring-custom-stone-artisan-${item.id}`),
        })),
      stoneTexts: catalog.stoneTexts.map((item) => ({
        id: item.id,
        name: item.name,
        active: item.active,
        priceAdd: item.priceAdd,
        meaning: item.meaning,
        imageUrl: item.previewImageUrl ?? pickSiteImageByKey(`ring-custom-stone-text-${item.id}`),
        description: item.meaning ?? null,
      })),
      scriptStyles: catalog.scriptStyles.map((item) => ({
        id: item.id,
        name: item.name,
        active: item.active,
        priceAdd: item.priceAdd,
        imageUrl: item.previewImageUrl ?? pickSiteImageByKey(`ring-custom-script-${item.id}`),
      })),
    },
    adminCatalog: catalog,
    whitelist,
  };
  return adminConfig;
}

export async function getRingCustomizationPublicConfig(
  productId: string
): Promise<RingCustomizationPublicConfigDto | null> {
  const adminConfig = await getOrCreateRingCustomizationConfig(productId);
  if (!adminConfig.config.enabled) {
    return null;
  }
  return {
    config: adminConfig.config,
    catalog: toPublicCatalog(adminConfig),
  };
}

export async function updateRingCustomizationConfig(
  productId: string,
  input: {
    config?: Partial<RingCustomizationConfigDto>;
    whitelist?: {
      shankArtisanIds?: string[];
      shankPatternIds?: string[];
      stoneArtisanIds?: string[];
      stoneTextIds?: string[];
      scriptStyleIds?: string[];
    };
  }
) {
  const current = await prisma.productRingCustomizationConfig.upsert({
    where: { productId },
    create: { productId },
    update: {},
  });
  await prisma.productRingCustomizationConfig.update({
    where: { id: current.id },
    data: {
      enabled: input.config?.enabled,
      sizeBase: input.config?.sizeBase,
      sizeMin: input.config?.sizeMin,
      sizeMax: input.config?.sizeMax,
      sizePricingMode: input.config?.sizePricingMode,
      sizeFixedDelta: input.config?.sizeFixedDelta,
      sizeStepAmount: input.config?.sizeStepAmount,
      shankEnabled: input.config?.shankEnabled,
      shankDefaultIncluded: input.config?.shankDefaultIncluded,
      shankDefaultRemovalCredit: input.config?.shankDefaultRemovalCredit,
      stoneEnabled: input.config?.stoneEnabled,
      stoneDefaultIncluded: input.config?.stoneDefaultIncluded,
      stoneDefaultRemovalCredit: input.config?.stoneDefaultRemovalCredit,
      baseLeadTimeDays: input.config?.baseLeadTimeDays,
      sizeLeadTimeDays: input.config?.sizeLeadTimeDays,
      shankLeadTimeDays: input.config?.shankLeadTimeDays,
      stoneLeadTimeDays: input.config?.stoneLeadTimeDays,
    },
  });
  if (input.whitelist) {
    await prisma.$transaction([
      prisma.productAllowedShankArtisan.deleteMany({ where: { configId: current.id } }),
      prisma.productAllowedShankPattern.deleteMany({ where: { configId: current.id } }),
      prisma.productAllowedStoneArtisan.deleteMany({ where: { configId: current.id } }),
      prisma.productAllowedStoneText.deleteMany({ where: { configId: current.id } }),
      prisma.productAllowedScriptStyle.deleteMany({ where: { configId: current.id } }),
      ...(input.whitelist.shankArtisanIds ?? []).map((artisanId) =>
        prisma.productAllowedShankArtisan.create({ data: { configId: current.id, artisanId } })
      ),
      ...(input.whitelist.shankPatternIds ?? []).map((patternId) =>
        prisma.productAllowedShankPattern.create({ data: { configId: current.id, patternId } })
      ),
      ...(input.whitelist.stoneArtisanIds ?? []).map((artisanId) =>
        prisma.productAllowedStoneArtisan.create({ data: { configId: current.id, artisanId } })
      ),
      ...(input.whitelist.stoneTextIds ?? []).map((textId) =>
        prisma.productAllowedStoneText.create({ data: { configId: current.id, textId } })
      ),
      ...(input.whitelist.scriptStyleIds ?? []).map((styleId) =>
        prisma.productAllowedScriptStyle.create({ data: { configId: current.id, styleId } })
      ),
    ]);
  }
  return getOrCreateRingCustomizationConfig(productId);
}

export async function upsertRingCustomizationCatalog(input: {
  artisans?: Array<{
    id?: string;
    name: string;
    scope: "shank" | "stone" | "both";
    active: boolean;
    priceMode: "fixed" | "multiplier";
    priceAdd: number;
    priceMultiplier?: number;
  }>;
  shankPatterns?: Array<{ id?: string; title: string; active: boolean; complexityLevel: number; priceAdd: number; imageUrl?: string | null }>;
  stoneTexts?: Array<{ id?: string; text: string; active: boolean; meaning?: string | null; priceAdd: number; previewImageUrl?: string | null }>;
  scriptStyles?: Array<{ id?: string; title: string; active: boolean; priceAdd: number; previewImageUrl?: string | null }>;
}) {
  await prisma.$transaction(async (tx) => {
    for (const artisan of input.artisans ?? []) {
      if (artisan.id) {
        await tx.ringCustomizationArtisan.update({
          where: { id: artisan.id },
          data: {
            name: artisan.name,
            scope: artisan.scope,
            active: artisan.active,
            priceMode: artisan.priceMode,
            priceAdd: artisan.priceAdd,
            priceMultiplier: artisan.priceMultiplier ?? 1,
          },
        });
      } else {
        await tx.ringCustomizationArtisan.create({
          data: {
            name: artisan.name,
            scope: artisan.scope,
            active: artisan.active,
            priceMode: artisan.priceMode,
            priceAdd: artisan.priceAdd,
            priceMultiplier: artisan.priceMultiplier ?? 1,
          },
        });
      }
    }
    for (const pattern of input.shankPatterns ?? []) {
      if (pattern.id) {
        await tx.ringCustomizationShankPattern.update({
          where: { id: pattern.id },
          data: {
            title: pattern.title,
            active: pattern.active,
            complexityLevel: pattern.complexityLevel,
            priceAdd: pattern.priceAdd,
            imageUrl: pattern.imageUrl ?? null,
          },
        });
      } else {
        await tx.ringCustomizationShankPattern.create({
          data: {
            title: pattern.title,
            active: pattern.active,
            complexityLevel: pattern.complexityLevel,
            priceAdd: pattern.priceAdd,
            imageUrl: pattern.imageUrl ?? null,
          },
        });
      }
    }
    for (const stoneText of input.stoneTexts ?? []) {
      if (stoneText.id) {
        await tx.ringCustomizationStoneText.update({
          where: { id: stoneText.id },
          data: {
            text: stoneText.text,
            active: stoneText.active,
            meaning: stoneText.meaning ?? null,
            priceAdd: stoneText.priceAdd,
            previewImageUrl: stoneText.previewImageUrl ?? null,
          },
        });
      } else {
        await tx.ringCustomizationStoneText.create({
          data: {
            text: stoneText.text,
            active: stoneText.active,
            meaning: stoneText.meaning ?? null,
            priceAdd: stoneText.priceAdd,
            previewImageUrl: stoneText.previewImageUrl ?? null,
          },
        });
      }
    }
    for (const style of input.scriptStyles ?? []) {
      if (style.id) {
        await tx.ringCustomizationScriptStyle.update({
          where: { id: style.id },
          data: {
            title: style.title,
            active: style.active,
            priceAdd: style.priceAdd,
            previewImageUrl: style.previewImageUrl ?? null,
          },
        });
      } else {
        await tx.ringCustomizationScriptStyle.create({
          data: {
            title: style.title,
            active: style.active,
            priceAdd: style.priceAdd,
            previewImageUrl: style.previewImageUrl ?? null,
          },
        });
      }
    }
  });
  return listRingCustomizationCatalog();
}

