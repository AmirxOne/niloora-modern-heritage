import Link from "next/link";
import { fa } from "@/lib/i18n/fa";

interface AuthFormHeaderProps {
  eyebrow: string;
  title: string;
  subtitle: string;
}

export function AuthFormHeader({ eyebrow, title, subtitle }: AuthFormHeaderProps) {
  return (
    <header className="auth-form-header">
      <Link href="/shop" className="auth-form-back">
        <span className="auth-form-back-icon" aria-hidden>
          →
        </span>
        {fa.auth.backToShop}
      </Link>
      <div className="auth-form-heading">
        <p className="auth-panel-eyebrow">{eyebrow}</p>
        <h1 className="auth-panel-title">{title}</h1>
        <p className="auth-panel-subtitle">{subtitle}</p>
      </div>
    </header>
  );
}
