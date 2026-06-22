"use client";

import Link from "next/link";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { fa } from "@/lib/i18n/fa";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useHomeDataContext } from "@/lib/context/HomeDataContext";

export function HomeReadings() {
  const { blogPosts: posts, isLoading } = useHomeDataContext();

  return (
    <section className="heritage-section-alt" aria-label={fa.home.readingsTitle}>
      <div className="site-container">
        <SectionHeading
          title={fa.home.readingsTitle}
          subtitle={fa.home.readingsSubtitle}
          className="!mb-6 md:!mb-8 [&_.mt-5]:!mt-4"
        />

        {isLoading ? (
          <div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
            aria-busy="true"
          >
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="sk h-64 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {posts.map((post) => (
              <BlogPostCard key={post.id} post={post} priority />
            ))}
          </div>
        )}

        <p className="mt-6 text-center text-sm md:mt-8">
          <Link href="/blog" className="text-turquoise-dark transition-colors hover:text-turquoise">
            {fa.home.readingsViewAll}
          </Link>
        </p>
      </div>
    </section>
  );
}
