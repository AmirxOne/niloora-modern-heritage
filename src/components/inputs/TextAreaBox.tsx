"use client";

import { type TextareaHTMLAttributes } from "react";
import clsx from "clsx";
import { fieldControlClass, FIELD_CONTROL_ERROR_CLASS } from "./fieldStyles";

interface TextAreaBoxProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  touched?: boolean;
  className?: string;
}

function TextAreaBox({ label, className, error, touched, id, ...rest }: TextAreaBoxProps) {
  const inputId = id ?? "customTextAreaBox";
  const hasError = Boolean(error && touched);

  return (
    <div className="relative flex flex-col" dir="rtl">
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
      <textarea
        id={inputId}
        className={fieldControlClass(
          "min-h-[7.5rem] h-auto py-3 text-right",
          hasError && FIELD_CONTROL_ERROR_CLASS,
          className
        )}
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

TextAreaBox.displayName = "TextAreaBox";

export default TextAreaBox;
