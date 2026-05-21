export const TRADE_IN_STATUSES = ["pending", "reviewed", "rejected"] as const;

export type TradeInSubmissionStatus = (typeof TRADE_IN_STATUSES)[number];

export const TRADE_IN_FILTER_STATUSES = ["all", ...TRADE_IN_STATUSES] as const;

export type TradeInFilterStatus = (typeof TRADE_IN_FILTER_STATUSES)[number];

export function isTradeInStatus(value: string): value is TradeInSubmissionStatus {
  return (TRADE_IN_STATUSES as readonly string[]).includes(value);
}

export function parseTradeInFilter(raw: string | null): TradeInFilterStatus {
  if (!raw || raw === "all") return "all";
  if ((TRADE_IN_FILTER_STATUSES as readonly string[]).includes(raw)) {
    return raw as TradeInFilterStatus;
  }
  return "all";
}

export const TRADE_IN_INTERNAL_NOTES_MAX = 4000;
