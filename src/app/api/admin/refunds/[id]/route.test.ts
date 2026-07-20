import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const mocks = vi.hoisted(() => {
  class MockRefundError extends Error {
    code = "refund_error";
  }
  class MockRefundNotFoundError extends MockRefundError {}
  class MockRefundConflictError extends MockRefundError {}
  class MockRefundTransitionError extends Error {}
  return {
    readSessionUser: vi.fn(),
    ensureAdmin: vi.fn(),
    applyRefundAction: vi.fn(),
    refundFindUnique: vi.fn(),
    isRefundAction: vi.fn(),
    writeAdminAuditLog: vi.fn(),
    dispatch: vi.fn(),
    ensureHandlers: vi.fn(),
    MockRefundError,
    MockRefundNotFoundError,
    MockRefundConflictError,
    MockRefundTransitionError,
  };
});

vi.mock("@/lib/server/auth/session", () => ({ readSessionUser: mocks.readSessionUser }));
vi.mock("@/lib/server/auth/guards", () => ({ ensureAdmin: mocks.ensureAdmin }));
vi.mock("@/lib/server/audit-log", () => ({ writeAdminAuditLog: mocks.writeAdminAuditLog }));
vi.mock("@/lib/server/prisma", () => ({
  prisma: {
    refund: {
      findUnique: mocks.refundFindUnique,
    },
  },
}));
vi.mock("@/lib/server/marketplace/refund/refund-service", () => ({
  applyRefundAction: mocks.applyRefundAction,
  isRefundAction: mocks.isRefundAction,
}));
vi.mock("@/lib/server/marketplace/refund/refund-errors", () => ({
  RefundError: mocks.MockRefundError,
  RefundNotFoundError: mocks.MockRefundNotFoundError,
  RefundConflictError: mocks.MockRefundConflictError,
}));
vi.mock("@/lib/server/marketplace/refund/refund-state-machine", () => ({
  RefundTransitionError: mocks.MockRefundTransitionError,
}));
vi.mock("@/lib/server/marketplace/refund/refund-dto", () => ({ toRefundDto: (r: unknown) => r }));
vi.mock("@/lib/server/marketplace/events/domain-events", () => ({
  dispatchDomainEvents: mocks.dispatch,
  ensureDefaultDomainEventHandlers: mocks.ensureHandlers,
}));

import { POST } from "@/app/api/admin/refunds/[id]/route";

function call(id: string, body: unknown) {
  const request = new Request(`http://localhost/api/admin/refunds/${id}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return POST(request, { params: Promise.resolve({ id }) });
}

describe("POST /api/admin/refunds/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readSessionUser.mockResolvedValue({ id: "admin-1", role: "admin" });
    mocks.ensureAdmin.mockReturnValue(null);
    mocks.isRefundAction.mockImplementation((v: string) =>
      ["review", "approve", "reject", "process", "complete", "fail"].includes(v)
    );
    mocks.dispatch.mockResolvedValue({ processed: 0, failed: 0 });
    mocks.refundFindUnique.mockResolvedValue({ id: "ref-1", status: "requested" });
  });

  it("blocks non-admins", async () => {
    mocks.ensureAdmin.mockReturnValue(NextResponse.json({ code: "forbidden" }, { status: 403 }));
    const response = await call("ref-1", { action: "approve" });
    expect(response.status).toBe(403);
  });

  it("rejects an invalid action", async () => {
    const response = await call("ref-1", { action: "explode" });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe("refund_invalid_action");
    expect(mocks.applyRefundAction).not.toHaveBeenCalled();
  });

  it("rejects reject/fail without reason", async () => {
    const response = await call("ref-1", { action: "reject" });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe("refund_reason_required");
  });

  it("returns 409 on expected status mismatch", async () => {
    mocks.refundFindUnique.mockResolvedValue({ id: "ref-1", status: "approved" });
    const response = await call("ref-1", {
      action: "process",
      expectedStatus: "requested",
    });
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.code).toBe("refund_status_mismatch");
    expect(mocks.applyRefundAction).not.toHaveBeenCalled();
  });

  it("applies a valid action", async () => {
    mocks.applyRefundAction.mockResolvedValue({ id: "ref-1", status: "approved" });
    const response = await call("ref-1", { action: "approve" });
    expect(response.status).toBe(200);
    expect(mocks.applyRefundAction).toHaveBeenCalledWith("ref-1", "approve", expect.any(Object));
    expect(mocks.writeAdminAuditLog).toHaveBeenCalled();
    expect(mocks.dispatch).toHaveBeenCalled();
  });

  it("maps not found to 404", async () => {
    mocks.applyRefundAction.mockRejectedValue(new mocks.MockRefundNotFoundError("missing"));
    const response = await call("ref-1", { action: "approve" });
    expect(response.status).toBe(404);
  });

  it("maps invalid transitions to 409", async () => {
    mocks.applyRefundAction.mockRejectedValue(new mocks.MockRefundTransitionError("bad"));
    const response = await call("ref-1", { action: "complete" });
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.code).toBe("refund_transition_conflict");
  });

  it("maps refund errors to 400", async () => {
    mocks.applyRefundAction.mockRejectedValue(new mocks.MockRefundError("bad"));
    const response = await call("ref-1", { action: "complete" });
    expect(response.status).toBe(400);
  });
});
