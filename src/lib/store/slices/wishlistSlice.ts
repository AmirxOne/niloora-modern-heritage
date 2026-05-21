import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { loadJson, storageKeys } from "../storage";

interface WishlistState {
  ids: string[];
  hydrated: boolean;
}

const initialState: WishlistState = {
  ids: [],
  hydrated: false,
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    hydrateWishlist(state) {
      state.ids = loadJson<string[]>(storageKeys.wishlist, []);
      state.hydrated = true;
    },
    setWishlistFromServer(state, action: PayloadAction<string[]>) {
      state.ids = action.payload;
      state.hydrated = true;
    },
    toggleWishlist(state, action: PayloadAction<string>) {
      const id = action.payload;
      if (state.ids.includes(id)) {
        state.ids = state.ids.filter((i) => i !== id);
      } else {
        state.ids.push(id);
      }
    },
    removeFromWishlist(state, action: PayloadAction<string>) {
      state.ids = state.ids.filter((i) => i !== action.payload);
    },
  },
});

export const { hydrateWishlist, setWishlistFromServer, toggleWishlist, removeFromWishlist } =
  wishlistSlice.actions;

type WishlistRoot = { wishlist: WishlistState };

export const selectWishlistIds = (state: WishlistRoot) => state.wishlist.ids;
export const selectWishlistHydrated = (state: WishlistRoot) => state.wishlist.hydrated;
export const selectIsWishlisted =
  (productId: string) => (state: WishlistRoot) =>
    state.wishlist.ids.includes(productId);

export default wishlistSlice.reducer;
