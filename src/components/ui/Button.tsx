"use client";

import { Loader2 } from "@/components/icons";
import { cn } from "@/lib/utils";
import { ICON_VARIANT, iconSizes } from "@/lib/icons";
import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "turquoise";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  isLoading?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-gold text-white font-semibold hover:bg-gold-dark shadow-[0_2px_8px_rgba(184,134,11,0.28)]",
  secondary:
    "bg-white text-ivory border border-[#E5E1DB] hover:border-gold/35 hover:bg-[#faf9f7]",
  ghost:
    "bg-transparent text-[#78716C] hover:bg-[#F5F3EF] hover:text-[#2C2A29]",
  outline:
    "bg-transparent border-2 border-gold text-gold-dark hover:bg-[#fdf8ee] hover:border-gold-dark",
  turquoise:
    "bg-turquoise text-white font-semibold hover:bg-turquoise-dark shadow-glass",
};

const sizes: Record<ButtonSize, string> = {
  sm:  "h-11 min-h-11 px-4 text-xs rounded-heritage",
  md:  "h-11 min-h-11 px-5 text-sm rounded-heritage",
  lg:  "h-11 min-h-11 px-8 text-sm rounded-heritage",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  isLoading,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 motion-safe:hover:-translate-y-px motion-safe:active:scale-[0.985]",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2
          className="h-4 w-4 shrink-0 animate-spin"
          variant={ICON_VARIANT}
          size={iconSizes.sm}
          aria-hidden
        />
      ) : null}
      {children}
    </button>
  );
}
