export const FUNNEL_EVENT_NAMES = [
  "view_product",
  "add_to_cart",
  "begin_checkout",
  "add_payment_info",
  "purchase",
] as const;

export type FunnelEventName = (typeof FUNNEL_EVENT_NAMES)[number];

export type CommerceItem = {
  item_id: string;
  item_name?: string;
  item_category?: string;
  item_variant?: string;
  price?: number;
  quantity?: number;
};

export type FunnelEventPayload = {
  event_name: FunnelEventName;
  event_id?: string;
  client_id: string;
  session_id: string;
  page_location?: string;
  occurred_at?: string;
  user_id?: string;
  currency?: string;
  value?: number;
  transaction_id?: string;
  payment_method?: string;
  funnel_step?: string;
  items?: CommerceItem[];
  metadata?: Record<string, unknown>;
};

export function isFunnelEventName(value: string): value is FunnelEventName {
  return (FUNNEL_EVENT_NAMES as readonly string[]).includes(value);
}
