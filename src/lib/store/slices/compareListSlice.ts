import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { MAX_COMPARE_PRODUCTS, pushUniqueProductId } from "@/lib/product-lists/constants";
import { loadJson, storageKeys } from "../storage";

interface CompareListState {
  ids: string[];
  hydrated: boolean;
}

const initialState: CompareListState = {
  ids: [],
  hydrated: false,
};

function clampCompareIds(ids: string[]) {
  return ids.slice(0, MAX_COMPARE_PRODUCTS);
}

const compareListSlice = createSlice({
  name: "compareList",
  initialState,
  reducers: {
    hydrateCompareList(state) {
      if (state.hydrated) return;
      const stored = clampCompareIds(loadJson<string[]>(storageKeys.compareList, []));
      if (state.ids.length > 0) {
        const merged = [...stored];
        for (const id of state.ids) {
          if (!merged.includes(id)) merged.push(id);
        }
        state.ids = clampCompareIds(merged);
      } else {
        state.ids = stored;
      }
      state.hydrated = true;
    },
    setCompareListFromServer(state, action: PayloadAction<string[]>) {
      state.ids = clampCompareIds(action.payload);
      state.hydrated = true;
    },
    addToCompareList(state, action: PayloadAction<string>) {
      state.hydrated = true;
      state.ids = pushUniqueProductId(state.ids, action.payload, MAX_COMPARE_PRODUCTS);
    },
    removeFromCompareList(state, action: PayloadAction<string>) {
      state.hydrated = true;
      state.ids = state.ids.filter((id) => id !== action.payload);
    },
    clearCompareList(state) {
      state.hydrated = true;
      state.ids = [];
    },
  },
});

export const {
  hydrateCompareList,
  setCompareListFromServer,
  addToCompareList,
  removeFromCompareList,
  clearCompareList,
} = compareListSlice.actions;

type CompareListRoot = { compareList: CompareListState };

export const selectCompareListIds = (state: CompareListRoot) => state.compareList.ids;
export const selectCompareListHydrated = (state: CompareListRoot) => state.compareList.hydrated;
export const selectIsInCompareList =
  (productId: string) => (state: CompareListRoot) =>
    state.compareList.ids.includes(productId);

export default compareListSlice.reducer;
