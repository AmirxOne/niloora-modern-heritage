const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function toEnglishDigits(input: string): string {
  return input.replace(/[۰-۹٠-٩]/g, (char) => {
    const persianIndex = PERSIAN_DIGITS.indexOf(char);
    if (persianIndex >= 0) return String(persianIndex);
    const arabicIndex = ARABIC_DIGITS.indexOf(char);
    if (arabicIndex >= 0) return String(arabicIndex);
    return char;
  });
}

export function toPersianDigits(input: string): string {
  return input.replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)] ?? digit);
}

/** User-visible copy: always Persian digits on server and client (avoids hydration drift). */
export function displayDigits(input: string | number | null | undefined): string {
  if (input == null) return "";
  return toPersianDigits(String(input));
}
