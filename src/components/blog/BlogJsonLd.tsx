import { absoluteUrl } from "@/lib/seo/site";
import { buildArticleJsonLd, buildBreadcrumbJsonLd } from "@/lib/seo/structured-data";
import type { PostDetail } from "@/lib/server/blog/post";

export function BlogJsonLd({ post }: { post: PostDetail }) {
  const article = buildArticleJsonLd({
    title: post.title,
    description: post.metaDescription ?? post.excerpt ?? post.title,
    path: `/blog/${post.slug}`,
    image: post.coverImage,
    publishedAt: post.publishedAt ?? post.createdAt,
    updatedAt: post.updatedAt,
    authorName: post.authorName,
  });
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "خانه", path: "/" },
    { name: "بلاگ", path: "/blog" },
    { name: post.title, path: `/blog/${post.slug}` },
  ]);
  const payload = [article, breadcrumb];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
