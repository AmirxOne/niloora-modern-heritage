import type { Post } from "@prisma/client";
import { HOME_READINGS_SEED_POSTS } from "@/lib/home/home-readings-posts";
import { prisma } from "@/lib/server/prisma";
import { ensureHomeReadingsPosts } from "./ensure-home-readings";
import {
  isPostStatus,
  normalizePostSlug,
  type AdminPostRecord,
  type PostDetail,
  type PostListItem,
  type PostStatus,
} from "./post";

function mapListItem(row: Post): PostListItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    coverImage: row.coverImage,
    authorName: row.authorName,
    publishedAt: row.publishedAt?.toISOString() ?? null,
  };
}

function mapDetail(row: Post): PostDetail {
  return {
    ...mapListItem(row),
    body: row.body,
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    status: row.status as PostStatus,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapAdminPost(row: Post): AdminPostRecord {
  return mapDetail(row);
}

function publishedWhere() {
  return {
    status: "published",
    OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
  };
}

export async function listPublishedPosts(limit = 50): Promise<PostListItem[]> {
  const rows = await prisma.post.findMany({
    where: publishedWhere(),
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
  return rows.map(mapListItem);
}

/** چهار مقالهٔ بخش «خواندنی‌ها» — همیشه با ترتیب ثابت و تصویر بنر. */
export async function listHomeReadingsPosts(): Promise<PostListItem[]> {
  await ensureHomeReadingsPosts();
  const slugs = HOME_READINGS_SEED_POSTS.map((post) => post.slug);
  const rows = await prisma.post.findMany({
    where: { slug: { in: slugs }, ...publishedWhere() },
  });
  const bySlug = new Map(rows.map((row) => [row.slug, mapListItem(row)]));
  return HOME_READINGS_SEED_POSTS.flatMap((seed) => {
    const post = bySlug.get(seed.slug);
    if (!post) return [];
    return [{ ...post, coverImage: seed.coverImage }];
  });
}

export async function getPublishedPostBySlug(slug: string): Promise<PostDetail | null> {
  const normalized = normalizePostSlug(slug);
  const row = await prisma.post.findFirst({
    where: { ...publishedWhere(), slug: normalized },
  });
  return row ? mapDetail(row) : null;
}

export async function listAdminPosts(allowedStatuses?: string[]): Promise<AdminPostRecord[]> {
  const rows = await prisma.post.findMany({
    where:
      Array.isArray(allowedStatuses) && allowedStatuses.length > 0
        ? { status: { in: allowedStatuses } }
        : undefined,
    orderBy: [{ updatedAt: "desc" }],
  });
  return rows.map(mapAdminPost);
}

export type PostUpsertInput = {
  slug: string;
  title: string;
  excerpt?: string | null;
  body: string;
  coverImage?: string | null;
  authorName?: string | null;
  status: PostStatus;
  publishedAt?: Date | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
};

export type PostPublishValidationIssue =
  | "excerpt"
  | "coverImage"
  | "authorName"
  | "metaTitle"
  | "metaDescription";

const PUBLISH_VALIDATION_LABELS: Record<PostPublishValidationIssue, string> = {
  excerpt: "خلاصه مقاله",
  coverImage: "تصویر کاور",
  authorName: "نام نویسنده",
  metaTitle: "عنوان سئو",
  metaDescription: "توضیحات سئو",
};

export function listPrePublishIssues(input: PostUpsertInput): PostPublishValidationIssue[] {
  const issues: PostPublishValidationIssue[] = [];
  if (!input.excerpt?.trim()) issues.push("excerpt");
  if (!input.coverImage?.trim()) issues.push("coverImage");
  if (!input.authorName?.trim()) issues.push("authorName");
  if (!input.metaTitle?.trim()) issues.push("metaTitle");
  if (!input.metaDescription?.trim()) issues.push("metaDescription");
  return issues;
}

export function validatePrePublishRequirements(
  input: PostUpsertInput
): { ok: true } | { ok: false; message: string; missing: PostPublishValidationIssue[] } {
  if (input.status !== "published") return { ok: true };
  const missing = listPrePublishIssues(input);
  if (missing.length === 0) return { ok: true };
  const labels = missing.map((key) => PUBLISH_VALIDATION_LABELS[key]).join("، ");
  return {
    ok: false,
    message: `برای انتشار مقاله، تکمیل این موارد الزامی است: ${labels}.`,
    missing,
  };
}

export async function createPost(input: PostUpsertInput) {
  return prisma.post.create({
    data: {
      slug: normalizePostSlug(input.slug),
      title: input.title.trim(),
      excerpt: input.excerpt?.trim() || null,
      body: input.body.trim(),
      coverImage: input.coverImage?.trim() || null,
      authorName: input.authorName?.trim() || null,
      status: input.status,
      publishedAt: input.status === "published" ? input.publishedAt ?? new Date() : null,
      metaTitle: input.metaTitle?.trim() || null,
      metaDescription: input.metaDescription?.trim() || null,
    },
  });
}

export async function updatePost(id: string, input: PostUpsertInput) {
  return prisma.post.update({
    where: { id },
    data: {
      slug: normalizePostSlug(input.slug),
      title: input.title.trim(),
      excerpt: input.excerpt?.trim() || null,
      body: input.body.trim(),
      coverImage: input.coverImage?.trim() || null,
      authorName: input.authorName?.trim() || null,
      status: input.status,
      publishedAt:
        input.status === "published"
          ? input.publishedAt ?? new Date()
          : null,
      metaTitle: input.metaTitle?.trim() || null,
      metaDescription: input.metaDescription?.trim() || null,
    },
  });
}

export async function deletePost(id: string) {
  return prisma.post.delete({ where: { id } });
}

export function parseAdminPostBody(body: unknown):
  | { ok: true; data: PostUpsertInput }
  | { ok: false; message: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, message: "بدنهٔ درخواست نامعتبر است." };
  }
  const b = body as Record<string, unknown>;
  const title = typeof b.title === "string" ? b.title.trim() : "";
  const slugRaw = typeof b.slug === "string" ? b.slug : title;
  const slug = normalizePostSlug(slugRaw);
  const postBody = typeof b.body === "string" ? b.body.trim() : "";
  const status = typeof b.status === "string" ? b.status : "draft";

  if (!title) return { ok: false, message: "عنوان مقاله الزامی است." };
  if (!slug) return { ok: false, message: "نامک (slug) معتبر نیست." };
  if (!postBody) return { ok: false, message: "متن مقاله الزامی است." };
  if (!isPostStatus(status)) {
    return { ok: false, message: "وضعیت انتشار نامعتبر است." };
  }

  let publishedAt: Date | null = null;
  if (typeof b.publishedAt === "string" && b.publishedAt.trim()) {
    const parsed = new Date(b.publishedAt);
    if (!Number.isNaN(parsed.getTime())) publishedAt = parsed;
  }

  return {
    ok: true,
    data: {
      slug,
      title,
      excerpt: typeof b.excerpt === "string" ? b.excerpt : null,
      body: postBody,
      coverImage: typeof b.coverImage === "string" ? b.coverImage : null,
      authorName: typeof b.authorName === "string" ? b.authorName : null,
      status,
      publishedAt: status === "published" ? publishedAt : null,
      metaTitle: typeof b.metaTitle === "string" ? b.metaTitle : null,
      metaDescription: typeof b.metaDescription === "string" ? b.metaDescription : null,
    },
  };
}
