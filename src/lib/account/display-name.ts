import { formatIranPhoneDisplay, normalizeIranPhone } from "@/lib/auth/phone";

type AccountNameInput = {
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  phone: string;
};

/** نام نمایشی حساب: نام و نام‌خانوادگی، در غیر این صورت شماره موبایل. */
export function resolveAccountDisplayName(input: AccountNameInput): string {
  const first = (input.firstName ?? "").trim();
  const last = (input.lastName ?? "").trim();
  const full = `${first} ${last}`.trim();
  if (full) return full;

  const name = (input.name ?? "").trim();
  if (name) {
    const phoneNorm = normalizeIranPhone(input.phone);
    const nameNorm = normalizeIranPhone(name);
    if (!phoneNorm || nameNorm !== phoneNorm) return name;
  }

  return formatIranPhoneDisplay(input.phone);
}

export function accountDisplayInitials(input: AccountNameInput): string {
  const first = (input.firstName ?? "").trim();
  const last = (input.lastName ?? "").trim();
  if (first && last) return `${first.slice(0, 1)}${last.slice(0, 1)}`;
  if (first) return first.slice(0, 1);

  const display = resolveAccountDisplayName(input);
  const parts = display.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`;
  }
  if (parts.length === 1) return parts[0].slice(0, 1);
  return "؟";
}

export function hasAccountProfileName(input: AccountNameInput): boolean {
  const first = (input.firstName ?? "").trim();
  const last = (input.lastName ?? "").trim();
  if (first && last) return true;

  const name = (input.name ?? "").trim();
  if (!name) return false;
  const phoneNorm = normalizeIranPhone(input.phone);
  const nameNorm = normalizeIranPhone(name);
  return Boolean(phoneNorm && nameNorm !== phoneNorm);
}
