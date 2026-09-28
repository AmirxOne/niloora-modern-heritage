"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFormik } from "formik";
import { fa } from "@/lib/i18n/fa";
import { useAuthPage } from "@/lib/hooks/useAuthPage";
import { getAuthErrorMessage } from "@/lib/auth/authErrors";
import { formatIranPhoneDisplay } from "@/lib/auth/phone";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthFormHeader } from "@/components/auth/AuthFormHeader";
import { AuthOtpInput } from "@/components/auth/AuthOtpInput";
import { FormikTextField } from "@/components/forms/FormikTextField";
import { Button } from "@/components/ui/Button";
import { forgotRequestValidationSchema } from "@/lib/auth/authSchemas";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";

type OtpRequestState = { phone: string; otpPreview?: string };

/**
 * حساب‌های آزمایشی — فقط در dev (NODE_ENV !== production) نمایش داده می‌شوند.
 * مثل الگوی پروژه MeetingHub: کلیک = پر کردن شماره + درخواست خودکار OTP.
 */
const DEV_TEST_ACCOUNTS = [
  { label: "ادمین", phone: "09123456789", hint: "دسترسی کامل admin" },
  { label: "ادیتور", phone: "09120000001", hint: "بلاگ: ساخت/ویرایش پیش‌نویس" },
  { label: "بازبین", phone: "09120000002", hint: "بلاگ: تأیید/انتشار" },
  { label: "فروشنده (مالک)", phone: "09120000004", hint: "پنل فروشنده atelier-test" },
  { label: "فروشنده (کارمند)", phone: "09120000005", hint: "دسترسی محدود فروشنده" },
  { label: "کاربر عادی", phone: "09120000003", hint: "خریدار بدون پنل فروشنده" },
  { label: "کاربر بدون دسترسی", phone: "09120000006", hint: "همیشه بدون نقش اضافه — برای تست‌های منفی" },
] as const;

const SHOW_DEV_ACCOUNTS = process.env.NODE_ENV !== "production";

export default function UnifiedAuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-matte" aria-hidden />}>
      <UnifiedAuthPageInner />
    </Suspense>
  );
}

function UnifiedAuthPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = safeRedirectPath(searchParams.get("redirect"));
  const referralFromUrl = searchParams.get("ref") ?? "";
  const { auth } = useAuthPage(redirectTo);

  const [requestState, setRequestState] = useState<OtpRequestState | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const verifyInFlightRef = useRef(false);

  const isOtpStep = Boolean(requestState);

  const phoneForm = useFormik({
    initialValues: { phone: "", referralCode: referralFromUrl },
    validationSchema: forgotRequestValidationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values) => {
      setIsSendingOtp(true);
      const result = await auth.requestOtp(values.phone);
      setIsSendingOtp(false);
      if (!result) return;
      setOtpCode("");
      setRequestState({
        phone: result.phone,
        otpPreview: result.otpPreview,
      });
      // در dev کد پیش‌نمایش را خودکار تایپ می‌کنیم تا ورود سریع باشد
      if (result.otpPreview) {
        setOtpCode(result.otpPreview);
      }
    },
  });

  const handleDevAccountClick = async (phone: string) => {
    if (isSendingOtp) return;
    phoneForm.setFieldValue("phone", phone);
    setIsSendingOtp(true);
    const result = await auth.requestOtp(phone);
    setIsSendingOtp(false);
    if (!result) return;
    setOtpCode(result.otpPreview ?? "");
    setRequestState({
      phone: result.phone,
      otpPreview: result.otpPreview,
    });
  };

  const errorMessage = getAuthErrorMessage(auth.error);

  const handleVerifyOtp = async () => {
    if (!requestState) return;
    if (verifyInFlightRef.current) return;
    verifyInFlightRef.current = true;
    setIsVerifyingOtp(true);
    try {
      const referralCode = (phoneForm.values.referralCode ?? "").trim();
      const result = await auth.verifyOtp(requestState.phone, otpCode, undefined, referralCode);
      if (!result) return;
      await auth.syncSessionAfterLogin();
      router.replace(redirectTo);
    } finally {
      setIsVerifyingOtp(false);
      verifyInFlightRef.current = false;
    }
  };

  const handleResend = async () => {
    if (!requestState) return;
    setIsSendingOtp(true);
    const result = await auth.requestOtp(requestState.phone);
    setIsSendingOtp(false);
    if (!result) return;
    setOtpCode("");
    setRequestState({
      phone: result.phone,
      otpPreview: result.otpPreview,
    });
  };

  const normalizedPhoneDisplay = useMemo(
    () => (requestState ? formatIranPhoneDisplay(requestState.phone) : ""),
    [requestState]
  );
  const requestedPhone = requestState?.phone ?? "";

  return (
    <AuthShell split="65-35">
      <AuthFormHeader
        eyebrow={fa.nav.loginOrRegister}
        title={isOtpStep ? fa.auth.otpStepTitle : fa.auth.otpEntryTitle}
        subtitle={isOtpStep ? fa.auth.otpStepSubtitle : fa.auth.otpEntrySubtitle}
      />

      {!isOtpStep ? (
        <form onSubmit={phoneForm.handleSubmit} className="auth-form-modern" noValidate>
          <FormikTextField
            formik={phoneForm}
            name="phone"
            label={fa.auth.phone}
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder={fa.auth.phonePlaceholder}
            className="auth-input-ltr"
          />
          <FormikTextField
            formik={phoneForm}
            name="referralCode"
            label={fa.auth.referralCodeLabel}
            type="text"
            autoComplete="off"
            placeholder={fa.auth.referralCodePlaceholder}
            className="auth-input-ltr"
          />

          {errorMessage ? <p className="auth-error-modern">{errorMessage}</p> : null}

          <Button type="submit" size="lg" className="w-full" isLoading={isSendingOtp}>
            {fa.auth.otpSubmitPhone}
          </Button>

          {SHOW_DEV_ACCOUNTS ? (
            <div className="rounded-heritage border border-subtle bg-matte-elevated px-4 py-3">
              <p className="text-xs text-silver">حساب‌های آزمایشی — کلیک کنید تا کد تایید (dev) صادر شود:</p>
              <div className="mt-2.5 flex flex-wrap gap-1.5" data-testid="dev-test-accounts">
                {DEV_TEST_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.phone}
                    type="button"
                    onClick={() => handleDevAccountClick(acc.phone)}
                    disabled={isSendingOtp}
                    title={`${acc.phone} · ${acc.hint}`}
                    className="rounded-full border border-subtle bg-matte px-2.5 py-1 text-xs text-ivory transition hover:border-gold/40 hover:bg-gold/10 disabled:opacity-50"
                  >
                    {acc.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </form>
      ) : (
        <div className="auth-form-modern">
          <p className="auth-otp-sent">
            کد تایید برای <span className="auth-otp-phone">{normalizedPhoneDisplay}</span> ارسال شد.
          </p>
          <p className="auth-otp-hint">{fa.auth.otpCodeHint}</p>

          <div className="auth-otp-wrap">
            <AuthOtpInput
              value={otpCode}
              onChange={setOtpCode}
              onComplete={handleVerifyOtp}
              isError={Boolean(errorMessage)}
              disabled={isSendingOtp || isVerifyingOtp}
            />
          </div>

          {errorMessage ? <p className="auth-error-modern">{errorMessage}</p> : null}

          <Button
            type="button"
            size="lg"
            className="w-full"
            isLoading={isVerifyingOtp}
            onClick={handleVerifyOtp}
            disabled={otpCode.length !== 6}
          >
            {fa.auth.otpSubmitCode}
          </Button>

          <div className="auth-otp-actions">
            <button
              type="button"
              className="auth-inline-link"
              onClick={handleResend}
              disabled={isSendingOtp || isVerifyingOtp}
            >
              {fa.auth.otpResend}
            </button>
            <button
              type="button"
              className="auth-inline-link"
              onClick={() => {
                setRequestState(null);
                setOtpCode("");
                phoneForm.setFieldValue("phone", requestedPhone);
              }}
            >
              {fa.auth.otpEditPhone}
            </button>
          </div>
        </div>
      )}

      <p className="auth-bottom-text">{fa.auth.otpLegalHint}</p>
    </AuthShell>
  );
}
