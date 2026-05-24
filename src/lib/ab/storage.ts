"use client";

const KEY = "niloora.ab.identity.v1";

function randomId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function readOrCreateAbIdentity(): string {
  if (typeof window === "undefined") return "ssr";
  const existing = window.localStorage.getItem(KEY)?.trim();
  if (existing) return existing;
  const next = randomId();
  window.localStorage.setItem(KEY, next);
  return next;
}
