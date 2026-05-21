/** نرمال‌سازی شماره موبایل ایران به فرم ۰۹xxxxxxxxx */
import { toEnglishDigits, toPersianDigits } from "@/lib/persian-digits";

export function normalizeIranPhone(input: string): string | null {
  const digits = toEnglishDigits(input).replace(/\D/g, "");
  if (!digits) return null;

  let normalized = digits;
  if (normalized.startsWith("98") && normalized.length === 12) {
    normalized = `0${normalized.slice(2)}`;
  } else if (normalized.startsWith("9") && normalized.length === 10) {
    normalized = `0${normalized}`;
  }

  if (!/^09\d{9}$/.test(normalized)) return null;
  return normalized;
}

export function formatIranPhoneDisplay(phone: string): string {
  const n = normalizeIranPhone(phone) ?? phone;
  if (n.length !== 11) return phone;
  return toPersianDigits(`${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7)}`);
}

export function isValidIranMobile(input: string): boolean {
  return normalizeIranPhone(input) !== null;
}
