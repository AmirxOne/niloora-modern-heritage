import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthErrorCode } from "@/lib/auth/authErrors";

/**
 * Lightweight auth state for shell/navigation decisions.
 * Detailed profile fields are loaded via `useAccount` and account API.
 */
export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  role?: "user" | "admin";
  memberSince?: string;
  tier?: "gold" | "platinum" | "royal";
}

interface AuthState {
  user: AuthUser | null;
  hydrated: boolean;
  sessionResolved: boolean;
  lastError: AuthErrorCode;
  lastResetPhone: string | null;
  lastResetTokenPreview: string | null;
  lastResetSucceeded: boolean;
}

const initialState: AuthState = {
  user: null,
  hydrated: false,
  sessionResolved: false,
  lastError: null,
  lastResetPhone: null,
  lastResetTokenPreview: null,
  lastResetSucceeded: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    hydrateAuth(state) {
      state.hydrated = true;
    },
    setAuthUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
      state.sessionResolved = true;
      state.lastError = null;
    },
    markSessionResolved(state) {
      state.sessionResolved = true;
    },
    setAuthError(state, action: PayloadAction<AuthErrorCode>) {
      state.lastError = action.payload;
    },
    setResetPreview(state, action: PayloadAction<{ phone: string; tokenPreview: string }>) {
      state.lastError = null;
      state.lastResetPhone = action.payload.phone;
      state.lastResetTokenPreview = action.payload.tokenPreview;
      state.lastResetSucceeded = false;
    },
    markResetSucceeded(state) {
      state.lastError = null;
      state.lastResetPhone = null;
      state.lastResetTokenPreview = null;
      state.lastResetSucceeded = true;
    },
    logoutAccount(state) {
      state.user = null;
      state.lastError = null;
      state.lastResetSucceeded = false;
    },
    clearAuthError(state) {
      state.lastError = null;
      state.lastResetSucceeded = false;
    },
  },
});

export const {
  hydrateAuth,
  setAuthUser,
  markSessionResolved,
  setAuthError,
  setResetPreview,
  markResetSucceeded,
  logoutAccount,
  clearAuthError,
} = authSlice.actions;

type AuthRoot = { auth: AuthState };

export const selectAuthUser = (state: AuthRoot) => state.auth.user;
export const selectAuthHydrated = (state: AuthRoot) => state.auth.hydrated;
export const selectAuthSessionResolved = (state: AuthRoot) => state.auth.sessionResolved;
export const selectAuthIsLoggedIn = (state: AuthRoot) => Boolean(state.auth.user);
export const selectAuthError = (state: AuthRoot) => state.auth.lastError;
export const selectLastResetPhone = (state: AuthRoot) => state.auth.lastResetPhone;
export const selectLastResetTokenPreview = (state: AuthRoot) =>
  state.auth.lastResetTokenPreview;
export const selectLastResetSucceeded = (state: AuthRoot) =>
  state.auth.lastResetSucceeded;

export default authSlice.reducer;
