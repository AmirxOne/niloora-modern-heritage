import { NextResponse } from "next/server";

// PURPOSE: keep API response semantics consistent across all route handlers.
export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, { status: 200, ...init });
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

export function badRequest(message: string, code?: string) {
  return NextResponse.json({ code: code ?? "bad_request", message }, { status: 400 });
}

export function unauthorized(message = "Unauthorized", code?: string) {
  return NextResponse.json({ code: code ?? "unauthorized", message }, { status: 401 });
}

export function forbidden(message = "Forbidden", code?: string) {
  return NextResponse.json({ code: code ?? "forbidden", message }, { status: 403 });
}

export function tooManyRequests(
  message = "Too Many Requests",
  retryAfterSec?: number,
  code?: string
) {
  const headers = retryAfterSec ? { "Retry-After": String(retryAfterSec) } : undefined;
  return NextResponse.json({ code: code ?? "rate_limited", message, retryAfterSec }, { status: 429, headers });
}

export function serviceUnavailable(message: string, code?: string) {
  return NextResponse.json({ code: code ?? "service_unavailable", message }, { status: 503 });
}

export function conflict(message: string) {
  return NextResponse.json({ message }, { status: 409 });
}

export function notFound(message: string) {
  return NextResponse.json({ message }, { status: 404 });
}

export function serverError(message = "Internal Server Error") {
  return NextResponse.json({ message }, { status: 500 });
}
