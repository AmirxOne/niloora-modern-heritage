import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/** قیمت‌ها به تومان ذخیره و نمایش داده می‌شوند */
export function formatPrice(priceInToman: number): string {
  return (
    new Intl.NumberFormat("fa-IR", {
      maximumFractionDigits: 0,
    }).format(priceInToman) + "\u00A0تومان"
  );
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
