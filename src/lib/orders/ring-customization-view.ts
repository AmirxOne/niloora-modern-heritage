import type { CartItem } from "@/lib/types";

export function summarizeRingCustomization(item: CartItem): string[] {
  const ring = item.ringPurchaseCustomization;
  if (!ring) return [];
  const rows: string[] = [];
  if (ring.size?.enabled) {
    rows.push(`سایز تحویل: ${ring.size.selected.toLocaleString("fa-IR")}`);
  }
  if (ring.shank) {
    if (ring.shank.state === "opted_out") rows.push("قلم‌کاری: حذف شد");
    if (ring.shank.state === "customized") rows.push("قلم‌کاری: شخصی‌سازی شد");
  }
  if (ring.stone) {
    if (ring.stone.state === "opted_out") rows.push("حکاکی: حذف شد");
    if (ring.stone.state === "customized") rows.push("حکاکی: شخصی‌سازی شد");
  }
  if (ring.leadTimeDaysDelta > 0) {
    rows.push(`زمان آماده‌سازی: ${ring.leadTimeDaysDelta.toLocaleString("fa-IR")} روز`);
  }
  return rows;
}

