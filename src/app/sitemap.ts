import type { MetadataRoute } from "next";
// Marketplace catalog changes with seller/product status — keep the
// sitemap dynamic instead of statically cached at build time.
export const dynamic = "force-dynamic";
import { serverLogger } from "@/lib/observability/logger";
import { absoluteUrl } from "@/lib/seo/site";
import { listPublishedPosts } from "@/lib/server/blog/post-service";
import { listProductIdsForSitemap } from "@/lib/server/products/product-page";

const STATIC_PATHS: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/shop", priority: 0.9, changeFrequency: "daily" },
  { path: "/about", priority: 0.75, changeFrequency: "monthly" },
  { path: "/blog", priority: 0.7, changeFrequency: "weekly" },
  { path: "/customize", priority: 0.8, changeFrequency: "monthly" },
  { path: "/pre-owned", priority: 0.75, changeFrequency: "weekly" },
  { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
  { path: "/faq", priority: 0.5, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.4, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.4, changeFrequency: "yearly" },
  { path: "/returns", priority: 0.4, changeFrequency: "yearly" },
  { path: "/support", priority: 0.45, changeFrequency: "monthly" },
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
  const [products, blogEntries] = await Promise.all([
    listProductIdsForSitemap(),
    listBlogSitemapEntries(),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((entry) => ({
    url: absoluteUrl(entry.path),
    // stable timestamp: blog list reflects the newest published post
    lastModified:
      blogEntries[0]?.lastModified ??
      products[0]?.updatedAt ??
      new Date(),
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));

  // NOTE: collection filter URLs (`/shop?collection=…`) are intentionally
  // NOT in the sitemap: they are filter permutations of /shop with a
  // canonical pointing to /shop. Only the canonical /shop is listed above.

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: absoluteUrl(`/product/${product.id}`),
    lastModified: product.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticEntries, ...productEntries, ...blogEntries];
}
