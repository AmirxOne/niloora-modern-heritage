"use client";

import { buildOrderTimeline, type OrderTimelineStepState } from "@/lib/orders/order-timeline";
import { fa } from "@/lib/i18n/fa";
import type { Order } from "@/lib/types";
import { cn } from "@/lib/utils";

function formatTimelineDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const stateDotClass: Record<OrderTimelineStepState, string> = {
  completed: "order-timeline-dot--completed",
  current: "order-timeline-dot--current",
  upcoming: "order-timeline-dot--upcoming",
  failed: "order-timeline-dot--failed",
};

export function OrderStatusTimeline({ order }: { order: Order }) {
  const steps = buildOrderTimeline(order);

  return (
    <section className="order-timeline" aria-label={fa.dashboard.orderTimeline.title}>
      <h3 className="order-timeline-title">{fa.dashboard.orderTimeline.title}</h3>
      <ol className="order-timeline-list">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          return (
            <li
              key={step.id}
              className={cn("order-timeline-item", `order-timeline-item--${step.state}`)}
            >
              <div className="order-timeline-marker" aria-hidden>
                <span className={cn("order-timeline-dot", stateDotClass[step.state])} />
                {!isLast ? <span className="order-timeline-line" /> : null}
              </div>
              <div className="order-timeline-body">
                <div className="order-timeline-head">
                  <p className="order-timeline-step-title">{step.title}</p>
                  {step.date ? (
                    <time className="order-timeline-date" dateTime={step.date}>
                      {formatTimelineDate(step.date)}
                    </time>
                  ) : null}
                </div>
                <p className="order-timeline-description">{step.description}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
