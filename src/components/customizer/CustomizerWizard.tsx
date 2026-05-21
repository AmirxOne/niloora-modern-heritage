"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { CarvingStyle, CustomizerState, ShankMasterId, StoneType } from "@/lib/types";
import { fa } from "@/lib/i18n/fa";
import { RING_SIZES, CARVING_OPTIONS } from "@/lib/constants";
import {
  SHANK_MASTERS,
  getShankModelsForMaster,
  getShankModel,
  getBandEngravingMasters,
  getStoneEngravingMasters,
  getStonesByCategory,
  getCatalogStone,
  getStoneInscription,
  STONE_INSCRIPTIONS,
  applyShankModelSelection,
  applyStoneSelection,
} from "@/lib/customizer/catalog";
import {
  canProceedWizardStep,
  getVisibleWizardSteps,
  type WizardStepId,
} from "@/lib/customizer/wizard";
import { ChoiceGallery } from "@/components/customizer/wizard/ChoiceGallery";
import { ToggleChoice } from "@/components/customizer/wizard/ToggleChoice";
import { WizardTimeline } from "@/components/customizer/wizard/WizardTimeline";
import { Button } from "@/components/ui/Button";
import { pickSiteImageByKey } from "@/lib/images";
import { cn, formatPrice } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import { ICON_VARIANT, iconSizes } from "@/lib/icons";

interface CustomizerWizardProps {
  state: CustomizerState;
  onUpdate: <K extends keyof CustomizerState>(key: K, value: CustomizerState[K]) => void;
  onBatchUpdate: (patch: Partial<CustomizerState>) => void;
  onStepChange?: (step: WizardStepId) => void;
  estimateTotal?: number;
  onRequestWorkshopQuote?: () => void;
  isSubmittingQuote?: boolean;
}

const STEP_META: Record<WizardStepId, { title: string; subtitle: string }> = {
  master: fa.customize.wizard.steps.master,
  shank: fa.customize.wizard.steps.shank,
  size: fa.customize.wizard.steps.size,
  "carving-toggle": fa.customize.wizard.steps.carvingToggle,
  carving: fa.customize.wizard.steps.carving,
  "band-engraving-toggle": fa.customize.wizard.steps.bandEngravingToggle,
  "band-engraving-master": fa.customize.wizard.steps.bandEngravingMaster,
  stone: fa.customize.wizard.steps.stone,
  "stone-engraving-toggle": fa.customize.wizard.steps.stoneEngravingToggle,
  "stone-engraving-master": fa.customize.wizard.steps.stoneEngravingMaster,
  "stone-inscription": fa.customize.wizard.steps.stoneInscription,
  review: fa.customize.wizard.steps.review,
};

export function CustomizerWizard({
  state,
  onUpdate,
  onBatchUpdate,
  onStepChange,
  estimateTotal,
  onRequestWorkshopQuote,
  isSubmittingQuote = false,
}: CustomizerWizardProps) {
  const steps = useMemo(() => getVisibleWizardSteps(state), [state]);
  const [stepIndex, setStepIndex] = useState(0);
  const safeStepIndex = Math.min(stepIndex, Math.max(steps.length - 1, 0));
  const currentStep = steps[safeStepIndex] ?? "master";
  const completionPercent = Math.max(0, Math.min(100, Math.round(((safeStepIndex + 1) / steps.length) * 100)));
  const canProceed = canProceedWizardStep(currentStep, state);

  useEffect(() => {
    onStepChange?.(currentStep);
  }, [currentStep, onStepChange]);

  useEffect(() => {
    setStepIndex((i) => Math.min(i, Math.max(steps.length - 1, 0)));
  }, [steps.length]);

  const goNext = useCallback(() => {
    if (!canProceedWizardStep(currentStep, state)) return;
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }, [currentStep, state, steps.length]);

  const goBack = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  const goToStep = useCallback((index: number) => {
    setStepIndex(index);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goNext();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goBack();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goBack, goNext]);

  const shankModels = useMemo(
    () => getShankModelsForMaster(state.shankMaster),
    [state.shankMaster]
  );

  const model = getShankModel(state.shankModelId);
  const carvingOptions = useMemo(() => {
    if (!model) return CARVING_OPTIONS.filter((c) => c.value !== "none");
    const allowed = new Set<string>(
      model.allowedCarvings.filter((c) => c !== "none")
    );
    return CARVING_OPTIONS.filter((c) => allowed.has(c.value));
  }, [model]);

  const handleMaster = (id: ShankMasterId) => {
    const models = getShankModelsForMaster(id);
    const first = models[0];
    if (first) {
      onBatchUpdate({ shankMaster: id, ...applyShankModelSelection(state, first.id) });
    } else {
      onUpdate("shankMaster", id);
    }
    setStepIndex(0);
  };

  const handleShank = (modelId: string) => {
    onBatchUpdate(applyShankModelSelection(state, modelId));
  };

  const handleBandEngravingMaster = (masterId: CustomizerState["bandEngravingMasterId"]) => {
    if (!masterId) return;
    const master = getBandEngravingMasters().find((m) => m.id === masterId);
    onBatchUpdate({
      bandEngravingMasterId: masterId,
      engravingStyle: master?.engravingStyle ?? "nastaliq",
      engravingText: master?.name ?? "",
    });
  };

  const handleStone = (stoneId: StoneType) => {
    onBatchUpdate(applyStoneSelection(state, stoneId));
  };

  const handleStoneMaster = (masterId: CustomizerState["stoneEngravingMasterId"]) => {
    onUpdate("stoneEngravingMasterId", masterId);
  };

  const handleInscription = (id: string) => {
    const ins = getStoneInscription(id);
    onBatchUpdate({
      stoneInscriptionId: id,
      engravingText: ins?.text ?? "",
    });
  };

  const reviewRows = useMemo(() => {
    const master = SHANK_MASTERS.find((m) => m.id === state.shankMaster);
    const shank = getShankModel(state.shankModelId);
    const bandMaster = state.bandEngravingMasterId
      ? getBandEngravingMasters().find((m) => m.id === state.bandEngravingMasterId)
      : null;
    const stone = getCatalogStone(state.stone);
    const stoneMaster = state.stoneEngravingMasterId
      ? getStoneEngravingMasters().find((m) => m.id === state.stoneEngravingMasterId)
      : null;
    const inscription = state.stoneInscriptionId
      ? getStoneInscription(state.stoneInscriptionId)
      : null;
    const carvingLabel = CARVING_OPTIONS.find((c) => c.value === state.carving)?.label;

    return [
      { label: fa.customize.wizard.review.shankMaster, value: master?.name ?? "—" },
      { label: fa.customize.wizard.review.shankModel, value: shank?.name ?? "—" },
      {
        label: fa.customize.wizard.review.size,
        value: state.size.toLocaleString("fa-IR"),
      },
      {
        label: fa.customize.wizard.review.carving,
        value: state.bandCarvingEnabled ? carvingLabel ?? "—" : fa.customize.wizard.review.none,
      },
      {
        label: fa.customize.wizard.review.bandEngraving,
        value: state.bandEngravingEnabled
          ? (bandMaster?.name ?? "—")
          : fa.customize.wizard.review.none,
      },
      { label: fa.customize.wizard.review.stone, value: stone?.name ?? "—" },
      {
        label: fa.customize.wizard.review.stoneEngraving,
        value: state.stoneEngravingEnabled
          ? (stoneMaster?.name ?? "—")
          : fa.customize.wizard.review.none,
      },
      {
        label: fa.customize.wizard.review.inscription,
        value: inscription?.text ?? fa.customize.wizard.review.none,
      },
    ];
  }, [state]);

  return (
    <div className="customizer-wizard">
      <WizardTimeline
        steps={steps}
        stepMeta={STEP_META}
        activeIndex={safeStepIndex}
        canProceedCurrent={canProceed}
        completionPercent={completionPercent}
        onSelectStep={goToStep}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.35 }}
          className="customizer-wizard-panel"
        >
          <header className="customizer-wizard-panel-header">
            <h2 className="customizer-wizard-panel-title">{STEP_META[currentStep].title}</h2>
            <p className="customizer-wizard-panel-subtitle">{STEP_META[currentStep].subtitle}</p>
          </header>

          {currentStep === "master" && (
            <ChoiceGallery
              options={SHANK_MASTERS.map((m) => ({
                id: m.id,
                name: m.name,
                description: m.title,
                image: m.image,
                meta: m.description,
              }))}
              value={state.shankMaster}
              onChange={(id) => handleMaster(id as ShankMasterId)}
              columns={3}
            />
          )}

          {currentStep === "shank" && (
            <ChoiceGallery
              options={shankModels.map((m) => ({
                id: m.id,
                name: m.name,
                description: m.description,
                image: m.image,
              }))}
              value={state.shankModelId}
              onChange={handleShank}
              columns={3}
            />
          )}

          {currentStep === "size" && (
            <div className="customizer-size-grid">
              {RING_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => onUpdate("size", size)}
                  className={cn(
                    "customizer-size-btn",
                    state.size === size && "customizer-size-btn--active"
                  )}
                  aria-pressed={state.size === size}
                >
                  {size.toLocaleString("fa-IR")}
                </button>
              ))}
            </div>
          )}

          {currentStep === "carving-toggle" && (
            <ToggleChoice
              value={state.bandCarvingEnabled}
              onChange={(yes) => {
                onBatchUpdate({
                  bandCarvingEnabled: yes,
                  carving: yes ? (model?.allowedCarvings.find((c) => c !== "none") ?? "minimal") : "none",
                });
              }}
            />
          )}

          {currentStep === "carving" && (
            <ChoiceGallery
              options={carvingOptions.map((c) => ({
                id: c.value,
                name: c.label,
                image: pickCarvingImage(c.value),
              }))}
              value={state.carving === "none" ? null : state.carving}
              onChange={(id) => onUpdate("carving", id as CarvingStyle)}
              columns={3}
            />
          )}

          {currentStep === "band-engraving-toggle" && (
            <ToggleChoice
              value={state.bandEngravingEnabled}
              onChange={(yes) => {
                onBatchUpdate({
                  bandEngravingEnabled: yes,
                  bandEngravingMasterId: yes ? null : null,
                  engravingText: yes ? state.engravingText : "",
                });
              }}
            />
          )}

          {currentStep === "band-engraving-master" && (
            <ChoiceGallery
              options={getBandEngravingMasters().map((m) => ({
                id: m.id,
                name: m.name,
                description: m.specialty,
                image: m.image,
                meta: m.description,
              }))}
              value={state.bandEngravingMasterId}
              onChange={(id) =>
                handleBandEngravingMaster(id as CustomizerState["bandEngravingMasterId"])
              }
              columns={3}
            />
          )}

          {currentStep === "stone" && (
            <StoneStep state={state} onSelectStone={handleStone} onCategory={onUpdate} />
          )}

          {currentStep === "stone-engraving-toggle" && (
            <ToggleChoice
              value={state.stoneEngravingEnabled}
              onChange={(yes) => {
                onBatchUpdate({
                  stoneEngravingEnabled: yes,
                  stoneEngravingMasterId: null,
                  stoneInscriptionId: null,
                  engravingText: yes ? state.engravingText : "",
                });
              }}
            />
          )}

          {currentStep === "stone-engraving-master" && (
            <ChoiceGallery
              options={getStoneEngravingMasters().map((m) => ({
                id: m.id,
                name: m.name,
                description: m.specialty,
                image: m.image,
                meta: m.description,
              }))}
              value={state.stoneEngravingMasterId}
              onChange={(id) =>
                handleStoneMaster(id as CustomizerState["stoneEngravingMasterId"])
              }
              columns={3}
            />
          )}

          {currentStep === "stone-inscription" && (
            <ul className="customizer-inscription-list">
              {STONE_INSCRIPTIONS.map((ins) => (
                <li key={ins.id}>
                  <button
                    type="button"
                    className={cn(
                      "customizer-inscription-card",
                      state.stoneInscriptionId === ins.id && "customizer-inscription-card--active"
                    )}
                    onClick={() => handleInscription(ins.id)}
                    aria-pressed={state.stoneInscriptionId === ins.id}
                  >
                    <span className="customizer-inscription-text">{ins.text}</span>
                    <span className="customizer-inscription-meaning">{ins.meaning}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {currentStep === "review" && (
            <>
              <ul className="customizer-review-list">
                {reviewRows.map((row) => (
                  <li key={row.label} className="customizer-review-row">
                    <span className="customizer-review-label">{row.label}</span>
                    <span className="customizer-review-value">{row.value}</span>
                  </li>
                ))}
              </ul>
              {estimateTotal != null ? (
                <p className="customizer-review-estimate">
                  <span>{fa.customize.wizard.estimatedPrice}</span>
                  <strong>{formatPrice(estimateTotal)}</strong>
                </p>
              ) : null}
              <p className="customizer-review-quote-hint">{fa.customize.wizard.quoteHint}</p>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <footer className="customizer-wizard-footer">
        <div className="customizer-wizard-footer-nav">
          <Button
            type="button"
            variant="outline"
            onClick={goBack}
            disabled={safeStepIndex === 0}
            className="customizer-wizard-footer-back"
          >
            <ChevronRight size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />
            {fa.customize.wizard.back}
          </Button>

          <div className="customizer-wizard-footer-meta">
            <p className="customizer-wizard-footer-step">
              {fa.customize.wizard.stepOf(safeStepIndex + 1, steps.length)}
            </p>
            <p className="customizer-wizard-footer-title">{STEP_META[currentStep].title}</p>
            {!canProceed && currentStep !== "review" ? (
              <p className="customizer-wizard-footer-hint" role="status">
                {fa.customize.wizard.navBlockedHint}
              </p>
            ) : null}
            <p className="customizer-wizard-footer-kbd">{fa.customize.wizard.keyboardHint}</p>
          </div>

          {currentStep !== "review" ? (
            <Button
              type="button"
              onClick={goNext}
              disabled={!canProceed}
              className="customizer-wizard-footer-next"
            >
              {fa.customize.wizard.next}
              <ChevronLeft size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />
            </Button>
          ) : onRequestWorkshopQuote ? (
            <Button
              type="button"
              variant="turquoise"
              onClick={onRequestWorkshopQuote}
              disabled={!canProceed || isSubmittingQuote}
              isLoading={isSubmittingQuote}
              className="customizer-wizard-footer-next"
            >
              {isSubmittingQuote
                ? fa.customize.wizard.quoteSubmitting
                : fa.customize.wizard.requestWorkshopQuote}
            </Button>
          ) : (
            <span className="customizer-wizard-footer-spacer" aria-hidden />
          )}
        </div>
      </footer>
    </div>
  );
}

function StoneStep({
  state,
  onSelectStone,
  onCategory,
}: {
  state: CustomizerState;
  onSelectStone: (id: StoneType) => void;
  onCategory: <K extends keyof CustomizerState>(key: K, value: CustomizerState[K]) => void;
}) {
  const stones = getStonesByCategory(state.stoneCategory);

  return (
    <div className="space-y-5">
      <div className="customizer-stone-tabs" role="tablist">
        {(["religious", "collection"] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            role="tab"
            aria-selected={state.stoneCategory === cat}
            className={cn(
              "customizer-stone-tab",
              state.stoneCategory === cat && "customizer-stone-tab--active"
            )}
            onClick={() => {
              onCategory("stoneCategory", cat);
              const list = getStonesByCategory(cat);
              if (list.length > 0 && !list.some((s) => s.id === state.stone)) {
                onSelectStone(list[0].id);
              }
            }}
          >
            {cat === "religious"
              ? fa.customize.wizard.stoneTabs.religious
              : fa.customize.wizard.stoneTabs.collection}
          </button>
        ))}
      </div>
      <ChoiceGallery
        options={stones.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          image: s.image,
        }))}
        value={state.stone}
        onChange={(id) => onSelectStone(id as StoneType)}
        columns={4}
      />
    </div>
  );
}

function pickCarvingImage(carving: CarvingStyle): string {
  return pickSiteImageByKey(`carving-${carving}`);
}
