import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { loadJson, storageKeys } from "../storage";

export type AppliedGiftCard = {
  code: string;
  appliedAmount: number;
  remainingAmount?: number;
};

type GiftCardState = {
  appliedCode: string | null;
  applied: AppliedGiftCard | null;
  hydrated: boolean;
  lastError: "not_found" | "inactive" | "expired" | "empty" | "unknown" | null;
};

const initialState: GiftCardState = {
  appliedCode: null,
  applied: null,
  hydrated: false,
  lastError: null,
};

const giftCardSlice = createSlice({
  name: "giftCard",
  initialState,
  reducers: {
    hydrateGiftCard(state) {
      state.appliedCode = loadJson<string | null>(storageKeys.giftCard, null);
      state.applied = null;
      state.hydrated = true;
      state.lastError = null;
    },
    applyGiftCard(state, action: PayloadAction<AppliedGiftCard>) {
      state.applied = action.payload;
      state.appliedCode = action.payload.code;
      state.lastError = null;
    },
    setGiftCardCode(state, action: PayloadAction<string | null>) {
      state.appliedCode = action.payload;
      state.applied = null;
      state.lastError = null;
    },
    clearGiftCard(state) {
      state.appliedCode = null;
      state.applied = null;
      state.lastError = null;
    },
    setGiftCardError(
      state,
      action: PayloadAction<"not_found" | "inactive" | "expired" | "empty" | "unknown" | null>
    ) {
      state.lastError = action.payload;
    },
  },
});

export const {
  hydrateGiftCard,
  applyGiftCard,
  setGiftCardCode,
  clearGiftCard,
  setGiftCardError,
} = giftCardSlice.actions;

type GiftCardRoot = { giftCard: GiftCardState };

export const selectGiftCardAppliedCode = (state: GiftCardRoot) => state.giftCard.appliedCode;
export const selectGiftCardApplied = (state: GiftCardRoot) => state.giftCard.applied;
export const selectGiftCardHydrated = (state: GiftCardRoot) => state.giftCard.hydrated;
export const selectGiftCardError = (state: GiftCardRoot) => state.giftCard.lastError;

export default giftCardSlice.reducer;
