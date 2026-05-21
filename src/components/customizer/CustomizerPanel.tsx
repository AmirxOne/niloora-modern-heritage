"use client";

import { motion } from "framer-motion";
import type { CustomizerState } from "@/lib/types";
import {
  BAND_OPTIONS,
  METAL_OPTIONS,
  STONE_OPTIONS,
  SHAPE_OPTIONS,
  ENGRAVING_STYLES,
  CARVING_OPTIONS,
  TEXTURE_OPTIONS,
  RING_SIZES,
} from "@/lib/constants";
import { fa } from "@/lib/i18n/fa";
import { useCustomizerCompatibility } from "@/lib/hooks/useCustomizerCompatibility";
import { OptionSelector } from "@/components/ui/OptionSelector";
import { Slider } from "@/components/ui/Slider";
import { TextBox } from "@/components/inputs";

interface CustomizerPanelProps {
  state: CustomizerState;
  onUpdate: <K extends keyof CustomizerState>(key: K, value: CustomizerState[K]) => void;
  labelMaps: {
    band: (b: CustomizerState["bandStyle"]) => string;
    stone: (s: CustomizerState["stone"]) => string;
    metal: (m: CustomizerState["metal"]) => string;
  };
}

const sectionTitles: Record<string, string> = {
  band: fa.customize.sections.band,
  metal: fa.customize.sections.metal,
  stone: fa.customize.sections.stone,
  engraving: fa.customize.sections.engraving,
  details: fa.customize.sections.details,
};

function mapOptions<T extends string>(
  options: { value: T; label: string; color?: string; sample?: string }[],
  allowed: Set<T>,
  compat: ReturnType<typeof useCustomizerCompatibility>,
  field: keyof CustomizerState
) {
  return options.map((opt) => {
    const ok = allowed.has(opt.value);
    return {
      ...opt,
      disabled: !ok,
      disabledReason: ok ? undefined : compat.getReason(field, opt.value),
    };
  });
}

export function CustomizerPanel({ state, onUpdate, labelMaps }: CustomizerPanelProps) {
  const compat = useCustomizerCompatibility(state, labelMaps);
  const sections = ["band", "metal", "stone", "engraving", "details"] as const;
  const { min: thicknessMin, max: thicknessMax } = compat.thicknessRange;
  const hasEngravingText = state.engravingText.trim().length > 0;

  return (
    <div className="scrollbar-luxury max-h-[calc(100vh-12rem)] space-y-8 overflow-y-auto ps-2">
      <p className="text-xs leading-relaxed text-silver/80">{fa.customize.compatibility.hint}</p>

      {sections.map((sectionId, i) => (
        <motion.section
          key={sectionId}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.5 }}
          className="rounded-heritage border border-subtle bg-matte-elevated p-5"
        >
          <h3 className="mb-5 font-display text-lg text-ivory">{sectionTitles[sectionId]}</h3>

          {sectionId === "band" && (
            <div className="space-y-6">
              <OptionSelector
                label={fa.customize.labels.bandStyle}
                options={mapOptions(BAND_OPTIONS, compat.allowed.bandStyle, compat, "bandStyle")}
                value={state.bandStyle}
                onChange={(v) => onUpdate("bandStyle", v)}
              />
              <Slider
                label={fa.customize.labels.bandThickness}
                value={state.thickness}
                min={thicknessMin}
                max={thicknessMax}
                step={0.1}
                unit="mm"
                formatValue={(v) => `${v.toFixed(1)} میلی‌متر`}
                onChange={(v) => onUpdate("thickness", v)}
              />
              <p className="text-[10px] text-silver/60">
                {fa.customize.compatibility.thicknessRange(thicknessMin, thicknessMax)}
              </p>
              <div className="space-y-3">
                <p className="text-xs text-silver">{fa.customize.labels.ringSize}</p>
                <div className="flex flex-wrap gap-2">
                  {RING_SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => onUpdate("size", size)}
                      className={`h-9 w-9 rounded-heritage border text-xs transition-all ${
                        state.size === size
                          ? "border-gold bg-gold/10 text-gold"
                          : "border-stone-200 text-silver hover:border-stone-300"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {sectionId === "metal" && (
            <div className="space-y-6">
              <OptionSelector
                label={fa.customize.labels.metalType}
                options={METAL_OPTIONS}
                value={state.metal}
                onChange={(v) => onUpdate("metal", v)}
                variant="swatches"
              />
              <OptionSelector
                label={fa.customize.labels.surfaceTexture}
                options={mapOptions(TEXTURE_OPTIONS, compat.allowed.texture, compat, "texture")}
                value={state.texture}
                onChange={(v) => onUpdate("texture", v)}
              />
            </div>
          )}

          {sectionId === "stone" && (
            <div className="space-y-6">
              <OptionSelector
                label={fa.customize.labels.stoneType}
                options={mapOptions(STONE_OPTIONS, compat.allowed.stone, compat, "stone")}
                value={state.stone}
                onChange={(v) => {
                  onUpdate("stone", v);
                  const opt = STONE_OPTIONS.find((s) => s.value === v);
                  if (opt) onUpdate("stoneColor", opt.color);
                }}
                variant="swatches"
              />
              <OptionSelector
                label={fa.customize.labels.stoneShape}
                options={mapOptions(SHAPE_OPTIONS, compat.allowed.stoneShape, compat, "stoneShape")}
                value={state.stoneShape}
                onChange={(v) => onUpdate("stoneShape", v)}
                variant="grid"
              />
            </div>
          )}

          {sectionId === "engraving" && (
            <div className="space-y-6">
              <TextBox
                label={fa.customize.labels.engravingText}
                placeholder="پیام خود را بنویسید…"
                value={state.engravingText}
                onChange={(e) => onUpdate("engravingText", e.target.value)}
                maxLength={40}
              />
              {hasEngravingText ? (
                <OptionSelector
                  label={fa.customize.labels.calligraphyStyle}
                  options={mapOptions(
                    ENGRAVING_STYLES.map((e) => ({
                      value: e.value,
                      label: e.label,
                      sample: e.sample,
                    })),
                    compat.allowed.engravingStyle,
                    compat,
                    "engravingStyle"
                  )}
                  value={state.engravingStyle}
                  onChange={(v) => onUpdate("engravingStyle", v)}
                />
              ) : (
                <p className="text-xs text-silver/70">{fa.customize.compatibility.engravingHint}</p>
              )}
            </div>
          )}

          {sectionId === "details" && (
            <OptionSelector
              label={fa.customize.labels.traditionalCarving}
              options={mapOptions(CARVING_OPTIONS, compat.allowed.carving, compat, "carving")}
              value={state.carving}
              onChange={(v) => onUpdate("carving", v)}
            />
          )}
        </motion.section>
      ))}
    </div>
  );
}
