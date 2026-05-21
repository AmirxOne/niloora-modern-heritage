import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "gold" | "turquoise" | "royal" | "default";
  className?: string;
}

const variants = {
  gold: "bg-gold/10 text-gold border-gold/20",
  turquoise: "bg-turquoise/10 text-turquoise-dark border-turquoise/25",
  royal: "bg-royal text-royal-dark border-stone-200",
  default: "bg-stone-100 text-silver border-stone-200",
};

export function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs tracking-wider uppercase",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
