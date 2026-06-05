export const ORDER_RETURN_REASONS = [
  "defect",
  "sizing",
  "change_mind",
  "authenticity",
  "other",
] as const;

export type OrderReturnReason = (typeof ORDER_RETURN_REASONS)[number];
