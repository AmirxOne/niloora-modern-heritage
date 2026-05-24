import type { Metadata } from "next";
import { PageTransition } from "@/components/layout/PageTransition";
import { buildPageMetadata } from "@/lib/seo/site";
import { RingSizeHelperClient } from "./RingSizeHelperClient";

export const metadata: Metadata = buildPageMetadata({
  title: "راهنمای سایز انگشتر",
  description:
    "ابزار تعاملی تعیین سایز انگشتر، جدول تبدیل کامل و نسخه چاپی برای اندازه‌گیری دقیق پیش از سفارش.",
  path: "/ring-size",
});

export default function RingSizePage() {
  return (
    <PageTransition>
      <div className="ring-size-page min-h-screen pb-24 pt-20 md:pt-24">
        <div className="site-container">
          <RingSizeHelperClient />
        </div>
      </div>
    </PageTransition>
  );
}
