export const INSTALLMENT_MONTH_OPTIONS = [3, 4, 6] as const;
export type InstallmentMonthOption = (typeof INSTALLMENT_MONTH_OPTIONS)[number];
export type CheckoutPaymentMethod = "zarinpal" | "bnpl";

export function isInstallmentMonthOption(value: number): value is InstallmentMonthOption {
  return INSTALLMENT_MONTH_OPTIONS.includes(value as InstallmentMonthOption);
}

export function calculateInstallmentAmount(total: number, months: InstallmentMonthOption): number {
  if (total <= 0) return 0;
  return Math.ceil(total / months);
}

export function validateBnplEligibility(input: {
  orderTotal: number;
  nationalCode?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  addressLine?: string | null;
}) {
  if (input.orderTotal < 5_000_000) {
    return { ok: false as const, message: "خرید اقساطی برای سفارش‌های زیر ۵ میلیون تومان فعال نیست." };
  }
  if (!input.nationalCode || input.nationalCode.replace(/\D/g, "").length !== 10) {
    return { ok: false as const, message: "برای خرید اقساطی تکمیل کد ملی در پروفایل الزامی است." };
  }
  if (!input.firstName || !input.lastName) {
    return { ok: false as const, message: "برای خرید اقساطی نام و نام خانوادگی را در پروفایل تکمیل کنید." };
  }
  if (!input.addressLine) {
    return { ok: false as const, message: "برای خرید اقساطی نشانی پروفایل باید تکمیل باشد." };
  }
  return { ok: true as const };
}
