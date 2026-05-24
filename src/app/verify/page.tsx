import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyClient } from "./VerifyClient";
import { fa } from "@/lib/i18n/fa";
import { buildPageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = buildPageMetadata({
  title: `${fa.verify.title} | ${fa.brand.name}`,
  description: fa.verify.subtitle,
  path: "/verify",
});

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="site-container py-24" />}>
      <VerifyClient />
    </Suspense>
  );
}
