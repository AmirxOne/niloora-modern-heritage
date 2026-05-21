import { describe, expect, it } from "vitest";
import { canNavigateToWizardStep, getWizardStepStatus } from "./wizard";

describe("wizard navigation", () => {
  it("allows back navigation to completed steps", () => {
    expect(canNavigateToWizardStep(0, 2, false)).toBe(true);
  });

  it("allows one step ahead when current is complete", () => {
    expect(canNavigateToWizardStep(3, 2, true)).toBe(true);
    expect(canNavigateToWizardStep(4, 2, true)).toBe(false);
  });

  it("marks step states", () => {
    expect(getWizardStepStatus(0, 2, true)).toBe("done");
    expect(getWizardStepStatus(2, 2, false)).toBe("active");
    expect(getWizardStepStatus(3, 2, true)).toBe("ready");
    expect(getWizardStepStatus(4, 2, true)).toBe("locked");
  });
});
