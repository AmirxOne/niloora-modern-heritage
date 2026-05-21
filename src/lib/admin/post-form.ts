import type { AdminPostRecord } from "@/lib/server/blog/post";

export type AdminPostFormValues = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  coverImage: string;
  authorName: string;
  status: "draft" | "published";
  publishedAt: string;
  metaTitle: string;
  metaDescription: string;
};

export function emptyAdminPostForm(): AdminPostFormValues {
  return {
    slug: "",
    title: "",
    excerpt: "",
    body: "",
    coverImage: "",
    authorName: "کارگاه ابراهیم آذری",
    status: "draft",
    publishedAt: "",
    metaTitle: "",
    metaDescription: "",
  };
}

export function adminPostToForm(post: AdminPostRecord): AdminPostFormValues {
  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt ?? "",
    body: post.body,
    coverImage: post.coverImage ?? "",
    authorName: post.authorName ?? "",
    status: post.status,
    publishedAt: post.publishedAt
      ? new Date(post.publishedAt).toISOString().slice(0, 16)
      : "",
    metaTitle: post.metaTitle ?? "",
    metaDescription: post.metaDescription ?? "",
  };
}

export function adminPostFormToPayload(values: AdminPostFormValues) {
  return {
    slug: values.slug || values.title,
    title: values.title,
    excerpt: values.excerpt || null,
    body: values.body,
    coverImage: values.coverImage || null,
    authorName: values.authorName || null,
    status: values.status,
    publishedAt: values.publishedAt || null,
    metaTitle: values.metaTitle || null,
    metaDescription: values.metaDescription || null,
  };
}
