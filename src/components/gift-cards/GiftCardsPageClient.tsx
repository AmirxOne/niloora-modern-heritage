"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { InfoPageShell } from "@/components/legal/InfoPageShell";
import { Button } from "@/components/ui/Button";
import { TextBox } from "@/components/inputs";
import { StatusAlert } from "@/components/ui/StatusAlert";
import { TomanPrice } from "@/components/commerce/TomanPrice";
import { useAuth } from "@/lib/hooks/useAuth";
import { useGiftCardPurchase } from "@/lib/hooks/useGiftCardPurchase";
import { useGiftCardBalance } from "@/lib/hooks/useGiftCardBalance";
import {
  GIFT_CARD_MAX_PURCHASE_AMOUNT,
  GIFT_CARD_MIN_PURCHASE_AMOUNT,
} from "@/lib/gift-card/constants";
import { fa } from "@/lib/i18n/fa";
import { formatTomanAmount } from "@/lib/utils";

const t = fa.giftCards;

const PRESET_AMOUNTS = [500_000, 1_000_000, 2_000_000, 5_000_000] as const;

function parseTomanInput(value: string): number {
  const normalized = value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[^\d]/g, "");
  return Number.parseInt(normalized, 10) || 0;
}

function formatExpiry(iso: string | null): string {
  if (!iso) return t.noExpiry;
  const date = new Date(iso).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return t.expiresAt(date);
}

export function GiftCardsPageClient() {
  const searchParams = useSearchParams();
  const auth = useAuth();
  const purchase = useGiftCardPurchase();
  const balance = useGiftCardBalance();

  const [amountInput, setAmountInput] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientContact, setRecipientContact] = useState("");
  const [codeInput, setCodeInput] = useState("");

  const paymentStatus = searchParams.get("payment");
  const paymentOrderId = searchParams.get("orderId");

  const amountRangeHint = useMemo(
    () =>
      t.amountRangeHint(
        formatTomanAmount(GIFT_CARD_MIN_PURCHASE_AMOUNT),
        formatTomanAmount(GIFT_CARD_MAX_PURCHASE_AMOUNT)
      ),
    []
  );

  const loginRedirect = `/auth?redirect=${encodeURIComponent("/gift-cards")}`;

  async function handlePurchase(event: React.FormEvent) {
    event.preventDefault();
    if (!auth.isLoggedIn) return;
    await purchase.purchase({
      amount: parseTomanInput(amountInput),
      recipientName,
      recipientContact,
    });
  }

  async function handleBalanceLookup(event: React.FormEvent) {
    event.preventDefault();
    await balance.lookup(codeInput);
  }

  function balanceStatusLabel() {
    const card = balance.result?.giftCard;
    if (!card) return "";
    if (card.expired) return t.statusExpired;
    if (!card.active) return t.statusInactive;
    return t.statusActive;
  }

  return (
    <InfoPageShell eyebrow={t.eyebrow} title={t.pageTitle} subtitle={t.subtitle}>
      {paymentStatus === "success" ? (
        <StatusAlert tone="success" title={t.paymentSuccessTitle} className="mb-6">
          <p>{t.paymentSuccessBody}</p>
          {paymentOrderId ? (
            <p className="mt-2 font-mono text-xs opacity-80" dir="ltr">
              {paymentOrderId}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/account#orders">
              <Button size="sm">{t.viewOrders}</Button>
            </Link>
            <Link href="/cart">
              <Button size="sm" variant="outline">
                {t.useInCart}
              </Button>
            </Link>
          </div>
        </StatusAlert>
      ) : null}

      {paymentStatus === "failed" ? (
        <StatusAlert tone="danger" title={t.paymentFailedTitle} className="mb-6">
          <p>{t.paymentFailedBody}</p>
          <div className="mt-4">
            <Link href="/gift-cards">
              <Button size="sm" variant="outline">
                {t.tryAgain}
              </Button>
            </Link>
          </div>
        </StatusAlert>
      ) : null}

      <div className="gift-cards-layout">
        <section className="gift-cards-panel">
          <h2 className="gift-cards-panel-title">{t.purchaseTitle}</h2>
          <p className="gift-cards-panel-hint">{t.purchaseHint}</p>
          <p className="gift-cards-panel-hint">{amountRangeHint}</p>

          {!auth.isLoggedIn ? (
            <StatusAlert tone="info" title={t.loginRequired} className="mt-4">
              <Link href={loginRedirect}>
                <Button size="sm" className="mt-3">
                  {t.loginCta}
                </Button>
              </Link>
            </StatusAlert>
          ) : (
            <form className="gift-cards-form" onSubmit={handlePurchase}>
              <div className="gift-cards-presets">
                <p className="gift-cards-presets-label">{t.presetLabel}</p>
                <div className="gift-cards-presets-row">
                  {PRESET_AMOUNTS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className={`gift-cards-preset-btn${
                        parseTomanInput(amountInput) === preset ? " gift-cards-preset-btn--active" : ""
                      }`}
                      onClick={() => setAmountInput(preset.toLocaleString("fa-IR"))}
                    >
                      <TomanPrice amount={preset} size="xs" />
                    </button>
                  ))}
                </div>
              </div>

              <TextBox
                label={t.amountLabel}
                value={amountInput}
                onChange={(event) => setAmountInput(event.target.value)}
                placeholder={t.amountPlaceholder}
                inputMode="numeric"
                required
              />
              <TextBox
                label={t.recipientNameLabel}
                value={recipientName}
                onChange={(event) => setRecipientName(event.target.value)}
                placeholder={t.recipientNamePlaceholder}
              />
              <TextBox
                label={t.recipientContactLabel}
                value={recipientContact}
                onChange={(event) => setRecipientContact(event.target.value)}
                placeholder={t.recipientContactPlaceholder}
                inputClassName="auth-input-ltr"
              />

              <Button type="submit" className="w-full" disabled={purchase.isPurchasing}>
                {purchase.isPurchasing ? t.purchasing : t.purchaseCta}
              </Button>
            </form>
          )}
        </section>

        <section className="gift-cards-panel">
          <h2 className="gift-cards-panel-title">{t.balanceTitle}</h2>
          <p className="gift-cards-panel-hint">{t.balanceHint}</p>

          <form className="gift-cards-form" onSubmit={handleBalanceLookup}>
            <TextBox
              label={t.codeLabel}
              value={codeInput}
              onChange={(event) => {
                setCodeInput(event.target.value.toUpperCase());
                balance.reset();
              }}
              placeholder={t.codePlaceholder}
              inputClassName="auth-input-ltr"
              required
            />
            <Button type="submit" className="w-full" variant="outline" disabled={balance.isLoading}>
              {balance.isLoading ? t.balanceLoading : t.balanceCta}
            </Button>
          </form>

          {balance.result && !balance.isLoading ? (
            balance.result.found && balance.result.giftCard ? (
              <div className="gift-cards-balance-card">
                <p className="gift-cards-balance-code" dir="ltr">
                  {balance.result.giftCard.code}
                </p>
                <dl className="gift-cards-balance-grid">
                  <div>
                    <dt>{t.remainingAmount}</dt>
                    <dd>
                      <TomanPrice amount={balance.result.giftCard.remainingAmount} size="sm" />
                    </dd>
                  </div>
                  <div>
                    <dt>{t.initialAmount}</dt>
                    <dd>
                      <TomanPrice amount={balance.result.giftCard.initialAmount} size="sm" />
                    </dd>
                  </div>
                  <div>
                    <dt>{t.statusLabel}</dt>
                    <dd>{balanceStatusLabel()}</dd>
                  </div>
                  <div>
                    <dt>{t.expiryLabel}</dt>
                    <dd>{formatExpiry(balance.result.giftCard.expiresAt)}</dd>
                  </div>
                </dl>
                <Link href="/cart" className="mt-4 block">
                  <Button size="sm" variant="outline" className="w-full">
                    {t.useInCart}
                  </Button>
                </Link>
              </div>
            ) : (
              <p className="gift-cards-balance-empty">{t.balanceNotFound}</p>
            )
          ) : null}
        </section>
      </div>

      <section className="gift-cards-how">
        <h2 className="gift-cards-panel-title">{t.howItWorksTitle}</h2>
        <ol className="gift-cards-steps">
          {t.howItWorksSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>
    </InfoPageShell>
  );
}
