"use client";

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  unit?: string;
  formatValue?: (v: number) => string;
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit = "",
  formatValue,
}: SliderProps) {
  const display = formatValue ? formatValue(value) : `${value}${unit}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs tracking-wider uppercase text-silver">{label}</p>
        <p className="text-sm text-gold">{display}</p>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-stone-200/60 accent-gold"
      />
    </div>
  );
}
