import { unauthorized } from "@/lib/server/http";

export function ensureAdmin(user: { role?: string } | null) {
  if (!user) return unauthorized();
  if (user.role !== "admin") return unauthorized("forbidden");
  return null;
}
