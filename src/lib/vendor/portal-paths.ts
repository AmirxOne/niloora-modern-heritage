/** Reserved /vendor/* segments for the seller portal (auth required). */
export const VENDOR_PORTAL_SEGMENTS = new Set([
  "apply",
  "dashboard",
  "products",
  "orders",
  "payouts",
]);

export function isVendorPortalPath(pathname: string): boolean {
  const segment = pathname.split("/").filter(Boolean)[1];
  if (!segment) return false;
  return VENDOR_PORTAL_SEGMENTS.has(segment);
}
