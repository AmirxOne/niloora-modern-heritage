import type { Metadata } from "next";
import { PageTransition } from "@/components/layout/PageTransition";
import { buildPageMetadata } from "@/lib/seo/site";
import { RingSizeHelperClient } from "./RingSizeHelperClient";

export const metadata: Metadata = buildPageMetadata({
  title: "راهنمای سایز انگشتر",
  description:
    "ابزار تعاملی تعیین سایز انگشتر و جدول تبدیل کامل برای انتخاب دقیق پیش از سفارش.",
  path: "/ring-size",
});

export default function RingSizePage() {
  return (
    <PageTransition>
      <div className="ring-size-page">
        <div className="site-container">
          <RingSizeHelperClient />
        </div>
      </div>
    </PageTransition>
  );
}
