import type { CartItem } from "@/lib/types";

export type CartRemovalReason = "not_found" | "sold" | "out_of_stock";

export type RemovedCartLine = {
  id: string;
  name: string;
  productId?: string;
  reason: CartRemovalReason;
  message: string;
};

export type AdjustedCartLine = {
  id: string;
  name: string;
  productId: string;
  previousQuantity: number;
  newQuantity: number;
  message: string;
};

export type SanitizeCartResult = {
  items: CartItem[];
  removed: RemovedCartLine[];
  adjusted: AdjustedCartLine[];
};
