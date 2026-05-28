"use client";

import { useCallback, useEffect, useState } from "react";
import { computeProductRating } from "../product-rating";
import type { ProductComment } from "../types";
import { apiFetch } from "@/lib/api/client-fetch";
import { useAuth } from "./useAuth";
import { parseJsonResponse } from "./fetch-utils";

type CommentDto = ProductComment;

export function useComments() {
  const auth = useAuth();
  const [pendingComments, setPendingComments] = useState<ProductComment[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isPendingLoading, setIsPendingLoading] = useState(true);
  const [canModerate, setCanModerate] = useState(false);

  const loadPending = useCallback(async () => {
    if (!auth.isLoggedIn) {
      setPendingComments([]);
      setIsPendingLoading(false);
      return;
    }
    setIsPendingLoading(true);
    try {
      const response = await apiFetch("/api/comments/pending");
      if (response.status === 401) {
        setPendingComments([]);
        setCanModerate(false);
        return;
      }
      if (!response.ok) return;
      const data = await parseJsonResponse<{ comments: CommentDto[] }>(response);
      setPendingComments(data?.comments ?? []);
      setCanModerate(true);
    } finally {
      setIsPendingLoading(false);
    }
  }, [auth.isLoggedIn]);

  useEffect(() => {
    setHydrated(true);
    loadPending();
  }, [loadPending]);

  const submit = useCallback(
    async (
      productId: string,
      authorName: string,
      body: string,
      rating: number,
      dimensionRatings?: {
        ratingBuildQuality: number;
        ratingBeauty: number;
        ratingValue: number;
        ratingPackaging: number;
      },
      media?: {
        mediaUrl?: string;
        mediaType?: "image" | "video";
      }
    ) => {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, authorName, body, rating, ...dimensionRatings, ...media }),
      });
      return response.ok;
    },
    []
  );

  const updateStatus = useCallback(async (id: string, action: "approve" | "reject") => {
    if (!canModerate) return;
    const response = await fetch(`/api/comments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (response.ok) {
      await loadPending();
      return true;
    }
    return false;
  }, [canModerate, loadPending]);

  const approve = useCallback((id: string) => updateStatus(id, "approve"), [updateStatus]);
  const reject = useCallback((id: string) => updateStatus(id, "reject"), [updateStatus]);

  return {
    pendingComments,
    pendingCount: pendingComments.length,
    hydrated,
    isPendingLoading,
    canModerate,
    submit,
    approve,
    reject,
  };
}

export function useProductComments(productId: string) {
  const [hydrated, setHydrated] = useState(false);
  const [approved, setApproved] = useState<ProductComment[]>([]);
  const [isApprovedLoading, setIsApprovedLoading] = useState(true);

  const loadApproved = useCallback(async () => {
    setIsApprovedLoading(true);
    try {
      const response = await fetch(
        `/api/comments?productId=${encodeURIComponent(productId)}&status=approved`
      );
      if (!response.ok) return;
      const data = await parseJsonResponse<{ comments: ProductComment[] }>(response);
      setApproved(data?.comments ?? []);
    } finally {
      setIsApprovedLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    setHydrated(true);
    loadApproved();
  }, [loadApproved]);

  const submit = useCallback(
    async (
      id: string,
      authorName: string,
      body: string,
      rating: number,
      dimensionRatings?: {
        ratingBuildQuality: number;
        ratingBeauty: number;
        ratingValue: number;
        ratingPackaging: number;
      },
      media?: {
        mediaUrl?: string;
        mediaType?: "image" | "video";
      }
    ) => {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id, authorName, body, rating, ...dimensionRatings, ...media }),
      });
      const success = response.ok;
      if (success) {
        await loadApproved();
      }
      return success;
    },
    [loadApproved]
  );

  const ratingSummary = computeProductRating(approved);

  return {
    approved,
    submit,
    hydrated,
    isApprovedLoading,
    ratingSummary,
  };
}
