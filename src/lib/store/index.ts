import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./slices/cartSlice";
import wishlistReducer from "./slices/wishlistSlice";
import designsReducer from "./slices/designsSlice";
import promoReducer from "./slices/promoSlice";
import productSalesReducer from "./slices/productSalesSlice";
import authReducer from "./slices/authSlice";
import compareListReducer from "./slices/compareListSlice";
import recentlyViewedReducer from "./slices/recentlyViewedSlice";
import customizerReducer from "./slices/customizerSlice";
import { persistMiddleware } from "./middleware/persistMiddleware";

export const makeStore = () =>
  configureStore({
    reducer: {
      cart: cartReducer,
      wishlist: wishlistReducer,
      designs: designsReducer,
      promo: promoReducer,
      productSales: productSalesReducer,
      auth: authReducer,
      compareList: compareListReducer,
      recentlyViewed: recentlyViewedReducer,
      customizer: customizerReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [],
        },
      }).concat(persistMiddleware),
    devTools: process.env.NODE_ENV !== "production",
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
