import { describe, expect, it } from "vitest";
import { defaultCustomizerState } from "@/lib/customizer-pricing";
import { mergeSavedDesigns, normalizeSavedDesigns } from "@/lib/preferences/saved-designs";
import type { SavedDesign } from "@/lib/types";

function design(
  id: string,
  overrides: Partial<SavedDesign> & { updatedAt?: string } = {}
): SavedDesign {
  return {
    id,
    name: `طرح ${id}`,
    state: defaultCustomizerState,
    price: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("mergeSavedDesigns", () => {
  it("keeps local-only designs when merging into empty remote", () => {
    const local = [design("local-1")];
    const { designs, stats } = mergeSavedDesigns(local, []);
    expect(designs).toHaveLength(1);
    expect(designs[0].id).toBe("local-1");
    expect(stats.mergedFromLocal).toBe(1);
  });

  it("resolves same-id conflict by updatedAt", () => {
    const local = [
      design("shared", {
        name: "محلی جدید",
        updatedAt: "2026-05-02T00:00:00.000Z",
        price: 1,
      }),
    ];
    const remote = [
      design("shared", {
        name: "سرور قدیمی",
        updatedAt: "2026-05-01T00:00:00.000Z",
        price: 1,
      }),
    ];
    const { designs, stats } = mergeSavedDesigns(local, remote);
    expect(designs[0].name).toBe("محلی جدید");
    expect(stats.conflictsResolved).toBe(1);
  });

  it("dedupes identical configurations with different ids", () => {
    const local = [design("a")];
    const remote = [
      design("b", { updatedAt: "2026-05-03T00:00:00.000Z" }),
    ];
    const { designs, stats } = mergeSavedDesigns(local, remote);
    expect(designs).toHaveLength(1);
    expect(stats.duplicatesRemoved).toBe(1);
  });

  it("reprices tampered client price on normalize", () => {
    const normalized = normalizeSavedDesigns([
      design("x", { price: 1 }),
    ]);
    expect(normalized[0].price).toBeGreaterThan(1_000_000);
  });
});
