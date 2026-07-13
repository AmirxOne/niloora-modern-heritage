import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";

type PrismaTx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

/** Canonical marketplace domain event types for MML-2. */
export const MARKETPLACE_EVENTS = {
  settlementEligible: "SettlementEligible",
  settlementCreated: "SettlementCreated",
  commissionCalculated: "CommissionCalculated",
  payoutRequested: "PayoutRequested",
  payoutCompleted: "PayoutCompleted",
  refundRequested: "RefundRequested",
  refundApproved: "RefundApproved",
  refundCompleted: "RefundCompleted",
  settlementReversed: "SettlementReversed",
  commissionReversed: "CommissionReversed",
  payoutAdjustmentRequired: "PayoutAdjustmentRequired",
} as const;

export type MarketplaceEventType =
  (typeof MARKETPLACE_EVENTS)[keyof typeof MARKETPLACE_EVENTS];

export type PublishDomainEventInput = {
  type: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  /** Globally unique key to make publishing idempotent (e.g. per state change). */
  idempotencyKey?: string;
};

export type DomainEventRecord = {
  id: string;
  type: string;
  aggregateType: string;
  aggregateId: string;
  payload: unknown;
  idempotencyKey: string | null;
  occurredAt: Date;
};

/**
 * Transactional outbox publish. Must be called with the same `tx` as the state
 * change so the event and the change commit atomically. Idempotent on
 * `idempotencyKey` via ON CONFLICT DO NOTHING (never throws on replay).
 */
export async function publishDomainEvent(
  tx: PrismaTx,
  event: PublishDomainEventInput
): Promise<void> {
  const id = `evt_${randomUUID()}`;
  const payloadJson = JSON.stringify(event.payload ?? {});
  await tx.$executeRaw`
    INSERT INTO "DomainEvent" (
      "id", "type", "aggregateType", "aggregateId", "payload", "idempotencyKey", "occurredAt", "createdAt"
    )
    VALUES (
      ${id}, ${event.type}, ${event.aggregateType}, ${event.aggregateId},
      ${payloadJson}::jsonb, ${event.idempotencyKey ?? null}, now(), now()
    )
    ON CONFLICT ("idempotencyKey") DO NOTHING
  `;
}

export type DomainEventHandler = (event: DomainEventRecord) => Promise<void> | void;

const handlers = new Map<string, DomainEventHandler[]>();

/** Register an idempotent consumer for a domain event type. */
export function registerDomainEventHandler(type: string, handler: DomainEventHandler): void {
  const list = handlers.get(type) ?? [];
  list.push(handler);
  handlers.set(type, list);
}

/** Test/bootstrap helper: clears registered handlers. */
export function resetDomainEventHandlers(): void {
  handlers.clear();
}

export type DispatchResult = {
  processed: number;
  failed: number;
};

/**
 * At-least-once consumer. Reads unprocessed outbox events and runs registered
 * handlers, marking each event processed only after all handlers succeed.
 * Handlers must be idempotent because delivery can repeat on retry.
 */
export async function dispatchDomainEvents(limit = 100): Promise<DispatchResult> {
  const events = await prisma.domainEvent.findMany({
    where: { processedAt: null },
    orderBy: { occurredAt: "asc" },
    take: Math.min(Math.max(1, limit), 500),
    select: {
      id: true,
      type: true,
      aggregateType: true,
      aggregateId: true,
      payload: true,
      idempotencyKey: true,
      occurredAt: true,
    },
  });

  let processed = 0;
  let failed = 0;

  for (const event of events) {
    const list = handlers.get(event.type) ?? [];
    try {
      for (const handler of list) {
        await handler(event as DomainEventRecord);
      }
      await prisma.domainEvent.update({
        where: { id: event.id },
        data: { processedAt: new Date(), attempts: { increment: 1 }, lastError: null },
      });
      processed += 1;
    } catch (error) {
      failed += 1;
      await prisma.domainEvent.update({
        where: { id: event.id },
        data: {
          attempts: { increment: 1 },
          lastError: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  return { processed, failed };
}

let defaultHandlersRegistered = false;

/**
 * Registers the built-in observability consumer once. Kept intentionally
 * side-effect-light (no cross-domain writes) so it satisfies "publish and
 * consume" without introducing unrelated features. Downstream integrations
 * (notifications, analytics) can register additional handlers.
 */
export function ensureDefaultDomainEventHandlers(): void {
  if (defaultHandlersRegistered) return;
  defaultHandlersRegistered = true;
  const observe: DomainEventHandler = (event) => {
    if (process.env.NODE_ENV !== "test") {
      console.info(
        `[domain-event] ${event.type} ${event.aggregateType}:${event.aggregateId}`
      );
    }
  };
  for (const type of Object.values(MARKETPLACE_EVENTS)) {
    registerDomainEventHandler(type, observe);
  }
}
