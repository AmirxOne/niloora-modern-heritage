import type { SanitizeCartResult } from "@/lib/cart/sanitize-types";
import type { CartItem } from "@/lib/types";

export async function validateCartAddOnServer(input: {
  productId: string;
  quantity: number;
  existingItems: CartItem[];
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const response = await fetch("/api/cart/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await response.json().catch(() => ({}))) as { message?: string; error?: string };
  if (!response.ok) {
    return { ok: false, message: data.message ?? data.error ?? "امکان افزودن به سبد وجود ندارد." };
  }
  return { ok: true };
}

export async function sanitizeCartOnServer(items: CartItem[]): Promise<SanitizeCartResult> {
  const response = await fetch("/api/cart/sanitize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  const data = (await response.json().catch(() => null)) as SanitizeCartResult | null;
  if (!response.ok || !data || !Array.isArray(data.items)) {
    return { items, removed: [], adjusted: [] };
  }
  return data;
}

export async function validateCartItemsOnServer(
  items: CartItem[]
): Promise<{ ok: true } | { ok: false; message: string }> {
  const response = await fetch("/api/cart/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  const data = (await response.json().catch(() => ({}))) as { message?: string; error?: string };
  if (!response.ok) {
    return { ok: false, message: data.message ?? data.error ?? "سبد خرید نامعتبر است." };
  }
  return { ok: true };
}
