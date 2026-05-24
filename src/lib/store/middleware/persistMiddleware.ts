import { isAction, type Middleware } from "@reduxjs/toolkit";
import { saveJson, storageKeys } from "../storage";

type PersistState = {
  cart: { items: unknown; hydrated: boolean };
  wishlist: { ids: unknown; hydrated: boolean };
  designs: { designs: unknown; hydrated: boolean };
  promo: { appliedCode: unknown; hydrated: boolean };
  productSales: { byProductId: unknown; hydrated: boolean };
  giftCard: { appliedCode: unknown; hydrated: boolean };
  auth: { user: unknown; hydrated: boolean };
  compareList: { ids: unknown; hydrated: boolean };
  recentlyViewed: { ids: unknown; hydrated: boolean };
};

const PERSIST_PREFIXES = [
  "cart/",
  "wishlist/",
  "designs/",
  "promo/",
  "productSales/",
  "giftCard/",
  "auth/",
  "compareList/",
  "recentlyViewed/",
] as const;

const SKIP_ACTIONS = new Set([
  "cart/hydrateCart",
  "wishlist/hydrateWishlist",
  "designs/hydrateDesigns",
  "promo/hydratePromo",
  "productSales/hydrateProductSales",
  "giftCard/hydrateGiftCard",
  "auth/hydrateAuth",
  "compareList/hydrateCompareList",
  "recentlyViewed/hydrateRecentlyViewed",
]);

export const persistMiddleware: Middleware<object, PersistState> =
  (store) => (next) => (action) => {
  const result = next(action);
  if (!isAction(action)) return result;
  const type = action.type;

  if (SKIP_ACTIONS.has(type)) return result;

  const shouldPersist = PERSIST_PREFIXES.some((p) => type.startsWith(p));
  if (!shouldPersist) return result;

  const state = store.getState();

  if (type.startsWith("cart/") && state.cart.hydrated) {
    saveJson(storageKeys.cart, state.cart.items);
  }
  if (type.startsWith("wishlist/") && state.wishlist.hydrated) {
    saveJson(storageKeys.wishlist, state.wishlist.ids);
  }
  if (type.startsWith("designs/") && state.designs.hydrated) {
    saveJson(storageKeys.designs, state.designs.designs);
  }
  if (type.startsWith("promo/") && state.promo.hydrated) {
    saveJson(storageKeys.promo, state.promo.appliedCode);
  }
  if (
    state.productSales.hydrated &&
    (type.startsWith("productSales/") || type === "orders/placeOrder")
  ) {
    saveJson(storageKeys.productSales, state.productSales.byProductId);
  }
  if (type.startsWith("giftCard/") && state.giftCard.hydrated) {
    saveJson(storageKeys.giftCard, state.giftCard.appliedCode);
  }
  if (type.startsWith("compareList/") && state.compareList.hydrated) {
    saveJson(storageKeys.compareList, state.compareList.ids);
  }
  if (type.startsWith("recentlyViewed/") && state.recentlyViewed.hydrated) {
    saveJson(storageKeys.recentlyViewed, state.recentlyViewed.ids);
  }

  return result;
};
