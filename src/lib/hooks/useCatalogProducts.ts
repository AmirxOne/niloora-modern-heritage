"use client";

import { useCallback, useEffect, useState } from "react";
import type { Product } from "@/lib/types";

type CatalogResponse = {
  products: Product[];
  maxPrice: number;
};

export function useCatalogProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [maxPrice, setMaxPrice] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/products");
      if (!response.ok) return;
      const data = (await response.json()) as CatalogResponse;
      setProducts(data.products ?? []);
      setMaxPrice(data.maxPrice ?? 0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return {
    products,
    maxPrice,
    isLoading,
    loadProducts,
  };
}
