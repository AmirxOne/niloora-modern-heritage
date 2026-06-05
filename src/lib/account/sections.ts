export const ACCOUNT_SECTION_IDS = [
  "overview",
  "referrals",
  "profile",
  "orders",
  "quotes",
  "ugc",
  "wishlist",
  "compare",
  "recently-viewed",
  "designs",
] as const;

export type AccountSectionId = (typeof ACCOUNT_SECTION_IDS)[number];
export type AccountNavSectionId = AccountSectionId;

const LEGACY_ALIASES: Record<string, AccountSectionId> = {
  dashboard: "overview",
};

export function isAccountSectionId(value: string): value is AccountSectionId {
  return (ACCOUNT_SECTION_IDS as readonly string[]).includes(value);
}

export function isAccountNavSectionId(value: string): value is AccountNavSectionId {
  return isAccountSectionId(value);
}

export function parseAccountSection(
  hash: string,
  sectionQuery: string | null
): AccountNavSectionId | null {
  const fromQuery = sectionQuery?.trim();
  if (fromQuery) {
    const normalized = fromQuery in LEGACY_ALIASES ? LEGACY_ALIASES[fromQuery] : fromQuery;
    if (isAccountNavSectionId(normalized)) return normalized;
  }

  const raw = hash.replace(/^#/, "").trim();
  if (!raw) return null;
  const normalized = raw in LEGACY_ALIASES ? LEGACY_ALIASES[raw] : raw;
  return isAccountNavSectionId(normalized) ? normalized : null;
}

export function accountSectionHref(section: AccountNavSectionId): string {
  return section === "overview" ? "/account" : `/account#${section}`;
}
