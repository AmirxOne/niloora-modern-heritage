import type { Metadata } from "next";
import Link from "next/link";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { PageTransition } from "@/components/layout/PageTransition";
import { OrnamentalDivider } from "@/components/ui/OrnamentalDivider";
import { fa } from "@/lib/i18n/fa";
import { buildPageMetadata } from "@/lib/seo/site";
import { listPublishedPosts } from "@/lib/server/blog/post-service";

export const metadata: Metadata = buildPageMetadata({
  title: `${fa.blog.title} | ${fa.brand.name}`,
  description: fa.blog.listDescription,
  path: "/blog",
});

export default async function BlogPage() {
  const posts = await listPublishedPosts();

  return (
    <PageTransition>
      <div className="blog-page pb-24 pt-28 md:pt-32">
        <div className="site-container max-w-5xl">
          <header className="blog-page-header">
            <span className="heritage-eyebrow">{fa.nav.blog}</span>
            <h1 className="blog-page-title">{fa.blog.title}</h1>
            <p className="blog-page-subtitle">{fa.blog.listDescription}</p>
            <OrnamentalDivider className="mx-auto my-6 max-w-[12rem]" />
          </header>

          {posts.length === 0 ? (
            <p className="blog-empty">{fa.blog.empty}</p>
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
    </PageTransition>
  );
}
