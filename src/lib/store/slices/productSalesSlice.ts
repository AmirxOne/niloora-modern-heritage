import { createSlice } from "@reduxjs/toolkit";
import type { CartItem } from "@/lib/types";
import { buildDefaultProductSales, mergeProductSales } from "@/lib/product-sales";
import { loadJson, storageKeys } from "../storage";

interface ProductSalesState {
  byProductId: Record<string, number>;
  hydrated: boolean;
}

const initialState: ProductSalesState = {
  byProductId: buildDefaultProductSales(),
  hydrated: false,
};

function incrementFromItems(
  sales: Record<string, number>,
  items: CartItem[]
): Record<string, number> {
  const next = { ...sales };
  for (const item of items) {
    if (!item.productId) continue;
    next[item.productId] = (next[item.productId] ?? 0) + item.quantity;
  }
  return next;
}

const productSalesSlice = createSlice({
  name: "productSales",
  initialState,
  reducers: {
    hydrateProductSales(state) {
      const stored = loadJson<Record<string, number> | null>(storageKeys.productSales, null);
      state.byProductId = mergeProductSales(stored);
      state.hydrated = true;
    },
    setProductSales(state, action: { payload: Record<string, number> }) {
      state.byProductId = mergeProductSales(action.payload);
      state.hydrated = true;
    },
    incrementProductSalesFromItems(state, action: { payload: CartItem[] }) {
      state.byProductId = incrementFromItems(state.byProductId, action.payload);
    },
  },
});

export const { hydrateProductSales, setProductSales, incrementProductSalesFromItems } =
  productSalesSlice.actions;

type ProductSalesRoot = { productSales: ProductSalesState };

export const selectProductSalesCount = (productId: string) => (state: ProductSalesRoot) =>
  state.productSales.byProductId[productId] ?? 0;

export const selectProductSalesHydrated = (state: ProductSalesRoot) =>
  state.productSales.hydrated;

export default productSalesSlice.reducer;
