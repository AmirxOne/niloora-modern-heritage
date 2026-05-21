"use client";

import { useEffect, useState } from "react";
import { X } from "@/components/icons";
import { TextBox } from "@/components/inputs";
import { fa } from "@/lib/i18n/fa";
import { usePromo } from "@/lib/hooks/usePromo";
import { usePromoBootstrap } from "@/lib/hooks/usePromoBootstrap";
import { ICON_VARIANT, iconSizes } from "@/lib/icons";
import { Button } from "@/components/ui/Button";

interface PromoCodeInputProps {
  subtotalSale: number;
}

export function PromoCodeInput({ subtotalSale }: PromoCodeInputProps) {
  const { appliedCode, lastError, tryApply, remove } = usePromo();
  const [input, setInput] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  usePromoBootstrap();

  useEffect(() => {
    setInput(appliedCode ?? "");
  }, [appliedCode]);

  const handleApply = async () => {
    if (!input.trim()) {
      remove();
      return;
    }
    setIsApplying(true);
    try {
      await tryApply(input, subtotalSale);
    } finally {
      setIsApplying(false);
    }
  };

  const errorMessage =
    lastError === "not_found" || lastError === "inactive"
      ? fa.bahakahi.promoErrorNotFound
      : lastError === "min_order"
        ? fa.bahakahi.promoErrorMinOrder
        : null;

  return (
    <div className="promo-code-block">
      <div className="promo-code-row">
        <TextBox
          id="promo-code"
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleApply();
          }}
          placeholder={fa.bahakahi.promoPlaceholder}
          inputClassName="promo-code-input auth-input-ltr"
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 flex-1"
          disabled={isApplying}
        />
        {appliedCode ? (
          <button
            type="button"
            onClick={remove}
            className="promo-code-remove"
            aria-label={fa.bahakahi.promoRemove}
          >
            <X size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />
          </button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void handleApply()}
            disabled={isApplying}
          >
            {isApplying ? fa.admin.orders.saving : fa.bahakahi.promoApply}
          </Button>
        )}
      </div>
      {appliedCode ? (
        <p className="promo-code-success">{fa.bahakahi.promoApplied(appliedCode)}</p>
      ) : (
        <p className="promo-code-hint">{fa.bahakahi.promoHint}</p>
      )}
      {errorMessage ? <p className="promo-code-error">{errorMessage}</p> : null}
    </div>
  );
}
