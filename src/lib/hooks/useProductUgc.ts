"use client";

import { useCallback, useEffect, useState } from "react";
import type { ProductUgcMedia, ProductUgcMediaAdmin, ProductUgcMediaType } from "@/lib/types";
import { parseJsonResponse } from "./fetch-utils";

type SubmitPayload = {
  productId: string;
  mediaUrl: string;
  mediaType: ProductUgcMediaType;
  caption?: string;
  orderId?: string;
};

export function useProductUgc(productId: string) {
  const [items, setItems] = useState<ProductUgcMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/ugc?productId=${encodeURIComponent(productId)}`);
      if (!response.ok) return;
      const data = await parseJsonResponse<{ items: ProductUgcMedia[] }>(response);
      setItems(data?.items ?? []);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = useCallback(async (payload: SubmitPayload) => {
    const response = await fetch("/api/ugc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return response.ok;
  }, []);

  return { items, isLoading, load, submit };
}

export function useMyUgc() {
  const [items, setItems] = useState<ProductUgcMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/ugc/my");
      if (!response.ok) return;
      const data = await parseJsonResponse<{ items: ProductUgcMedia[] }>(response);
      setItems(data?.items ?? []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { items, isLoading, load };
}

export function useAdminUgcModeration() {
  const [pendingItems, setPendingItems] = useState<ProductUgcMediaAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canModerate, setCanModerate] = useState(false);

  const loadPending = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/ugc/pending");
      if (response.status === 401) {
        setCanModerate(false);
        setPendingItems([]);
        return;
      }
      if (!response.ok) {
        setCanModerate(false);
        return;
      }
      const data = await parseJsonResponse<{ items: ProductUgcMediaAdmin[] }>(response);
      setPendingItems(data?.items ?? []);
      setCanModerate(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  const update = useCallback(
    async (id: string, action: "approve" | "reject") => {
      if (!canModerate) return false;
      const response = await fetch(`/api/admin/ugc/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) return false;
      await loadPending();
      return true;
    },
    [canModerate, loadPending]
  );

  return {
    pendingItems,
    isLoading,
    canModerate,
    approve: (id: string) => update(id, "approve"),
    reject: (id: string) => update(id, "reject"),
  };
}
