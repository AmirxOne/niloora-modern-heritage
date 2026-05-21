import moment from "jalali-moment";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const JALALI_DATE_RE = /^\d{4}\/\d{1,2}\/\d{1,2}$/;
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export function persianDigitsToEnglish(str: string): string {
  return str
    .split("")
    .map((char) => {
      const index = PERSIAN_DIGITS.indexOf(char);
      return index >= 0 ? String(index) : char;
    })
    .join("");
}

/** Gregorian ISO `yyyy-mm-dd` -> Jalali `jYYYY/jMM/jDD` */
export function isoDateToJalaliDisplay(iso: string): string {
  const t = persianDigitsToEnglish(iso.trim());
  if (!t) return "";
  if (JALALI_DATE_RE.test(t)) return t;
  if (!ISO_DATE_RE.test(t)) return "";
  const m = moment(`${t}T12:00:00`);
  if (!m.isValid()) return "";
  return m.locale("fa").format("jYYYY/jMM/jDD");
}

/** Jalali `yyyy/mm/dd` (or ISO) -> Gregorian ISO `yyyy-mm-dd` */
export function jalaliDisplayToIsoDate(jalali: string): string {
  const t = persianDigitsToEnglish(jalali.trim());
  if (!t) return "";
  if (ISO_DATE_RE.test(t)) return t;
  if (!JALALI_DATE_RE.test(t)) return "";
  const m = moment(t, "jYYYY/jMM/jDD");
  if (!m.isValid()) return "";
  return m.format("YYYY-MM-DD");
}

export function parseFilterDateForApi(dateStr: string): Date | null {
  const iso = jalaliDisplayToIsoDate(dateStr);
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}
