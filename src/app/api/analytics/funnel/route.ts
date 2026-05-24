import { badRequest, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import {
  isFunnelEventName,
  type CommerceItem,
  type FunnelEventPayload,
} from "@/lib/analytics/funnel-events";
import { writeFunnelEvent } from "@/lib/server/analytics/funnel-log";

function normalizeItems(value: unknown): CommerceItem[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const mapped: CommerceItem[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const itemId = typeof row.item_id === "string" ? row.item_id.trim() : "";
    if (!itemId) continue;
    mapped.push({
      item_id: itemId,
      item_name: typeof row.item_name === "string" ? row.item_name : undefined,
      item_category: typeof row.item_category === "string" ? row.item_category : undefined,
      item_variant: typeof row.item_variant === "string" ? row.item_variant : undefined,
      price: typeof row.price === "number" ? row.price : undefined,
      quantity: typeof row.quantity === "number" ? row.quantity : undefined,
    });
  }
  return mapped;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const eventName = typeof body.event_name === "string" ? body.event_name : "";
    const clientId = typeof body.client_id === "string" ? body.client_id.trim() : "";
    const sessionId = typeof body.session_id === "string" ? body.session_id.trim() : "";
    if (!isFunnelEventName(eventName) || !clientId || !sessionId) {
      return badRequest("Invalid funnel event payload.");
    }

    const payload: FunnelEventPayload = {
      event_name: eventName,
      event_id: typeof body.event_id === "string" ? body.event_id : undefined,
      client_id: clientId,
      session_id: sessionId,
      page_location: typeof body.page_location === "string" ? body.page_location : undefined,
      occurred_at: typeof body.occurred_at === "string" ? body.occurred_at : new Date().toISOString(),
      user_id: typeof body.user_id === "string" ? body.user_id : undefined,
      currency: typeof body.currency === "string" ? body.currency : "IRR",
      value: typeof body.value === "number" ? body.value : undefined,
      transaction_id: typeof body.transaction_id === "string" ? body.transaction_id : undefined,
      payment_method: typeof body.payment_method === "string" ? body.payment_method : undefined,
      funnel_step: typeof body.funnel_step === "string" ? body.funnel_step : undefined,
      items: normalizeItems(body.items),
      metadata:
        body.metadata && typeof body.metadata === "object"
          ? (body.metadata as Record<string, unknown>)
          : undefined,
    };

    await writeFunnelEvent(payload, request);
    return ok({ recorded: true });
  } catch (error) {
    return handleRouteError(error, { route: "/api/analytics/funnel" });
  }
}
