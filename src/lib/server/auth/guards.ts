import { forbidden, unauthorized } from "@/lib/server/http";
import {
  canCreateContent as canCreateContentByRole,
  canDeleteContent as canDeleteContentByRole,
  canTransitionPostStatus as canTransitionPostStatusByRole,
  editablePostStatusesForRole as editablePostStatusesByRole,
  isPostEditableByRole as isPostEditableByRoleStatus,
} from "@/lib/auth/content-workflow";

export function ensureAdmin(user: { role?: string } | null) {
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden("forbidden");
  return null;
}

export function ensureContentWorkflowAccess(user: { role?: string } | null) {
  if (!user) return unauthorized();
  if (user.role === "admin" || user.role === "editor" || user.role === "reviewer") return null;
  return forbidden("forbidden");
}

export function canCreateContent(user: { role?: string } | null): boolean {
  return canCreateContentByRole(user?.role);
}

export function canDeleteContent(user: { role?: string } | null): boolean {
  return canDeleteContentByRole(user?.role);
}

export function canTransitionPostStatus(
  role: string | undefined,
  fromStatus: string | null | undefined,
  toStatus: string
): boolean {
  return canTransitionPostStatusByRole(role, fromStatus, toStatus);
}

export function editablePostStatusesForRole(role: string | undefined): string[] {
  return editablePostStatusesByRole(role);
}

export function isPostEditableByRole(role: string | undefined, status: string): boolean {
  return isPostEditableByRoleStatus(role, status);
}
