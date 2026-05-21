import Link from "next/link";
import { PageTransition } from "@/components/layout/PageTransition";
import { Button } from "@/components/ui/Button";
import { fa } from "@/lib/i18n/fa";

export default function BlogPostNotFound() {
  return (
    <PageTransition>
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 pb-24 pt-36 text-center">
        <h1 className="font-display text-3xl text-ivory">{fa.blog.notFound}</h1>
        <Link href="/blog" className="mt-8">
          <Button variant="outline">{fa.blog.backToList}</Button>
        </Link>
      </div>
    </PageTransition>
  );
}
