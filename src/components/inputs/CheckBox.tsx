"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import clsx from "clsx";

/**
 * Central checkbox — the ONLY checkbox in the app.
 * Consistent size (1.125rem), gold accent, focus ring, disabled state.
 */
interface CheckBoxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
  /** wrapper classes (layout of the label row) */
  className?: string;
}

export const CheckBox = forwardRef<HTMLInputElement, CheckBoxProps>(
  ({ label, className, id, ...rest }, ref) => {
    const inputId = id ?? "customCheckBox";
    return (
      <label
        htmlFor={inputId}
        className={clsx(
          "flex cursor-pointer select-none items-center gap-2 text-sm text-ivory",
          rest.disabled && "cursor-not-allowed opacity-50",
          className
        )}
      >
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          className="peer sr-only"
          {...rest}
        />
        {/* visual box */}
        <span
          aria-hidden
          className="flex h-[1.125rem] w-[1.125rem] shrink-0 items-center justify-center rounded-[0.3rem] border-[1.5px] border-[var(--color-border-strong)] bg-white transition-[border-color,background-color,opacity]
            peer-checked:border-gold peer-checked:bg-gold
            peer-focus-visible:ring-2 peer-focus-visible:ring-gold/40
            after:h-[0.55rem] after:w-[0.35rem] after:-translate-y-[1px] after:rotate-45 after:border-r-2 after:border-b-2 after:border-white after:opacity-0 after:transition-opacity peer-checked:after:opacity-100"
        />
        {label ? <span className="leading-none">{label}</span> : null}
      </label>
    );
  }
);

CheckBox.displayName = "CheckBox";
