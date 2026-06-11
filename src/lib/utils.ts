import { type ClassValue, clsx } from "clsx";
import { toPersianDigits } from "@/lib/persian-digits";

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/** فقط رقم قیمت (بدون واحد) — deterministic across SSR and browser */
export function formatTomanAmount(priceInToman: number): string {
  const grouped = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(priceInToman);
  return toPersianDigits(grouped);
}

/** قیمت‌ها به تومان ذخیره و نمایش داده می‌شوند */
export function formatPrice(priceInToman: number): string {
  return `تومان\u00A0${formatTomanAmount(priceInToman)}`;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
