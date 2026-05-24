"use client";

import type { CommerceItem, FunnelEventName } from "@/lib/analytics/funnel-events";

const CLIENT_ID_KEY = "niloora.analytics.client_id.v1";
const SESSION_ID_KEY = "niloora.analytics.session_id.v1";
const FUNNEL_ONCE_KEY = "niloora.analytics.funnel.once.v1";

type TrackInput = {
  event_name: FunnelEventName;
  user_id?: string;
  currency?: string;
  value?: number;
  transaction_id?: string;
  payment_method?: string;
  funnel_step?: string;
  items?: CommerceItem[];
  metadata?: Record<string, unknown>;
  dedupe_key?: string;
};

function randomId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function readOrSet(key: string): string {
  if (typeof window === "undefined") return "ssr";
  const v = window.localStorage.getItem(key)?.trim();
  if (v) return v;
  const next = randomId();
  window.localStorage.setItem(key, next);
  return next;
}

function readOnceSet(): Record<string, true> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(FUNNEL_ONCE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, true>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeOnceSet(value: Record<string, true>) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(FUNNEL_ONCE_KEY, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function getAnalyticsIds() {
  return {
    client_id: readOrSet(CLIENT_ID_KEY),
    session_id: readOrSet(SESSION_ID_KEY),
  };
}

export async function trackFunnelEvent(input: TrackInput): Promise<void> {
  if (typeof window === "undefined") return;
  if (input.dedupe_key) {
    const seen = readOnceSet();
    if (seen[input.dedupe_key]) return;
    seen[input.dedupe_key] = true;
    writeOnceSet(seen);
  }

  const ids = getAnalyticsIds();
  try {
    await fetch("/api/analytics/funnel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        event_name: input.event_name,
        event_id: randomId(),
        client_id: ids.client_id,
        session_id: ids.session_id,
        page_location: window.location.pathname + window.location.search,
        occurred_at: new Date().toISOString(),
        user_id: input.user_id,
        currency: input.currency ?? "IRR",
        value: input.value,
        transaction_id: input.transaction_id,
        payment_method: input.payment_method,
        funnel_step: input.funnel_step,
        items: input.items,
        metadata: input.metadata,
      }),
    });
  } catch {
    // no-op
  }
}
