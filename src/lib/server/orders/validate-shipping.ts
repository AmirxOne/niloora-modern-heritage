import {
  validateCheckoutShipping,
  type CheckoutShippingInput,
} from "@/lib/checkout/shipping";

export function parseAndValidateShippingPayload(
  raw: unknown
): { ok: true; shipping: CheckoutShippingInput } | { ok: false; message: string } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, message: "اطلاعات ارسال نامعتبر است." };
  }

  const body = raw as Record<string, unknown>;
  const input: CheckoutShippingInput = {
    fullName: String(body.fullName ?? ""),
    mobile: String(body.mobile ?? ""),
    email: String(body.email ?? ""),
    province: String(body.province ?? ""),
    city: String(body.city ?? ""),
    address: String(body.address ?? ""),
    postalCode: String(body.postalCode ?? ""),
    orderNote: String(body.orderNote ?? ""),
    shippingMethod: String(body.shippingMethod ?? "standard") as CheckoutShippingInput["shippingMethod"],
  };

  const result = validateCheckoutShipping(input);
  if (!result.valid || !result.normalized) {
    const firstError = Object.values(result.errors)[0];
    return { ok: false, message: firstError ?? "اطلاعات ارسال نامعتبر است." };
  }

  return { ok: true, shipping: result.normalized };
}
