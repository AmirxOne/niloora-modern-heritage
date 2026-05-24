"use client";

type AbTrackPayload = {
  experimentId: string;
  variantId: string;
  identity: string;
  type: "exposure" | "conversion";
  page?: string;
  metadata?: unknown;
};

export async function trackAbEvent(payload: AbTrackPayload): Promise<void> {
  try {
    await fetch("/api/ab/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // no-op: analytics should not block UX
  }
}
