import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CartItem, CustomizerState, ProductAvailability } from "@/lib/types";
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/images";
import { generateId } from "@/lib/utils";
import { loadJson, storageKeys } from "../storage";

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  hydrated: boolean;
}

const initialState: CartState = {
  items: [],
  isOpen: false,
  hydrated: false,
};

type AddItemPayload = Omit<CartItem, "id" | "quantity"> & { quantity?: number };

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    hydrateCart(state) {
      state.items = loadJson<CartItem[]>(storageKeys.cart, []);
      state.hydrated = true;
    },
    setCartItemsFromServer(state, action: PayloadAction<CartItem[]>) {
      state.items = action.payload;
      state.hydrated = true;
    },
    setCartOpen(state, action: PayloadAction<boolean>) {
      state.isOpen = action.payload;
    },
    addCartItem(state, action: PayloadAction<AddItemPayload>) {
      const item = action.payload;
      const existing = state.items.find(
        (i) =>
          i.productId === item.productId &&
          JSON.stringify(i.customizerState) === JSON.stringify(item.customizerState) &&
          JSON.stringify(i.ringPurchaseCustomization) === JSON.stringify(item.ringPurchaseCustomization)
      );
      if (existing) {
        existing.quantity += item.quantity ?? 1;
      } else {
        state.items.push({
          ...item,
          id: generateId(),
          quantity: item.quantity ?? 1,
        });
      }
    },
    addProductToCart(
      state,
      action: PayloadAction<{
        productId: string;
        name: string;
        price: number;
        listPrice?: number;
        image: string;
        availability: ProductAvailability;
        collectionId?: string;
      }>
    ) {
      const { productId, name, price, listPrice, image, availability, collectionId } =
        action.payload;
      const existing = state.items.find((i) => i.productId === productId && !i.customizerState);
      if (existing) {
        existing.quantity += 1;
        existing.price = price;
        if (listPrice != null) existing.listPrice = listPrice;
        if (collectionId != null) existing.collectionId = collectionId;
      } else {
        state.items.push({
          id: generateId(),
          productId,
          collectionId,
          name,
          price,
          listPrice,
          image,
          availability,
          quantity: 1,
        });
      }
    },
    addCustomDesignToCart(
      state,
      action: PayloadAction<{
        name: string;
        price: number;
        customizerState: CustomizerState;
      }>
    ) {
      const { name, price, customizerState } = action.payload;
      state.items.push({
        id: generateId(),
        name,
        price,
        image: DEFAULT_PRODUCT_IMAGE,
        quantity: 1,
        customizerState,
      });
    },
    removeCartItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.id !== action.payload);
    },
    updateCartItemQuantity(
      state,
      action: PayloadAction<{ id: string; quantity: number }>
    ) {
      const { id, quantity } = action.payload;
      if (quantity < 1) return;
      const item = state.items.find((i) => i.id === id);
      if (item) item.quantity = quantity;
    },
    updateCartItemRingCustomization(
      state,
      action: PayloadAction<{
        id: string;
        price: number;
        listPrice?: number;
        ringPurchaseCustomization?: CartItem["ringPurchaseCustomization"];
      }>
    ) {
      const { id, price, listPrice, ringPurchaseCustomization } = action.payload;
      const item = state.items.find((i) => i.id === id);
      if (!item) return;
      item.price = Math.max(0, Math.round(price));
      if (listPrice != null) item.listPrice = Math.max(0, Math.round(listPrice));
      item.ringPurchaseCustomization = ringPurchaseCustomization;
    },
    clearCart(state) {
      state.items = [];
    },
  },
});

export const {
  hydrateCart,
  setCartItemsFromServer,
  setCartOpen,
  addCartItem,
  addProductToCart,
  addCustomDesignToCart,
  removeCartItem,
  updateCartItemQuantity,
  updateCartItemRingCustomization,
  clearCart,
} = cartSlice.actions;

type CartRoot = { cart: CartState };

export const selectCartItems = (state: CartRoot) => state.cart.items;
export const selectCartIsOpen = (state: CartRoot) => state.cart.isOpen;
export const selectCartHydrated = (state: CartRoot) => state.cart.hydrated;
export const selectCartTotal = (state: CartRoot) =>
  state.cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
export const selectCartCount = (state: CartRoot) =>
  state.cart.items.reduce((sum, i) => sum + i.quantity, 0);

export default cartSlice.reducer;
