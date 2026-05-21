"use client";

import dynamic from "next/dynamic";
import type { CustomizerState } from "@/lib/types";
import { fa } from "@/lib/i18n/fa";
import { METAL_OPTIONS } from "@/lib/constants";
import { getCatalogStone, getShankModel } from "@/lib/customizer/catalog";
import type { WizardStepId } from "@/lib/customizer/wizard";
import { Rotate3d } from "@/components/icons";
import { ICON_VARIANT, iconSizes } from "@/lib/icons";

const RingCanvas = dynamic(() => import("./ring3d/RingCanvas"), {
  ssr: false,
  loading: () => <Ring3DLoading />,
});

interface Ring3DPreviewProps {
  state: CustomizerState;
  className?: string;
  mode?: "full" | "shank-only";
}

export function Ring3DPreview({ state, className, mode = "full" }: Ring3DPreviewProps) {
  const shankOnly = mode === "shank-only";
  const metal = METAL_OPTIONS.find((m) => m.value === state.metal);
  const stone = getCatalogStone(state.stone);
  const shank = getShankModel(state.shankModelId);

  return (
    <div className={className ?? "ring-3d-preview"}>
      <div className="ring-3d-viewport">
        <div className="ring-3d-viewport-glow" aria-hidden />
        <RingCanvas state={state} mode={mode} />
        <div className="ring-3d-hint">
          <Rotate3d size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />
          <span>{fa.customize.preview3dHint}</span>
        </div>
      </div>
      <dl className="ring-3d-specs">
        <div>
          <dt>{fa.customize.previewSpecShank}</dt>
          <dd>{shank?.name ?? "—"}</dd>
        </div>
        <div>
          <dt>{fa.customize.previewSpecMetal}</dt>
          <dd>{metal?.label ?? "—"}</dd>
        </div>
        {!shankOnly ? (
          <div>
            <dt>{fa.customize.previewSpecStone}</dt>
            <dd>{stone?.name ?? "—"}</dd>
          </div>
        ) : null}
        <div>
          <dt>{fa.customize.labels.ringSize}</dt>
          <dd>{state.size.toLocaleString("fa-IR")}</dd>
        </div>
      </dl>
    </div>
  );
}

function Ring3DLoading() {
  return (
    <div className="ring-3d-loading" aria-busy>
      <div className="ring-3d-loading-orbit" />
      <p>{fa.common.loading}</p>
    </div>
  );
}

const SHANK_PREVIEW_STEPS: WizardStepId[] = [
  "master",
  "shank",
  "size",
  "carving-toggle",
  "carving",
  "band-engraving-toggle",
  "band-engraving-master",
];

export function getPreviewModeForStep(step: WizardStepId): "full" | "shank-only" {
  return SHANK_PREVIEW_STEPS.includes(step) ? "shank-only" : "full";
}
