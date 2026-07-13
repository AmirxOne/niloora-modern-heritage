import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/lib/server/prisma", () => ({
  prisma: {
    domainEvent: { findMany: mocks.findMany, update: mocks.update },
  },
}));

import {
  dispatchDomainEvents,
  publishDomainEvent,
  registerDomainEventHandler,
  resetDomainEventHandlers,
} from "@/lib/server/marketplace/events/domain-events";

beforeEach(() => {
  vi.clearAllMocks();
  resetDomainEventHandlers();
  mocks.update.mockResolvedValue({});
});

describe("publishDomainEvent", () => {
  it("appends to the outbox via the provided transaction", async () => {
    const executeRaw = vi.fn().mockResolvedValue(1);
    await publishDomainEvent({ $executeRaw: executeRaw } as never, {
      type: "SettlementCreated",
      aggregateType: "Settlement",
      aggregateId: "stl1",
      idempotencyKey: "SettlementCreated:stl1",
      payload: { foo: "bar" },
    });
    expect(executeRaw).toHaveBeenCalledTimes(1);
  });
});

describe("dispatchDomainEvents", () => {
  it("runs handlers and marks events processed", async () => {
    mocks.findMany.mockResolvedValue([
      { id: "e1", type: "PayoutCompleted", aggregateType: "Payout", aggregateId: "p1", payload: {}, idempotencyKey: null, occurredAt: new Date() },
    ]);
    const handler = vi.fn().mockResolvedValue(undefined);
    registerDomainEventHandler("PayoutCompleted", handler);

    const result = await dispatchDomainEvents();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ processed: 1, failed: 0 });
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "e1" },
        data: expect.objectContaining({ processedAt: expect.any(Date) }),
      })
    );
  });

  it("records failure and does not mark processed when a handler throws", async () => {
    mocks.findMany.mockResolvedValue([
      { id: "e2", type: "PayoutCompleted", aggregateType: "Payout", aggregateId: "p2", payload: {}, idempotencyKey: null, occurredAt: new Date() },
    ]);
    registerDomainEventHandler("PayoutCompleted", () => {
      throw new Error("boom");
    });

    const result = await dispatchDomainEvents();

    expect(result).toEqual({ processed: 0, failed: 1 });
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ lastError: "boom" }) })
    );
  });
});
