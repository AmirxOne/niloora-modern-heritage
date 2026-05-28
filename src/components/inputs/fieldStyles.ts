import clsx from "clsx";

/** کلاس پایهٔ همه فیلدهای متنی — ارتفاع در globals.css (h-11) */
export const FIELD_CONTROL_CLASS = "field-control";

export const FIELD_CONTROL_ERROR_CLASS = "field-control--error";

export function fieldControlClass(...extra: (string | false | undefined)[]) {
  return clsx(FIELD_CONTROL_CLASS, ...extra);
}
