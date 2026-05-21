import Image from "next/image";
import Link from "next/link";
import type { PostListItem } from "@/lib/server/blog/post";
import { fa } from "@/lib/i18n/fa";

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function BlogPostCard({ post }: { post: PostListItem }) {
  return (
    <article className="blog-card">
      <Link href={`/blog/${post.slug}`} className="blog-card-link">
        {post.coverImage ? (
          <div className="blog-card-image">
            <Image
              src={post.coverImage}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
            />
          </div>
        ) : (
          <div className="blog-card-image blog-card-image--placeholder" aria-hidden />
        )}
        <div className="blog-card-body">
          <p className="blog-card-meta">
            {post.authorName ? `${post.authorName} · ` : null}
            {formatDate(post.publishedAt)}
          </p>
          <h2 className="blog-card-title">{post.title}</h2>
          {post.excerpt ? <p className="blog-card-excerpt">{post.excerpt}</p> : null}
          <span className="blog-card-cta">{fa.blog.readMore}</span>
        </div>
      </Link>
    </article>
  );
}
