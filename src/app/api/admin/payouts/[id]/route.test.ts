import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const mocks = vi.hoisted(() => {
  class MockPayoutNotFound extends Error {}
  class MockPayoutTransition extends Error {}
  class MockPayoutConflict extends Error {}
  class MockPayoutError extends Error {
    code = "payout_error";
  }
  return {
    readSessionUser: vi.fn(),
    ensureAdmin: vi.fn(),
    applyPayoutAction: vi.fn(),
    payoutFindUnique: vi.fn(),
    writeAdminAuditLog: vi.fn(),
    dispatch: vi.fn(),
    ensureHandlers: vi.fn(),
    MockPayoutNotFound,
    MockPayoutTransition,
    MockPayoutConflict,
    MockPayoutError,
  };
});

const MockPayoutNotFound = mocks.MockPayoutNotFound;
const MockPayoutTransition = mocks.MockPayoutTransition;

vi.mock("@/lib/server/auth/session", () => ({ readSessionUser: mocks.readSessionUser }));
vi.mock("@/lib/server/auth/guards", () => ({ ensureAdmin: mocks.ensureAdmin }));
vi.mock("@/lib/server/audit-log", () => ({ writeAdminAuditLog: mocks.writeAdminAuditLog }));
vi.mock("@/lib/server/prisma", () => ({
  prisma: {
    payout: {
      findUnique: mocks.payoutFindUnique,
    },
  },
}));
vi.mock("@/lib/server/marketplace/payout/payout-dto", () => ({ toPayoutDto: (p: unknown) => p }));
vi.mock("@/lib/server/marketplace/events/domain-events", () => ({
  dispatchDomainEvents: mocks.dispatch,
  ensureDefaultDomainEventHandlers: mocks.ensureHandlers,
}));
vi.mock("@/lib/server/marketplace/payout/payout-service", () => ({
  applyPayoutAction: mocks.applyPayoutAction,
  isPayoutAction: (v: string) => ["approve", "reject", "process", "complete", "fail"].includes(v),
  PayoutNotFoundError: mocks.MockPayoutNotFound,
  PayoutTransitionError: mocks.MockPayoutTransition,
  PayoutConflictError: mocks.MockPayoutConflict,
  PayoutError: mocks.MockPayoutError,
}));

import { POST } from "@/app/api/admin/payouts/[id]/route";

function req(body: unknown) {
  return new Request("http://localhost/api/admin/payouts/pay-1", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

const ctx = { params: Promise.resolve({ id: "pay-1" }) };

describe("POST /api/admin/payouts/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readSessionUser.mockResolvedValue({ id: "admin-1", role: "admin" });
    mocks.ensureAdmin.mockReturnValue(null);
    mocks.dispatch.mockResolvedValue({ processed: 0, failed: 0 });
    mocks.payoutFindUnique.mockResolvedValue({ id: "pay-1", status: "pending" });
  });

  it("blocks non-admins", async () => {
    mocks.ensureAdmin.mockReturnValue(NextResponse.json({ code: "forbidden" }, { status: 403 }));
    const response = await POST(req({ action: "approve" }), ctx);
    expect(response.status).toBe(403);
    expect(mocks.applyPayoutAction).not.toHaveBeenCalled();
  });

  it("rejects unknown actions", async () => {
    const response = await POST(req({ action: "explode" }), ctx);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe("payout_invalid_action");
  });

  it("rejects reject/fail without reason", async () => {
    const response = await POST(req({ action: "reject" }), ctx);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe("payout_reason_required");
  });

  it("returns 409 on expected status mismatch", async () => {
    mocks.payoutFindUnique.mockResolvedValue({ id: "pay-1", status: "approved" });
    const response = await POST(req({ action: "process", expectedStatus: "pending" }), ctx);
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.code).toBe("payout_status_mismatch");
    expect(mocks.applyPayoutAction).not.toHaveBeenCalled();
  });

  it("applies a valid action, audits, and dispatches events", async () => {
    mocks.applyPayoutAction.mockResolvedValue({ id: "pay-1", status: "approved" });
    const response = await POST(req({ action: "approve" }), ctx);
    expect(response.status).toBe(200);
    expect(mocks.applyPayoutAction).toHaveBeenCalledWith("pay-1", "approve", expect.any(Object));
    expect(mocks.writeAdminAuditLog).toHaveBeenCalled();
    expect(mocks.dispatch).toHaveBeenCalled();
  });

  it("maps invalid transitions to 409", async () => {
    mocks.applyPayoutAction.mockRejectedValue(new MockPayoutTransition("bad"));
    const response = await POST(req({ action: "complete" }), ctx);
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.code).toBe("payout_transition_conflict");
  });

  it("maps not-found to 404", async () => {
    mocks.applyPayoutAction.mockRejectedValue(new MockPayoutNotFound("missing"));
    const response = await POST(req({ action: "approve" }), ctx);
    expect(response.status).toBe(404);
  });
});
