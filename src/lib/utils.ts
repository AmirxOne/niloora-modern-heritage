import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/** فقط رقم قیمت (بدون واحد) */
export function formatTomanAmount(priceInToman: number): string {
  return new Intl.NumberFormat("fa-IR", {
    maximumFractionDigits: 0,
  }).format(priceInToman);
}

/** قیمت‌ها به تومان ذخیره و نمایش داده می‌شوند */
export function formatPrice(priceInToman: number): string {
  return `تومان\u00A0${formatTomanAmount(priceInToman)}`;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
