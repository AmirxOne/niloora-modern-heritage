const BLOCKED_PREFIXES = ["//", "http:", "https:", "javascript:", "data:", "vbscript:"];

/**
 * Allow only same-origin relative paths for post-auth redirects.
 */
export function safeRedirectPath(raw: string | null | undefined, fallback = "/account"): string {
  if (!raw?.trim()) return fallback;

  const value = raw.trim();
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (value.includes("\\")) return fallback;

  const lowered = value.toLowerCase();
  for (const prefix of BLOCKED_PREFIXES) {
    if (lowered.startsWith(prefix)) return fallback;
  }

  return value;
}
