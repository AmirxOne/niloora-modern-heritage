import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { PromoCodeDefinition } from "@/lib/types";
import { loadJson, storageKeys } from "../storage";

interface PromoState {
  appliedCode: string | null;
  appliedPromo: PromoCodeDefinition | null;
  lastError: "not_found" | "min_order" | "inactive" | null;
  hydrated: boolean;
}

const initialState: PromoState = {
  appliedCode: null,
  appliedPromo: null,
  lastError: null,
  hydrated: false,
};

const promoSlice = createSlice({
  name: "promo",
  initialState,
  reducers: {
    hydratePromo(state) {
      state.appliedCode = loadJson<string | null>(storageKeys.promo, null);
      state.appliedPromo = null;
      state.hydrated = true;
    },
    setPromoFromServer(state, action: PayloadAction<string | null>) {
      state.appliedCode = action.payload;
      state.appliedPromo = null;
      state.hydrated = true;
    },
    setAppliedPromo(state, action: PayloadAction<PromoCodeDefinition | null>) {
      state.appliedPromo = action.payload;
      state.appliedCode = action.payload?.code ?? null;
      state.lastError = null;
    },
    applyPromoCode(state, action: PayloadAction<PromoCodeDefinition>) {
      state.appliedPromo = action.payload;
      state.appliedCode = action.payload.code;
      state.lastError = null;
    },
    setPromoError(state, action: PayloadAction<"not_found" | "min_order" | "inactive" | null>) {
      state.lastError = action.payload;
    },
    clearPromoCode(state) {
      state.appliedCode = null;
      state.appliedPromo = null;
      state.lastError = null;
    },
  },
});

export const {
  hydratePromo,
  setPromoFromServer,
  setAppliedPromo,
  applyPromoCode,
  setPromoError,
  clearPromoCode,
} = promoSlice.actions;

type PromoRoot = { promo: PromoState };

export const selectAppliedPromoCode = (state: PromoRoot) => state.promo.appliedCode;
export const selectAppliedPromo = (state: PromoRoot) => state.promo.appliedPromo;
export const selectPromoError = (state: PromoRoot) => state.promo.lastError;
export const selectPromoHydrated = (state: PromoRoot) => state.promo.hydrated;

export default promoSlice.reducer;
