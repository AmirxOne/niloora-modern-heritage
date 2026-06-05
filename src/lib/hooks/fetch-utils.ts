"use client";

export type ApiJsonBody = {
  message?: string;
  error?: string;
};

export async function parseJsonResponse<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export function isAuthDenied(response: Response): boolean {
  return response.status === 401 || response.status === 403;
}

export function getAuthDeniedMessage(
  status: number,
  context: "admin" | "user" = "user"
): string {
  if (status === 403) return "شما به این بخش دسترسی ندارید.";
  if (context === "admin") return "دسترسی مدیریت ندارید.";
  return "لطفاً وارد حساب کاربری شوید.";
}

export async function parseApiErrorMessage(
  response: Response,
  fallback = "خطا در ارتباط با سرور.",
  context: "admin" | "user" = "user"
): Promise<string> {
  if (isAuthDenied(response)) {
    return getAuthDeniedMessage(response.status, context);
  }
  const data = await parseJsonResponse<ApiJsonBody>(response);
  return data?.message ?? data?.error ?? fallback;
}
