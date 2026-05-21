"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "@/components/icons";
import { formatPrice } from "@/lib/utils";
import { iconSizes, ICON_VARIANT } from "@/lib/icons";
import { cn } from "@/lib/utils";

export function AccountResourceRow({
  href,
  title,
  subtitle,
  price,
  image,
  trailing,
  className,
}: {
  href?: string;
  title: string;
  subtitle?: string;
  price?: number;
  image?: string;
  trailing?: React.ReactNode;
  className?: string;
}) {
  const inner = (
    <>
      {image ? (
        <div className="account-resource-thumb">
          <Image src={image} alt="" fill className="object-cover" sizes="64px" />
        </div>
      ) : (
        <div className="account-resource-thumb account-resource-thumb--placeholder" aria-hidden />
      )}
      <div className="account-resource-body">
        <p className="account-resource-title">{title}</p>
        {subtitle ? <p className="account-resource-subtitle">{subtitle}</p> : null}
        {price != null ? <p className="account-resource-price">{formatPrice(price)}</p> : null}
      </div>
      {trailing ?? (
        <ChevronLeft
          size={iconSizes.sm}
          variant={ICON_VARIANT}
          className="shrink-0 text-silver/70"
          aria-hidden
        />
      )}
    </>
  );

  const rowClass = cn("account-resource-row", className);

  if (href) {
    return (
      <Link href={href} className={rowClass}>
        {inner}
      </Link>
    );
  }

  return <div className={rowClass}>{inner}</div>;
}
