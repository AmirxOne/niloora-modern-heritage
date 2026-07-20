import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const mocks = vi.hoisted(() => ({
  readSessionUser: vi.fn(),
  ensureAdmin: vi.fn(),
  acquireLock: vi.fn(),
  runSettlementEngine: vi.fn(),
  writeAdminAuditLog: vi.fn(),
  dispatch: vi.fn(),
  ensureHandlers: vi.fn(),
}));

vi.mock("@/lib/server/auth/session", () => ({ readSessionUser: mocks.readSessionUser }));
vi.mock("@/lib/server/auth/guards", () => ({ ensureAdmin: mocks.ensureAdmin }));
vi.mock("@/lib/server/marketplace/settlement/settlement-run-lock", () => ({
  acquireSettlementRunLock: mocks.acquireLock,
}));
vi.mock("@/lib/server/marketplace/settlement/settlement-service", () => ({
  runSettlementEngine: mocks.runSettlementEngine,
}));
vi.mock("@/lib/server/audit-log", () => ({ writeAdminAuditLog: mocks.writeAdminAuditLog }));
vi.mock("@/lib/server/marketplace/events/domain-events", () => ({
  dispatchDomainEvents: mocks.dispatch,
  ensureDefaultDomainEventHandlers: mocks.ensureHandlers,
}));

import { POST } from "@/app/api/admin/settlements/run/route";

describe("POST /api/admin/settlements/run", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acquireLock.mockReturnValue({ release: vi.fn() });
    mocks.readSessionUser.mockResolvedValue({ id: "admin-1", role: "admin" });
    mocks.ensureAdmin.mockReturnValue(null);
    mocks.runSettlementEngine.mockResolvedValue({
      evaluated: 1,
      settled: 1,
      deduped: 0,
      skipped: 0,
      totalNetSettled: 1000,
      results: [{ orderId: "ord-1", vendorId: "ven-1", settled: true, deduped: false }],
    });
    mocks.dispatch.mockResolvedValue({ processed: 1, failed: 0 });
  });

  it("returns 409 when another run is in progress", async () => {
    mocks.acquireLock.mockReturnValue(null);
    const response = await POST(new Request("http://localhost/api/admin/settlements/run", { method: "POST" }));
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.code).toBe("settlement_run_in_progress");
    expect(mocks.runSettlementEngine).not.toHaveBeenCalled();
  });

  it("blocks non-admin users", async () => {
    mocks.ensureAdmin.mockReturnValue(NextResponse.json({ code: "forbidden" }, { status: 403 }));
    const response = await POST(new Request("http://localhost/api/admin/settlements/run", { method: "POST" }));
    expect(response.status).toBe(403);
    expect(mocks.runSettlementEngine).not.toHaveBeenCalled();
  });

  it("runs settlement, audits, and dispatches domain events", async () => {
    const response = await POST(new Request("http://localhost/api/admin/settlements/run", { method: "POST" }));
    expect(response.status).toBe(200);
    expect(mocks.runSettlementEngine).toHaveBeenCalledWith({ actorId: "admin-1" });
    expect(mocks.writeAdminAuditLog).toHaveBeenCalled();
    expect(mocks.dispatch).toHaveBeenCalled();
  });
});
