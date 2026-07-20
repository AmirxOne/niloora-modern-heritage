import { describe, expect, it } from "vitest";
import {
  canAccessContentWorkflow,
  canCreateContent,
  canDeleteContent,
  canTransitionPostStatus,
} from "@/lib/auth/content-workflow";

describe("content-workflow role matrix", () => {
  it("enforces workflow access roles", () => {
    expect(canAccessContentWorkflow("admin")).toBe(true);
    expect(canAccessContentWorkflow("editor")).toBe(true);
    expect(canAccessContentWorkflow("reviewer")).toBe(true);
    expect(canAccessContentWorkflow("user")).toBe(false);
  });

  it("enforces create/delete permissions by role", () => {
    expect(canCreateContent("admin")).toBe(true);
    expect(canCreateContent("editor")).toBe(true);
    expect(canCreateContent("reviewer")).toBe(false);
    expect(canDeleteContent("admin")).toBe(true);
    expect(canDeleteContent("editor")).toBe(false);
    expect(canDeleteContent("reviewer")).toBe(false);
  });

  it("enforces transition matrix per role", () => {
    // editor
    expect(canTransitionPostStatus("editor", "draft", "review")).toBe(true);
    expect(canTransitionPostStatus("editor", "review", "draft")).toBe(true);
    expect(canTransitionPostStatus("editor", "review", "published")).toBe(false);

    // reviewer
    expect(canTransitionPostStatus("reviewer", "review", "published")).toBe(true);
    expect(canTransitionPostStatus("reviewer", "published", "review")).toBe(true);
    expect(canTransitionPostStatus("reviewer", "draft", "review")).toBe(false);

    // user denied
    expect(canTransitionPostStatus("user", "draft", "review")).toBe(false);
  });
});
