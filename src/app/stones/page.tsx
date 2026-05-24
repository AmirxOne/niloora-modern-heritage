import type { Metadata } from "next";
import Link from "next/link";
import { PageTransition } from "@/components/layout/PageTransition";
import { listStoneGuides } from "@/lib/stones";
import { fa } from "@/lib/i18n/fa";
import { buildPageMetadata } from "@/lib/seo/site";
import { StonesSearchGrid } from "./StonesSearchGrid";

export const metadata: Metadata = buildPageMetadata({
  title: "دانشنامه سنگ‌ها",
  description:
    "راهنمای جامع سنگ‌های انگشتر: تاریخچه پیدایش، کاربرد تاریخی، اثرات روان‌شناختی و پیشنهاد انتخاب برای تیپ‌های شخصیتی مختلف.",
  path: "/stones",
});

export default function StonesPage() {
  const stones = listStoneGuides();

  return (
    <PageTransition>
      <div className="stones-page min-h-screen pb-24 pt-20 md:pt-24">
        <div className="site-container">
          <div className="stones-page-shell">
            <header className="stones-page-header">
              <span className="heritage-eyebrow">دانشنامه تخصصی</span>
              <h1 className="stones-page-title">راهنمای کامل سنگ‌های انگشتر</h1>
              <p className="stones-page-subtitle">
                پیش از خرید، تاریخچه و ویژگی‌های روان‌شناختی هر سنگ را بررسی کنید تا انتخابی دقیق‌تر و شخصی‌تر داشته
                باشید.
              </p>
            </header>

            <StonesSearchGrid stones={stones} />

            <div className="stones-page-footer-link">
              <Link href="/shop">{fa.blog.backToShop}</Link>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

