"use client";

import { cn } from "@/lib/utils";

export function AccountSectionContainer({
  title,
  subtitle,
  children,
  className,
  headerAction,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
}) {
  return (
    <section className={cn("account-section", className)}>
      <header className="account-section-header">
        <div className="min-w-0">
          <h2 className="account-section-title">{title}</h2>
          {subtitle ? <p className="account-section-subtitle">{subtitle}</p> : null}
        </div>
        {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
      </header>
      <div className="account-section-body">{children}</div>
    </section>
  );
}
