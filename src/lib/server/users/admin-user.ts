export const ADMIN_USER_ROLES = ["user", "editor", "reviewer", "admin"] as const;

export type AdminUserRole = (typeof ADMIN_USER_ROLES)[number];

export function isAdminUserRole(value: string): value is AdminUserRole {
  return (ADMIN_USER_ROLES as readonly string[]).includes(value);
}

export function parseAdminUsersSearch(raw: string | null): string {
  return (raw ?? "").trim().slice(0, 80);
}

export function parseAdminUsersPage(raw: string | null): number {
  const n = Number.parseInt(raw ?? "1", 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, 500);
}

export function parseAdminUsersPageSize(raw: string | null): number {
  const n = Number.parseInt(raw ?? "20", 10);
  if (!Number.isFinite(n) || n < 1) return 20;
  return Math.min(n, 100);
}
