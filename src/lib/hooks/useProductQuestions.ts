"use client";

import { apiFetch } from "@/lib/api/client-fetch";
import { useCallback, useEffect, useState } from "react";
import type { ProductQuestion } from "@/lib/types";
import { isAuthDenied, parseJsonResponse } from "./fetch-utils";

export interface PendingProductQuestionAnswer {
  id: string;
  questionId: string;
  authorName: string;
  body: string;
  status: "pending" | "approved" | "rejected";
  isOfficial: boolean;
  createdAt: string;
  productId: string;
  questionBody: string;
  questionAuthorName: string;
}

export function useProductQuestions(
  productId: string,
  initialApproved?: ProductQuestion[]
) {
  const [hydrated, setHydrated] = useState(false);
  const [approved, setApproved] = useState<ProductQuestion[]>(initialApproved ?? []);
  const [isLoading, setIsLoading] = useState(initialApproved == null);

  const loadApproved = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setIsLoading(true);
    }
    try {
      const response = await fetch(
        `/api/product-questions?productId=${encodeURIComponent(productId)}`,
        { cache: "no-store" }
      );
      if (!response.ok) return;
      const data = await parseJsonResponse<{ questions: ProductQuestion[] }>(response);
      setApproved(data?.questions ?? []);
    } finally {
      if (!options?.silent) {
        setIsLoading(false);
      }
    }
  }, [productId]);

  useEffect(() => {
    if (initialApproved != null) {
      setApproved(initialApproved);
      setIsLoading(false);
    }
  }, [initialApproved]);

  useEffect(() => {
    setHydrated(true);
    void loadApproved({ silent: initialApproved != null });
  }, [initialApproved, loadApproved]);

  const submitQuestion = useCallback(
    async (authorName: string, body: string) => {
      const response = await apiFetch("/api/product-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, authorName, body }),
      });
      return response.ok;
    },
    [productId]
  );

  const submitAnswer = useCallback(
    async (questionId: string, authorName: string, body: string) => {
      const response = await apiFetch(
        `/api/product-questions/${encodeURIComponent(questionId)}/answers`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ authorName, body }),
        }
      );
      const success = response.ok;
      if (success) {
        await loadApproved();
      }
      return success;
    },
    [loadApproved]
  );

  return {
    approved,
    submitQuestion,
    submitAnswer,
    hydrated,
    isLoading,
    count: approved.length,
  };
}

export function useProductQuestionsModeration() {
  const [pendingQuestions, setPendingQuestions] = useState<ProductQuestion[]>([]);
  const [pendingAnswers, setPendingAnswers] = useState<PendingProductQuestionAnswer[]>([]);
  const [isPendingLoading, setIsPendingLoading] = useState(true);
  const [canModerate, setCanModerate] = useState(false);

  const loadPending = useCallback(async () => {
    setIsPendingLoading(true);
    try {
      const response = await apiFetch("/api/product-questions/pending");
      if (isAuthDenied(response)) {
        setCanModerate(false);
        setPendingQuestions([]);
        setPendingAnswers([]);
        return;
      }
      if (!response.ok) {
        setCanModerate(false);
        return;
      }
      const data = await parseJsonResponse<{
        questions: ProductQuestion[];
        answers: PendingProductQuestionAnswer[];
      }>(response);
      setPendingQuestions(data?.questions ?? []);
      setPendingAnswers(data?.answers ?? []);
      setCanModerate(true);
    } finally {
      setIsPendingLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  const updateQuestionStatus = useCallback(
    async (id: string, action: "approve" | "reject") => {
      if (!canModerate) return false;
      const response = await apiFetch(`/api/product-questions/${id}`, {
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

  const updateAnswerStatus = useCallback(
    async (id: string, action: "approve" | "reject") => {
      if (!canModerate) return false;
      const response = await apiFetch(`/api/product-questions/answers/${id}`, {
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
    pendingQuestions,
    pendingAnswers,
    pendingTotal: pendingQuestions.length + pendingAnswers.length,
    isPendingLoading,
    canModerate,
    approveQuestion: (id: string) => updateQuestionStatus(id, "approve"),
    rejectQuestion: (id: string) => updateQuestionStatus(id, "reject"),
    approveAnswer: (id: string) => updateAnswerStatus(id, "approve"),
    rejectAnswer: (id: string) => updateAnswerStatus(id, "reject"),
  };
}
