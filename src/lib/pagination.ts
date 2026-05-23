/** اندازهٔ پیش‌فرض صفحه‌بندی گالری (۴ ستون × ۳ ردیف در دسکتاپ) */
export const SHOP_PAGE_SIZE = 12;

export const COMMENTS_PAGE_SIZE = 5;
export const QUESTIONS_PAGE_SIZE = 5;
export const ORDERS_PAGE_SIZE = 4;
export const MODERATION_PAGE_SIZE = 6;

export function getTotalPages(totalItems: number, pageSize: number): number {
  if (totalItems <= 0 || pageSize <= 0) return 1;
  return Math.ceil(totalItems / pageSize);
}

export function clampPage(page: number, totalPages: number): number {
  if (totalPages < 1) return 1;
  return Math.min(Math.max(1, page), totalPages);
}

export function paginateSlice<T>(items: readonly T[], page: number, pageSize: number): T[] {
  const totalPages = getTotalPages(items.length, pageSize);
  const safePage = clampPage(page, totalPages);
  const start = (safePage - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function getPageRange(from: number, to: number, total: number) {
  return { from, to, total };
}

export type PageToken = number | "ellipsis";

/** شمارهٔ صفحات قابل نمایش با «…» برای فهرست‌های بلند */
export function getVisiblePageTokens(current: number, totalPages: number): PageToken[] {
  if (totalPages <= 1) return totalPages === 1 ? [1] : [];
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const tokens: PageToken[] = [1];

  if (current > 3) tokens.push("ellipsis");

  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);

  for (let p = start; p <= end; p += 1) {
    tokens.push(p);
  }

  if (current < totalPages - 2) tokens.push("ellipsis");

  tokens.push(totalPages);
  return tokens;
}
