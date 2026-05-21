import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { MAX_RECENTLY_VIEWED, pushUniqueProductId } from "@/lib/product-lists/constants";
import { loadJson, storageKeys } from "../storage";

interface RecentlyViewedState {
  ids: string[];
  hydrated: boolean;
}

const initialState: RecentlyViewedState = {
  ids: [],
  hydrated: false,
};

const recentlyViewedSlice = createSlice({
  name: "recentlyViewed",
  initialState,
  reducers: {
    hydrateRecentlyViewed(state) {
      state.ids = loadJson<string[]>(storageKeys.recentlyViewed, []);
      state.hydrated = true;
    },
    setRecentlyViewedFromServer(state, action: PayloadAction<string[]>) {
      state.ids = action.payload;
      state.hydrated = true;
    },
    recordProductView(state, action: PayloadAction<string>) {
      state.ids = pushUniqueProductId(state.ids, action.payload, MAX_RECENTLY_VIEWED);
    },
    removeRecentlyViewed(state, action: PayloadAction<string>) {
      state.ids = state.ids.filter((id) => id !== action.payload);
    },
    clearRecentlyViewed(state) {
      state.ids = [];
    },
  },
});

export const {
  hydrateRecentlyViewed,
  setRecentlyViewedFromServer,
  recordProductView,
  removeRecentlyViewed,
  clearRecentlyViewed,
} = recentlyViewedSlice.actions;

type RecentlyViewedRoot = { recentlyViewed: RecentlyViewedState };

export const selectRecentlyViewedIds = (state: RecentlyViewedRoot) => state.recentlyViewed.ids;
export const selectRecentlyViewedHydrated = (state: RecentlyViewedRoot) =>
  state.recentlyViewed.hydrated;

export default recentlyViewedSlice.reducer;
