"use client";

import { useMemo } from "react";
import { Check, Copy, User } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { TomanPrice } from "@/components/commerce/TomanPrice";
import { fa } from "@/lib/i18n/fa";
import type { ReferralSummary } from "@/lib/types";
import { iconSizes, ICON_VARIANT } from "@/lib/icons";

function statusLabel(status: string) {
  if (status === "rewarded") return fa.referral.statusRewarded;
  if (status === "blocked") return fa.referral.statusBlocked;
  return fa.referral.statusRegistered;
}

export function AccountReferralPanel({ referral }: { referral: ReferralSummary | null }) {
  const shareLink = useMemo(() => {
    if (!referral?.referralCode) return "";
    return `/auth?ref=${encodeURIComponent(referral.referralCode)}`;
  }, [referral?.referralCode]);

  const copy = async (value: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Keep silent if clipboard fails.
    }
  };

  if (!referral) {
    return (
      <div className="account-panel account-panel--loading" aria-busy="true">
        <div className="account-skeleton account-skeleton--hero" />
      </div>
    );
  }

  return (
    <div className="account-referrals space-y-6">
      <div className="account-referral-card">
        <div className="account-referral-card-head">
          <div>
            <p className="account-referral-eyebrow">{fa.referral.codeLabel}</p>
            <p className="account-referral-code">{referral.referralCode}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => copy(referral.referralCode)}>
            <Copy size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />
            {fa.referral.copyCode}
          </Button>
        </div>
        <p className="account-referral-hint">{fa.referral.shareHint}</p>
        <div className="account-referral-share-row">
          <code className="account-referral-share-link">{shareLink}</code>
          <Button variant="secondary" size="sm" onClick={() => copy(shareLink)}>
            <Copy size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />
            {fa.referral.copyLink}
          </Button>
        </div>
      </div>

      <div className="account-stat-grid">
        <div className="account-stat-tile">
          <p className="account-stat-tile-label">{fa.referral.creditLabel}</p>
          <p className="account-stat-tile-value text-price-sale">
            <TomanPrice amount={referral.referralCredit} size="xs" />
          </p>
        </div>
        <div className="account-stat-tile">
          <p className="account-stat-tile-label">{fa.referral.totalEarnedLabel}</p>
          <p className="account-stat-tile-value text-price-sale">
            <TomanPrice amount={referral.referralEarnedTotal} size="xs" />
          </p>
        </div>
        <div className="account-stat-tile">
          <p className="account-stat-tile-label">{fa.referral.rewardedCountLabel}</p>
          <p className="account-stat-tile-value">
            {referral.summary.rewardedCount.toLocaleString("fa-IR")}
          </p>
        </div>
      </div>

      <div className="account-subsection">
        <header className="account-subsection-header">
          <h3 className="account-subsection-title">{fa.referral.recentInvitesTitle}</h3>
          <p className="account-subsection-subtitle">{fa.referral.recentInvitesSubtitle}</p>
        </header>
        {referral.recentInvites.length === 0 ? (
          <div className="account-empty-inline">
            <User size={iconSizes.md} variant={ICON_VARIANT} aria-hidden />
            <p>{fa.referral.empty}</p>
          </div>
        ) : (
          <ul className="account-resource-list">
            {referral.recentInvites.map((item) => (
              <li key={item.id}>
                <div className="account-resource-row">
                  <div className="account-resource-body">
                    <p className="account-resource-title">{item.invitee.name}</p>
                    <p className="account-resource-subtitle">{item.invitee.phone}</p>
                  </div>
                  <div className="account-referral-invite-meta">
                    <span className="account-referral-status">{statusLabel(item.status)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
