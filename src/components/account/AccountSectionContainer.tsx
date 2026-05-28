"use client";

import { cn } from "@/lib/utils";

export function AccountSectionContainer({
  title,
  subtitle,
  children,
  className,
  headerAction,
  bodyVariant = "panel",
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
  /** flush: بدون قاب اضافه — برای لیست سفارش/پیشنهاد که خودشان کارت دارند */
  bodyVariant?: "panel" | "flush";
}) {
  return (
    <section className={cn("account-section", className)}>
      {title ? (
        <header className="account-section-header">
          <div className="account-section-header-copy">
            <h2 className="account-section-title">{title}</h2>
            {subtitle ? <p className="account-section-subtitle">{subtitle}</p> : null}
          </div>
          {headerAction ? <div className="account-section-header-action">{headerAction}</div> : null}
        </header>
      ) : null}
      <div
        className={cn(
          bodyVariant === "flush" ? "account-section-body--flush" : "account-section-body"
        )}
      >
        {children}
      </div>
    </section>
  );
}
