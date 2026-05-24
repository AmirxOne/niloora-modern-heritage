"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { parseJsonResponse } from "@/lib/hooks/fetch-utils";

type Props = {
  checkoutPath: string;
  cartItems: unknown[];
  shippingSnapshot?: Record<string, unknown> | null;
};

export function AbandonedCartRecoveryCard({ checkoutPath, cartItems, shippingSnapshot }: Props) {
  const [channel, setChannel] = useState<"sms" | "email">("sms");
  const [contact, setContact] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    try {
      const phone = sessionStorage.getItem("niloora-abandoned-contact-sms") || "";
      const email = sessionStorage.getItem("niloora-abandoned-contact-email") || "";
      setContact(channel === "sms" ? phone : email);
    } catch {
      // noop
    }
  }, [channel]);

  async function submitReminder() {
    if (!contact.trim()) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/abandoned-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          contact,
          name,
          cartItems,
          shipping: shippingSnapshot ?? null,
          checkoutPath,
        }),
      });
      const data = await parseJsonResponse<{ message?: string }>(response);
      if (!response.ok) {
        toast.error(data?.message ?? "ثبت یادآوری انجام نشد.");
        return;
      }
      try {
        sessionStorage.setItem(`niloora-abandoned-contact-${channel}`, contact);
      } catch {
        // noop
      }
      toast.success("یادآوری سبد رهاشده ثبت شد.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="cart-abandoned-recovery-card">
      <h3 className="cart-abandoned-recovery-card__title">یادآوری سبد رهاشده</h3>
      <p className="cart-abandoned-recovery-card__subtitle">
        اگر خرید را نیمه‌کاره رها کنید، لینک مستقیم بازگشت به پرداخت برای شما ارسال می‌شود.
      </p>
      <div className="cart-abandoned-recovery-card__chips">
        <button
          type="button"
          className={`cart-abandoned-recovery-card__chip${channel === "sms" ? " is-active" : ""}`}
          onClick={() => setChannel("sms")}
        >
          پیامک
        </button>
        <button
          type="button"
          className={`cart-abandoned-recovery-card__chip${channel === "email" ? " is-active" : ""}`}
          onClick={() => setChannel("email")}
        >
          ایمیل
        </button>
      </div>

      <input
        className="cart-abandoned-recovery-card__input"
        placeholder="نام (اختیاری)"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <input
        className="cart-abandoned-recovery-card__input"
        type={channel === "sms" ? "tel" : "email"}
        placeholder={channel === "sms" ? "۰۹۱۲۳۴۵۶۷۸۹" : "you@example.com"}
        value={contact}
        onChange={(event) => setContact(event.target.value)}
      />

      <Button
        type="button"
        variant="outline"
        className="w-full mt-2"
        disabled={!contact.trim() || submitting}
        onClick={() => void submitReminder()}
      >
        {submitting ? "در حال ثبت…" : "فعال‌سازی یادآوری سبد"}
      </Button>
    </div>
  );
}
