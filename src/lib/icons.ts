import type { ComponentType } from "react";

/** واریانت پیش‌فرض آیکن‌ها در کل پروژه — یکدست با Iconsax */
export const ICON_VARIANT = "Linear" as const;

export type IconVariant =
  | "Linear"
  | "Outline"
  | "Broken"
  | "Bold"
  | "Bulk"
  | "TwoTone";

export type IconsaxIconProps = {
  size?: number | string;
  color?: string;
  variant?: IconVariant;
  className?: string;
};

export type IconComponent = ComponentType<IconsaxIconProps>;

export const iconSizes = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
} as const;

export type IconSizeKey = keyof typeof iconSizes;
