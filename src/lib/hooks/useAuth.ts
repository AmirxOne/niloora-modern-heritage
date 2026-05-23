"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  clearAuthError,
  logoutAccount,
  markSessionResolved,
  markResetSucceeded,
  setAuthError,
  setAuthUser,
  setResetPreview,
  selectAuthError,
  selectAuthHydrated,
  selectAuthIsLoggedIn,
  selectAuthSessionResolved,
  selectLastResetPhone,
  selectLastResetSucceeded,
  selectLastResetTokenPreview,
  selectAuthUser,
} from "../store/slices/authSlice";
import { getAuthErrorMessage } from "../auth/authErrors";
import { normalizeIranPhone } from "../auth/phone";
import { toEnglishDigits, toPersianDigits } from "@/lib/persian-digits";
import { parseJsonResponse } from "./fetch-utils";

/**
 * Client auth gateway:
 * - wraps all auth-related API calls
 * - keeps Redux auth slice as single source of truth
 * - maps HTTP status codes to domain error codes
 */
type SessionUserDto = {
  id: string;
  name: string;
  phone: string;
  role: "user" | "admin";
  memberSince: string;
  tier: "gold" | "platinum" | "royal";
};

type OtpRequestDto = {
  phone: string;
  isNewUser: boolean;
  expiresAt: string;
  otpPreview?: string;
};

type OtpVerifyDto = {
  user: SessionUserDto;
  isNewUser: boolean;
};

function mapErrorStatus(status: number): "invalid_credentials" | "unknown" {
  if (status === 401) return "invalid_credentials";
  return "unknown";
}

function mapOtpErrorCode(
  status: number,
  code?: string,
  legacyMessage?: string
):
  | "otp_invalid"
  | "otp_expired"
  | "otp_too_many_attempts"
  | "otp_rate_limited"
  | "sms_send_failed"
  | "invalid_phone"
  | "unknown" {
  const key = code ?? legacyMessage;
  if (status === 429 || key === "otp_rate_limited") return "otp_rate_limited";
  if (key === "sms_send_failed" || key === "sms_not_configured") return "sms_send_failed";
  if (status === 400 && key === "invalid_phone") return "invalid_phone";
  if (status === 400 && key === "invalid_otp_payload") return "otp_invalid";
  if (status !== 401) return "unknown";
  if (key === "otp_expired") return "otp_expired";
  if (key === "otp_too_many_attempts") return "otp_too_many_attempts";
  if (key === "otp_invalid") return "otp_invalid";
  return "otp_invalid";
}

function otpFailureToast(
  status: number,
  data?: { code?: string; message?: string }
): string {
  if (data?.message) return data.message;
  const mapped = getAuthErrorMessage(mapOtpErrorCode(status, data?.code, data?.message));
  return mapped ?? "خطایی رخ داد. دوباره تلاش کنید.";
}

export function useAuth() {
  // PURPOSE: single client gateway for auth APIs + auth slice mutations.
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectAuthUser);
  const isLoggedIn = useAppSelector(selectAuthIsLoggedIn);
  const hydrated = useAppSelector(selectAuthHydrated);
  const sessionResolved = useAppSelector(selectAuthSessionResolved);
  const error = useAppSelector(selectAuthError);
  const lastResetPhone = useAppSelector(selectLastResetPhone);
  const lastResetTokenPreview = useAppSelector(selectLastResetTokenPreview);
  const lastResetSucceeded = useAppSelector(selectLastResetSucceeded);

  const login = useCallback(
    async (phone: string, password: string) => {
      dispatch(clearAuthError());
      const normalizedPhone = normalizeIranPhone(phone);
      if (!normalizedPhone || !password) {
        dispatch(setAuthError("invalid_credentials"));
        return;
      }
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone, password }),
      });
      if (!response.ok) {
        dispatch(setAuthError(mapErrorStatus(response.status)));
        return;
      }
      const data = await parseJsonResponse<{ user: SessionUserDto }>(response);
      if (!data?.user) {
        dispatch(setAuthError("unknown"));
        return;
      }
      dispatch(
        setAuthUser({
          id: data.user.id,
          name: data.user.name,
          phone: data.user.phone,
          role: data.user.role,
          memberSince: data.user.memberSince,
          tier: data.user.tier,
        })
      );
    },
    [dispatch]
  );

  const register = useCallback(
    async (name: string, phone: string, password: string) => {
      dispatch(clearAuthError());
      const normalizedPhone = normalizeIranPhone(phone);
      if (!name.trim() || !normalizedPhone || password.length < 6) {
        dispatch(setAuthError("unknown"));
        return;
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone: normalizedPhone, password }),
      });

      if (!response.ok) {
        if (response.status === 409) {
          dispatch(setAuthError("phone_exists"));
          return;
        }
        dispatch(setAuthError("unknown"));
        return;
      }

      const data = await parseJsonResponse<{ user: SessionUserDto }>(response);
      if (!data?.user) {
        dispatch(setAuthError("unknown"));
        return;
      }
      dispatch(
        setAuthUser({
          id: data.user.id,
          name: data.user.name,
          phone: data.user.phone,
          role: data.user.role,
          memberSince: data.user.memberSince,
          tier: data.user.tier,
        })
      );
    },
    [dispatch]
  );

  const logout = useCallback(() => {
    fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    dispatch(logoutAccount());
  }, [dispatch]);

  const requestReset = useCallback(
    async (phone: string) => {
      dispatch(clearAuthError());
      const normalizedPhone = normalizeIranPhone(phone);
      if (!normalizedPhone) {
        dispatch(setAuthError("phone_not_found"));
        return;
      }
      const response = await fetch("/api/auth/forgot-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone }),
      });
      if (!response.ok) {
        if (response.status === 404) {
          dispatch(setAuthError("phone_not_found"));
          return;
        }
        dispatch(setAuthError("unknown"));
        return;
      }
      const data = await parseJsonResponse<{ tokenPreview?: string }>(response);
      if (!data?.tokenPreview) {
        dispatch(setAuthError("unknown"));
        return;
      }
      dispatch(setResetPreview({ phone: normalizedPhone, tokenPreview: data.tokenPreview }));
    },
    [dispatch]
  );

  const confirmReset = useCallback(
    async (phone: string, token: string, newPassword: string) => {
      dispatch(clearAuthError());
      const normalizedPhone = normalizeIranPhone(phone);
      if (!normalizedPhone || !token.trim() || newPassword.length < 6) {
        dispatch(setAuthError("invalid_reset"));
        return;
      }
      const response = await fetch("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: normalizedPhone,
          token,
          newPassword,
        }),
      });
      if (!response.ok) {
        if (response.status === 401) {
          dispatch(setAuthError("invalid_reset"));
          return;
        }
        if (response.status === 404) {
          dispatch(setAuthError("phone_not_found"));
          return;
        }
        dispatch(setAuthError("unknown"));
        return;
      }
      dispatch(markResetSucceeded());
    },
    [dispatch]
  );

  const clearError = useCallback(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const requestOtp = useCallback(
    async (phone: string): Promise<OtpRequestDto | null> => {
      // FLOW: normalize input -> call API -> map status to auth error state.
      dispatch(clearAuthError());
      const normalizedPhone = normalizeIranPhone(phone);
      if (!normalizedPhone) {
        dispatch(setAuthError("invalid_phone"));
        return null;
      }

      const response = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone }),
      });

      const data = await parseJsonResponse<
        OtpRequestDto & { message?: string; code?: string; retryAfterSec?: number }
      >(response);
      if (!response.ok || !data) {
        dispatch(setAuthError(mapOtpErrorCode(response.status, data?.code, data?.message)));
        toast.error(otpFailureToast(response.status, data ?? undefined));
        return null;
      }
      if (data.otpPreview) {
        toast.success(`کد تایید: ${toPersianDigits(data.otpPreview)}`);
      } else {
        toast.success("کد تایید ارسال شد.");
      }

      return data;
    },
    [dispatch]
  );

  const verifyOtp = useCallback(
    async (phone: string, code: string, name?: string): Promise<OtpVerifyDto | null> => {
      // FLOW: verify code -> persist session user in store -> return minimal UI payload.
      dispatch(clearAuthError());
      const normalizedPhone = normalizeIranPhone(phone);
      const normalizedCode = toEnglishDigits(code);
      if (!normalizedPhone || !/^\d{6}$/.test(normalizedCode)) {
        dispatch(setAuthError("otp_invalid"));
        return null;
      }

      const response = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: normalizedPhone,
          code: normalizedCode,
          name: name?.trim() || undefined,
        }),
      });

      const data = await parseJsonResponse<OtpVerifyDto & { message?: string; code?: string }>(response);
      if (!response.ok || !data?.user) {
        dispatch(setAuthError(mapOtpErrorCode(response.status, data?.code, data?.message)));
        toast.error(otpFailureToast(response.status, data ?? undefined));
        return null;
      }

      dispatch(
        setAuthUser({
          id: data.user.id,
          name: data.user.name,
          phone: data.user.phone,
          role: data.user.role,
          memberSince: data.user.memberSince,
          tier: data.user.tier,
        })
      );
      toast.success("با موفقیت وارد شدید.");

      return {
        user: data.user,
        isNewUser: data.isNewUser,
      };
    },
    [dispatch]
  );

  const loadSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session", {
        method: "GET",
        credentials: "include",
      });
      if (response.status === 401) {
        dispatch(setAuthUser(null));
        return;
      }
      if (!response.ok) {
        dispatch(markSessionResolved());
        dispatch(setAuthError("unknown"));
        return;
      }
      const data = await parseJsonResponse<{ user: SessionUserDto }>(response);
      if (!data?.user) {
        dispatch(setAuthUser(null));
        return;
      }
      dispatch(
        setAuthUser({
          id: data.user.id,
          name: data.user.name,
          phone: data.user.phone,
          role: data.user.role,
          memberSince: data.user.memberSince,
          tier: data.user.tier,
        })
      );
    } catch {
      dispatch(setAuthUser(null));
    }
  }, [dispatch]);

  return {
    user,
    isLoggedIn,
    hydrated,
    sessionResolved,
    error,
    lastResetPhone,
    lastResetTokenPreview,
    lastResetSucceeded,
    login,
    register,
    logout,
    requestReset,
    confirmReset,
    clearError,
    requestOtp,
    verifyOtp,
    loadSession,
  };
}
