// Lightweight static blur placeholder (parchment tone) used to reduce CLS on
// key imagery (product cards, hero banners, product gallery). A tiny inline SVG
// keeps the payload near-zero while giving next/image a real blur source that
// also works with `fill`.
const BLUR_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="#EAE6E0"/></svg>';

function toBase64(value: string): string {
  if (typeof window === "undefined") {
    return Buffer.from(value).toString("base64");
  }
  return window.btoa(value);
}

export const BLUR_DATA_URL = `data:image/svg+xml;base64,${toBase64(BLUR_SVG)}`;
