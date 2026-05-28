"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/context/AppContext";
import { useCartPricing } from "@/lib/hooks/useCartPricing";
import { TomanPrice } from "@/components/commerce/TomanPrice";
import { CartFuroohSummary } from "@/components/cart/CartFuroohSummary";
import { CartLineItem } from "@/components/cart/CartLineItem";
import { PromoCodeInput } from "@/components/cart/PromoCodeInput";
import { fa } from "@/lib/i18n/fa";
import { Check } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { ICON_VARIANT } from "@/lib/icons";
import { toast } from "sonner";
import { useGiftCard } from "@/lib/hooks/useGiftCard";
import {
  CartCheckoutTotals,
  useCheckoutGrandTotal,
} from "@/components/cart/CartCheckoutTotals";
import { CheckoutShippingForm, type CheckoutShippingFormState } from "@/components/cart/CheckoutShippingForm";
import { useAccount } from "@/lib/hooks/useAccount";
import { orderReceiptPath } from "@/lib/orders/order-receipt";
import { computeShippingCost } from "@/lib/orders/shipping-cost";
import { UnifiedEmptyState } from "@/components/ui/UnifiedEmptyState";
import type { CheckoutShippingInput } from "@/lib/checkout/shipping";
import {
  checkoutProfileSummary,
  isCheckoutProfileReady,
} from "@/lib/checkout/profile-ready";
import { AbandonedCartRecoveryCard } from "@/components/cart/AbandonedCartRecoveryCard";
import { GiftCardInput } from "@/components/cart/GiftCardInput";
import {
  INSTALLMENT_MONTH_OPTIONS,
  calculateInstallmentAmount,
  type InstallmentMonthOption,
} from "@/lib/checkout/bnpl";
import { trackFunnelEvent } from "@/lib/analytics/client";

type CheckoutStep = "cart" | "checkout" | "success";

export function CartPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart, orders, auth } = useApp();
  const account = useAccount();
  const giftCard = useGiftCard();
  const pricing = useCartPricing();
  const [step, setStep] = useState<CheckoutStep>("cart");
  const [paying, setPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"zarinpal" | "bnpl">("zarinpal");
  const [installmentMonths, setInstallmentMonths] = useState<InstallmentMonthOption>(3);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);
  const paymentHandled = useRef(false);
  const shippingFormRef = useRef<CheckoutShippingFormState | null>(null);
  const [shippingForm, setShippingForm] = useState<CheckoutShippingInput | null>(null);

  const handleShippingStateReady = useCallback((state: CheckoutShippingFormState) => {
    shippingFormRef.current = state;
    setShippingForm(state.form);
  }, []);

  const { grandTotal, quote: shippingQuote } = useCheckoutGrandTotal(pricing, shippingForm);
  const installmentAmountPreview = calculateInstallmentAmount(grandTotal, installmentMonths);

  useEffect(() => {
    if (searchParams.get("step") === "checkout" && cart.items.length > 0) {
      setStep("checkout");
    }
  }, [searchParams, cart.items.length]);

  useEffect(() => {
    if (step !== "checkout" || cart.items.length === 0) return;
    void trackFunnelEvent({
      event_name: "begin_checkout",
      value: pricing.payableAfterGiftCard,
      items: cart.items.map((item) => ({
        item_id: item.productId ?? item.id,
        item_name: item.name,
        item_category: item.availability,
        price: item.price,
        quantity: item.quantity,
      })),
      dedupe_key: `begin_checkout:${cart.items.map((i) => i.id).join(",")}`,
    });
  }, [step, cart.items, pricing.payableAfterGiftCard]);

  const profileReady =
    auth.isLoggedIn && !account.isLoading && isCheckoutProfileReady(account.user);

  useEffect(() => {
    const payment = searchParams.get("payment");
    if (!payment || paymentHandled.current) return;
    paymentHandled.current = true;

    const orderId = searchParams.get("orderId");
    const itemsSnapshot = [...cart.items];

    if (payment === "success") {
      setConfirmedOrderId(orderId);
      cart.clearCart();
      void auth.loadSession();
      if (itemsSnapshot.length > 0) {
        void orders.completePaidOrder(itemsSnapshot);
      } else {
        void orders.loadOrders();
      }
      if (orderId) {
        router.replace(orderReceiptPath(orderId));
        return;
      }
      setStep("success");
      router.replace("/cart", { scroll: false });
      return;
    }

    if (payment === "failed") {
      const reason = searchParams.get("reason");
      if (reason === "user_cancelled") {
        toast.error(fa.cart.paymentCancelled);
      } else {
        toast.error(fa.cart.paymentFailed);
      }
      setStep("checkout");
      router.replace("/cart?step=checkout", { scroll: false });
    }
  }, [searchParams, cart, orders, router, auth]);

  const handlePay = async () => {
    if (cart.items.length === 0) return;

    const shipping: CheckoutShippingInput | null =
      shippingFormRef.current?.validate() ?? null;
    if (!shipping) {
      toast.error(fa.cart.shippingInvalid);
      return;
    }

    const payQuote = computeShippingCost({
      province: shipping.province,
      city: shipping.city,
      shippingMethod: shipping.shippingMethod,
    });
    if (!payQuote.ready) {
      toast.error(fa.cart.shippingCostPending);
      return;
    }

    setPaying(true);
    try {
      void trackFunnelEvent({
        event_name: "add_payment_info",
        payment_method: paymentMethod,
        value: grandTotal,
        items: cart.items.map((item) => ({
          item_id: item.productId ?? item.id,
          item_name: item.name,
          item_category: item.availability,
          price: item.price,
          quantity: item.quantity,
        })),
      });
      const result = await orders.startZarinpalPayment(cart.items, {
        promoCode: pricing.appliedPromo?.code ?? null,
        giftCardCode: giftCard.appliedCode,
        paymentMethod,
        installmentMonths: paymentMethod === "bnpl" ? installmentMonths : null,
        shipping,
      });
      if (result.ok && paymentMethod === "bnpl" && result.bnpl) {
        toast.success("درخواست خرید اقساطی ثبت شد. تیم فروش برای تکمیل قرارداد با شما تماس می‌گیرد.");
        setConfirmedOrderId(null);
        cart.clearCart();
        await orders.loadOrders();
        setStep("success");
        return;
      }
      if (result.ok && result.redirectUrl) {
        window.location.href = result.redirectUrl;
        return;
      }
    } finally {
      setPaying(false);
    }
  };

  useEffect(() => {
    const token = searchParams.get("recovery");
    if (!token) return;
    fetch("/api/abandoned-cart/recover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).catch(() => undefined);
  }, [searchParams]);

  const titles: Record<CheckoutStep, string> = {
    cart: fa.cart.pageTitle,
    checkout: fa.cart.checkout,
    success: fa.cart.confirmed,
  };

  return (
    <div className="cart-page">
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="cart-page-header"
      >
        <p className="page-eyebrow">{fa.nav.cart}</p>
        <h1 className="cart-page-title">{titles[step]}</h1>
        {step === "cart" ? (
          <p className="cart-page-subtitle">
            {cart.count > 0 ? fa.cart.itemsInCart(cart.count) : fa.cart.pageSubtitle}
          </p>
        ) : null}
      </motion.header>

      {step === "success" ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="cart-success-card"
        >
          <div className="cart-success-icon" aria-hidden>
            <Check className="text-turquoise" size={32} variant={ICON_VARIANT} />
          </div>
          <p className="font-display text-2xl text-ivory">{fa.cart.orderConfirmed}</p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-silver">{fa.cart.orderConfirmedHint}</p>
          {confirmedOrderId ? (
            <p className="mt-4 font-mono text-sm text-gold-dark">شماره سفارش: {confirmedOrderId}</p>
          ) : null}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {confirmedOrderId ? (
              <Link href={orderReceiptPath(confirmedOrderId)}>
                <Button>{fa.cart.viewReceipt}</Button>
              </Link>
            ) : null}
            <Link href="/account#orders">
              <Button variant={confirmedOrderId ? "outline" : undefined}>
                {fa.dashboard.viewPurchaseHistory}
              </Button>
            </Link>
            <Link href="/shop">
              <Button variant="outline">{fa.cart.explore}</Button>
            </Link>
          </div>
        </motion.div>
      ) : cart.items.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <UnifiedEmptyState
            visual="cart"
            title={fa.cart.empty}
            description={fa.cart.emptyHint}
            className="cart-empty-state"
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/shop">
                  <Button>{fa.cart.explore}</Button>
                </Link>
                <Link href="/customize">
                  <Button variant="outline">{fa.nav.customize}</Button>
                </Link>
              </div>
            }
          />
        </motion.div>
      ) : (
        <div className="cart-layout">
          <div className="cart-main">
            {step === "cart" ? (
              <ul className="cart-line-list">
                <AnimatePresence mode="popLayout">
                  {cart.items.map((item) => (
                    <CartLineItem
                      key={item.id}
                      item={item}
                      onDecrease={() => cart.updateQuantity(item.id, item.quantity - 1)}
                      onIncrease={() => cart.updateQuantity(item.id, item.quantity + 1)}
                      onRemove={() => cart.removeItem(item.id)}
                    />
                  ))}
                </AnimatePresence>
              </ul>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <CheckoutShippingForm
                  profile={account.user ?? undefined}
                  onStateReady={handleShippingStateReady}
                  disabled={paying}
                />
                <div className="mt-6 rounded-heritage border border-gold/15 bg-parchment/30 px-4 py-4 text-sm text-ivory-light">
                  <p className="font-medium text-ivory">روش پرداخت</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      className={`checkout-shipping-method-card ${paymentMethod === "zarinpal" ? "checkout-shipping-method-card--selected" : ""}`}
                      onClick={() => setPaymentMethod("zarinpal")}
                    >
                      <span className="font-medium text-ivory">پرداخت آنلاین زرین‌پال</span>
                      <span className="mt-1 block text-xs text-silver">تسویه کامل در لحظه</span>
                    </button>
                    <button
                      type="button"
                      className={`checkout-shipping-method-card ${paymentMethod === "bnpl" ? "checkout-shipping-method-card--selected" : ""}`}
                      onClick={() => setPaymentMethod("bnpl")}
                    >
                      <span className="font-medium text-ivory">{fa.cart.installmentMethodTitle}</span>
                      <span className="mt-1 block text-xs text-silver">بررسی اولیه و شروع قرارداد اقساطی</span>
                    </button>
                  </div>
                  {paymentMethod === "bnpl" ? (
                    <div className="mt-4 rounded-heritage border border-gold/20 bg-white/60 p-3">
                      <p className="text-xs text-silver">شرایط اقساط</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {INSTALLMENT_MONTH_OPTIONS.map((month) => (
                          <button
                            key={month}
                            type="button"
                            className={`rounded-full border px-3 py-1 text-xs ${
                              installmentMonths === month
                                ? "border-gold bg-gold/10 text-gold-dark"
                                : "border-gold/20 text-silver"
                            }`}
                            onClick={() => setInstallmentMonths(month)}
                          >
                            {month.toLocaleString("fa-IR")} قسط
                          </button>
                        ))}
                      </div>
                      <p className="mt-3 text-xs text-silver">
                        {fa.cart.installmentEachLabel}: <span className="font-semibold text-ivory"><TomanPrice amount={installmentAmountPreview} size="xs" /></span>
                      </p>
                      <p className="mt-1 text-[11px] text-silver">
                        {fa.cart.installmentValidationHint}
                      </p>
                    </div>
                  ) : null}
                  <p className="font-medium text-ivory">پرداخت امن زرین‌پال</p>
                  <p className="mt-2 leading-relaxed text-silver">
                    {fa.cart.grandTotal}:{" "}
                    <span className="font-semibold text-price-sale">
                      <TomanPrice
                        amount={shippingQuote.ready ? grandTotal : pricing.payableAfterGiftCard}
                        size="sm"
                      />
                    </span>
                  </p>
                  {shippingQuote.ready ? (
                    <p className="mt-1 text-xs text-silver">
                      {fa.cart.shippingCostLabel}:{" "}
                      {shippingQuote.cost > 0
                        ? <TomanPrice amount={shippingQuote.cost} size="xs" />
                        : fa.dashboard.orderShippingCostFree}
                      {shippingQuote.zoneLabel
                        ? ` · ${fa.cart.shippingZoneHint(shippingQuote.zoneLabel)}`
                        : ""}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-silver">{fa.cart.shippingCostPending}</p>
                  )}
                  <p className="mt-2 text-xs text-silver">
                    تا قبل از تأیید پرداخت در درگاه، سفارش در وضعیت «در انتظار پرداخت» باقی می‌ماند.
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          <aside className="cart-summary">
            <div className="cart-summary-card">
              <h2 className="font-display text-lg text-ivory">{fa.cart.yourSelection}</h2>
              <ul className="mt-4 space-y-3 border-b border-gold/10 pb-4">
                {cart.items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-3 text-sm">
                    <span className="text-silver">
                      {item.name}
                      <span className="text-gold/50"> ×{item.quantity.toLocaleString("fa-IR")}</span>
                    </span>
                    <span className="shrink-0 font-medium text-price-sale">
                      <TomanPrice amount={item.price * item.quantity} size="xs" />
                    </span>
                  </li>
                ))}
              </ul>

              <PromoCodeInput subtotalSale={pricing.subtotalSale} />
              <GiftCardInput payableBeforeGiftCard={pricing.payable} />

              {pricing.appliedBundles.length > 0 ? (
                <div className="cart-bundle-list">
                  <p className="cart-bundle-list__title">{fa.cart.bundleAppliedTitle}</p>
                  <ul className="cart-bundle-list__items">
                    {pricing.appliedBundles.map((entry) => (
                      <li key={entry.bundle.id} className="cart-bundle-list__item">
                        <span>{entry.bundle.title}</span>
                        <span className="text-price-sale">
                          <TomanPrice amount={entry.amount} size="xs" />
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <CartFuroohSummary pricing={pricing} hidePayable={step === "checkout"} />

              {step === "checkout" ? (
                <CartCheckoutTotals pricing={pricing} shippingForm={shippingForm} />
              ) : pricing.totalFurooh === 0 ? (
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-silver">{fa.cart.total}</span>
                  <TomanPrice amount={pricing.payable} size="md" />
                </div>
              ) : null}

              {auth.user?.loyaltyTier ? (
                <div className="cart-loyalty-cta">
                  <p className="cart-loyalty-cta-title">
                    {fa.loyalty.checkoutTierLabel(fa.loyalty.tierLabel[auth.user.loyaltyTier])}
                  </p>
                  <p className="cart-loyalty-cta-hint">
                    {fa.loyalty.checkoutPointsHint(
                      Math.max(0, Math.floor(pricing.payableAfterGiftCard / 100000))
                    )}
                  </p>
                </div>
              ) : null}

              {step === "cart" && profileReady && account.user ? (
                <div className="cart-fast-checkout mt-6">
                  <p className="cart-fast-checkout-title">{fa.cart.fastCheckoutTitle}</p>
                  <p className="cart-fast-checkout-hint">{fa.cart.fastCheckoutHint}</p>
                  <p className="cart-fast-checkout-address">{checkoutProfileSummary(account.user)}</p>
                  <Button className="mt-4 w-full" size="lg" onClick={() => setStep("checkout")}>
                    {fa.cart.fastCheckoutCta}
                  </Button>
                  <Link
                    href="/account#profile"
                    className="mt-3 block text-center text-xs text-turquoise-dark hover:text-turquoise"
                  >
                    {fa.cart.fastCheckoutEdit}
                  </Link>
                </div>
              ) : null}

              {step === "cart" ? (
                <div className="mt-6 space-y-3">
                  <Button className="w-full" size="lg" onClick={() => setStep("checkout")}>
                    {profileReady ? fa.cart.proceedCheckout : fa.cart.guestCheckout}
                  </Button>
                  {!auth.isLoggedIn ? (
                    <p className="text-center text-xs leading-relaxed text-silver">
                      {fa.cart.guestCheckoutHint}
                    </p>
                  ) : null}
                  {!auth.isLoggedIn ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        router.push(
                          `/auth?redirect=${encodeURIComponent("/cart?step=checkout")}`
                        )
                      }
                    >
                      {fa.cart.loginForFasterCheckout}
                    </Button>
                  ) : !profileReady ? (
                    <Link
                      href="/account#profile"
                      className="block text-center text-xs text-turquoise-dark hover:text-turquoise"
                    >
                      {fa.cart.fastCheckoutEdit}
                    </Link>
                  ) : null}
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  <Button className="w-full" size="lg" onClick={handlePay} disabled={paying}>
                    {paying
                      ? fa.cart.paymentProcessing
                      : paymentMethod === "bnpl"
                        ? fa.cart.payWithInstallments
                        : fa.cart.payWithZarinpal}
                  </Button>
                  <AbandonedCartRecoveryCard
                    checkoutPath="/cart?step=checkout"
                    cartItems={cart.items}
                    shippingSnapshot={shippingForm as Record<string, unknown> | null}
                  />
                  <button
                    type="button"
                    onClick={() => setStep("cart")}
                    className="w-full text-center text-sm text-turquoise-dark hover:text-turquoise"
                    disabled={paying}
                  >
                    {fa.cart.backToCart}
                  </button>
                </div>
              )}

              {step === "cart" ? (
                <Link
                  href="/shop"
                  className="mt-4 block text-center text-sm text-silver transition-colors hover:text-turquoise-dark"
                >
                  {fa.cart.continueShopping}
                </Link>
              ) : null}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
