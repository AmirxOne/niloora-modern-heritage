"use client";

import { useState } from "react";
import type { MetalType, StoneType } from "@/lib/types";
import { METAL_OPTIONS, STONE_OPTIONS } from "@/lib/constants";
import { fa } from "@/lib/i18n/fa";
import { TextBox } from "@/components/inputs";
import { OptionSelector } from "@/components/ui/OptionSelector";

interface ProductOptionsProps {
  defaultMetal: MetalType;
  defaultStone: StoneType;
  onMetalChange?: (metal: MetalType) => void;
  onStoneChange?: (stone: StoneType) => void;
}

export function ProductOptions({ defaultMetal, defaultStone, onMetalChange, onStoneChange }: ProductOptionsProps) {
  const [metal, setMetal] = useState(defaultMetal);
  const [stone, setStone] = useState(defaultStone);
  const [engraving, setEngraving] = useState("");

  return (
    <div className="space-y-8">
      <OptionSelector label={fa.product.selectMetal} options={METAL_OPTIONS} value={metal} onChange={(v) => { setMetal(v); onMetalChange?.(v); }} variant="swatches" />
      <OptionSelector label={fa.product.selectStone} options={STONE_OPTIONS} value={stone} onChange={(v) => { setStone(v); onStoneChange?.(v); }} variant="swatches" />
      <TextBox
        id="product-engraving"
        label={fa.product.engravingPreview}
        value={engraving}
        onChange={(e) => setEngraving(e.target.value)}
        placeholder={fa.product.engravingPlaceholder}
        maxLength={30}
        inputClassName="bg-matte-elevated"
      />
      {engraving ? <p className="text-center text-lg text-gold/80">{engraving}</p> : null}
    </div>
  );
}
