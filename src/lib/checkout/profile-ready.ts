import {
  checkoutShippingFromProfile,
  validateCheckoutShipping,
} from "@/lib/checkout/shipping";

export type CheckoutProfilePrefill = {
  firstName?: string | null;
  lastName?: string | null;
  name?: string;
  phone?: string;
  province?: string | null;
  city?: string | null;
  addressLine?: string | null;
  postalCode?: string | null;
};

export function isCheckoutProfileReady(profile: CheckoutProfilePrefill | null | undefined): boolean {
  if (!profile?.phone?.trim()) return false;
  const draft = checkoutShippingFromProfile(profile);
  return validateCheckoutShipping(draft).valid;
}

export function checkoutProfileSummary(profile: CheckoutProfilePrefill): string {
  const draft = checkoutShippingFromProfile(profile);
  const parts = [
    draft.fullName,
    draft.province && draft.city ? `${draft.province}، ${draft.city}` : null,
    draft.address,
  ].filter(Boolean);
  return parts.join(" — ");
}
