"use client";

import { Fragment } from "react";
import { cn } from "@/lib/utils";

type StepStatus = "complete" | "current" | "upcoming";

export type StepperOrientation = "horizontal" | "vertical";

export interface StepperSubStep {
  id: string;
  label: string;
  status?: StepStatus;
}

export interface StepperStep {
  id: string;
  label: string;
  description?: string;
  optionalLabel?: string;
  subSteps?: StepperSubStep[];
}

interface StepperProps {
  steps: StepperStep[];
  currentStepId: string;
  completedStepIds?: string[];
  orientation?: StepperOrientation;
  className?: string;
  onStepClick?: (stepId: string) => void;
}

function resolveStepStatus(
  step: StepperStep,
  currentStepId: string,
  completedStepIds: Set<string>
): StepStatus {
  if (completedStepIds.has(step.id)) return "complete";
  if (step.id === currentStepId) return "current";
  return "upcoming";
}

function StepCircle({ status, index }: { status: StepStatus; index: number }) {
  if (status === "complete") {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-gold-dark bg-gold-dark text-xs font-semibold text-white transition-all duration-300">
        ✓
      </span>
    );
  }

  if (status === "current") {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-gold bg-gold text-xs font-semibold text-white shadow-[0_2px_8px_rgba(184,134,11,0.25)] transition-all duration-300">
        {index + 1}
      </span>
    );
  }

  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-gold/20 bg-parchment text-xs font-semibold text-silver transition-all duration-300">
      {index + 1}
    </span>
  );
}

function StepTitle({
  step,
  status,
  orientation,
}: {
  step: StepperStep;
  status: StepStatus;
  orientation: StepperOrientation;
}) {
  return (
    <span
      className={cn(
        "text-sm font-semibold",
        status === "upcoming" ? "text-silver" : "text-gold-dark",
        orientation === "horizontal" ? "text-center" : ""
      )}
    >
      {step.label}
      {step.optionalLabel ? <span className="ms-1 text-xs font-normal text-silver">({step.optionalLabel})</span> : null}
    </span>
  );
}

function StepDescription({
  step,
  status,
  orientation,
}: {
  step: StepperStep;
  status: StepStatus;
  orientation: StepperOrientation;
}) {
  if (!step.description) return null;

  return (
    <span
      className={cn(
        "text-xs",
        status === "upcoming" ? "text-silver/70" : "text-silver",
        orientation === "horizontal" ? "text-center" : ""
      )}
    >
      {step.description}
    </span>
  );
}

export function Stepper({
  steps,
  currentStepId,
  completedStepIds = [],
  orientation = "horizontal",
  className,
  onStepClick,
}: StepperProps) {
  const done = new Set(completedStepIds);
  const activeStep = steps.find((step) => step.id === currentStepId);

  if (!steps.length) return null;

  if (orientation === "vertical") {
    return (
      <div className={cn("grid gap-3", className)}>
        <ol className="grid gap-2.5">
          {steps.map((step, index) => {
            const status = resolveStepStatus(step, currentStepId, done);
            const isLast = index === steps.length - 1;
            return (
              <li key={step.id} className="relative ps-10">
                {!isLast ? (
                  <span className="absolute start-[13px] top-8 h-[calc(100%-14px)] w-0.5 overflow-hidden rounded-full bg-gold/20">
                    <span
                      className={cn(
                        "absolute inset-x-0 top-0 bg-gold transition-[height] duration-500 ease-out",
                        status === "complete" ? "h-full" : "h-0"
                      )}
                    />
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => onStepClick?.(step.id)}
                  disabled={!onStepClick}
                  className={cn(
                    "absolute start-0 top-0 rounded-full outline-none transition-transform duration-300 disabled:cursor-default",
                    onStepClick ? "cursor-pointer" : ""
                  )}
                >
                  <StepCircle status={status} index={index} />
                </button>
                <div className="grid gap-1 pb-2">
                  <StepTitle step={step} status={status} orientation={orientation} />
                  <StepDescription step={step} status={status} orientation={orientation} />
                </div>
              </li>
            );
          })}
        </ol>

        {activeStep?.subSteps?.length ? (
          <div className="rounded-heritage border border-gold/10 bg-parchment/30 p-3">
            <p className="text-xs font-semibold text-ivory">زیرمرحله‌ها</p>
            <ol className="mt-2 grid gap-2">
              {activeStep.subSteps.map((sub, index) => {
                const status = sub.status ?? "upcoming";
                return (
                  <li key={sub.id} className="flex items-center gap-2 text-xs">
                    <StepCircle status={status} index={index} />
                    <span className={status === "upcoming" ? "text-silver" : "text-gold-dark"}>{sub.label}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("mb-10 grid gap-3", className)}>
      <ol className="flex items-start gap-1">
        {steps.map((step, index) => {
          const status = resolveStepStatus(step, currentStepId, done);
          const isLast = index === steps.length - 1;
          const connectorActive = done.has(step.id) || step.id === currentStepId;
          return (
            <Fragment key={step.id}>
              <li className="min-w-0 shrink-0">
                <button
                  type="button"
                  onClick={() => onStepClick?.(step.id)}
                  disabled={!onStepClick}
                  className={cn(
                    "grid min-w-16 justify-items-center gap-1 rounded-heritage px-1 py-0.5 outline-none transition-all duration-300 disabled:cursor-default",
                    onStepClick ? "cursor-pointer" : ""
                  )}
                >
                  <StepCircle status={status} index={index} />
                  <StepTitle step={step} status={status} orientation={orientation} />
                  <StepDescription step={step} status={status} orientation={orientation} />
                </button>
              </li>
              {!isLast ? (
                <span className="relative mt-3 h-0.5 min-w-6 flex-1 overflow-hidden rounded-full bg-gold/20">
                  <span
                    className={cn(
                      "absolute inset-y-0 left-0 right-0 origin-right bg-gold transition-transform duration-500 ease-out",
                      connectorActive ? "scale-x-100" : "scale-x-0"
                    )}
                  />
                </span>
              ) : null}
            </Fragment>
          );
        })}
      </ol>

      {activeStep?.subSteps?.length ? (
        <div className="rounded-heritage border border-gold/10 bg-parchment/30 p-3">
          <p className="text-xs font-semibold text-ivory">{activeStep.label}</p>
          <ol className="mt-2 grid gap-2 sm:grid-cols-2">
            {activeStep.subSteps.map((sub, index) => {
              const status = sub.status ?? "upcoming";
              return (
                <li key={sub.id} className="flex items-center gap-2 text-xs">
                  <StepCircle status={status} index={index} />
                  <span className={status === "upcoming" ? "text-silver" : "text-gold-dark"}>{sub.label}</span>
                </li>
              );
            })}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
