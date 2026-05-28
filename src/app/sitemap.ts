import type { MetadataRoute } from "next";
import { serverLogger } from "@/lib/observability/logger";
import { absoluteUrl } from "@/lib/seo/site";
import { listPublishedPosts } from "@/lib/server/blog/post-service";
import { listProductIdsForSitemap } from "@/lib/server/products/product-page";
import { getCatalogProducts } from "@/lib/server/products";
import { prisma } from "@/lib/server/prisma";
import { listArtisansForCatalog } from "@/lib/artisans";
import { listStoneGuidesForCatalog } from "@/lib/stones";
import { listShopLandingParams, shopLandingPath } from "@/lib/seo/landing-pages";
import { listStoneCompareParams } from "@/lib/seo/stone-compare";

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
  { path: "/workshop-transparency", priority: 0.6, changeFrequency: "monthly" },
  { path: "/verify", priority: 0.6, changeFrequency: "weekly" },
  { path: "/stones", priority: 0.7, changeFrequency: "weekly" },
  { path: "/guide/buying", priority: 0.72, changeFrequency: "weekly" },
  { path: "/ring-size", priority: 0.65, changeFrequency: "monthly" },
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
  const landingPages = listShopLandingParams();
  const stoneComparePages = listStoneCompareParams();
  const [catalog, products, collections, blogEntries] = await Promise.all([
    getCatalogProducts(),
    listProductIdsForSitemap(),
    prisma.collection.findMany({ select: { id: true } }),
    listBlogSitemapEntries(),
  ]);
  const artisans = listArtisansForCatalog(catalog);
  const stones = listStoneGuidesForCatalog(catalog);

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

  const landingEntries: MetadataRoute.Sitemap = landingPages.map((entry) => ({
    url: absoluteUrl(shopLandingPath(entry.facet, entry.slug)),
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.68,
  }));

  const stoneCompareEntries: MetadataRoute.Sitemap = stoneComparePages.map((entry) => ({
    url: absoluteUrl(`/compare/stone/${entry.pair}`),
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.66,
  }));

  return [
    ...staticEntries,
    ...collectionEntries,
    ...productEntries,
    ...artisanEntries,
    ...stoneEntries,
    ...landingEntries,
    ...stoneCompareEntries,
    ...blogEntries,
  ];
}
