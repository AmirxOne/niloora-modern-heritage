"use client";

import { TextBox } from "@/components/inputs";

interface FormikTextFieldProps {
  name: string;
  label: string;
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  /** کلاس روی خود input (مثلاً auth-input-ltr) */
  className?: string;
  minLength?: number;
  formik: {
    getFieldProps: (name: string) => ReturnType<
      import("formik").FormikProps<Record<string, string>>["getFieldProps"]
    >;
    touched: Record<string, boolean | undefined>;
    errors: Record<string, string | undefined>;
  };
}

export function FormikTextField({
  formik,
  name,
  label,
  type = "text",
  placeholder,
  autoComplete,
  inputMode,
  className,
  minLength,
}: FormikTextFieldProps) {
  const touched = Boolean(formik.touched[name]);
  const error = formik.errors[name];
  const field = formik.getFieldProps(name);

  return (
    <TextBox
      label={label}
      id={name}
      type={type}
      placeholder={placeholder}
      autoComplete={autoComplete}
      minLength={minLength}
      inputMode={inputMode}
      inputClassName={className}
      name={field.name}
      value={String(field.value ?? "")}
      onChange={field.onChange}
      onBlur={field.onBlur}
      error={error}
      touched={touched}
    />
  );
}
