"use client";

import { createContext, useContext, useEffect } from "react";
import { useCart } from "../hooks/useCart";
import { useWishlist } from "../hooks/useWishlist";
import { useCompareList } from "../hooks/useCompareList";
import { useRecentlyViewed } from "../hooks/useRecentlyViewed";
import { useSavedDesigns } from "../hooks/useSavedDesigns";
import { useOrders } from "../hooks/useOrders";
import { useQuoteRequests } from "../hooks/useQuoteRequests";
import { useComments } from "../hooks/useComments";
import { useAuth } from "../hooks/useAuth";
import { useProductSalesSync } from "../hooks/useProductSalesSync";
import { useUserPreferencesSync } from "../hooks/useUserPreferencesSync";
import { usePersistUserPreferences } from "../hooks/usePersistUserPreferences";

/**
 * Central client composition point.
 * Any new client domain hook should be wired here once, then consumed via `useApp()`.
 */
type CartReturn = ReturnType<typeof useCart>;
type WishlistReturn = ReturnType<typeof useWishlist>;
type CompareListReturn = ReturnType<typeof useCompareList>;
type RecentlyViewedReturn = ReturnType<typeof useRecentlyViewed>;
type DesignsReturn = ReturnType<typeof useSavedDesigns>;
type OrdersReturn = ReturnType<typeof useOrders>;
type QuoteRequestsReturn = ReturnType<typeof useQuoteRequests>;
type CommentsReturn = ReturnType<typeof useComments>;
type AuthReturn = ReturnType<typeof useAuth>;

interface AppContextValue {
  cart: CartReturn;
  wishlist: WishlistReturn;
  compareList: CompareListReturn;
  recentlyViewed: RecentlyViewedReturn;
  designs: DesignsReturn;
  orders: OrdersReturn;
  quoteRequests: QuoteRequestsReturn;
  comments: CommentsReturn;
  auth: AuthReturn;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // PURPOSE: compose all client domains behind one stable context entrypoint.
  // FLOW: create domain hooks -> run cross-domain sync hooks -> expose unified value.
  const cart = useCart();
  const wishlist = useWishlist();
  const compareList = useCompareList();
  const recentlyViewed = useRecentlyViewed();
  const designs = useSavedDesigns();
  const orders = useOrders();
  const quoteRequests = useQuoteRequests();
  const comments = useComments();
  const auth = useAuth();
  useProductSalesSync();
  const { hydrated, loadSession } = auth;
  useUserPreferencesSync(auth.isLoggedIn);
  usePersistUserPreferences(auth.isLoggedIn);

  useEffect(() => {
    // BOUNDARY: auth hydration must complete before session restore request.
    if (hydrated) {
      loadSession();
    }
  }, [hydrated, loadSession]);

  return (
    <AppContext.Provider
      value={{ cart, wishlist, compareList, recentlyViewed, designs, orders, quoteRequests, comments, auth }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
