export const ADMIN_MEDIA_CATEGORIES = [
  { value: "general", label: "عمومی" },
  { value: "products", label: "محصولات" },
  { value: "posts", label: "بلاگ" },
  { value: "home", label: "صفحه اصلی" },
] as const;

export type AdminMediaCategory = (typeof ADMIN_MEDIA_CATEGORIES)[number]["value"];

export function isAdminMediaCategory(value: string): value is AdminMediaCategory {
  return ADMIN_MEDIA_CATEGORIES.some((item) => item.value === value);
}
