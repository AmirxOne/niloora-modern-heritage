"use client";

import { Crown } from "@/components/icons";
import { formatIranPhoneDisplay } from "@/lib/auth/phone";
import {
  accountDisplayInitials,
  hasAccountProfileName,
  resolveAccountDisplayName,
} from "@/lib/account/display-name";
import { fa } from "@/lib/i18n/fa";
import { iconSizes, ICON_VARIANT } from "@/lib/icons";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

type AccountUser = {
  name: string;
  phone: string;
  firstName?: string | null;
  lastName?: string | null;
  tier: "gold" | "platinum" | "royal";
  loyaltyTier?: "bronze" | "silver" | "gold" | "platinum";
  role?: "user" | "editor" | "reviewer" | "admin";
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

const loyaltyTierLabel: Record<NonNullable<AccountUser["loyaltyTier"]>, string> = {
  bronze: "برنزی",
  silver: "نقره‌ای",
  gold: "طلایی",
  platinum: "پلاتینیومی",
};

export function AccountSidebarCard({ user }: { user: AccountUser }) {
  const nameInput = {
    firstName: user.firstName,
    lastName: user.lastName,
    name: user.name,
    phone: user.phone,
  };
  const displayName = resolveAccountDisplayName(nameInput);
  const showPhoneSubtitle = hasAccountProfileName(nameInput);
  const initials = accountDisplayInitials(nameInput);
  const role = user.role ?? "user";
  const roleLabel =
    role === "admin"
      ? fa.dashboard.roleAdmin
      : role === "editor"
        ? fa.dashboard.roleEditor
        : role === "reviewer"
          ? fa.dashboard.roleReviewer
          : fa.dashboard.roleUser;

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
            {showPhoneSubtitle ? (
              <p className="mt-0.5 text-xs text-silver" dir="ltr">
                {formatIranPhoneDisplay(user.phone)}
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-gold/10 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="gold" className="gap-1.5 normal-case tracking-normal">
              <Crown size={12} variant={ICON_VARIANT} aria-hidden />
              {`${fa.dashboard.royalPatron} · ${tierLabel[user.tier]}`}
            </Badge>
            {user.loyaltyTier ? (
              <Badge variant="default" className="normal-case tracking-normal">
                {`باشگاه: ${loyaltyTierLabel[user.loyaltyTier]}`}
              </Badge>
            ) : null}
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
