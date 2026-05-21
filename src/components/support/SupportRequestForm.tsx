"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { TextAreaBox, SelectBox, TextBox } from "@/components/inputs";
import { Button } from "@/components/ui/Button";
import { fa } from "@/lib/i18n/fa";
import { useAccount } from "@/lib/hooks/useAccount";
import { useAuth } from "@/lib/hooks/useAuth";
import { useOrders } from "@/lib/hooks/useOrders";
import {
  RETURN_CATEGORIES,
  SUPPORT_CATEGORIES,
  type SupportRequestKind,
} from "@/lib/server/support-request/support-request";
import type { Order } from "@/lib/types";

const s = fa.supportRequest;

const kindOptions = [
  { value: "return", label: s.kindReturn },
  { value: "support", label: s.kindSupport },
] as const;

function categoryOptions(kind: SupportRequestKind) {
  const labels =
    kind === "return" ? s.returnCategories : s.supportCategories;
  const keys = kind === "return" ? RETURN_CATEGORIES : SUPPORT_CATEGORIES;
  return keys.map((value) => ({
    value,
    label: labels[value as keyof typeof labels],
  }));
}

function eligibleOrders(orders: Order[]) {
  return orders.filter((o) => o.status !== "pending_payment" && o.status !== "payment_failed");
}

export function SupportRequestForm() {
  const searchParams = useSearchParams();
  const auth = useAuth();
  const account = useAccount();
  const ordersState = useOrders();
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [kind, setKind] = useState<SupportRequestKind>("return");
  const [category, setCategory] = useState("");
  const [orderId, setOrderId] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const orderOptions = useMemo(() => {
    const list = eligibleOrders(ordersState.orders);
    return [
      { value: "", label: s.orderManual },
      ...list.map((o) => ({
        value: o.id,
        label: `${o.id} — ${new Date(o.date).toLocaleDateString("fa-IR")}`,
      })),
    ];
  }, [ordersState.orders]);

  const categories = useMemo(() => categoryOptions(kind), [kind]);

  useEffect(() => {
    const initialOrder = searchParams.get("orderId")?.trim();
    if (initialOrder) setOrderId(initialOrder);
  }, [searchParams]);

  useEffect(() => {
    if (!categories.some((c) => c.value === category)) {
      setCategory(categories[0]?.value ?? "");
    }
  }, [kind, categories, category]);

  useEffect(() => {
    const profile = account.user;
    if (!profile) return;
    const profileName = [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim();
    if (profileName && !fullName) setFullName(profileName);
    if (profile.phone && !phone) setPhone(profile.phone);
  }, [account.user, fullName, phone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) {
      toast.error("موضوع درخواست را انتخاب کنید.");
      return;
    }
    const response = await fetch("/api/support-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind,
        category,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        message: message.trim(),
        orderId: orderId.trim() || undefined,
      }),
    });
    const data = (await response.json().catch(() => null)) as {
      request?: { id: string };
      message?: string;
    } | null;
    if (!response.ok || !data?.request?.id) {
      toast.error(data?.message ?? "ثبت درخواست انجام نشد. دوباره تلاش کنید.");
      return;
    }
    toast.success("درخواست با موفقیت ثبت شد.");
    setSubmittedId(data.request.id);
  };

  if (submittedId) {
    return (
      <div className="pre-owned-sell-success">
        <h2 className="font-display text-2xl text-ivory">{s.successTitle}</h2>
        <p className="mt-4 text-silver">{s.successBody}</p>
        <p className="mt-3 font-mono text-sm text-gold-dark" dir="ltr">
          {s.successId(submittedId)}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {auth.user ? (
            <Link href="/account#orders">
              <Button variant="turquoise" className="w-full sm:w-auto">
                {s.backToAccount}
              </Button>
            </Link>
          ) : null}
          <Link href="/returns">
            <Button variant="outline" className="w-full sm:w-auto">
              {s.backToReturns}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="pre-owned-sell-form space-y-5">
      {!auth.user ? (
        <p className="rounded-heritage border border-gold/15 bg-parchment/20 px-4 py-3 text-sm text-silver">
          {s.loginHint}{" "}
          <Link href="/login" className="text-turquoise-dark hover:text-turquoise">
            {s.loginCta}
          </Link>
        </p>
      ) : null}

      <SelectBox
        label={s.kindLabel}
        value={kind}
        options={[...kindOptions]}
        onValueChange={(value) => setKind(value as SupportRequestKind)}
      />

      <SelectBox
        label={s.categoryLabel}
        value={category}
        options={categories}
        onValueChange={setCategory}
      />

      {auth.user && orderOptions.length > 1 ? (
        <SelectBox
          label={s.orderLabel}
          value={orderId}
          options={orderOptions}
          onValueChange={setOrderId}
        />
      ) : (
        <TextBox
          label={s.orderLabel}
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          placeholder={s.orderPlaceholder}
          inputClassName="auth-input-ltr font-mono text-sm"
        />
      )}

      <TextBox
        label={s.fullName}
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
      />
      <TextBox
        label={s.phone}
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        inputClassName="auth-input-ltr"
        required
      />
      <TextBox
        label={s.email}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        inputClassName="auth-input-ltr"
      />
      <TextAreaBox
        label={s.message}
        id="support-message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
      />
      <p className="text-xs text-silver">{s.messageHint}</p>

      <Button type="submit" className="w-full" size="lg">
        {s.submit}
      </Button>
    </form>
  );
}
