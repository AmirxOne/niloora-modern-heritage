"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="fa" dir="rtl">
      <body className="min-h-screen bg-matte px-6 py-20 text-center text-ivory">
        <h1 className="font-display text-2xl">خطای غیرمنتظره</h1>
        <p className="mt-4 text-sm text-silver">
          مشکل گزارش شد. لطفاً صفحه را دوباره بارگذاری کنید یا بعداً تلاش کنید.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-8 rounded-heritage border border-gold/30 bg-parchment/20 px-6 py-2 text-sm text-gold-dark hover:border-gold/50"
        >
          تلاش مجدد
        </button>
      </body>
    </html>
  );
}
