import { NextResponse } from "next/server";
import { parseJsonResponse } from "../../helpers/parse-response";
import { adminUser } from "../../fixtures/users";

const mocks = {
  readSessionUser: jest.fn(),
  ensureAdmin: jest.fn(),
  writeAdminAuditLog: jest.fn(),
  dispatchDomainEvents: jest.fn(),
  ensureDefaultDomainEventHandlers: jest.fn(),
  refundFindUnique: jest.fn(),
  payoutFindUnique: jest.fn(),
  applyRefundAction: jest.fn(),
  applyPayoutAction: jest.fn(),
  runSettlementEngine: jest.fn(),
  acquireSettlementRunLock: jest.fn(),
};

class MockRefundError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}
class MockRefundTransitionError extends Error {}
class MockRefundConflictError extends Error {}
class MockRefundNotFoundError extends MockRefundError {}

class MockPayoutError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}
class MockPayoutTransitionError extends Error {}
class MockPayoutConflictError extends Error {}
class MockPayoutNotFoundError extends MockPayoutError {}

jest.mock("@/lib/server/auth/session", () => ({
  readSessionUser: mocks.readSessionUser,
}));
jest.mock("@/lib/server/auth/guards", () => ({
  ensureAdmin: mocks.ensureAdmin,
}));
jest.mock("@/lib/server/audit-log", () => ({
  writeAdminAuditLog: mocks.writeAdminAuditLog,
}));
jest.mock("@/lib/server/marketplace/events/domain-events", () => ({
  dispatchDomainEvents: mocks.dispatchDomainEvents,
  ensureDefaultDomainEventHandlers: mocks.ensureDefaultDomainEventHandlers,
}));
jest.mock("@/lib/server/prisma", () => ({
  prisma: {
    refund: { findUnique: mocks.refundFindUnique },
    payout: { findUnique: mocks.payoutFindUnique },
  },
}));
jest.mock("@/lib/server/marketplace/refund/refund-service", () => ({
  applyRefundAction: mocks.applyRefundAction,
  isRefundAction: (value: string) =>
    ["review", "approve", "reject", "process", "complete", "fail"].includes(value),
}));
jest.mock("@/lib/server/marketplace/refund/refund-errors", () => ({
  RefundError: MockRefundError,
  RefundNotFoundError: MockRefundNotFoundError,
  RefundConflictError: MockRefundConflictError,
}));
jest.mock("@/lib/server/marketplace/refund/refund-state-machine", () => ({
  RefundTransitionError: MockRefundTransitionError,
}));
jest.mock("@/lib/server/marketplace/refund/refund-dto", () => ({ toRefundDto: (r: unknown) => r }));
jest.mock("@/lib/server/marketplace/payout/payout-service", () => ({
  applyPayoutAction: mocks.applyPayoutAction,
  isPayoutAction: (value: string) =>
    ["approve", "reject", "process", "complete", "fail"].includes(value),
  PayoutError: MockPayoutError,
  PayoutNotFoundError: MockPayoutNotFoundError,
  PayoutConflictError: MockPayoutConflictError,
  PayoutTransitionError: MockPayoutTransitionError,
}));
jest.mock("@/lib/server/marketplace/payout/payout-dto", () => ({ toPayoutDto: (p: unknown) => p }));
jest.mock("@/lib/server/marketplace/settlement/settlement-service", () => ({
  runSettlementEngine: mocks.runSettlementEngine,
}));
jest.mock("@/lib/server/marketplace/settlement/settlement-run-lock", () => ({
  acquireSettlementRunLock: mocks.acquireSettlementRunLock,
}));

import { POST as refundAction } from "@/app/api/admin/refunds/[id]/route";
import { POST as payoutAction } from "@/app/api/admin/payouts/[id]/route";
import { POST as runSettlement } from "@/app/api/admin/settlements/run/route";

describe("Integration — admin financial safety controls", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks.readSessionUser.mockResolvedValue(adminUser as never);
    mocks.ensureAdmin.mockReturnValue(null);
    mocks.refundFindUnique.mockResolvedValue({ id: "ref-1", status: "requested" });
    mocks.payoutFindUnique.mockResolvedValue({ id: "pay-1", status: "pending" });
    mocks.dispatchDomainEvents.mockResolvedValue({ processed: 0, failed: 0 });
    mocks.acquireSettlementRunLock.mockReturnValue({ release: jest.fn() });
  });

  it("applies refund action successfully with audit/event flow", async () => {
    mocks.applyRefundAction.mockResolvedValue({ id: "ref-1", status: "approved" });
    const response = await refundAction(
      new Request("http://localhost/api/admin/refunds/ref-1", {
        method: "POST",
        body: JSON.stringify({ action: "approve", expectedStatus: "requested" }),
      }),
      { params: Promise.resolve({ id: "ref-1" }) }
    );
    const { status, json } = await parseJsonResponse<{ refund: { status: string } }>(response);
    expect(status).toBe(200);
    expect(json.refund.status).toBe("approved");
    expect(mocks.writeAdminAuditLog).toHaveBeenCalled();
    expect(mocks.dispatchDomainEvents).toHaveBeenCalled();
  });

  it("rejects stale refund action state with explicit conflict code", async () => {
    mocks.refundFindUnique.mockResolvedValue({ id: "ref-1", status: "under_review" });
    const response = await refundAction(
      new Request("http://localhost/api/admin/refunds/ref-1", {
        method: "POST",
        body: JSON.stringify({ action: "approve", expectedStatus: "requested" }),
      }),
      { params: Promise.resolve({ id: "ref-1" }) }
    );
    const { status, json } = await parseJsonResponse<{ code: string }>(response);
    expect(status).toBe(409);
    expect(json.code).toBe("refund_status_mismatch");
    expect(mocks.applyRefundAction).not.toHaveBeenCalled();
  });

  it("requires reason for payout reject/fail", async () => {
    const response = await payoutAction(
      new Request("http://localhost/api/admin/payouts/pay-1", {
        method: "POST",
        body: JSON.stringify({ action: "reject" }),
      }),
      { params: Promise.resolve({ id: "pay-1" }) }
    );
    const { status, json } = await parseJsonResponse<{ code: string }>(response);
    expect(status).toBe(400);
    expect(json.code).toBe("payout_reason_required");
    expect(mocks.applyPayoutAction).not.toHaveBeenCalled();
  });

  it("maps payout transition conflicts to explicit code", async () => {
    mocks.applyPayoutAction.mockRejectedValue(new MockPayoutTransitionError("invalid transition"));
    const response = await payoutAction(
      new Request("http://localhost/api/admin/payouts/pay-1", {
        method: "POST",
        body: JSON.stringify({ action: "complete" }),
      }),
      { params: Promise.resolve({ id: "pay-1" }) }
    );
    const { status, json } = await parseJsonResponse<{ code: string }>(response);
    expect(status).toBe(409);
    expect(json.code).toBe("payout_transition_conflict");
  });

  it("runs settlement successfully and logs sensitive operation", async () => {
    mocks.runSettlementEngine.mockResolvedValue({
      evaluated: 1,
      settled: 1,
      deduped: 0,
      skipped: 0,
      totalNetSettled: 50000,
      results: [],
    });
    const response = await runSettlement(
      new Request("http://localhost/api/admin/settlements/run", { method: "POST" })
    );
    const { status, json } = await parseJsonResponse<{ settlement: { settled: number } }>(response);
    expect(status).toBe(200);
    expect(json.settlement.settled).toBe(1);
    expect(mocks.writeAdminAuditLog).toHaveBeenCalled();
  });

  it("blocks concurrent settlement runs", async () => {
    mocks.acquireSettlementRunLock.mockReturnValue(null);
    const response = await runSettlement(
      new Request("http://localhost/api/admin/settlements/run", { method: "POST" })
    );
    const { status, json } = await parseJsonResponse<{ code: string }>(response);
    expect(status).toBe(409);
    expect(json.code).toBe("settlement_run_in_progress");
    expect(mocks.runSettlementEngine).not.toHaveBeenCalled();
  });

  it("audits denied settlement run for non-admin user", async () => {
    mocks.ensureAdmin.mockReturnValue(NextResponse.json({ code: "forbidden" }, { status: 403 }));
    const response = await runSettlement(
      new Request("http://localhost/api/admin/settlements/run", { method: "POST" })
    );
    expect(response.status).toBe(403);
    expect(mocks.writeAdminAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "settlement.run.denied",
      })
    );
  });
});
