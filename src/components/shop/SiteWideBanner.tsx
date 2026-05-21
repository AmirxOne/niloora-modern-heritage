"use client";

import { useSiteBanner } from "@/lib/hooks/useSiteBanner";
import { fa } from "@/lib/i18n/fa";

export function SiteWideBanner() {
  const { banner } = useSiteBanner();

  if (!banner.enabled || banner.percent <= 0) return null;

  return (
    <div className="site-wide-banner" role="status">
      <span className="site-wide-banner-badge">{banner.badge || fa.bahakahi.word}</span>
      <div className="site-wide-banner-text">
        <p className="site-wide-banner-title">{banner.title}</p>
        <p className="site-wide-banner-hint">
          {banner.percent.toLocaleString("fa-IR")}٪ {banner.subtitle}
        </p>
      </div>
    </div>
  );
}
