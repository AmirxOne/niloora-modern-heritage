export const SUPPORT_REQUEST_KINDS = ["return", "support"] as const;
export type SupportRequestKind = (typeof SUPPORT_REQUEST_KINDS)[number];

export const RETURN_CATEGORIES = [
  "defect",
  "sizing",
  "change_mind",
  "authenticity",
  "other",
] as const;

export const SUPPORT_CATEGORIES = [
  "shipping",
  "repair",
  "payment",
  "product_info",
  "other",
] as const;

export type ReturnCategory = (typeof RETURN_CATEGORIES)[number];
export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];
export type SupportRequestCategory = ReturnCategory | SupportCategory;

export const SUPPORT_REQUEST_STATUSES = [
  "pending",
  "in_progress",
  "resolved",
  "rejected",
] as const;

export type SupportRequestStatus = (typeof SUPPORT_REQUEST_STATUSES)[number];

export const SUPPORT_REQUEST_FILTER_STATUSES = [
  "all",
  ...SUPPORT_REQUEST_STATUSES,
] as const;

export type SupportRequestFilterStatus = (typeof SUPPORT_REQUEST_FILTER_STATUSES)[number];

export const SUPPORT_REQUEST_FILTER_KINDS = ["all", ...SUPPORT_REQUEST_KINDS] as const;

export type SupportRequestFilterKind = (typeof SUPPORT_REQUEST_FILTER_KINDS)[number];

export const SUPPORT_MESSAGE_MIN = 20;
export const SUPPORT_MESSAGE_MAX = 4000;
export const SUPPORT_INTERNAL_NOTES_MAX = 4000;

export function isSupportRequestKind(value: string): value is SupportRequestKind {
  return (SUPPORT_REQUEST_KINDS as readonly string[]).includes(value);
}

export function isReturnCategory(value: string): value is ReturnCategory {
  return (RETURN_CATEGORIES as readonly string[]).includes(value);
}

export function isSupportCategory(value: string): value is SupportCategory {
  return (SUPPORT_CATEGORIES as readonly string[]).includes(value);
}

export function isCategoryForKind(
  kind: SupportRequestKind,
  category: string
): category is SupportRequestCategory {
  return kind === "return" ? isReturnCategory(category) : isSupportCategory(category);
}

export function isSupportRequestStatus(value: string): value is SupportRequestStatus {
  return (SUPPORT_REQUEST_STATUSES as readonly string[]).includes(value);
}

export function parseSupportRequestFilter(raw: string | null): SupportRequestFilterStatus {
  if (!raw || raw === "all") return "all";
  if ((SUPPORT_REQUEST_FILTER_STATUSES as readonly string[]).includes(raw)) {
    return raw as SupportRequestFilterStatus;
  }
  return "all";
}

export function parseSupportRequestKindFilter(raw: string | null): SupportRequestFilterKind {
  if (!raw || raw === "all") return "all";
  if ((SUPPORT_REQUEST_FILTER_KINDS as readonly string[]).includes(raw)) {
    return raw as SupportRequestFilterKind;
  }
  return "all";
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, "").trim();
}
