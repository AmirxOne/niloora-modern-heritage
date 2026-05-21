"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { fa } from "@/lib/i18n/fa";
import { PageTransition } from "@/components/layout/PageTransition";
import { Button } from "@/components/ui/Button";
import { TextAreaBox, TextBox } from "@/components/inputs";

export default function PreOwnedSellPage() {
  const [submitted, setSubmitted] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [ringDescription, setRingDescription] = useState("");
  const [estimatedOriginalPrice, setEstimatedOriginalPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [wantsRemake, setWantsRemake] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(estimatedOriginalPrice.replace(/[^\d]/g, ""));
    if (!fullName.trim() || !phone.trim() || !ringDescription.trim() || !price) {
      toast.error("لطفاً همه فیلدهای الزامی را کامل کنید.");
      return;
    }

    const response = await fetch("/api/trade-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: fullName.trim(),
        phone: phone.trim(),
        ringDescription: ringDescription.trim(),
        estimatedOriginalPrice: price,
        notes: notes.trim() || undefined,
        wantsRemake,
      }),
    });
    if (!response.ok) {
      toast.error("ثبت درخواست فروش انجام نشد. دوباره تلاش کنید.");
      return;
    }
    toast.success("درخواست فروش با موفقیت ثبت شد.");
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <PageTransition>
        <div className="pre-owned-sell-page min-h-screen pb-16 pt-24 md:pt-28">
          <div className="site-container max-w-lg">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="pre-owned-sell-success"
            >
              <h1 className="font-display text-2xl text-ivory">{fa.preOwned.sellPage.successTitle}</h1>
              <p className="mt-4 text-silver">{fa.preOwned.sellPage.successBody}</p>
              <Link href="/shop" className="mt-8 block">
                <Button className="w-full">{fa.preOwned.sellPage.backToShop}</Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="pre-owned-sell-page min-h-screen pb-16 pt-24 md:pt-28">
        <div className="site-container max-w-xl">
          <header className="pre-owned-sell-header">
            <span className="heritage-eyebrow">{fa.preOwned.sellPage.eyebrow}</span>
            <h1 className="pre-owned-sell-title">{fa.preOwned.sellPage.title}</h1>
            <p className="pre-owned-sell-subtitle">{fa.preOwned.sellPage.subtitle}</p>
          </header>

          <form onSubmit={handleSubmit} className="pre-owned-sell-form space-y-5">
            <TextBox
              label={fa.preOwned.sellPage.fullName}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <TextBox
              label={fa.preOwned.sellPage.phone}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputClassName="auth-input-ltr"
              required
            />
            <TextAreaBox
              label={fa.preOwned.sellPage.ringDescription}
              id="ring-desc"
              value={ringDescription}
              onChange={(e) => setRingDescription(e.target.value)}
              required
            />
            <TextBox
              label={fa.preOwned.sellPage.estimatedPrice}
              type="text"
              inputMode="numeric"
              value={estimatedOriginalPrice}
              onChange={(e) => setEstimatedOriginalPrice(e.target.value)}
              inputClassName="auth-input-ltr"
              required
            />
            <TextAreaBox
              label={fa.preOwned.sellPage.notes}
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <label className="pre-owned-sell-checkbox">
              <input
                type="checkbox"
                checked={wantsRemake}
                onChange={(e) => setWantsRemake(e.target.checked)}
              />
              <span>{fa.preOwned.sellPage.wantsRemake}</span>
            </label>
            <Button type="submit" className="w-full" size="lg">
              {fa.preOwned.sellPage.submit}
            </Button>
          </form>
        </div>
      </div>
    </PageTransition>
  );
}
