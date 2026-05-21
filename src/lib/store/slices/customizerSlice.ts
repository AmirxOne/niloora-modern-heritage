import { createSelector, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CustomizerState } from "@/lib/types";
import type { CompatibilityChange } from "@/lib/customizer/compatibility";
import {
  defaultCustomizerState,
  sanitizeCustomizer,
  getCustomizerPrice,
  mapCompatibilityChanges,
} from "../customizer-utils";

interface CustomizerStateSlice {
  state: CustomizerState;
  recentChanges: CompatibilityChange[];
}

const initialSanitized = sanitizeCustomizer(defaultCustomizerState);

const initialState: CustomizerStateSlice = {
  state: initialSanitized.state,
  recentChanges: [],
};

const customizerSlice = createSlice({
  name: "customizer",
  initialState,
  reducers: {
    initCustomizer(state, action: PayloadAction<Partial<CustomizerState> | undefined>) {
      const merged = { ...defaultCustomizerState, ...(action.payload ?? {}) };
      const { state: fixed, changes } = sanitizeCustomizer(merged);
      state.state = fixed;
      state.recentChanges = changes;
    },
    updateCustomizerField(
      state,
      action: PayloadAction<{
        key: keyof CustomizerState;
        value: CustomizerState[keyof CustomizerState];
      }>
    ) {
      const { key, value } = action.payload;
      const merged = { ...state.state, [key]: value };
      const { state: fixed, changes } = sanitizeCustomizer(merged);
      state.state = fixed;
      if (changes.length > 0) {
        state.recentChanges = changes;
      }
    },
    updateCustomizerPatch(state, action: PayloadAction<Partial<CustomizerState>>) {
      const merged = { ...state.state, ...action.payload };
      const { state: fixed, changes } = sanitizeCustomizer(merged);
      state.state = fixed;
      if (changes.length > 0) {
        state.recentChanges = changes;
      }
    },
    dismissCompatibilityChanges(state) {
      state.recentChanges = [];
    },
    resetCustomizer(state) {
      state.state = defaultCustomizerState;
      state.recentChanges = [];
    },
    loadCustomizerState(state, action: PayloadAction<CustomizerState>) {
      const { state: fixed, changes } = sanitizeCustomizer(action.payload);
      state.state = fixed;
      state.recentChanges = changes;
    },
  },
});

export const {
  initCustomizer,
  updateCustomizerField,
  updateCustomizerPatch,
  dismissCompatibilityChanges,
  resetCustomizer,
  loadCustomizerState,
} = customizerSlice.actions;

type CustomizerRoot = { customizer: CustomizerStateSlice };

export const selectCustomizerState = (state: CustomizerRoot) => state.customizer.state;
export const selectCustomizerPrice = (state: CustomizerRoot) =>
  getCustomizerPrice(state.customizer.state);
const selectRecentCompatibilityChanges = (state: CustomizerRoot) => state.customizer.recentChanges;
export const selectCompatibilityNotices = createSelector(
  [selectRecentCompatibilityChanges],
  (changes) => mapCompatibilityChanges(changes)
);

export default customizerSlice.reducer;
