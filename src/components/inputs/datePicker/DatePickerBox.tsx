"use client";

import { useCallback, useId, useMemo } from "react";
import clsx from "clsx";
import DatePicker from "react-multi-date-picker";
import type { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { Calendar } from "@/components/icons";
import { ICON_VARIANT } from "@/lib/icons";
import { fieldControlClass, FIELD_CONTROL_ERROR_CLASS } from "../fieldStyles";
import { isoDateToJalaliDisplay, jalaliDisplayToIsoDate } from "@/components/inputs/datePicker/jalaliDateValue";
import "@/components/inputs/datePicker/jalaliDateBox.css";
import "react-multi-date-picker/styles/colors/teal.css";
import "react-multi-date-picker/styles/layouts/mobile.css";

const WEEK_DAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

export type DatePickerBoxChangeEvent = {
  target: {
    name?: string;
    value: string;
  };
};

export type DatePickerBoxBlurEvent = {
  target: {
    name?: string;
  };
};

export interface DatePickerBoxProps {
  label?: string;
  error?: string;
  touched?: boolean;
  className?: string;
  id?: string;
  name?: string;
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  onChange?: (event: DatePickerBoxChangeEvent) => void;
  onValueChange?: (value: string) => void;
  onBlur?: (event: DatePickerBoxBlurEvent) => void;
}

interface PickerInputProps {
  value?: string;
  openCalendar?: () => void;
  onFocus?: () => void;
  error?: string;
  touched?: boolean;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

function PickerInput({
  value,
  openCalendar,
  onFocus,
  error,
  touched,
  placeholder,
  disabled,
  id,
}: PickerInputProps) {
  const hasError = Boolean(error && touched);
  const open = () => {
    if (disabled) return;
    openCalendar?.();
  };

  return (
    <div className="relative w-full" dir="rtl">
      <input
        id={id}
        readOnly
        disabled={disabled}
        value={value ?? ""}
        placeholder={placeholder}
        onClick={open}
        onFocus={() => {
          onFocus?.();
          open();
        }}
        className={fieldControlClass(
          "cursor-pointer text-right",
          hasError && FIELD_CONTROL_ERROR_CLASS,
          disabled && "cursor-not-allowed opacity-60"
        )}
      />
      <Calendar
        size={18}
        variant={ICON_VARIANT}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-silver"
      />
    </div>
  );
}

function toIsoFromPickerValue(picked: DateObject | DateObject[] | null): string {
  if (picked == null) return "";
  const item = Array.isArray(picked) ? picked[0] : picked;
  if (!item) return "";
  const jalali = item.format("YYYY/MM/DD");
  return jalaliDisplayToIsoDate(jalali);
}

function DatePickerBox({
  label,
  className,
  error,
  touched,
  id: idProp,
  name,
  value = "",
  placeholder = "انتخاب تاریخ",
  disabled = false,
  onChange,
  onValueChange,
  onBlur,
}: DatePickerBoxProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const hasError = Boolean(error && touched);
  const jalaliValue = useMemo(() => isoDateToJalaliDisplay(value), [value]);

  const emitChange = useCallback(
    (iso: string) => {
      onValueChange?.(iso);
      onChange?.({ target: { name, value: iso } });
    },
    [name, onChange, onValueChange]
  );

  const handlePickerChange = (picked: DateObject | DateObject[] | null) => {
    emitChange(toIsoFromPickerValue(picked));
  };

  return (
    <div className={clsx("relative flex flex-col", className)} dir="rtl">
      {label ? (
        <label
          htmlFor={id}
          className={clsx(
            "pointer-events-none absolute -top-2 start-3 z-10 rounded-sm bg-matte-elevated px-1 text-[11px] font-medium leading-none",
            hasError ? "text-red-400" : "text-silver"
          )}
        >
          {label}
        </label>
      ) : null}

      {name ? <input type="hidden" name={name} value={value} readOnly /> : null}
      <DatePicker
        value={jalaliValue || null}
        onChange={handlePickerChange}
        onClose={() => onBlur?.({ target: { name } })}
        format="YYYY/MM/DD"
        calendar={persian}
        locale={persian_fa}
        weekDays={WEEK_DAYS}
        monthYearSeparator="‌"
        calendarPosition="bottom-right"
        portal
        zIndex={2100}
        disabled={disabled}
        containerClassName="w-full"
        className="date-picker-box jalali-date-picker jalali-date-picker--dark w-full"
        headerOrder={["MONTH_YEAR", "LEFT_BUTTON", "RIGHT_BUTTON"]}
        render={(displayValue, openCalendar) => (
          <PickerInput
            value={displayValue}
            openCalendar={openCalendar}
            id={id}
            error={error}
            touched={touched}
            placeholder={placeholder}
            disabled={disabled}
          />
        )}
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

DatePickerBox.displayName = "DatePickerBox";

export default DatePickerBox;
