"use client";

import { Crown } from "@/components/icons";
import { formatIranPhoneDisplay } from "@/lib/auth/phone";
import { fa } from "@/lib/i18n/fa";
import { iconSizes, ICON_VARIANT } from "@/lib/icons";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

type AccountUser = {
  name: string;
  phone: string;
  tier: "gold" | "platinum" | "royal";
  role?: "user" | "admin";
  memberSince: string;
};

const tierStyles: Record<AccountUser["tier"], string> = {
  gold: "account-tier-gold",
  platinum: "account-tier-platinum",
  royal: "account-tier-royal",
};

const tierLabel: Record<AccountUser["tier"], string> = {
  gold: "گلد",
  platinum: "پلاتینیوم",
  royal: "رویال",
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "؟";
  if (parts.length === 1) return parts[0].slice(0, 1);
  return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`;
}

export function AccountSidebarCard({ user }: { user: AccountUser }) {
  const displayName = user.name.trim() || formatIranPhoneDisplay(user.phone);
  const initials = initialsFromName(displayName);
  const role = user.role ?? "user";
  const roleLabel = role === "admin" ? fa.dashboard.roleAdmin : fa.dashboard.roleUser;

  return (
    <section className={cn("account-sidebar-card", tierStyles[user.tier])}>
      <div className="account-sidebar-card-glow" aria-hidden />
      <div className="account-sidebar-card-inner">
        <div className="flex items-center gap-4">
          <span className="account-avatar" aria-hidden>
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg text-ivory">{displayName}</p>
            <p className="mt-0.5 text-xs text-silver" dir="ltr">
              {formatIranPhoneDisplay(user.phone)}
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-gold/10 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="gold" className="gap-1.5 normal-case tracking-normal">
              <Crown size={12} variant={ICON_VARIANT} aria-hidden />
              {`${fa.dashboard.royalPatron} · ${tierLabel[user.tier]}`}
            </Badge>
            <Badge
              variant={role === "admin" ? "turquoise" : "default"}
              className="normal-case tracking-normal"
            >
              {roleLabel}
            </Badge>
          </div>
          <span className="text-xs text-silver">{fa.dashboard.memberSince(user.memberSince)}</span>
        </div>
      </div>
    </section>
  );
}
