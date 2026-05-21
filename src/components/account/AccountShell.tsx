"use client";

import { cn } from "@/lib/utils";

export function AccountShell({
  sidebar,
  children,
  className,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("account-shell", className)}>
      <aside className="account-shell-sidebar">{sidebar}</aside>
      <main className="account-shell-main">{children}</main>
    </div>
  );
}
