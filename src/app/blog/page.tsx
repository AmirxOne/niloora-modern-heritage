import type { Metadata } from "next";
import Link from "next/link";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { PageTransition } from "@/components/layout/PageTransition";
import { PageHeader } from "@/components/ui/PageHeader";
import { fa } from "@/lib/i18n/fa";
import { buildPageMetadata } from "@/lib/seo/site";
import { listPublishedPosts } from "@/lib/server/blog/post-service";
import { UnifiedEmptyState } from "@/components/ui/UnifiedEmptyState";

export const metadata: Metadata = buildPageMetadata({
  title: `${fa.blog.title} | ${fa.brand.name}`,
  description: fa.blog.listDescription,
  path: "/blog",
});

export default async function BlogPage() {
  const posts = await listPublishedPosts();

  return (
    <PageTransition>
      <div className="blog-page pb-24 pt-20 md:pt-24">
        <div className="site-container">
          <div className="blog-page-shell">
            <PageHeader
              eyebrow={fa.nav.blog}
              title={fa.blog.title}
              subtitle={fa.blog.listDescription}
              className="blog-page-header"
            />

            {posts.length === 0 ? (
              <UnifiedEmptyState
                visual="blog"
                title={fa.blog.empty}
                className="blog-empty"
                action={
                  <Link href="/shop">
                    <span className="inline-flex items-center rounded-heritage-pill border border-gold/20 bg-white px-4 py-2 text-sm text-turquoise-dark transition-colors hover:text-turquoise">
                      {fa.blog.backToShop}
                    </span>
                  </Link>
                }
              />
            ) : (
              <div className="blog-grid">
                {posts.map((post) => (
                  <BlogPostCard key={post.id} post={post} />
                ))}
              </div>
            )}

            <div className="mt-12 text-center">
              <Link href="/shop" className="text-sm text-turquoise-dark hover:text-turquoise">
                {fa.blog.backToShop}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
