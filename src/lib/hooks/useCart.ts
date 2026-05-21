"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  validateCartAddOnServer,
  validateCartItemsOnServer,
} from "@/lib/cart/validate-cart-client";
import type { CartItem, CustomizerState, ProductAvailability } from "../types";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  setCartOpen,
  addCartItem,
  addProductToCart,
  addCustomDesignToCart,
  removeCartItem,
  updateCartItemQuantity,
  clearCart,
  selectCartItems,
  selectCartIsOpen,
  selectCartTotal,
  selectCartCount,
  selectCartHydrated,
} from "../store/slices/cartSlice";

export type AddProductOptions = {
  name?: string;
  price?: number;
  image?: string;
  availability?: ProductAvailability;
  /** پیش‌فرض true؛ برای مرور در صفحهٔ اصلی false تا بلافاصله به سبد نرود */
  navigateToCart?: boolean;
};

export function useCart() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const isOpen = useAppSelector(selectCartIsOpen);
  const total = useAppSelector(selectCartTotal);
  const count = useAppSelector(selectCartCount);
  const hydrated = useAppSelector(selectCartHydrated);

  const setIsOpen = useCallback(
    (open: boolean) => dispatch(setCartOpen(open)),
    [dispatch]
  );

  const addItem = useCallback(
    (item: Omit<CartItem, "id" | "quantity"> & { quantity?: number }) => {
      dispatch(addCartItem(item));
      toast.success("آیتم به سبد خرید اضافه شد.");
    },
    [dispatch]
  );

  const addProduct = useCallback(
    async (productId: string, options?: AddProductOptions) => {
      let product: {
        id: string;
        name: string;
        image: string;
        availability: ProductAvailability;
        price: number;
        listPrice?: number;
        discountPercent?: number;
      } | null = null;
      if (!options?.name || !options?.image || !options?.availability || options?.price == null) {
        const response = await fetch(`/api/products/${encodeURIComponent(productId)}`);
        if (response.ok) {
          const data = (await response.json()) as {
            product?: {
              id: string;
              name: string;
              image: string;
              availability: ProductAvailability;
              price: number;
              listPrice?: number;
              discountPercent?: number;
            };
          };
          if (data.product) {
            product = data.product;
          }
        }
      }

      const validation = await validateCartAddOnServer({
        productId,
        quantity: 1,
        existingItems: items,
      });
      if (!validation.ok) {
        toast.error(validation.message);
        return;
      }

      const pricing = product
        ? {
            salePrice: product.price,
            listPrice: product.listPrice ?? product.price,
            furoohAmount: (product.listPrice ?? product.price) - product.price,
            furoohPercent: product.discountPercent ?? 0,
            hasProductFurooh: Boolean(product.discountPercent && product.discountPercent > 0),
          }
        : null;
      const resolved = options?.availability ?? product?.availability ?? "ready";
      dispatch(
        addProductToCart({
          productId,
          name: options?.name ?? product?.name ?? "",
          price: pricing?.salePrice ?? options?.price ?? 0,
          listPrice: pricing?.listPrice,
          image: options?.image ?? product?.image ?? "",
          availability: resolved,
        })
      );
      toast.success("محصول به سبد خرید اضافه شد.");
      if (options?.navigateToCart !== false) {
        router.push("/cart");
      }
    },
    [dispatch, router, items]
  );

  const addCustomDesign = useCallback(
    (name: string, price: number, state: CustomizerState) => {
      dispatch(addCustomDesignToCart({ name, price, customizerState: state }));
      toast.success("طرح سفارشی به سبد خرید اضافه شد.");
      router.push("/cart");
    },
    [dispatch, router]
  );

  const removeItem = useCallback(
    (id: string) => {
      dispatch(removeCartItem(id));
      toast.info("آیتم از سبد خرید حذف شد.");
    },
    [dispatch]
  );

  const updateQuantity = useCallback(
    async (id: string, quantity: number) => {
      if (quantity < 1) return;
      const line = items.find((i) => i.id === id);
      if (!line) return;

      const draft = items.map((i) =>
        i.id === id ? { ...i, quantity } : { ...i }
      );
      const validation = await validateCartItemsOnServer(draft);
      if (!validation.ok) {
        toast.error(validation.message);
        return;
      }

      dispatch(updateCartItemQuantity({ id, quantity }));
    },
    [dispatch, items]
  );

  const clearCartFn = useCallback(() => {
    dispatch(clearCart());
    toast.info("سبد خرید خالی شد.");
  }, [dispatch]);

  return {
    items,
    total,
    count,
    isOpen,
    setIsOpen,
    addItem,
    addProduct,
    addCustomDesign,
    removeItem,
    updateQuantity,
    clearCart: clearCartFn,
    hydrated,
  };
}
