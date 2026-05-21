import type { CustomizerState } from "@/lib/types";
import {
  getCatalogStone,
  getShankModel,
  getStoneInscription,
} from "./catalog";

export const WIZARD_STEP_IDS = [
  "master",
  "shank",
  "size",
  "carving-toggle",
  "carving",
  "band-engraving-toggle",
  "band-engraving-master",
  "stone",
  "stone-engraving-toggle",
  "stone-engraving-master",
  "stone-inscription",
  "review",
] as const;

export type WizardStepId = (typeof WIZARD_STEP_IDS)[number];

export function getVisibleWizardSteps(state: CustomizerState): WizardStepId[] {
  const model = getShankModel(state.shankModelId);
  const stone = getCatalogStone(state.stone);

  const steps: WizardStepId[] = ["master", "shank", "size"];

  if (model?.supportsCarving) {
    steps.push("carving-toggle");
    if (state.bandCarvingEnabled) steps.push("carving");
  }

  if (model?.supportsBandEngraving) {
    steps.push("band-engraving-toggle");
    if (state.bandEngravingEnabled) steps.push("band-engraving-master");
  }

  steps.push("stone");

  if (stone?.supportsEngraving) {
    steps.push("stone-engraving-toggle");
    if (state.stoneEngravingEnabled) {
      steps.push("stone-engraving-master");
      steps.push("stone-inscription");
    }
  }

  steps.push("review");
  return steps;
}

export function canProceedWizardStep(step: WizardStepId, state: CustomizerState): boolean {
  switch (step) {
    case "master":
      return Boolean(state.shankMaster);
    case "shank":
      return Boolean(state.shankModelId && getShankModel(state.shankModelId));
    case "size":
      return state.size >= 4 && state.size <= 12;
    case "carving-toggle":
      return true;
    case "carving":
      return state.bandCarvingEnabled ? state.carving !== "none" : true;
    case "band-engraving-toggle":
      return true;
    case "band-engraving-master":
      return state.bandEngravingEnabled ? Boolean(state.bandEngravingMasterId) : true;
    case "stone":
      return Boolean(getCatalogStone(state.stone));
    case "stone-engraving-toggle":
      return true;
    case "stone-engraving-master":
      return state.stoneEngravingEnabled ? Boolean(state.stoneEngravingMasterId) : true;
    case "stone-inscription":
      return state.stoneEngravingEnabled
        ? Boolean(state.stoneInscriptionId && getStoneInscription(state.stoneInscriptionId))
        : true;
    case "review":
      return true;
    default:
      return true;
  }
}

export function getWizardStepIndex(steps: WizardStepId[], step: WizardStepId): number {
  return Math.max(0, steps.indexOf(step));
}

export type WizardStepStatus = "done" | "active" | "ready" | "locked";

/** Whether the user may jump to `targetIndex` from `currentIndex`. */
export function canNavigateToWizardStep(
  targetIndex: number,
  currentIndex: number,
  canProceedCurrent: boolean
): boolean {
  if (targetIndex <= currentIndex) return true;
  if (targetIndex === currentIndex + 1 && canProceedCurrent) return true;
  return false;
}

export function getWizardStepStatus(
  stepIndex: number,
  currentIndex: number,
  canProceedCurrent: boolean
): WizardStepStatus {
  if (stepIndex < currentIndex) return "done";
  if (stepIndex === currentIndex) return "active";
  if (stepIndex === currentIndex + 1 && canProceedCurrent) return "ready";
  return "locked";
}
