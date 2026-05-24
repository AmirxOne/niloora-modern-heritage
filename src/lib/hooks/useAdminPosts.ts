"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { AdminPostRecord } from "@/lib/server/blog/post";
import { useAuth } from "./useAuth";
import { parseJsonResponse } from "./fetch-utils";
import { canAccessContentWorkflow, canCreateContent, canDeleteContent } from "@/lib/auth/content-workflow";

export function useAdminPosts() {
  const auth = useAuth();
  const role = auth.user?.role;
  const isWorkflowUser = canAccessContentWorkflow(role);
  const canCreate = canCreateContent(role);
  const canDelete = canDeleteContent(role);
  const [posts, setPosts] = useState<AdminPostRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadPosts = useCallback(async () => {
    if (!isWorkflowUser) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/posts");
      if (!response.ok) {
        toast.error("دریافت مقالات انجام نشد.");
        return;
      }
      const data = await parseJsonResponse<{ posts: AdminPostRecord[] }>(response);
      setPosts(data?.posts ?? []);
    } finally {
      setIsLoading(false);
    }
  }, [isWorkflowUser]);

  const createPost = useCallback(
    async (payload: unknown) => {
      if (!canCreate) return null;
      setIsSaving(true);
      try {
        const response = await fetch("/api/admin/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await parseJsonResponse<{ post?: AdminPostRecord; message?: string }>(response);
        if (!response.ok || !data?.post) {
          toast.error(data?.message ?? "ثبت مقاله انجام نشد.");
          return null;
        }
        setPosts((prev) => [data.post!, ...prev]);
        toast.success("مقاله ثبت شد.");
        return data.post;
      } finally {
        setIsSaving(false);
      }
    },
    [canCreate]
  );

  const updatePost = useCallback(
    async (id: string, payload: unknown) => {
      if (!isWorkflowUser) return null;
      setIsSaving(true);
      try {
        const response = await fetch(`/api/admin/posts/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await parseJsonResponse<{ post?: AdminPostRecord; message?: string }>(response);
        if (!response.ok || !data?.post) {
          toast.error(data?.message ?? "ذخیره انجام نشد.");
          return null;
        }
        setPosts((prev) => prev.map((p) => (p.id === id ? data.post! : p)));
        toast.success("مقاله به‌روزرسانی شد.");
        return data.post;
      } finally {
        setIsSaving(false);
      }
    },
    [isWorkflowUser]
  );

  const deletePost = useCallback(
    async (id: string) => {
      if (!canDelete) return false;
      setIsSaving(true);
      try {
        const response = await fetch(`/api/admin/posts/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          toast.error("حذف انجام نشد.");
          return false;
        }
        setPosts((prev) => prev.filter((p) => p.id !== id));
        toast.success("مقاله حذف شد.");
        return true;
      } finally {
        setIsSaving(false);
      }
    },
    [canDelete]
  );

  return {
    role,
    isWorkflowUser,
    canCreate,
    canDelete,
    posts,
    isLoading,
    isSaving,
    loadPosts,
    createPost,
    updatePost,
    deletePost,
  };
}
