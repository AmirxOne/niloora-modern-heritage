import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogJsonLd } from "@/components/blog/BlogJsonLd";
import { PostBody } from "@/components/blog/PostBody";
import { PageTransition } from "@/components/layout/PageTransition";
import { fa } from "@/lib/i18n/fa";
import { buildPageMetadata } from "@/lib/seo/site";
import {
  getPublishedPostBySlug,
  listPublishedPosts,
} from "@/lib/server/blog/post-service";

export async function generateStaticParams() {
  const posts = await listPublishedPosts(100);
  return posts.map((post) => ({ slug: post.slug }));
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) {
    return { title: fa.blog.notFound };
  }

  // Brand name is appended by the root title template — keep this bare.
  const title = post.metaTitle ?? post.title;
  const description = post.metaDescription ?? post.excerpt ?? post.title.slice(0, 160);

  return buildPageMetadata({
    title,
    description,
    path: `/blog/${post.slug}`,
    image: post.coverImage,
    ogType: "article",
    article: {
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt ?? undefined,
      authors: post.authorName ? [post.authorName] : undefined,
    },
  });
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) notFound();

  return (
    <PageTransition>
      <BlogJsonLd post={post} />
      <article className="blog-article pb-24 pt-20 md:pt-24">
        <div className="site-container max-w-3xl">
          <nav className="blog-breadcrumb" aria-label="مسیر">
            <Link href="/">{fa.nav.home}</Link>
            <span aria-hidden>/</span>
            <Link href="/blog">{fa.nav.blog}</Link>
            <span aria-hidden>/</span>
            <span>{post.title}</span>
          </nav>

          <header className="blog-article-header">
            <p className="blog-article-meta">
              {post.authorName ? `${post.authorName} · ` : null}
              {formatDate(post.publishedAt)}
            </p>
            <h1 className="blog-article-title">{post.title}</h1>
            {post.excerpt ? <p className="blog-article-excerpt">{post.excerpt}</p> : null}
          </header>

          {post.coverImage ? (
            <div className="blog-article-cover">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
              />
            </div>
          ) : null}

          <PostBody body={post.body} />

          <footer className="blog-article-footer">
            <Link href="/blog" className="text-turquoise-dark hover:text-turquoise">
              {fa.blog.backToList}
            </Link>
          </footer>
        </div>
      </article>
    </PageTransition>
  );
}
