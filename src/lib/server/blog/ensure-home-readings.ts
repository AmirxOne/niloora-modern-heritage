import { HOME_READINGS_SEED_POSTS } from "@/lib/home/home-readings-posts";
import { prisma } from "@/lib/server/prisma";

/** اگر کمتر از چهار مقالهٔ منتشرشده باشد، چهار مقالهٔ خواندنی‌ها را upsert می‌کند. */
export async function ensureHomeReadingsPosts(): Promise<void> {
  for (const post of HOME_READINGS_SEED_POSTS) {
    const publishedAt = new Date(Date.now() - post.sortOrder * 86400000);

    await prisma.post.upsert({
      where: { slug: post.slug },
      create: {
        id: post.id,
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        body: post.body,
        coverImage: post.coverImage,
        authorName: post.authorName,
        status: "published",
        publishedAt,
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
      },
      update: {
        title: post.title,
        excerpt: post.excerpt,
        body: post.body,
        coverImage: post.coverImage,
        authorName: post.authorName,
        status: "published",
        publishedAt,
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
      },
    });
  }
}
