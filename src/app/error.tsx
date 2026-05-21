"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="site-container flex min-h-[50vh] flex-col items-center justify-center py-20 text-center">
      <h1 className="font-display text-2xl text-ivory">مشکلی پیش آمد</h1>
      <p className="mt-3 max-w-md text-sm text-silver">
        این خطا برای بررسی ثبت شد. می‌توانید دوباره تلاش کنید یا به صفحهٔ اصلی بازگردید.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={() => reset()}>
          تلاش مجدد
        </Button>
        <Link href="/">
          <Button variant="outline">صفحه اصلی</Button>
        </Link>
      </div>
    </div>
  );
}
