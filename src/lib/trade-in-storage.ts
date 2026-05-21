import type { TradeInSubmission } from "@/lib/types";

const STORAGE_KEY = "niloora-trade-in-submissions";

export function getTradeInSubmissions(): TradeInSubmission[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TradeInSubmission[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTradeInSubmission(
  data: Omit<TradeInSubmission, "id" | "createdAt" | "status">
): TradeInSubmission {
  const entry: TradeInSubmission = {
    ...data,
    id: `ti-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: "pending",
  };
  const list = getTradeInSubmissions();
  list.unshift(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 20)));
  return entry;
}
