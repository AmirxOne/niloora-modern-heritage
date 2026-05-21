"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-matte" aria-hidden />}>
      <LoginPageRedirect />
    </Suspense>
  );
}

function LoginPageRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const redirect = searchParams.get("redirect");
    const nextUrl = redirect
      ? `/auth?redirect=${encodeURIComponent(redirect)}`
      : "/auth";
    router.replace(nextUrl);
  }, [router, searchParams]);

  return <div className="min-h-screen bg-matte" aria-hidden />;
}
