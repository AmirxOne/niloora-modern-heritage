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
      className={cn("status-alert", `status-alert--${tone}`, className)}
      style={toneVars[tone]}
      role="status"
    >
      <div className="status-alert__icon-wrap" aria-hidden>
        <Icon size={iconSizes.md} variant={ICON_VARIANT} />
      </div>
      <div className="status-alert__content">
        {title ? <p className="status-alert__title">{title}</p> : null}
        <div className="status-alert__body">{children}</div>
        {action ? <div className="status-alert__action">{action}</div> : null}
      </div>
    </div>
  );
}

