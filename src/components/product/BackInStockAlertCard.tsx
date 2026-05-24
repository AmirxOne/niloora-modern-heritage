"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import type { Product, ProductAvailability } from "@/lib/types";
import { parseJsonResponse } from "@/lib/hooks/fetch-utils";
import { fa } from "@/lib/i18n/fa";

function canSubscribe(availability: ProductAvailability): boolean {
  return availability === "sold" || availability === "preorder";
}

interface BackInStockAlertCardProps {
  product: Product;
}

export function BackInStockAlertCard({ product }: BackInStockAlertCardProps) {
  const [channel, setChannel] = useState<"sms" | "email">("sms");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = fa.product.backInStock;

  const contactLabel = useMemo(
    () => (channel === "sms" ? t.contactLabelSms : t.contactLabelEmail),
    [channel, t.contactLabelEmail, t.contactLabelSms]
  );
  const contactPlaceholder = useMemo(
    () => (channel === "sms" ? t.contactPlaceholderSms : t.contactPlaceholderEmail),
    [channel, t.contactPlaceholderEmail, t.contactPlaceholderSms]
  );

  if (!canSubscribe(product.availability)) {
    return null;
  }

  async function handleSubmit() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/back-in-stock-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          channel,
          contact,
          name,
        }),
      });
      const data = await parseJsonResponse<{ message?: string }>(response);
      if (!response.ok) {
        toast.error(data?.message ?? "ثبت اعلان انجام نشد.");
        return;
      }
      toast.success(t.success);
      setContact("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="product-back-in-stock-card" aria-labelledby="product-back-in-stock-title">
      <header className="product-back-in-stock-card__head">
        <h3 id="product-back-in-stock-title" className="product-back-in-stock-card__title">
          {t.title}
        </h3>
        <p className="product-back-in-stock-card__subtitle">{t.subtitle}</p>
      </header>

      <div className="product-back-in-stock-card__channels" role="radiogroup" aria-label={t.channelLabel}>
        <button
          type="button"
          className={`product-back-in-stock-card__chip${channel === "sms" ? " is-active" : ""}`}
          onClick={() => setChannel("sms")}
          aria-pressed={channel === "sms"}
        >
          {t.channelSms}
        </button>
        <button
          type="button"
          className={`product-back-in-stock-card__chip${channel === "email" ? " is-active" : ""}`}
          onClick={() => setChannel("email")}
          aria-pressed={channel === "email"}
        >
          {t.channelEmail}
        </button>
      </div>

      <div className="product-back-in-stock-card__form">
        <label className="product-back-in-stock-card__label">
          {t.nameLabel}
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="product-back-in-stock-card__input"
          />
        </label>
        <label className="product-back-in-stock-card__label">
          {contactLabel}
          <input
            type={channel === "sms" ? "tel" : "email"}
            value={contact}
            onChange={(event) => setContact(event.target.value)}
            placeholder={contactPlaceholder}
            className="product-back-in-stock-card__input"
          />
        </label>
      </div>

      <Button
        type="button"
        variant="outline"
        className="product-back-in-stock-card__cta"
        disabled={!contact.trim() || isSubmitting}
        onClick={handleSubmit}
      >
        {isSubmitting ? t.submitting : t.submit}
      </Button>
    </section>
  );
}
