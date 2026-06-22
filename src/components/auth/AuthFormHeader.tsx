interface AuthFormHeaderProps {
  eyebrow: string;
  title: string;
  subtitle: string;
}

export function AuthFormHeader({ eyebrow, title, subtitle }: AuthFormHeaderProps) {
  return (
    <header className="auth-form-header">
      <div className="auth-form-heading">
        <p className="auth-panel-eyebrow">{eyebrow}</p>
        <h1 className="auth-panel-title">{title}</h1>
        <p className="auth-panel-subtitle">{subtitle}</p>
      </div>
    </header>
  );
}
