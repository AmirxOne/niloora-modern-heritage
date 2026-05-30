ALTER TABLE "OrderItem"
ADD COLUMN IF NOT EXISTS "ringPurchaseCustomization" JSONB;

CREATE TABLE IF NOT EXISTS "ProductRingCustomizationConfig" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "sizeBase" INTEGER,
  "sizeMin" INTEGER,
  "sizeMax" INTEGER,
  "sizePricingMode" TEXT NOT NULL DEFAULT 'free',
  "sizeFixedDelta" INTEGER NOT NULL DEFAULT 0,
  "sizeStepAmount" INTEGER NOT NULL DEFAULT 0,
  "shankEnabled" BOOLEAN NOT NULL DEFAULT false,
  "shankDefaultIncluded" BOOLEAN NOT NULL DEFAULT false,
  "shankDefaultRemovalCredit" INTEGER NOT NULL DEFAULT 0,
  "stoneEnabled" BOOLEAN NOT NULL DEFAULT false,
  "stoneDefaultIncluded" BOOLEAN NOT NULL DEFAULT false,
  "stoneDefaultRemovalCredit" INTEGER NOT NULL DEFAULT 0,
  "baseLeadTimeDays" INTEGER NOT NULL DEFAULT 0,
  "sizeLeadTimeDays" INTEGER NOT NULL DEFAULT 0,
  "shankLeadTimeDays" INTEGER NOT NULL DEFAULT 0,
  "stoneLeadTimeDays" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductRingCustomizationConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProductRingCustomizationConfig_productId_key"
  ON "ProductRingCustomizationConfig"("productId");

CREATE INDEX IF NOT EXISTS "ProductRingCustomizationConfig_enabled_updatedAt_idx"
  ON "ProductRingCustomizationConfig"("enabled", "updatedAt");

CREATE TABLE IF NOT EXISTS "RingCustomizationArtisan" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "priceMode" TEXT NOT NULL DEFAULT 'fixed',
  "priceAdd" INTEGER NOT NULL DEFAULT 0,
  "priceMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RingCustomizationArtisan_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "RingCustomizationArtisan_scope_active_updatedAt_idx"
  ON "RingCustomizationArtisan"("scope", "active", "updatedAt");

CREATE TABLE IF NOT EXISTS "RingCustomizationShankPattern" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "imageUrl" TEXT,
  "complexityLevel" INTEGER NOT NULL DEFAULT 1,
  "priceAdd" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RingCustomizationShankPattern_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "RingCustomizationShankPattern_active_updatedAt_idx"
  ON "RingCustomizationShankPattern"("active", "updatedAt");

CREATE TABLE IF NOT EXISTS "RingCustomizationStoneText" (
  "id" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "meaning" TEXT,
  "previewImageUrl" TEXT,
  "priceAdd" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "searchKeywords" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RingCustomizationStoneText_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "RingCustomizationStoneText_active_updatedAt_idx"
  ON "RingCustomizationStoneText"("active", "updatedAt");

CREATE TABLE IF NOT EXISTS "RingCustomizationScriptStyle" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "previewImageUrl" TEXT,
  "priceAdd" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RingCustomizationScriptStyle_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "RingCustomizationScriptStyle_active_updatedAt_idx"
  ON "RingCustomizationScriptStyle"("active", "updatedAt");

CREATE TABLE IF NOT EXISTS "ProductAllowedShankArtisan" (
  "configId" TEXT NOT NULL,
  "artisanId" TEXT NOT NULL,
  CONSTRAINT "ProductAllowedShankArtisan_pkey" PRIMARY KEY ("configId","artisanId")
);
CREATE INDEX IF NOT EXISTS "ProductAllowedShankArtisan_artisanId_idx"
  ON "ProductAllowedShankArtisan"("artisanId");

CREATE TABLE IF NOT EXISTS "ProductAllowedShankPattern" (
  "configId" TEXT NOT NULL,
  "patternId" TEXT NOT NULL,
  CONSTRAINT "ProductAllowedShankPattern_pkey" PRIMARY KEY ("configId","patternId")
);
CREATE INDEX IF NOT EXISTS "ProductAllowedShankPattern_patternId_idx"
  ON "ProductAllowedShankPattern"("patternId");

CREATE TABLE IF NOT EXISTS "ProductAllowedStoneArtisan" (
  "configId" TEXT NOT NULL,
  "artisanId" TEXT NOT NULL,
  CONSTRAINT "ProductAllowedStoneArtisan_pkey" PRIMARY KEY ("configId","artisanId")
);
CREATE INDEX IF NOT EXISTS "ProductAllowedStoneArtisan_artisanId_idx"
  ON "ProductAllowedStoneArtisan"("artisanId");

CREATE TABLE IF NOT EXISTS "ProductAllowedStoneText" (
  "configId" TEXT NOT NULL,
  "textId" TEXT NOT NULL,
  CONSTRAINT "ProductAllowedStoneText_pkey" PRIMARY KEY ("configId","textId")
);
CREATE INDEX IF NOT EXISTS "ProductAllowedStoneText_textId_idx"
  ON "ProductAllowedStoneText"("textId");

CREATE TABLE IF NOT EXISTS "ProductAllowedScriptStyle" (
  "configId" TEXT NOT NULL,
  "styleId" TEXT NOT NULL,
  CONSTRAINT "ProductAllowedScriptStyle_pkey" PRIMARY KEY ("configId","styleId")
);
CREATE INDEX IF NOT EXISTS "ProductAllowedScriptStyle_styleId_idx"
  ON "ProductAllowedScriptStyle"("styleId");

CREATE TABLE IF NOT EXISTS "StoneTextAllowedScript" (
  "textId" TEXT NOT NULL,
  "styleId" TEXT NOT NULL,
  CONSTRAINT "StoneTextAllowedScript_pkey" PRIMARY KEY ("textId","styleId")
);
CREATE INDEX IF NOT EXISTS "StoneTextAllowedScript_styleId_idx"
  ON "StoneTextAllowedScript"("styleId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProductRingCustomizationConfig_productId_fkey'
  ) THEN
    ALTER TABLE "ProductRingCustomizationConfig"
      ADD CONSTRAINT "ProductRingCustomizationConfig_productId_fkey"
      FOREIGN KEY ("productId") REFERENCES "Product"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProductAllowedShankArtisan_configId_fkey'
  ) THEN
    ALTER TABLE "ProductAllowedShankArtisan"
      ADD CONSTRAINT "ProductAllowedShankArtisan_configId_fkey"
      FOREIGN KEY ("configId") REFERENCES "ProductRingCustomizationConfig"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProductAllowedShankArtisan_artisanId_fkey'
  ) THEN
    ALTER TABLE "ProductAllowedShankArtisan"
      ADD CONSTRAINT "ProductAllowedShankArtisan_artisanId_fkey"
      FOREIGN KEY ("artisanId") REFERENCES "RingCustomizationArtisan"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProductAllowedShankPattern_configId_fkey'
  ) THEN
    ALTER TABLE "ProductAllowedShankPattern"
      ADD CONSTRAINT "ProductAllowedShankPattern_configId_fkey"
      FOREIGN KEY ("configId") REFERENCES "ProductRingCustomizationConfig"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProductAllowedShankPattern_patternId_fkey'
  ) THEN
    ALTER TABLE "ProductAllowedShankPattern"
      ADD CONSTRAINT "ProductAllowedShankPattern_patternId_fkey"
      FOREIGN KEY ("patternId") REFERENCES "RingCustomizationShankPattern"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProductAllowedStoneArtisan_configId_fkey'
  ) THEN
    ALTER TABLE "ProductAllowedStoneArtisan"
      ADD CONSTRAINT "ProductAllowedStoneArtisan_configId_fkey"
      FOREIGN KEY ("configId") REFERENCES "ProductRingCustomizationConfig"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProductAllowedStoneArtisan_artisanId_fkey'
  ) THEN
    ALTER TABLE "ProductAllowedStoneArtisan"
      ADD CONSTRAINT "ProductAllowedStoneArtisan_artisanId_fkey"
      FOREIGN KEY ("artisanId") REFERENCES "RingCustomizationArtisan"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProductAllowedStoneText_configId_fkey'
  ) THEN
    ALTER TABLE "ProductAllowedStoneText"
      ADD CONSTRAINT "ProductAllowedStoneText_configId_fkey"
      FOREIGN KEY ("configId") REFERENCES "ProductRingCustomizationConfig"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProductAllowedStoneText_textId_fkey'
  ) THEN
    ALTER TABLE "ProductAllowedStoneText"
      ADD CONSTRAINT "ProductAllowedStoneText_textId_fkey"
      FOREIGN KEY ("textId") REFERENCES "RingCustomizationStoneText"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProductAllowedScriptStyle_configId_fkey'
  ) THEN
    ALTER TABLE "ProductAllowedScriptStyle"
      ADD CONSTRAINT "ProductAllowedScriptStyle_configId_fkey"
      FOREIGN KEY ("configId") REFERENCES "ProductRingCustomizationConfig"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProductAllowedScriptStyle_styleId_fkey'
  ) THEN
    ALTER TABLE "ProductAllowedScriptStyle"
      ADD CONSTRAINT "ProductAllowedScriptStyle_styleId_fkey"
      FOREIGN KEY ("styleId") REFERENCES "RingCustomizationScriptStyle"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'StoneTextAllowedScript_textId_fkey'
  ) THEN
    ALTER TABLE "StoneTextAllowedScript"
      ADD CONSTRAINT "StoneTextAllowedScript_textId_fkey"
      FOREIGN KEY ("textId") REFERENCES "RingCustomizationStoneText"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'StoneTextAllowedScript_styleId_fkey'
  ) THEN
    ALTER TABLE "StoneTextAllowedScript"
      ADD CONSTRAINT "StoneTextAllowedScript_styleId_fkey"
      FOREIGN KEY ("styleId") REFERENCES "RingCustomizationScriptStyle"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
