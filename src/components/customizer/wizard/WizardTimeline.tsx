"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { WizardStepId } from "@/lib/customizer/wizard";
import {
  canNavigateToWizardStep,
  getWizardStepStatus,
} from "@/lib/customizer/wizard";
import { fa } from "@/lib/i18n/fa";
import { Check, Lock } from "@/components/icons";
import { ICON_VARIANT, iconSizes } from "@/lib/icons";
import { cn } from "@/lib/utils";

export type WizardStepMeta = { title: string; subtitle: string };

type WizardTimelineProps = {
  steps: WizardStepId[];
  stepMeta: Record<WizardStepId, WizardStepMeta>;
  activeIndex: number;
  canProceedCurrent: boolean;
  completionPercent: number;
  onSelectStep: (index: number) => void;
};

const STATE_LABEL: Record<ReturnType<typeof getWizardStepStatus>, string> = {
  done: fa.customize.wizard.stepState.done,
  active: fa.customize.wizard.stepState.active,
  ready: fa.customize.wizard.stepState.ready,
  locked: fa.customize.wizard.stepState.locked,
};

export function WizardTimeline({
  steps,
  stepMeta,
  activeIndex,
  canProceedCurrent,
  completionPercent,
  onSelectStep,
}: WizardTimelineProps) {
  const railRef = useRef<HTMLOListElement>(null);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const node = stepRefs.current[activeIndex];
    if (!node || !railRef.current) return;
    node.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeIndex, steps.length]);

  const currentMeta = stepMeta[steps[activeIndex] ?? "master"];

  return (
    <nav className="customizer-wizard-progress" aria-label={fa.customize.wizard.timelineAria}>
      <div className="customizer-wizard-progress-head">
        <div className="customizer-wizard-progress-top">
          <p className="customizer-wizard-step-meta">
            {fa.customize.wizard.stepOf(activeIndex + 1, steps.length)}
          </p>
          <p className="customizer-wizard-progress-active">{currentMeta.title}</p>
          <p className="customizer-wizard-progress-subtitle">{currentMeta.subtitle}</p>
        </div>
        <span className="customizer-wizard-progress-chip">
          {fa.customize.wizard.progressComplete(completionPercent)}
        </span>
      </div>

      <div
        className="customizer-wizard-progress-track"
        role="progressbar"
        aria-valuenow={completionPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={fa.customize.wizard.progressAria}
      >
        <motion.div
          className="customizer-wizard-progress-fill"
          animate={{ width: `${completionPercent}%` }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <ol
        ref={railRef}
        className="customizer-wizard-timeline-track"
        style={{ "--wizard-step-count": steps.length } as React.CSSProperties}
      >
        {steps.map((stepId, index) => {
          const status = getWizardStepStatus(index, activeIndex, canProceedCurrent);
          const navigable = canNavigateToWizardStep(index, activeIndex, canProceedCurrent);
          const isLast = index === steps.length - 1;

          return (
            <li
              key={stepId}
              ref={(el) => {
                stepRefs.current[index] = el;
              }}
              className={cn(
                "customizer-wizard-rail-item",
                `customizer-wizard-rail-item--${status}`,
                navigable && "customizer-wizard-rail-item--clickable",
                isLast && "customizer-wizard-rail-item--last"
              )}
            >
              {!isLast ? (
                <span
                  className={cn(
                    "customizer-wizard-rail-connector",
                    status === "done" && "customizer-wizard-rail-connector--done"
                  )}
                  aria-hidden
                />
              ) : null}
              <button
                type="button"
                className="customizer-wizard-rail-btn"
                onClick={() => {
                  if (navigable) onSelectStep(index);
                }}
                disabled={!navigable}
                aria-current={status === "active" ? "step" : undefined}
                aria-disabled={!navigable}
                title={stepMeta[stepId].title}
              >
                <span
                  className={cn(
                    "customizer-wizard-step-indicator",
                    status === "active" && "customizer-wizard-step-indicator--active",
                    status === "done" && "customizer-wizard-step-indicator--done",
                    status === "locked" && "customizer-wizard-step-indicator--locked"
                  )}
                >
                  {status === "done" ? (
                    <Check size={iconSizes.xs} variant={ICON_VARIANT} aria-hidden />
                  ) : status === "locked" ? (
                    <Lock size={iconSizes.xs} variant={ICON_VARIANT} aria-hidden />
                  ) : (
                    (index + 1).toLocaleString("fa-IR")
                  )}
                </span>
                <span className="customizer-wizard-step-label">{stepMeta[stepId].title}</span>
                <span className="customizer-wizard-step-state">{STATE_LABEL[status]}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <p className="customizer-wizard-timeline-hint">{fa.customize.wizard.timelineHint}</p>
    </nav>
  );
}
