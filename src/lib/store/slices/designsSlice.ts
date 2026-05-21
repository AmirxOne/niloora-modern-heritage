import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CustomizerState, SavedDesign } from "@/lib/types";
import { generateId } from "@/lib/utils";
import { loadJson, storageKeys } from "../storage";

interface DesignsState {
  designs: SavedDesign[];
  hydrated: boolean;
  /** True after login merge with server preferences (blocks premature PUT). */
  remoteMerged: boolean;
}

const initialState: DesignsState = {
  designs: [],
  hydrated: false,
  remoteMerged: false,
};

const designsSlice = createSlice({
  name: "designs",
  initialState,
  reducers: {
    hydrateDesigns(state) {
      state.designs = loadJson<SavedDesign[]>(storageKeys.designs, []);
      state.hydrated = true;
      state.remoteMerged = false;
    },
    setDesignsFromServer(state, action: PayloadAction<SavedDesign[]>) {
      state.designs = action.payload;
      state.hydrated = true;
      state.remoteMerged = true;
    },
    resetDesignsRemoteMerge(state) {
      state.remoteMerged = false;
    },
    saveDesign(
      state,
      action: PayloadAction<{
        name: string;
        customizerState: CustomizerState;
        price: number;
      }>
    ) {
      const { name, customizerState, price } = action.payload;
      const now = new Date().toISOString();
      const design: SavedDesign = {
        id: generateId(),
        name,
        state: customizerState,
        price,
        createdAt: now,
        updatedAt: now,
      };
      state.designs.unshift(design);
    },
    removeDesign(state, action: PayloadAction<string>) {
      state.designs = state.designs.filter((d) => d.id !== action.payload);
    },
  },
});

export const {
  hydrateDesigns,
  setDesignsFromServer,
  resetDesignsRemoteMerge,
  saveDesign,
  removeDesign,
} = designsSlice.actions;

type DesignsRoot = { designs: DesignsState };

export const selectSavedDesigns = (state: DesignsRoot) => state.designs.designs;
export const selectDesignsHydrated = (state: DesignsRoot) => state.designs.hydrated;
export const selectDesignsRemoteMerged = (state: DesignsRoot) => state.designs.remoteMerged;

export default designsSlice.reducer;
