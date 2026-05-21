"use client";

import { ICON_VARIANT, type IconComponent } from "@/lib/icons";
import { cn } from "@/lib/utils";

export function AccountEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: IconComponent;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("account-empty-state", className)}>
      {Icon ? (
        <span className="account-empty-state-icon" aria-hidden>
          <Icon size={28} variant={ICON_VARIANT} />
        </span>
      ) : null}
      <p className="account-empty-state-title">{title}</p>
      {description ? <p className="account-empty-state-desc">{description}</p> : null}
      {action ? <div className="account-empty-state-action">{action}</div> : null}
    </div>
  );
}
