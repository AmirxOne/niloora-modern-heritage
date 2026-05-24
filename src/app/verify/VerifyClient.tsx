"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { PageTransition } from "@/components/layout/PageTransition";
import { TextBox } from "@/components/inputs";
import { Button } from "@/components/ui/Button";
import { fa } from "@/lib/i18n/fa";
import type { ProductAuthenticitySummary } from "@/lib/types";
import { normalizePieceCode } from "@/lib/products/piece-code";

function statusLabel(status: ProductAuthenticitySummary["status"]) {
  if (status === "verified") return fa.verify.statusVerified;
  if (status === "not_found") return fa.verify.statusNotFound;
  return fa.verify.statusInvalid;
}

export function VerifyClient() {
  const params = useSearchParams();
  const initialPieceCode = params.get("pieceCode")?.trim() ?? "";

  const [pieceCode, setPieceCode] = useState(initialPieceCode);
  const [result, setResult] = useState<ProductAuthenticitySummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedInput = useMemo(() => normalizePieceCode(pieceCode), [pieceCode]);

  const runVerify = async (value: string) => {
    const input = value.trim();
    if (!input) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/authenticity/verify?pieceCode=${encodeURIComponent(input)}`);
      if (!response.ok) {
        if (response.status === 400) {
          setError(fa.verify.invalidCode);
        } else {
          setError(fa.verify.notFound);
        }
        setResult(null);
        return;
      }
      const data = (await response.json()) as ProductAuthenticitySummary;
      setResult(data);
      if (data.status === "invalid") setError(fa.verify.invalidCode);
      else if (data.status === "not_found") setError(fa.verify.notFound);
      else setError(null);
    } catch {
      setError(fa.verify.notFound);
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialPieceCode) void runVerify(initialPieceCode);
  }, [initialPieceCode]);

  return (
    <PageTransition>
      <div className="verify-page min-h-screen pb-24 pt-20 md:pt-24">
        <div className="site-container">
          <section className="verify-page-shell">
            <header className="verify-page-header">
              <span className="heritage-eyebrow">{fa.verify.eyebrow}</span>
              <h1 className="verify-page-title">{fa.verify.title}</h1>
              <p className="verify-page-subtitle">{fa.verify.subtitle}</p>
            </header>

            <form
              className="verify-form"
              onSubmit={(e) => {
                e.preventDefault();
                void runVerify(pieceCode);
              }}
            >
              <TextBox
                label={fa.verify.inputLabel}
                value={pieceCode}
                onChange={(e) => setPieceCode(e.target.value)}
                placeholder={fa.verify.inputPlaceholder}
                autoComplete="off"
                inputClassName="text-left"
              />
              <Button type="submit" isLoading={isLoading}>
                {isLoading ? fa.verify.checking : fa.verify.submit}
              </Button>
            </form>

            {normalizedInput ? (
              <p className="verify-normalized" dir="ltr">
                {normalizedInput}
              </p>
            ) : null}

            {error ? <p className="verify-error">{error}</p> : null}

            {result ? (
              <section className="verify-result">
                <div className="verify-result-head">
                  <h2 className="verify-result-title">
                    {result.status === "verified" ? fa.verify.verifiedTitle : statusLabel(result.status)}
                  </h2>
                  <span className={`verify-status-chip verify-status-chip--${result.status}`}>
                    {statusLabel(result.status)}
                  </span>
                </div>

                <div className="verify-result-grid">
                  <div className="verify-kv">
                    <span>{fa.verify.resultCodeLabel}</span>
                    <strong dir="ltr">{result.pieceCodeNormalized}</strong>
                  </div>
                  <div className="verify-kv">
                    <span>{fa.verify.historyTotal}</span>
                    <strong>{result.history.totalChecks.toLocaleString("fa-IR")}</strong>
                  </div>
                  <div className="verify-kv">
                    <span>{fa.verify.historySuccess}</span>
                    <strong>{result.history.successfulChecks.toLocaleString("fa-IR")}</strong>
                  </div>
                  <div className="verify-kv">
                    <span>{fa.verify.historyLastVerified}</span>
                    <strong>
                      {result.history.lastVerifiedAt
                        ? new Date(result.history.lastVerifiedAt).toLocaleString("fa-IR")
                        : "—"}
                    </strong>
                  </div>
                </div>

                {result.product ? (
                  <div className="verify-product-card">
                    <Image
                      src={result.product.image}
                      alt={result.product.name}
                      className="verify-product-image"
                      width={80}
                      height={80}
                    />
                    <div className="verify-product-body">
                      <p className="verify-product-name">{result.product.namePersian}</p>
                      <p className="verify-product-sub">{fa.verify.verifiedHint}</p>
                      <Link href={`/product/${result.product.id}`} className="verify-product-link">
                        {fa.verify.openProduct}
                      </Link>
                    </div>
                  </div>
                ) : null}

                <div className="verify-history">
                  <h3 className="verify-history-title">{fa.verify.historyRecent}</h3>
                  {result.history.recent.length > 0 ? (
                    <ul className="verify-history-list">
                      {result.history.recent.map((entry) => (
                        <li key={entry.id} className="verify-history-item">
                          <span className={`verify-status-chip verify-status-chip--${entry.status}`}>
                            {statusLabel(entry.status)}
                          </span>
                          <span dir="ltr">{entry.pieceCodeNormalized}</span>
                          <time dateTime={entry.verifiedAt}>{new Date(entry.verifiedAt).toLocaleString("fa-IR")}</time>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="verify-history-empty">—</p>
                  )}
                </div>
              </section>
            ) : null}
          </section>
        </div>
      </div>
    </PageTransition>
  );
}
