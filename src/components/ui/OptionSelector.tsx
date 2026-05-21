"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Option<T extends string> {
  value: T;
  label: string;
  color?: string;
  sample?: string;
  disabled?: boolean;
  disabledReason?: string;
}

interface OptionSelectorProps<T extends string> {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  variant?: "pills" | "swatches" | "grid";
}

export function OptionSelector<T extends string>({
  label,
  options,
  value,
  onChange,
  variant = "pills",
}: OptionSelectorProps<T>) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-silver">{label}</p>
      <motion.div layout className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const disabled = opt.disabled ?? false;
          return (
            <motion.button
              key={opt.value}
              type="button"
              layout
              disabled={disabled}
              onClick={() => !disabled && onChange(opt.value)}
              whileHover={disabled ? undefined : { scale: 1.02 }}
              whileTap={disabled ? undefined : { scale: 0.98 }}
              transition={{ duration: 0.2 }}
              title={disabled ? opt.disabledReason : undefined}
              className={cn(
                "relative rounded-sm border transition-all duration-300",
                variant === "swatches" && "h-10 w-10 p-0",
                variant === "pills" && "px-4 py-2 text-xs",
                variant === "grid" && "px-3 py-2 text-xs",
                disabled && "cursor-not-allowed opacity-35",
                !disabled && value === opt.value
                  ? "border-gold bg-gold/10 text-gold"
                  : !disabled &&
                      "border-stone-200 bg-matte-surface text-silver hover:border-stone-300 hover:text-ivory",
                disabled && "border-subtle bg-matte-surface/50 text-silver/50"
              )}
              aria-pressed={value === opt.value}
              aria-disabled={disabled}
            >
              {variant === "swatches" && opt.color ? (
                <span
                  className="absolute inset-1 rounded-sm"
                  style={{ backgroundColor: opt.color }}
                />
              ) : opt.sample ? (
                <span className="font-persian text-sm">{opt.sample}</span>
              ) : (
                opt.label
              )}
              {variant === "swatches" ? (
                <span className="sr-only">{opt.label}</span>
              ) : null}
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
