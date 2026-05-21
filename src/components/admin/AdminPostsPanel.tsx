"use client";

import { useEffect, useState } from "react";
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

export function AdminPostsPanel() {
  const admin = useAdminPosts();
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<AdminPostFormValues>(emptyAdminPostForm());

  useEffect(() => {
    if (admin.isAdmin) void admin.loadPosts();
  }, [admin.isAdmin, admin.loadPosts]);

  const startCreate = () => {
    setMode("create");
    setEditingId(null);
    setFormValues(emptyAdminPostForm());
  };

  const startEdit = (post: AdminPostRecord) => {
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
    if (!window.confirm(fa.admin.posts.deleteConfirm)) return;
    const ok = await admin.deletePost(editingId);
    if (ok) cancelForm();
  };

  if (!admin.isAdmin) {
    return (
      <div className="admin-orders-forbidden">
        <p className="text-ivory">{fa.admin.forbidden}</p>
      </div>
    );
  }

  return (
    <div className="admin-orders-panel">
      <div className="admin-orders-toolbar">
        <Button type="button" onClick={startCreate}>
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
          <AdminPostForm values={formValues} onChange={setFormValues} disabled={admin.isSaving} />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" disabled={admin.isSaving} onClick={() => void handleSubmit()}>
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
              <Button
                type="button"
                variant="outline"
                className="text-copper"
                disabled={admin.isSaving}
                onClick={() => void handleDelete()}
              >
                {fa.admin.posts.delete}
              </Button>
            ) : null}
          </div>
        </section>
      ) : null}

      {admin.isLoading ? (
        <p className="text-silver">{fa.admin.posts.loading}</p>
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
                <Badge variant={post.status === "published" ? "turquoise" : "default"}>
                  {post.status === "published"
                    ? fa.admin.posts.statusPublished
                    : fa.admin.posts.statusDraft}
                </Badge>
              </div>
              <div className="mt-3 flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => startEdit(post)}>
                  {fa.admin.posts.editTitle}
                </Button>
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
