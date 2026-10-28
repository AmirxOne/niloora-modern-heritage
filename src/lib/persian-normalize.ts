/**
 * Persian text normalization for SEARCH ONLY.
 * - Arabic ی/ك → Persian ی/ک (Iranian users type Persian forms, data may
 *   contain either)
 * - Arabic diacritics (tashkeel) removed
 * - zero-width chars removed (ZWJ/ZWNJ — نیم‌فاصله variations)
 * - Arabic-Indic vs Persian digits unified to latin for matching
 *
 * NEVER use for identifiers, phones, passwords or stored data — it exists
 * to make catalog/product search forgiving for Persian queries.
 */

const ARABIC_YE = "\u064A"; // ي
const PERSIAN_YE = "\u06CC"; // ی
const ARABIC_KAF = "\u0643"; // ك
const PERSIAN_KAF = "\u06A9"; // ک

const DIACRITICS = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const ZERO_WIDTH = /[\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/g;
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export function normalizePersianSearch(input: string): string {
  let text = input ?? "";

  // unify ye/kaf
  text = text.split(ARABIC_YE).join(PERSIAN_YE).split(ARABIC_KAF).join(PERSIAN_KAF);

  // strip diacritics + zero-width
  text = text.replace(DIACRITICS, "").replace(ZERO_WIDTH, "");

  // unify digits to latin
  text = Array.from(text)
    .map((ch) => {
      const ar = ARABIC_DIGITS.indexOf(ch);
      if (ar >= 0) return String(ar);
      const fa = PERSIAN_DIGITS.indexOf(ch);
      if (fa >= 0) return String(fa);
      return ch;
    })
    .join("");

  // collapse whitespace
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}
