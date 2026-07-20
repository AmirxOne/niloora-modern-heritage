"use client";

import { OTPInput, type SlotProps } from "input-otp";
import { cn } from "@/lib/utils";
import { toEnglishDigits, toPersianDigits } from "@/lib/persian-digits";

interface AuthOtpInputProps {
  value: string;
  onChange: (val: string) => void;
  onComplete?: (val: string) => void;
  isError?: boolean;
  disabled?: boolean;
}

interface OtpSlotProps extends SlotProps {
  isStart?: boolean;
  isMiddle?: boolean;
  isEnd?: boolean;
  isError?: boolean;
}

function FakeCaret({ isError = false }: { isError?: boolean }) {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      <div
        className={cn(
          "h-5 w-px animate-pulse",
          isError ? "bg-red-500/80" : "bg-gold/90"
        )}
      />
    </div>
  );
}

function FakeDash({ isError = false }: { isError?: boolean }) {
  return (
    <div className="mx-0.5 flex items-center justify-center">
      <div
        className={cn(
          "h-[2px] w-2.5 rounded-full",
          isError ? "bg-red-500/70" : "bg-gold/80"
        )}
      />
    </div>
  );
}

function Slot({ isStart, isMiddle, isEnd, isError = false, ...props }: OtpSlotProps) {
  const displayChar = props.char ? toPersianDigits(props.char) : "";
  return (
    <div
      className={cn(
        "relative flex h-11 w-9 items-center justify-center border text-base font-semibold transition-colors sm:h-12 sm:w-10",
        isMiddle ? "rounded-none border-x-0" : "",
        isStart ? "rounded-l-md rounded-r-none" : "",
        isEnd ? "rounded-r-md rounded-l-none" : "",
        props.isActive && !isError ? "border-gold/60 bg-gold/10 shadow-[0_0_0_1px_rgba(166,124,61,0.15)]" : "",
        props.char && !isError ? "border-gold/35 bg-parchment/20 text-gold-light" : "",
        !props.char && !props.isActive && !isError
          ? "border-gold/20 bg-matte-elevated/95 text-ivory"
          : "",
        isError ? "border-red-500/50 bg-red-500/10 text-red-200" : "text-ivory"
      )}
    >
      {displayChar}
      {props.hasFakeCaret ? <FakeCaret isError={isError} /> : null}
    </div>
  );
}

export function AuthOtpInput({
  value,
  onChange,
  onComplete,
  isError = false,
  disabled,
}: AuthOtpInputProps) {
  const handleChange = (val: string) => {
    const normalized = toEnglishDigits(val);
    if (!/^\d*$/.test(normalized)) return;
    onChange(normalized);
  };

  return (
    <div dir="ltr" className="w-full">
      <OTPInput
        maxLength={6}
        autoFocus
        value={value}
        onChange={handleChange}
        onComplete={onComplete}
        disabled={disabled}
        containerClassName="flex w-full items-center justify-center"
        render={({ slots }) => (
          <div className="flex items-center gap-1.5">
            <div className="flex">
              {slots.slice(0, 3).map((slot, idx) => (
                <Slot
                  key={idx}
                  {...slot}
                  isStart={idx === 0}
                  isMiddle={idx === 1}
                  isEnd={idx === 2}
                  isError={isError}
                />
              ))}
            </div>
            <FakeDash isError={isError} />
            <div className="flex">
              {slots.slice(3, 6).map((slot, idx) => (
                <Slot
                  key={idx}
                  {...slot}
                  isStart={idx === 0}
                  isMiddle={idx === 1}
                  isEnd={idx === 2}
                  isError={isError}
                />
              ))}
            </div>
          </div>
        )}
      />
    </div>
  );
}
