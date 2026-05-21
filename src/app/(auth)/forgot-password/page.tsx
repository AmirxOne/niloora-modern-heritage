"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useFormik } from "formik";
import { useRouter, useSearchParams } from "next/navigation";
import { fa } from "@/lib/i18n/fa";
import { useApp } from "@/lib/context/AppContext";
import { Button } from "@/components/ui/Button";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthFormHeader } from "@/components/auth/AuthFormHeader";
import { FormikTextField } from "@/components/forms/FormikTextField";
import {
  forgotRequestValidationSchema,
  forgotResetValidationSchema,
} from "@/lib/auth/authSchemas";

function ForgotRequestForm({
  onRequested,
  lastResetTokenPreview,
  serverError,
}: {
  onRequested: (phone: string) => void;
  lastResetTokenPreview: string | null;
  serverError: string | null;
}) {
  const { auth } = useApp();

  const formik = useFormik({
    initialValues: { phone: "" },
    validationSchema: forgotRequestValidationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: (values, { setSubmitting }) => {
      auth.clearError();
      auth.requestReset(values.phone);
      onRequested(values.phone.trim());
      setSubmitting(false);
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} className="auth-form-modern" noValidate>
      <FormikTextField
        formik={formik}
        name="phone"
        label={fa.auth.phone}
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        placeholder={fa.auth.phonePlaceholder}
        className="auth-input-ltr"
      />

      {serverError ? <p className="auth-error-modern">{serverError}</p> : null}
      {lastResetTokenPreview ? (
        <p className="auth-token-demo">
          {fa.auth.forgotSent}
          <br />
          <span>{lastResetTokenPreview}</span>
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" isLoading={formik.isSubmitting}>
        {fa.auth.forgotSubmit}
      </Button>
    </form>
  );
}

function ForgotResetForm({
  requestPhone,
  lastResetTokenPreview,
  serverError,
}: {
  requestPhone: string;
  lastResetTokenPreview: string | null;
  serverError: string | null;
}) {
  const { auth } = useApp();

  const formik = useFormik({
    initialValues: { token: "", newPassword: "" },
    validationSchema: forgotResetValidationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: (values, { setSubmitting }) => {
      auth.clearError();
      auth.confirmReset(requestPhone, values.token, values.newPassword);
      setSubmitting(false);
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} className="auth-form-modern" noValidate>
      {lastResetTokenPreview ? (
        <p className="auth-token-demo">
          {fa.auth.forgotSent}
          <br />
          <span>{lastResetTokenPreview}</span>
        </p>
      ) : null}
      <FormikTextField
        formik={formik}
        name="token"
        label={fa.auth.resetToken}
        autoComplete="one-time-code"
        placeholder={fa.auth.resetTokenPlaceholder}
        className="auth-input-ltr"
      />
      <FormikTextField
        formik={formik}
        name="newPassword"
        label={fa.auth.resetNewPassword}
        type="password"
        autoComplete="new-password"
        placeholder={fa.auth.resetNewPasswordPlaceholder}
      />
      {serverError ? <p className="auth-error-modern">{serverError}</p> : null}
      <Button type="submit" size="lg" className="w-full" isLoading={formik.isSubmitting}>
        {fa.auth.resetSubmit}
      </Button>
    </form>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-matte" aria-hidden />}>
      <ForgotPasswordPageInner />
    </Suspense>
  );
}

function ForgotPasswordPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/account";
  const { auth } = useApp();

  const [requestPhone, setRequestPhone] = useState("");
  const [step, setStep] = useState<"request" | "reset">("request");

  useEffect(() => {
    auth.clearError();
  }, [auth]);

  useEffect(() => {
    if (auth.lastResetTokenPreview) {
      setStep("reset");
    }
  }, [auth.lastResetTokenPreview]);

  useEffect(() => {
    if (auth.lastResetSucceeded) {
      router.push(`/auth?redirect=${encodeURIComponent(redirectTo)}`);
    }
  }, [auth.lastResetSucceeded, redirectTo, router]);

  const serverError = useMemo(() => {
    if (auth.error === "phone_not_found") return fa.auth.forgotPhoneNotFound;
    if (auth.error === "invalid_reset") return fa.auth.resetInvalid;
    return null;
  }, [auth.error]);

  return (
    <AuthShell split="65-35">
      <AuthFormHeader
        eyebrow={fa.auth.forgotPassword}
        title={fa.auth.forgotTitle}
        subtitle={fa.auth.forgotSubtitle}
      />

      {step === "request" ? (
        <ForgotRequestForm
          onRequested={(phone) => setRequestPhone(phone)}
          lastResetTokenPreview={auth.lastResetTokenPreview}
          serverError={serverError}
        />
      ) : (
        <ForgotResetForm
          requestPhone={requestPhone}
          lastResetTokenPreview={auth.lastResetTokenPreview}
          serverError={serverError}
        />
      )}

      <p className="auth-bottom-text">
        <Link href={`/auth?redirect=${encodeURIComponent(redirectTo)}`} className="auth-inline-link">
          {fa.auth.backToLogin}
        </Link>
      </p>
    </AuthShell>
  );
}
