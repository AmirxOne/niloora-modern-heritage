"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextBox } from "@/components/inputs";
import { useGiftCard } from "@/lib/hooks/useGiftCard";
import { useGiftCardBootstrap } from "@/lib/hooks/useGiftCardBootstrap";

export function GiftCardInput({ payableBeforeGiftCard }: { payableBeforeGiftCard: number }) {
  const giftCard = useGiftCard();
  const [input, setInput] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  useGiftCardBootstrap();

  useEffect(() => {
    setInput(giftCard.appliedCode ?? "");
  }, [giftCard.appliedCode]);

  const submit = async () => {
    setIsApplying(true);
    try {
      await giftCard.tryApply(input, payableBeforeGiftCard);
    } finally {
      setIsApplying(false);
    }
  };

  if (payableBeforeGiftCard <= 0) return null;

  return (
    <div className="promo-code-block">
      <div className="promo-code-row">
        <TextBox
          id="gift-card-code"
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") void submit();
          }}
          placeholder="GC-XXXXXXXX"
          inputClassName="promo-code-input auth-input-ltr"
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 flex-1"
          disabled={isApplying}
        />
        {giftCard.appliedCode ? (
          <Button type="button" size="sm" variant="outline" onClick={giftCard.remove}>
            حذف کارت
          </Button>
        ) : (
          <Button type="button" size="sm" variant="outline" onClick={() => void submit()} disabled={isApplying}>
            {isApplying ? "در حال بررسی…" : "اعمال کارت هدیه"}
          </Button>
        )}
      </div>
      {giftCard.applied ? (
        <p className="promo-code-success">
          کارت {giftCard.applied.code} اعمال شد.
        </p>
      ) : (
        <p className="promo-code-hint">کد کارت هدیه را وارد کنید تا از مانده اعتبار کسر شود.</p>
      )}
      {giftCard.error ? <p className="promo-code-error">کارت هدیه معتبر نیست یا قابل استفاده نیست.</p> : null}
    </div>
  );
}
