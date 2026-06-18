"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FooterSocialLinks } from "@/components/layout/FooterSocialLinks";
import { Button } from "@/components/ui/Button";
import type { SiteSocialLinks } from "@/lib/site-settings/types";
import { fa } from "@/lib/i18n/fa";
import { cn } from "@/lib/utils";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function FooterNewsletterColumn({
  social,
  className,
  headingClassName,
}: {
  social: SiteSocialLinks;
  className?: string;
  headingClassName?: string;
}) {
  const [email, setEmail] = useState("");

  const emailValid = isValidEmail(email);
  const titleClass = headingClassName ?? "mb-4 text-xs font-semibold uppercase tracking-widest text-[#B8860B]";

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!emailValid) return;
    toast.success(fa.footer.emailSignupSuccess);
    setEmail("");
  };

  return (
    <div className={cn("footer-newsletter w-full shrink-0 lg:w-auto", className)}>
      <div>
        <h3 className={cn(titleClass, "normal-case")}>{fa.footer.stayWithUs}</h3>
        <FooterSocialLinks social={social} />
      </div>

      <div className="mt-6 sm:mt-8">
        <p className="mb-3 hidden text-sm leading-relaxed text-[#78716C] md:block">
          {fa.footer.emailSignupTitle}
        </p>
        <form className="flex w-full items-start gap-2" onSubmit={handleSubmit}>
          <label className="block min-w-0 grow">
            <span className="sr-only">{fa.footer.emailPlaceholder}</span>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={fa.footer.emailPlaceholder}
              className="field-control text-left"
              dir="ltr"
              autoComplete="email"
            />
          </label>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={!emailValid}
            className="shrink-0"
          >
            {fa.footer.emailSubmit}
          </Button>
        </form>
      </div>
    </div>
  );
}
