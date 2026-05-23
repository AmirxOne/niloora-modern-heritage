import type { MetadataRoute } from "next";
import { serverLogger } from "@/lib/observability/logger";
import { absoluteUrl } from "@/lib/seo/site";
import { listPublishedPosts } from "@/lib/server/blog/post-service";
import { listProductIdsForSitemap } from "@/lib/server/products/product-page";
import { prisma } from "@/lib/server/prisma";
import { listAllArtisans } from "@/lib/artisans";
import { listStoneGuides } from "@/lib/stones";

const STATIC_PATHS: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/shop", priority: 0.9, changeFrequency: "daily" },
  { path: "/about", priority: 0.75, changeFrequency: "monthly" },
  { path: "/artisans", priority: 0.72, changeFrequency: "weekly" },
  { path: "/blog", priority: 0.7, changeFrequency: "weekly" },
  { path: "/customize", priority: 0.8, changeFrequency: "monthly" },
  { path: "/pre-owned", priority: 0.75, changeFrequency: "weekly" },
  { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
  { path: "/faq", priority: 0.5, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.4, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.4, changeFrequency: "yearly" },
  { path: "/returns", priority: 0.4, changeFrequency: "yearly" },
  { path: "/support", priority: 0.45, changeFrequency: "monthly" },
  { path: "/stones", priority: 0.7, changeFrequency: "weekly" },
];

async function listBlogSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const posts = await listPublishedPosts(500);
    return posts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: post.publishedAt ? new Date(post.publishedAt) : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch (error) {
    serverLogger.warn("sitemap_blog_posts_skipped", { route: "/sitemap.xml" }, error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const artisans = listAllArtisans();
  const stones = listStoneGuides();
  const [products, collections, blogEntries] = await Promise.all([
    listProductIdsForSitemap(),
    prisma.collection.findMany({ select: { id: true } }),
    listBlogSitemapEntries(),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((entry) => ({
    url: absoluteUrl(entry.path),
    lastModified: new Date(),
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));

  const collectionEntries: MetadataRoute.Sitemap = collections.map((collection) => ({
    url: absoluteUrl(`/shop?collection=${encodeURIComponent(collection.id)}`),
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.65,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: absoluteUrl(`/product/${product.id}`),
    lastModified: product.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const artisanEntries: MetadataRoute.Sitemap = artisans.map((artisan) => ({
    url: absoluteUrl(`/artisans/${artisan.slug}`),
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.62,
  }));

  const stoneEntries: MetadataRoute.Sitemap = stones.map((stone) => ({
    url: absoluteUrl(`/stones/${stone.slug}`),
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.64,
  }));

  return [...staticEntries, ...collectionEntries, ...productEntries, ...artisanEntries, ...stoneEntries, ...blogEntries];
}
