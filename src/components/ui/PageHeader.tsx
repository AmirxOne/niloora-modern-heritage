import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  align = "start",
  className,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  eyebrow?: string;
  align?: "start" | "center";
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <header
      className={cn(
        "page-header",
        align === "center" && "page-header--center",
        className
      )}
    >
      {eyebrow ? <p className="page-eyebrow">{eyebrow}</p> : null}
      <h1 className="page-header-title">{title}</h1>
      {subtitle ? <p className="page-header-subtitle">{subtitle}</p> : null}
      {children}
    </header>
  );
}
