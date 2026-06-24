/** When false (default), catalog behaves exactly as pre-marketplace D2C. */
export function isMarketplaceCatalogFilterEnabled(): boolean {
  return process.env.ENABLE_MARKETPLACE_FILTER === "true";
}

/** When false (default), catalog sort order is unchanged from pre-ranking behavior. */
export function isMarketplaceRankingEnabled(): boolean {
  return process.env.ENABLE_MARKETPLACE_RANKING === "true";
}
