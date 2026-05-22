"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CHECKOUT_SHIPPING_STORAGE_KEY,
  checkoutShippingFromProfile,
  emptyCheckoutShipping,
  IRAN_PROVINCES,
  SHIPPING_METHODS,
  validateCheckoutShipping,
  type CheckoutShippingInput,
} from "@/lib/checkout/shipping";
import { computeShippingCost } from "@/lib/orders/shipping-cost";
import { TomanPrice } from "@/components/commerce/TomanPrice";
import { TextBox, TextAreaBox, SelectBox } from "@/components/inputs";
import { fa } from "@/lib/i18n/fa";

type ProfilePrefill = {
  firstName?: string | null;
  lastName?: string | null;
  name?: string;
  phone?: string;
  email?: string | null;
  province?: string | null;
  city?: string | null;
  addressLine?: string | null;
  postalCode?: string | null;
};

export type CheckoutShippingFormState = {
  form: CheckoutShippingInput;
  showErrors: boolean;
  validate: () => CheckoutShippingInput | null;
  touchAll: () => void;
};

interface CheckoutShippingFormProps {
  profile?: ProfilePrefill | null;
  onStateReady?: (state: CheckoutShippingFormState) => void;
  disabled?: boolean;
}

export function CheckoutShippingForm({ profile, onStateReady, disabled }: CheckoutShippingFormProps) {
  const provinceOptions = useMemo(
    () => IRAN_PROVINCES.map((p) => ({ value: p, label: p })),
    []
  );

  const [form, setForm] = useState<CheckoutShippingInput>(() => {
    if (typeof window === "undefined") return emptyCheckoutShipping();
    try {
      const saved = sessionStorage.getItem(CHECKOUT_SHIPPING_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<CheckoutShippingInput>;
        return { ...emptyCheckoutShipping(), ...parsed, shippingMethod: parsed.shippingMethod ?? "standard" };
      }
    } catch {
      /* ignore */
    }
    return profile ? checkoutShippingFromProfile(profile) : emptyCheckoutShipping();
  });

  const [touched, setTouched] = useState<Partial<Record<keyof CheckoutShippingInput, boolean>>>(
    {}
  );
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm((prev) => {
      const hasData = prev.fullName || prev.address || prev.province;
      if (hasData) return prev;
      return checkoutShippingFromProfile(profile);
    });
  }, [profile]);

  useEffect(() => {
    try {
      sessionStorage.setItem(CHECKOUT_SHIPPING_STORAGE_KEY, JSON.stringify(form));
    } catch {
      /* ignore */
    }
  }, [form]);

  useEffect(() => {
    if (form.province !== "تهران" && form.shippingMethod === "express_tehran") {
      setForm((prev) => ({ ...prev, shippingMethod: "standard" }));
    }
  }, [form.province, form.shippingMethod]);

  const validation = validateCheckoutShipping(form);

  const availableMethods = useMemo(
    () =>
      SHIPPING_METHODS.filter(
        (m) => m.id !== "express_tehran" || form.province === "تهران"
      ),
    [form.province]
  );

  const selectedQuote = useMemo(
    () =>
      computeShippingCost({
        province: form.province,
        city: form.city,
        shippingMethod: form.shippingMethod,
      }),
    [form.province, form.city, form.shippingMethod]
  );

  const touchAll = useCallback(() => {
    setShowErrors(true);
    setTouched({
      fullName: true,
      mobile: true,
      province: true,
      city: true,
      address: true,
      postalCode: true,
      email: true,
      orderNote: true,
      shippingMethod: true,
    });
  }, []);

  const validate = useCallback((): CheckoutShippingInput | null => {
    setShowErrors(true);
    setTouched({
      fullName: true,
      mobile: true,
      email: true,
      province: true,
      city: true,
      address: true,
      postalCode: true,
      orderNote: true,
      shippingMethod: true,
    });
    const result = validateCheckoutShipping(form);
    return result.valid && result.normalized ? result.normalized : null;
  }, [form]);

  const onStateReadyRef = useRef(onStateReady);
  onStateReadyRef.current = onStateReady;

  useEffect(() => {
    onStateReadyRef.current?.({ form, showErrors, validate, touchAll });
  }, [form, showErrors, validate, touchAll]);

  const setField = <K extends keyof CheckoutShippingInput>(key: K, value: CheckoutShippingInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const markTouched = (key: keyof CheckoutShippingInput) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  const fieldError = (key: keyof CheckoutShippingInput) => {
    const err = validation.errors[key];
    if (!err) return undefined;
    return touched[key] || showErrors ? err : undefined;
  };

  return (
    <div className="cart-checkout-form space-y-5">
      <p className="text-sm leading-relaxed text-silver">{fa.cart.checkoutHint}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextBox
          label={fa.cart.shipping.fullName}
          value={form.fullName}
          onChange={(e) => setField("fullName", e.target.value)}
          onBlur={() => markTouched("fullName")}
          error={fieldError("fullName")}
          touched={Boolean(touched.fullName || showErrors)}
          disabled={disabled}
          autoComplete="name"
        />
        <TextBox
          label={fa.cart.shipping.mobile}
          value={form.mobile}
          onChange={(e) => setField("mobile", e.target.value)}
          onBlur={() => markTouched("mobile")}
          error={fieldError("mobile")}
          touched={Boolean(touched.mobile || showErrors)}
          disabled={disabled}
          inputClassName="auth-input-ltr"
          placeholder="09123456789"
          autoComplete="tel"
        />
      </div>

      <TextBox
        label={fa.cart.shipping.email}
        value={form.email}
        onChange={(e) => setField("email", e.target.value)}
        onBlur={() => markTouched("email")}
        error={fieldError("email")}
        touched={Boolean(touched.email || showErrors)}
        disabled={disabled}
        inputClassName="auth-input-ltr"
        autoComplete="email"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectBox
          label={fa.cart.shipping.province}
          value={form.province}
          options={provinceOptions}
          placeholder={fa.cart.shipping.provincePlaceholder}
          searchable
          onValueChange={(value) => setField("province", value)}
          onBlur={() => markTouched("province")}
          error={fieldError("province")}
          touched={Boolean(touched.province || showErrors)}
          disabled={disabled}
        />
        <TextBox
          label={fa.cart.shipping.city}
          value={form.city}
          onChange={(e) => setField("city", e.target.value)}
          onBlur={() => markTouched("city")}
          error={fieldError("city")}
          touched={Boolean(touched.city || showErrors)}
          disabled={disabled}
        />
      </div>

      <TextBox
        label={fa.cart.shipping.postalCode}
        value={form.postalCode}
        onChange={(e) => setField("postalCode", e.target.value)}
        onBlur={() => markTouched("postalCode")}
        error={fieldError("postalCode")}
        touched={Boolean(touched.postalCode || showErrors)}
        disabled={disabled}
        inputClassName="auth-input-ltr"
        placeholder="1234567890"
      />

      <TextAreaBox
        label={fa.cart.shipping.address}
        value={form.address}
        onChange={(e) => setField("address", e.target.value)}
        onBlur={() => markTouched("address")}
        error={fieldError("address")}
        touched={Boolean(touched.address || showErrors)}
        disabled={disabled}
        rows={3}
      />

      <fieldset className="checkout-shipping-methods">
        <legend className="mb-3 text-sm font-medium text-ivory">{fa.cart.shipping.methodTitle}</legend>
        {selectedQuote.ready && selectedQuote.zoneLabel ? (
          <p className="mb-3 text-xs text-silver">
            {fa.cart.shippingZoneHint(selectedQuote.zoneLabel)}
          </p>
        ) : (
          <p className="mb-3 text-xs text-silver">{fa.cart.shippingCostPending}</p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {availableMethods.map((method) => {
            const selected = form.shippingMethod === method.id;
            const methodQuote = computeShippingCost({
              province: form.province,
              city: form.city,
              shippingMethod: method.id,
            });
            return (
              <label
                key={method.id}
                className={`checkout-shipping-method-card${selected ? " checkout-shipping-method-card--selected" : ""}`}
              >
                <input
                  type="radio"
                  name="shippingMethod"
                  value={method.id}
                  checked={selected}
                  disabled={disabled}
                  className="sr-only"
                  onChange={() => {
                    setField("shippingMethod", method.id);
                    markTouched("shippingMethod");
                  }}
                />
                <span className="font-medium text-ivory">{method.label}</span>
                <span className="mt-1 block text-xs text-silver">{method.eta}</span>
                <span className="mt-2 block text-sm text-price-sale">
                  {methodQuote.ready
                    ? methodQuote.cost > 0
                      ? <TomanPrice amount={methodQuote.cost} size="xs" />
                      : fa.dashboard.orderShippingCostFree
                    : "—"}
                </span>
                {method.id === "express_tehran" && methodQuote.ready && selectedQuote.zone === "tehran" ? (
                  <span className="mt-1 block text-[11px] text-silver">
                    شامل اضافه‌بهای پیک فوری
                  </span>
                ) : null}
              </label>
            );
          })}
        </div>
        {fieldError("shippingMethod") ? (
          <p className="mt-2 text-xs text-rose-400">{fieldError("shippingMethod")}</p>
        ) : null}
      </fieldset>

      <TextAreaBox
        label={fa.cart.shipping.orderNote}
        value={form.orderNote}
        onChange={(e) => setField("orderNote", e.target.value)}
        onBlur={() => markTouched("orderNote")}
        error={fieldError("orderNote")}
        touched={Boolean(touched.orderNote || showErrors)}
        disabled={disabled}
        rows={2}
        placeholder={fa.cart.shipping.orderNotePlaceholder}
      />

      <div className="rounded-heritage border border-gold/15 bg-parchment/30 px-4 py-4 text-sm text-ivory-light">
        <p className="font-medium text-ivory">{fa.cart.shipping.deliveryTitle}</p>
        <p className="mt-2 text-xs leading-relaxed text-silver">{fa.cart.shipping.deliveryHint}</p>
      </div>
    </div>
  );
}
