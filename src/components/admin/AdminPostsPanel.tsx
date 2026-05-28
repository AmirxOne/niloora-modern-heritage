"use client";

import { useEffect, useState } from "react";
import { LoadingState } from "@/components/ui/loading/LoadingState";
import Link from "next/link";
import {
  adminPostFormToPayload,
  adminPostToForm,
  emptyAdminPostForm,
  type AdminPostFormValues,
} from "@/lib/admin/post-form";
import type { AdminPostRecord } from "@/lib/server/blog/post";
import { useAdminPosts } from "@/lib/hooks/useAdminPosts";
import { fa } from "@/lib/i18n/fa";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AdminPostForm } from "@/components/admin/AdminPostForm";
import {
  canTransitionPostStatus,
  canCreateContent,
  canDeleteContent,
  isPostEditableByRole,
} from "@/lib/auth/content-workflow";

export function AdminPostsPanel() {
  const admin = useAdminPosts();
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<AdminPostFormValues>(emptyAdminPostForm());

  useEffect(() => {
    if (admin.isWorkflowUser) void admin.loadPosts();
  }, [admin.isWorkflowUser, admin.loadPosts]);

  const startCreate = () => {
    if (!admin.canCreate) return;
    setMode("create");
    setEditingId(null);
    setFormValues(emptyAdminPostForm());
  };

  const startEdit = (post: AdminPostRecord) => {
    if (!isPostEditableByRole(admin.role, post.status)) return;
    setMode("edit");
    setEditingId(post.id);
    setFormValues(adminPostToForm(post));
  };

  const cancelForm = () => {
    setMode(null);
    setEditingId(null);
    setFormValues(emptyAdminPostForm());
  };

  const handleSubmit = async () => {
    const existing = mode === "edit" && editingId ? admin.posts.find((p) => p.id === editingId) : null;
    if (
      !canTransitionPostStatus(
        admin.role,
        mode === "create" ? "draft" : existing?.status,
        formValues.status
      )
    ) {
      return;
    }
    const payload = adminPostFormToPayload(formValues);
    if (mode === "create") {
      const created = await admin.createPost(payload);
      if (created) cancelForm();
      return;
    }
    if (mode === "edit" && editingId) {
      const updated = await admin.updatePost(editingId, payload);
      if (updated) setFormValues(adminPostToForm(updated));
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    if (!admin.canDelete) return;
    if (!window.confirm(fa.admin.posts.deleteConfirm)) return;
    const ok = await admin.deletePost(editingId);
    if (ok) cancelForm();
  };

  if (!admin.allowed) return null;

  return (
    <div className="admin-orders-panel">
      <div className="admin-orders-toolbar">
        <Button type="button" onClick={startCreate} disabled={!admin.canCreate}>
          {fa.admin.posts.add}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={admin.isLoading}
          onClick={() => void admin.loadPosts()}
        >
          {fa.admin.posts.refresh}
        </Button>
      </div>

      {mode ? (
        <section className="admin-order-card mb-6">
          <h2 className="admin-page-title text-lg">
            {mode === "create" ? fa.admin.posts.createTitle : fa.admin.posts.editTitle}
          </h2>
          <p className="mb-3 text-xs text-silver">
            {admin.role === "admin"
              ? fa.admin.posts.statusFlowHintAdmin
              : admin.role === "reviewer"
                ? fa.admin.posts.statusFlowHintReviewer
                : fa.admin.posts.statusFlowHintEditor}
          </p>
          <AdminPostForm values={formValues} onChange={setFormValues} disabled={admin.isSaving} />
          {mode === "create" && !canCreateContent(admin.role) ? (
            <p className="mt-2 text-xs text-copper">{fa.admin.posts.cannotCreate}</p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={
                admin.isSaving ||
                !canTransitionPostStatus(
                  admin.role,
                  mode === "create"
                    ? "draft"
                    : admin.posts.find((p) => p.id === editingId)?.status ?? "draft",
                  formValues.status
                )
              }
              onClick={() => void handleSubmit()}
            >
              {admin.isSaving ? fa.admin.posts.saving : fa.admin.posts.save}
            </Button>
            <Button type="button" variant="outline" onClick={cancelForm}>
              {fa.admin.posts.cancel}
            </Button>
            {mode === "edit" && formValues.status === "published" ? (
              <Link
                href={`/blog/${formValues.slug}`}
                target="_blank"
                className="inline-flex items-center text-sm text-turquoise-dark hover:text-turquoise"
              >
                {fa.admin.posts.preview}
              </Link>
            ) : null}
            {mode === "edit" ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="text-copper"
                  disabled={admin.isSaving || !admin.canDelete}
                  onClick={() => void handleDelete()}
                >
                  {fa.admin.posts.delete}
                </Button>
                {!canDeleteContent(admin.role) ? (
                  <p className="self-center text-xs text-copper">{fa.admin.posts.cannotDelete}</p>
                ) : null}
              </>
            ) : null}
          </div>
        </section>
      ) : null}

      {admin.isLoading ? (
        <LoadingState variant="admin-cards" />
      ) : admin.posts.length === 0 ? (
        <p className="admin-orders-empty">{fa.admin.posts.empty}</p>
      ) : (
        <ul className="admin-orders-list space-y-3">
          {admin.posts.map((post) => (
            <li key={post.id} className="admin-order-card">
              <div className="admin-order-card-header">
                <div>
                  <p className="admin-order-id font-mono text-xs" dir="ltr">
                    /blog/{post.slug}
                  </p>
                  <p className="admin-order-customer text-base font-medium text-ivory">
                    {post.title}
                  </p>
                </div>
                <Badge
                  variant={
                    post.status === "published"
                      ? "turquoise"
                      : post.status === "review"
                        ? "gold"
                        : "default"
                  }
                >
                  {post.status === "published"
                    ? fa.admin.posts.statusPublished
                    : post.status === "review"
                      ? fa.admin.posts.statusReview
                      : fa.admin.posts.statusDraft}
                </Badge>
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!isPostEditableByRole(admin.role, post.status)}
                  onClick={() => startEdit(post)}
                >
                  {fa.admin.posts.editTitle}
                </Button>
                {!isPostEditableByRole(admin.role, post.status) ? (
                  <span className="self-center text-xs text-silver">{fa.admin.posts.cannotEditStatus}</span>
                ) : null}
                {post.status === "published" ? (
                  <Link
                    href={`/blog/${post.slug}`}
                    target="_blank"
                    className="inline-flex items-center rounded-full border border-gold/20 px-3 py-1 text-xs text-turquoise-dark hover:text-turquoise"
                  >
                    {fa.admin.posts.preview}
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
