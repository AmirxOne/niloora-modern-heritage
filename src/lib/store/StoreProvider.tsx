"use client";

import { useRef, useEffect } from "react";
import { Provider } from "react-redux";
import { makeStore, type AppStore } from "./index";
import { hydrateCart } from "./slices/cartSlice";
import { hydrateWishlist } from "./slices/wishlistSlice";
import { hydrateDesigns } from "./slices/designsSlice";
import { hydratePromo } from "./slices/promoSlice";
import { hydrateProductSales } from "./slices/productSalesSlice";
import { hydrateAuth } from "./slices/authSlice";
import { hydrateCompareList } from "./slices/compareListSlice";
import { hydrateRecentlyViewed } from "./slices/recentlyViewedSlice";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);

  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  useEffect(() => {
    const store = storeRef.current;
    if (!store) return;
    store.dispatch(hydrateCart());
    store.dispatch(hydrateWishlist());
    store.dispatch(hydrateDesigns());
    store.dispatch(hydratePromo());
    store.dispatch(hydrateProductSales());
    store.dispatch(hydrateAuth());
    store.dispatch(hydrateCompareList());
    store.dispatch(hydrateRecentlyViewed());
  }, []);

  return <Provider store={storeRef.current}>{children}</Provider>;
}
