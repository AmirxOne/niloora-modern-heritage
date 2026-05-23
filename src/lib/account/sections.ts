export const ACCOUNT_SECTION_IDS = [
  "overview",
  "profile",
  "orders",
  "quotes",
  "wishlist",
  "compare",
  "recently-viewed",
  "designs",
] as const;

export type AccountSectionId = (typeof ACCOUNT_SECTION_IDS)[number];

const LEGACY_ALIASES: Record<string, AccountSectionId> = {
  dashboard: "overview",
};

export function isAccountSectionId(value: string): value is AccountSectionId {
  return (ACCOUNT_SECTION_IDS as readonly string[]).includes(value);
}

export function parseAccountSection(
  hash: string,
  sectionQuery: string | null
): AccountSectionId | null {
  const fromQuery = sectionQuery?.trim();
  if (fromQuery) {
    const normalized = fromQuery in LEGACY_ALIASES ? LEGACY_ALIASES[fromQuery] : fromQuery;
    if (isAccountSectionId(normalized)) return normalized;
  }

  const raw = hash.replace(/^#/, "").trim();
  if (!raw) return null;
  const normalized = raw in LEGACY_ALIASES ? LEGACY_ALIASES[raw] : raw;
  return isAccountSectionId(normalized) ? normalized : null;
}

export function accountSectionHref(section: AccountSectionId): string {
  return section === "overview" ? "/account" : `/account#${section}`;
}
