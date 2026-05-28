"use client";

import { SocialBrandIcon } from "@/components/icons/social/SocialBrandIcon";
import type { SiteSocialLinks } from "@/lib/site-settings/types";
import { FOOTER_SOCIAL_LABELS, FOOTER_SOCIAL_ORDER } from "@/lib/site-settings/social";
import { cn } from "@/lib/utils";

export function FooterSocialLinks({
  social,
  className,
}: {
  social: SiteSocialLinks;
  className?: string;
}) {
  const items = FOOTER_SOCIAL_ORDER.map((key) => ({
    key,
    href: social[key],
    label: FOOTER_SOCIAL_LABELS[key],
  })).filter((item): item is typeof item & { href: string } => Boolean(item.href));

  if (items.length === 0) return null;

  return (
    <div
      className={cn("footer-social", className)}
      role="list"
      aria-label="شبکه‌های اجتماعی و پیام‌رسان‌ها"
    >
      {items.map((item) => (
        <a
          key={item.key}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={item.label}
          role="listitem"
          className="footer-social-link"
        >
          <SocialBrandIcon brand={item.key} size={18} />
        </a>
      ))}
    </div>
  );
}
