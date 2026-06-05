"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextBox, TextAreaBox } from "@/components/inputs";
import { useAdminGiftCards } from "@/lib/hooks/useAdminGiftCards";
import { TomanPrice } from "@/components/commerce/TomanPrice";
import { LoadingState } from "@/components/ui/loading/LoadingState";

export function AdminGiftCardsPanel() {
  const admin = useAdminGiftCards();
  const { isAdmin, loadGiftCards } = admin;
  const [amount, setAmount] = useState("500000");
  const [note, setNote] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientContact, setRecipientContact] = useState("");

  useEffect(() => {
    if (isAdmin) void loadGiftCards();
  }, [isAdmin, loadGiftCards]);

  if (!admin.allowed) return null;

  return (
    <div className="admin-orders-panel">
      <section className="admin-order-card mb-6">
        <h2 className="admin-page-title text-lg">ایجاد کارت هدیه جدید</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <TextBox
            label="مبلغ کارت هدیه (تومان)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputClassName="auth-input-ltr"
          />
          <TextBox
            label="نام گیرنده (اختیاری)"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
          />
          <TextBox
            label="شماره/ایمیل گیرنده (اختیاری)"
            value={recipientContact}
            onChange={(e) => setRecipientContact(e.target.value)}
            inputClassName="auth-input-ltr"
          />
          <TextAreaBox
            label="یادداشت داخلی (اختیاری)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
          />
        </div>
        <div className="mt-4">
          <Button
            type="button"
            onClick={() =>
              void admin.createGiftCard({
                amount: Number(amount),
                note,
                recipientName,
                recipientContact,
              })
            }
            disabled={admin.isSaving}
          >
            {admin.isSaving ? "در حال ثبت…" : "ثبت کارت هدیه"}
          </Button>
        </div>
      </section>

      {admin.isLoading ? (
        <LoadingState variant="admin-cards" count={2} />
      ) : admin.giftCards.length === 0 ? (
        <p className="admin-orders-empty">کارت هدیه‌ای ثبت نشده است.</p>
      ) : (
        <div className="admin-orders-list">
          {admin.giftCards.map((card) => (
            <article key={card.id} className="admin-order-card">
              <header className="admin-order-card-header">
                <div>
                  <p className="admin-order-id font-mono" dir="ltr">{card.code}</p>
                  <p className="admin-order-customer">
                    موجودی: <TomanPrice amount={card.remainingAmount} size="xs" />
                  </p>
                  <p className="admin-order-date">
                    مبلغ اولیه: <TomanPrice amount={card.initialAmount} size="xs" />
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void admin.updateGiftCard(card.id, { active: !card.active })}
                  disabled={admin.isSaving}
                >
                  {card.active ? "غیرفعال‌سازی" : "فعال‌سازی"}
                </Button>
              </header>
              {card.note ? <p className="text-xs text-silver">{card.note}</p> : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
