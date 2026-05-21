import { describe, expect, it } from "vitest";
import { MAX_RECENTLY_VIEWED, pushUniqueProductId } from "./constants";

describe("pushUniqueProductId", () => {
  it("moves existing id to front", () => {
    expect(pushUniqueProductId(["a", "b", "c"], "b", 12)).toEqual(["b", "a", "c"]);
  });

  it("caps list length", () => {
    const ids = Array.from({ length: MAX_RECENTLY_VIEWED }, (_, i) => `p-${i}`);
    const next = pushUniqueProductId(ids, "new", MAX_RECENTLY_VIEWED);
    expect(next).toHaveLength(MAX_RECENTLY_VIEWED);
    expect(next[0]).toBe("new");
  });
});
