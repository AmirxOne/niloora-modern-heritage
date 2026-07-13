import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const mocks = vi.hoisted(() => {
  class MockRefundError extends Error {
    code = "refund_ineligible";
  }
  return {
    readSessionUser: vi.fn(),
    ensureAdmin: vi.fn(),
    requestRefund: vi.fn(),
    writeAdminAuditLog: vi.fn(),
    dispatch: vi.fn(),
    ensureHandlers: vi.fn(),
    MockRefundError,
  };
});

vi.mock("@/lib/server/auth/session", () => ({ readSessionUser: mocks.readSessionUser }));
vi.mock("@/lib/server/auth/guards", () => ({ ensureAdmin: mocks.ensureAdmin }));
vi.mock("@/lib/server/audit-log", () => ({ writeAdminAuditLog: mocks.writeAdminAuditLog }));
vi.mock("@/lib/server/prisma", () => ({
  prisma: { refund: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) } },
}));
vi.mock("@/lib/server/marketplace/refund/refund-service", () => ({ requestRefund: mocks.requestRefund }));
vi.mock("@/lib/server/marketplace/refund/refund-errors", () => ({ RefundError: mocks.MockRefundError }));
vi.mock("@/lib/server/marketplace/refund/refund-dto", () => ({ toRefundDto: (r: unknown) => r }));
vi.mock("@/lib/server/marketplace/events/domain-events", () => ({
  dispatchDomainEvents: mocks.dispatch,
  ensureDefaultDomainEventHandlers: mocks.ensureHandlers,
}));

import { POST } from "@/app/api/admin/refunds/route";

function req(body: unknown) {
  return new Request("http://localhost/api/admin/refunds", { method: "POST", body: JSON.stringify(body) });
}

describe("POST /api/admin/refunds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readSessionUser.mockResolvedValue({ id: "admin-1", role: "admin" });
    mocks.ensureAdmin.mockReturnValue(null);
    mocks.dispatch.mockResolvedValue({ processed: 0, failed: 0 });
  });

  it("blocks non-admins", async () => {
    mocks.ensureAdmin.mockReturnValue(NextResponse.json({ code: "forbidden" }, { status: 403 }));
    const response = await POST(req({ orderId: "o1", amount: 100, reference: "r1" }));
    expect(response.status).toBe(403);
    expect(mocks.requestRefund).not.toHaveBeenCalled();
  });

  it("requires orderId, positive amount, and reference", async () => {
    expect((await POST(req({ amount: 100, reference: "r1" }))).status).toBe(400);
    expect((await POST(req({ orderId: "o1", amount: 0, reference: "r1" }))).status).toBe(400);
    expect((await POST(req({ orderId: "o1", amount: 100 }))).status).toBe(400);
  });

  it("creates a refund request", async () => {
    mocks.requestRefund.mockResolvedValue({ refund: { id: "ref-1", amount: 100, status: "requested" }, deduped: false });
    const response = await POST(req({ orderId: "o1", amount: 100, reference: "r1" }));
    expect(response.status).toBe(200);
    expect(mocks.requestRefund).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: "o1", amount: 100, reference: "r1" })
    );
    expect(mocks.writeAdminAuditLog).toHaveBeenCalled();
  });

  it("maps ineligibility to 400", async () => {
    mocks.requestRefund.mockRejectedValue(new mocks.MockRefundError("not eligible"));
    const response = await POST(req({ orderId: "o1", amount: 100, reference: "r1" }));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe("refund_ineligible");
  });
});
