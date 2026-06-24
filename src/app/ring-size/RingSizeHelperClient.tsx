"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { RING_SIZES } from "@/lib/constants";
import { Button } from "@/components/ui/Button";

const CIRCUMFERENCE_BASE_MM = 46;
const CIRCUMFERENCE_STEP_MM = 1.27;
const DIAMETER_DIVISOR = Math.PI;
const DEFAULT_SIZE = 7;

type ConversionRow = {
  us: number;
  diameterMm: number;
  circumferenceMm: number;
  eu: number;
};

function toFixedNumber(value: number, digits = 2): number {
  return Number(value.toFixed(digits));
}

function buildConversionRows(): ConversionRow[] {
  return RING_SIZES.map((us) => {
    const circumference = CIRCUMFERENCE_BASE_MM + (us - 4) * CIRCUMFERENCE_STEP_MM;
    const diameter = circumference / DIAMETER_DIVISOR;
    return {
      us,
      diameterMm: toFixedNumber(diameter),
      circumferenceMm: toFixedNumber(circumference),
      eu: Math.round(circumference),
    };
  });
}

function nearestSizeByCircumference(circumferenceMm: number, rows: ConversionRow[]): ConversionRow {
  return rows.reduce((best, row) => {
    const bestDiff = Math.abs(best.circumferenceMm - circumferenceMm);
    const rowDiff = Math.abs(row.circumferenceMm - circumferenceMm);
    return rowDiff < bestDiff ? row : best;
  }, rows[0]);
}

export function RingSizeHelperClient() {
  const rows = useMemo(buildConversionRows, []);
  const defaultRow = rows.find((row) => row.us === DEFAULT_SIZE) ?? rows[0];
  const [activeUsSize, setActiveUsSize] = useState<number>(defaultRow.us);
  const [circumferenceInput, setCircumferenceInput] = useState<string>(
    defaultRow.circumferenceMm.toString()
  );
  const [errorText, setErrorText] = useState<string>("");

  const activeRow = rows.find((row) => row.us === activeUsSize) ?? defaultRow;

  const handleCalculate = () => {
    const numeric = Number(circumferenceInput.replace(",", "."));
    if (!Number.isFinite(numeric) || numeric < 40 || numeric > 80) {
      setErrorText("عدد واردشده معتبر نیست. محیط انگشت را بین 40 تا 80 میلی‌متر وارد کنید.");
      return;
    }
    const nearest = nearestSizeByCircumference(numeric, rows);
    setActiveUsSize(nearest.us);
    setErrorText("");
  };

  const applySizeToCustomizeLink = `/customize?ringSize=${encodeURIComponent(activeUsSize)}`;

  return (
    <div className="ring-size-shell">
      <header className="ring-size-header">
        <h1 className="ring-size-title">راهنمای تعیین سایز انگشتر</h1>
        <p className="ring-size-subtitle">
          سایز پیشنهادی خود را با ابزار تعاملی پیدا کنید و جدول تبدیل را برای انتخاب دقیق‌تر ببینید.
        </p>
      </header>

      <section className="ring-size-measurement-tips" aria-labelledby="ring-size-measurement-tips-title">
        <h2 id="ring-size-measurement-tips-title" className="ring-size-section-title">
          نکات اندازه‌گیری
        </h2>
        <ul className="ring-size-measurement-tips-list">
          <li>برای بهترین دقت، عصرها اندازه‌گیری کنید (انگشت‌ها در حالت طبیعی‌تر هستند).</li>
          <li>اندازه را از بند انگشت رد کنید؛ حلقه باید راحت رد شود ولی لق نباشد.</li>
          <li>اگر بین دو سایز مردد هستید، نیم سایز بزرگ‌تر انتخاب بهتری است.</li>
        </ul>
      </section>

      <section className="ring-size-tool" aria-label="ابزار تعاملی سایز انگشتر">
        <h2 className="ring-size-section-title">ابزار تعاملی</h2>
        <p className="ring-size-tool-hint">
          اگر محیط انگشت را با نخ یا متر خیاطی اندازه گرفته‌اید، عدد را وارد کنید تا نزدیک‌ترین سایز پیشنهاد شود.
        </p>
        <div className="ring-size-tool-row">
          <label htmlFor="ring-size-circumference" className="ring-size-tool-label">
            محیط انگشت (میلی‌متر)
          </label>
          <input
            id="ring-size-circumference"
            type="number"
            min={40}
            max={80}
            step={0.1}
            value={circumferenceInput}
            onChange={(event) => setCircumferenceInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleCalculate();
              }
            }}
            className="ring-size-tool-input"
          />
          <Button type="button" onClick={handleCalculate} className="ring-size-tool-btn">
            محاسبه سایز
          </Button>
        </div>
        {errorText ? <p className="ring-size-tool-error">{errorText}</p> : null}
      </section>

      <section className="ring-size-result" aria-live="polite">
        <h2 className="ring-size-section-title">نتیجه پیشنهادی</h2>
        <div className="ring-size-result-grid">
          <article className="ring-size-result-card">
            <span className="ring-size-result-label">سایز US</span>
            <strong className="ring-size-result-value">{activeRow.us.toLocaleString("fa-IR")}</strong>
          </article>
          <article className="ring-size-result-card">
            <span className="ring-size-result-label">قطر تقریبی</span>
            <strong className="ring-size-result-value">
              {activeRow.diameterMm.toLocaleString("fa-IR")} میلی‌متر
            </strong>
          </article>
          <article className="ring-size-result-card">
            <span className="ring-size-result-label">محیط تقریبی</span>
            <strong className="ring-size-result-value">
              {activeRow.circumferenceMm.toLocaleString("fa-IR")} میلی‌متر
            </strong>
          </article>
          <article className="ring-size-result-card">
            <span className="ring-size-result-label">سایز EU</span>
            <strong className="ring-size-result-value">{activeRow.eu.toLocaleString("fa-IR")}</strong>
          </article>
        </div>
        <div className="ring-size-result-actions">
          <Link href={applySizeToCustomizeLink} className="ring-size-action ring-size-action--primary">
            اعمال این سایز در سفارشی‌سازی
          </Link>
        </div>
      </section>

      <section className="ring-size-conversion" aria-label="جدول تبدیل سایز">
        <h2 className="ring-size-section-title">جدول تبدیل سایز</h2>
        <div className="ring-size-table-wrap">
          <table className="ring-size-table">
            <thead>
              <tr>
                <th>US</th>
                <th>قطر (mm)</th>
                <th>محیط (mm)</th>
                <th>EU</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.us}
                  className={row.us === activeRow.us ? "is-active" : undefined}
                  onClick={() => setActiveUsSize(row.us)}
                >
                  <td>{row.us.toLocaleString("fa-IR")}</td>
                  <td>{row.diameterMm.toLocaleString("fa-IR")}</td>
                  <td>{row.circumferenceMm.toLocaleString("fa-IR")}</td>
                  <td>{row.eu.toLocaleString("fa-IR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
