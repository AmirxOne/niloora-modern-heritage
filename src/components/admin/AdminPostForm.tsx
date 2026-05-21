"use client";

import { fa } from "@/lib/i18n/fa";
import type { AdminPostFormValues } from "@/lib/admin/post-form";
import { SelectBox, TextAreaBox, TextBox } from "@/components/inputs";

const statusOptions = [
  { value: "draft", label: fa.admin.posts.statusDraft },
  { value: "published", label: fa.admin.posts.statusPublished },
];

type Props = {
  values: AdminPostFormValues;
  onChange: (values: AdminPostFormValues) => void;
  disabled?: boolean;
};

export function AdminPostForm({ values, onChange, disabled }: Props) {
  const set = <K extends keyof AdminPostFormValues>(key: K, value: AdminPostFormValues[K]) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <div className="grid gap-4">
      <TextBox
        label={fa.admin.posts.title}
        value={values.title}
        onChange={(e) => set("title", e.target.value)}
        disabled={disabled}
      />
      <TextBox
        label={fa.admin.posts.slug}
        value={values.slug}
        onChange={(e) => set("slug", e.target.value)}
        disabled={disabled}
        inputClassName="auth-input-ltr"
        placeholder="how-to-choose-gemstone"
      />
      <TextAreaBox
        label={fa.admin.posts.excerpt}
        value={values.excerpt}
        onChange={(e) => set("excerpt", e.target.value)}
        disabled={disabled}
        rows={2}
      />
      <TextBox
        label={fa.admin.posts.coverImage}
        value={values.coverImage}
        onChange={(e) => set("coverImage", e.target.value)}
        disabled={disabled}
        inputClassName="auth-input-ltr"
      />
      <TextBox
        label={fa.admin.posts.author}
        value={values.authorName}
        onChange={(e) => set("authorName", e.target.value)}
        disabled={disabled}
      />
      <SelectBox
        label={fa.admin.posts.status}
        value={values.status}
        options={statusOptions}
        disabled={disabled}
        onValueChange={(v) => set("status", v as AdminPostFormValues["status"])}
      />
      <TextBox
        label={fa.admin.posts.publishedAt}
        value={values.publishedAt}
        onChange={(e) => set("publishedAt", e.target.value)}
        disabled={disabled}
        inputClassName="auth-input-ltr"
        placeholder="2026-05-21T12:00"
      />
      <TextAreaBox
        label={fa.admin.posts.body}
        value={values.body}
        onChange={(e) => set("body", e.target.value)}
        disabled={disabled}
        rows={12}
      />
      <TextBox
        label={fa.admin.posts.metaTitle}
        value={values.metaTitle}
        onChange={(e) => set("metaTitle", e.target.value)}
        disabled={disabled}
      />
      <TextAreaBox
        label={fa.admin.posts.metaDescription}
        value={values.metaDescription}
        onChange={(e) => set("metaDescription", e.target.value)}
        disabled={disabled}
        rows={2}
      />
    </div>
  );
}
