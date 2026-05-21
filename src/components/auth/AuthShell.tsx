import { AuthVisual } from "@/components/auth/AuthVisual";
import { cn } from "@/lib/utils";

interface AuthShellProps {
  children: React.ReactNode;
  visual?: React.ReactNode;
  className?: string;
  /** نسبت ستون فرم به تصویر در دسکتاپ (۳۵ / ۶۵) — فقط ورود/ثبت‌نام */
  split?: "65-35";
}

export function AuthShell({ children, visual, className, split }: AuthShellProps) {
  return (
    <div className={cn("auth-screen", className)}>
      <div className="auth-screen-bg" aria-hidden />

      <div
        className={cn("auth-shell relative z-10", split === "65-35" && "auth-shell--3565")}
      >
        <section className="auth-panel auth-panel--form">{children}</section>
        <div className="auth-visual-slot">{visual ?? <AuthVisual />}</div>
      </div>
    </div>
  );
}
