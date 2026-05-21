import { normalizeIranPhone } from "@/lib/auth/phone";
import { computeShippingCost } from "@/lib/orders/shipping-cost";
import {
  isShippingMethodId,
  SHIPPING_METHODS,
  type ShippingMethodId,
} from "@/lib/orders/shipping-methods";
import { toEnglishDigits } from "@/lib/persian-digits";

export type CheckoutShippingInput = {
  fullName: string;
  mobile: string;
  email: string;
  province: string;
  city: string;
  address: string;
  postalCode: string;
  orderNote: string;
  shippingMethod: ShippingMethodId;
};

export { SHIPPING_METHODS };

export type CheckoutShippingErrors = Partial<Record<keyof CheckoutShippingInput, string>>;

export const IRAN_PROVINCES = [
  "آذربایجان شرقی",
  "آذربایجان غربی",
  "اردبیل",
  "اصفهان",
  "البرز",
  "ایلام",
  "بوشهر",
  "تهران",
  "چهارمحال و بختیاری",
  "خراسان جنوبی",
  "خراسان رضوی",
  "خراسان شمالی",
  "خوزستان",
  "زنجان",
  "سمنان",
  "سیستان و بلوچستان",
  "فارس",
  "قزوین",
  "قم",
  "کردستان",
  "کرمان",
  "کرمانشاه",
  "کهگیلویه و بویراحمد",
  "گلستان",
  "گیلان",
  "لرستان",
  "مازندران",
  "مرکزی",
  "هرمزگان",
  "همدان",
  "یزد",
] as const;

export function emptyCheckoutShipping(): CheckoutShippingInput {
  return {
    fullName: "",
    mobile: "",
    email: "",
    province: "",
    city: "",
    address: "",
    postalCode: "",
    orderNote: "",
    shippingMethod: "standard",
  };
}

export function checkoutShippingFromProfile(profile: {
  firstName?: string | null;
  lastName?: string | null;
  name?: string;
  phone?: string;
  email?: string | null;
  province?: string | null;
  city?: string | null;
  addressLine?: string | null;
  postalCode?: string | null;
}): CheckoutShippingInput {
  const fullName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() ||
    profile.name?.trim() ||
    "";

  return {
    fullName,
    mobile: profile.phone?.trim() ?? "",
    email: profile.email?.trim() ?? "",
    province: profile.province?.trim() ?? "",
    city: profile.city?.trim() ?? "",
    address: profile.addressLine?.trim() ?? "",
    postalCode: profile.postalCode?.trim() ?? "",
    orderNote: "",
    shippingMethod: "standard",
  };
}

export function validateCheckoutShipping(
  input: CheckoutShippingInput
): { valid: boolean; errors: CheckoutShippingErrors; normalized: CheckoutShippingInput | null } {
  const errors: CheckoutShippingErrors = {};

  const fullName = input.fullName.trim().replace(/\s+/g, " ");
  if (fullName.length < 3) {
    errors.fullName = "نام و نام خانوادگی را کامل وارد کنید.";
  } else if (fullName.length > 120) {
    errors.fullName = "نام واردشده بیش از حد طولانی است.";
  }

  const mobile = normalizeIranPhone(input.mobile);
  if (!mobile) {
    errors.mobile = "شماره موبایل معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹).";
  }

  const email = input.email.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "ایمیل واردشده معتبر نیست.";
  } else if (email.length > 120) {
    errors.email = "ایمیل بیش از حد طولانی است.";
  }

  const province = input.province.trim();
  if (province.length < 2) {
    errors.province = "استان را انتخاب یا وارد کنید.";
  }

  const city = input.city.trim();
  if (city.length < 2) {
    errors.city = "نام شهر را وارد کنید.";
  } else if (city.length > 80) {
    errors.city = "نام شهر بیش از حد طولانی است.";
  }

  const address = input.address.trim();
  if (address.length < 10) {
    errors.address = "نشانی کامل ارسال را وارد کنید (حداقل ۱۰ کاراکتر).";
  } else if (address.length > 500) {
    errors.address = "نشانی بیش از حد طولانی است.";
  }

  const postalCode = toEnglishDigits(input.postalCode).replace(/\D/g, "");
  if (!/^\d{10}$/.test(postalCode)) {
    errors.postalCode = "کد پستی باید ۱۰ رقم باشد.";
  }

  const orderNote = input.orderNote.trim();
  if (orderNote.length > 500) {
    errors.orderNote = "یادداشت سفارش حداکثر ۵۰۰ کاراکتر است.";
  }

  const shippingMethod = input.shippingMethod;
  if (!isShippingMethodId(shippingMethod)) {
    errors.shippingMethod = "روش ارسال را انتخاب کنید.";
  } else if (shippingMethod === "express_tehran" && province !== "تهران") {
    errors.shippingMethod = "پیک فوری فقط برای استان تهران در دسترس است.";
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors, normalized: null };
  }

  return {
    valid: true,
    errors: {},
    normalized: {
      fullName,
      mobile: mobile!,
      email,
      province,
      city,
      address,
      postalCode,
      orderNote,
      shippingMethod: shippingMethod as ShippingMethodId,
    },
  };
}

export function shippingCostForInput(
  input: Pick<CheckoutShippingInput, "province" | "city" | "shippingMethod">
): number {
  return computeShippingCost(input).cost;
}

export const CHECKOUT_SHIPPING_STORAGE_KEY = "niloora-checkout-shipping";
