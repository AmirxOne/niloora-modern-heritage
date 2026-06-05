"use client";

import type { CSSProperties, ReactNode } from "react";
import { Check, History, MessageSquare, X } from "@/components/icons";
import { ICON_VARIANT, iconSizes } from "@/lib/icons";
import { cn } from "@/lib/utils";

export type StatusAlertTone = "success" | "warning" | "info" | "danger";

interface StatusAlertProps {
  tone?: StatusAlertTone;
  title?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

const iconByTone = {
  success: Check,
  warning: History,
  info: MessageSquare,
  danger: X,
} as const;

const toneVars: Record<StatusAlertTone, CSSProperties> = {
  success: {
    "--status-bg": "#DDF4E3",
    "--status-border": "#8FD3A1",
    "--status-icon-bg": "#BEE8C9",
    "--status-icon": "#5EBA79",
    "--status-title": "#0F3A1D",
    "--status-body": "#1C6A36",
  } as CSSProperties,
  warning: {
    "--status-bg": "#FFF0D6",
    "--status-border": "#F2C98B",
    "--status-icon-bg": "#FADDAE",
    "--status-icon": "#D39A4C",
    "--status-title": "#56370A",
    "--status-body": "#935E12",
  } as CSSProperties,
  info: {
    "--status-bg": "#DDF2FF",
    "--status-border": "#90C8F2",
    "--status-icon-bg": "#BFE2FA",
    "--status-icon": "#5CA7DF",
    "--status-title": "#0E3A5A",
    "--status-body": "#1C6796",
  } as CSSProperties,
  danger: {
    "--status-bg": "#FDE8EA",
    "--status-border": "#EEAAB2",
    "--status-icon-bg": "#F7CCD1",
    "--status-icon": "#D67984",
    "--status-title": "#5A1822",
    "--status-body": "#9C2F3F",
  } as CSSProperties,
};

export function StatusAlert({
  tone = "info",
  title,
  children,
  action,
  className,
}: StatusAlertProps) {
  const Icon = iconByTone[tone];
  return (
    <div
      className={cn(
        "grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-xl border px-[0.95rem] py-[0.85rem] shadow-[0_10px_22px_-18px_rgba(44,42,41,0.45)] bg-[var(--status-bg)] border-[var(--status-border)]",
        className
      )}
      style={toneVars[tone]}
      role="status"
    >
      <div
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--status-icon-bg)] text-[var(--status-icon)]"
        aria-hidden
      >
        <Icon size={iconSizes.md} variant={ICON_VARIANT} />
      </div>
      <div className="flex min-h-8 min-w-0 flex-col justify-center">
        {title ? (
          <p className="mb-0.5 text-[0.95rem] font-bold leading-[1.35] text-[var(--status-title)]">
            {title}
          </p>
        ) : null}
        <div className="text-[0.83rem] leading-[1.6] text-[var(--status-body)]">{children}</div>
        {action ? <div className="mt-2.5">{action}</div> : null}
      </div>
    </div>
  );
}
