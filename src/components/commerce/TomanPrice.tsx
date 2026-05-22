import { cn, formatTomanAmount } from "@/lib/utils";

export const tomanPriceSizes = {
  xs: { sale: "text-xs", list: "text-[10px]", currency: "text-[9px]" },
  sm: { sale: "text-lg", list: "text-sm", currency: "text-[10px]" },
  md: { sale: "text-2xl", list: "text-base", currency: "text-xs" },
  lg: { sale: "text-3xl", list: "text-xl", currency: "text-sm" },
} as const;

export type TomanPriceSize = keyof typeof tomanPriceSizes;

interface TomanPriceProps {
  amount: number;
  size?: TomanPriceSize;
  variant?: "sale" | "list";
  className?: string;
}

/** قیمت با «تومان» همیشه در سمت چپ عدد (LTR) */
export function TomanPrice({
  amount,
  size = "md",
  variant = "sale",
  className,
}: TomanPriceProps) {
  const sizes = tomanPriceSizes[size];
  const isList = variant === "list";

  return (
    <span className={cn("product-price-toman inline-flex items-baseline gap-x-1.5", className)} dir="ltr">
      <span
        className={cn(
          "font-normal leading-none",
          sizes.currency,
          isList ? "text-silver/80" : "text-silver"
        )}
      >
        تومان
      </span>
      <span
        className={cn(
          "font-display leading-none tabular-nums",
          isList
            ? cn("font-normal text-silver line-through decoration-gold/40", sizes.list)
            : cn("font-semibold text-price-sale", sizes.sale)
        )}
      >
        {formatTomanAmount(amount)}
      </span>
    </span>
  );
}

interface StackedTomanPriceProps {
  listPrice: number;
  salePrice: number;
  size?: TomanPriceSize;
  hasListPrice: boolean;
  className?: string;
}

export function StackedTomanPrice({
  listPrice,
  salePrice,
  size = "md",
  hasListPrice,
  className,
}: StackedTomanPriceProps) {
  const sizes = tomanPriceSizes[size];

  return (
    <div className={cn("product-price-stack", className)} dir="ltr">
      {hasListPrice ? (
        <>
          <span
            className={cn(
              "product-price-stack-currency-spacer font-normal leading-none",
              sizes.currency
            )}
            aria-hidden
          >
            تومان
          </span>
          <span
            className={cn(
              "product-price-stack-amount mb-2 text-start font-display font-normal leading-none text-silver line-through decoration-gold/40",
              sizes.list
            )}
          >
            {formatTomanAmount(listPrice)}
          </span>
        </>
      ) : null}
      <span className={cn("product-price-stack-currency font-normal leading-none text-silver", sizes.currency)}>
        تومان
      </span>
      <span
        className={cn(
          "product-price-stack-amount font-display font-semibold leading-none text-price-sale",
          sizes.sale
        )}
      >
        {formatTomanAmount(salePrice)}
      </span>
    </div>
  );
}

/** قیمت + ادامهٔ متن فارسی (مثلاً «بهاکاهی از این اثر») */
export function TomanPriceWithSuffix({
  amount,
  suffix,
  size = "xs",
  className,
}: {
  amount: number;
  suffix: string;
  size?: TomanPriceSize;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-1", className)}>
      <TomanPrice amount={amount} size={size} />
      <span>{suffix}</span>
    </span>
  );
}
