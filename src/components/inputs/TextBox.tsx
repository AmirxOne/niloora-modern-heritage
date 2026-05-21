"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import clsx from "clsx";
import { fieldControlClass, FIELD_CONTROL_ERROR_CLASS } from "./fieldStyles";

interface TextBoxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  touched?: boolean;
  className?: string;
  inputClassName?: string;
}

const TextBox = forwardRef<HTMLInputElement, TextBoxProps>(
  ({ label, className, inputClassName, error, touched, id, ...rest }, ref) => {
    const inputId = id ?? "customTextBox";
    const hasError = Boolean(error && touched);

    return (
      <div className={clsx("relative flex flex-col", className)} dir="rtl">
        {label ? (
          <label
            htmlFor={inputId}
            className={clsx(
              "pointer-events-none absolute -top-2 start-3 z-10 rounded-sm bg-matte-elevated px-1 text-[11px] font-medium leading-none",
              hasError ? "text-red-400" : "text-silver"
            )}
          >
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={fieldControlClass("text-right", hasError && FIELD_CONTROL_ERROR_CLASS, inputClassName)}
          {...rest}
        />
        {hasError ? (
          <div className="mt-1">
            <span className="rounded-[4px] bg-red-500/20 p-0.5 px-2 text-[10px] font-bold text-red-400">
              {error}
            </span>
          </div>
        ) : null}
      </div>
    );
  }
);

TextBox.displayName = "TextBox";

export default TextBox;
