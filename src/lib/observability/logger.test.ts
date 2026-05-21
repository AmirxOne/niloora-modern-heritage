import { afterEach, describe, expect, it, vi } from "vitest";
import { serverLogger } from "@/lib/observability/logger";

describe("serverLogger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes JSON logs in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    serverLogger.error("test failure", { route: "/api/test" }, new Error("boom"));

    expect(spy).toHaveBeenCalledOnce();
    const payload = JSON.parse(String(spy.mock.calls[0][0]));
    expect(payload.level).toBe("error");
    expect(payload.msg).toBe("test failure");
    expect(payload.context?.route).toBe("/api/test");
    expect(payload.err.message).toBe("boom");
  });
});
