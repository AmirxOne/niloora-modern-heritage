import { fa } from "@/lib/i18n/fa";
import type { Order } from "@/lib/types";

export type OrderTimelineStepId =
  | "placed"
  | "payment"
  | "production"
  | "shipping"
  | "delivered";

export type OrderTimelineStepState = "completed" | "current" | "upcoming" | "failed";

export type OrderTimelineStep = {
  id: OrderTimelineStepId;
  title: string;
  description: string;
  state: OrderTimelineStepState;
  date?: string;
};

const STEP_ORDER: OrderTimelineStepId[] = [
  "placed",
  "payment",
  "production",
  "shipping",
  "delivered",
];

function isOrderPaid(order: Order): boolean {
  if (order.paymentMethod === "bnpl") {
    return order.status !== "pending_payment" && order.status !== "payment_failed";
  }
  if (order.payment?.status === "paid") return true;
  return !["pending_payment", "payment_failed"].includes(order.status);
}

function productionPhase(order: Order): "upcoming" | "current" | "completed" {
  if (!isOrderPaid(order)) return "upcoming";
  if (order.status === "processing" || order.status === "crafting") return "current";
  if (["shipped", "delivered"].includes(order.status)) return "completed";
  return "upcoming";
}

function shippingPhase(order: Order): "upcoming" | "current" | "completed" {
  if (order.status === "shipped") return "current";
  if (order.status === "delivered") return "completed";
  return "upcoming";
}

function deliveryPhase(order: Order): "upcoming" | "current" | "completed" {
  if (order.status === "delivered") return "completed";
  if (order.status === "shipped") return "current";
  return "upcoming";
}

function resolveStepState(
  phase: "upcoming" | "current" | "completed",
  options?: { failed?: boolean }
): OrderTimelineStepState {
  if (options?.failed) return "failed";
  return phase;
}

type StepCopy = {
  completed: string;
  upcoming: string;
  current?: string;
  currentCrafting?: string;
  failed?: string;
};

function stepDescription(
  id: OrderTimelineStepId,
  state: OrderTimelineStepState,
  order: Order
): string {
  const copy = fa.dashboard.orderTimeline.descriptions[id] as StepCopy;
  if (state === "failed" && copy.failed) return copy.failed;
  if (state === "current") {
    if (id === "production" && order.status === "crafting" && copy.currentCrafting) {
      return copy.currentCrafting;
    }
    if (copy.current) return copy.current;
  }
  if (state === "completed") return copy.completed;
  return copy.upcoming;
}

function shippingDescription(order: Order, state: OrderTimelineStepState): string {
  const base = stepDescription("shipping", state, order);
  if (order.trackingCode && (state === "current" || state === "completed")) {
    return `${base} ${fa.dashboard.orderTimeline.trackingNote(order.trackingCode)}`;
  }
  return base;
}

export function buildOrderTimeline(order: Order): OrderTimelineStep[] {
  const t = fa.dashboard.orderTimeline;
  const placed: OrderTimelineStep = {
    id: "placed",
    title: t.steps.placed,
    description: t.descriptions.placed.completed,
    state: "completed",
    date: order.date,
  };

  let paymentState: OrderTimelineStepState;
  if (order.status === "payment_failed") {
    paymentState = "failed";
  } else if (order.status === "pending_payment") {
    paymentState = "current";
  } else if (isOrderPaid(order)) {
    paymentState = "completed";
  } else {
    paymentState = "upcoming";
  }

  const payment: OrderTimelineStep = {
    id: "payment",
    title: t.steps.payment,
    description: stepDescription("payment", paymentState, order),
    state: paymentState,
    date: paymentState === "completed" ? order.payment?.verifiedAt : undefined,
  };

  const prodPhase = productionPhase(order);
  const production: OrderTimelineStep = {
    id: "production",
    title: t.steps.production,
    description: stepDescription("production", resolveStepState(prodPhase), order),
    state: resolveStepState(prodPhase),
    date:
      prodPhase === "completed" || (prodPhase === "current" && order.status === "crafting")
        ? order.updatedAt
        : undefined,
  };

  const shipPhase = shippingPhase(order);
  const shipping: OrderTimelineStep = {
    id: "shipping",
    title: t.steps.shipping,
    description: shippingDescription(order, resolveStepState(shipPhase)),
    state: resolveStepState(shipPhase),
    date: shipPhase !== "upcoming" ? order.updatedAt : undefined,
  };

  const delPhase = deliveryPhase(order);
  const delivered: OrderTimelineStep = {
    id: "delivered",
    title: t.steps.delivered,
    description: stepDescription("delivered", resolveStepState(delPhase), order),
    state: resolveStepState(delPhase),
    date: delPhase === "completed" ? order.updatedAt : undefined,
  };

  return [placed, payment, production, shipping, delivered];
}

export function orderTimelineStepOrder(): OrderTimelineStepId[] {
  return [...STEP_ORDER];
}
