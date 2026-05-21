"use client";

import { useMemo } from "react";
import type { Product } from "@/lib/types";
import { useCatalogProducts } from "./useCatalogProducts";

/** Resolve catalog products by id list, preserving caller order. */
export function useProductsByIds(ids: string[]): Product[] {
  const { products } = useCatalogProducts();

  return useMemo(() => {
    if (ids.length === 0) return [];
    const byId = new Map(products.map((p) => [p.id, p]));
    return ids.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p));
  }, [ids, products]);
}
