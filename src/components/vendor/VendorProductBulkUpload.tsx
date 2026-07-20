"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { fa } from "@/lib/i18n/fa";

const EXCEL_ACCEPT =
  ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const EXCEL_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

type BulkResult = {
  totalRows: number;
  created: number;
  failed: number;
  errors?: Array<{ row: number; message: string }>;
};

type Props = {
  onDone: () => void;
};

export function VendorProductBulkUpload({ onDone }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkResult | null>(null);

  const canUpload = useMemo(() => !uploading && !loadingTemplate && Boolean(selectedFile), [uploading, loadingTemplate, selectedFile]);

  const downloadFile = async (kind: "template" | "sample") => {
    setError(null);
    setLoadingTemplate(true);
    try {
      const response = await fetch(`/api/vendor/products/excel?kind=${kind}`, {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        setError(payload?.message ?? fa.vendor.errorGeneric);
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(new Blob([blob], { type: EXCEL_MIME }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download =
        kind === "sample" ? "vendor-products-sample.xlsx" : "vendor-products-template.xlsx";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError(fa.vendor.errorGeneric);
    } finally {
      setLoadingTemplate(false);
    }
  };

  const uploadExcel = async () => {
    if (!selectedFile) return;
    setError(null);
    setResult(null);
    setUploading(true);
    try {
      const buffer = await selectedFile.arrayBuffer();
      const response = await fetch("/api/vendor/products/excel", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": EXCEL_MIME,
        },
        body: buffer,
      });
      const payload = (await response.json()) as BulkResult & { message?: string };
      if (!response.ok) {
        setError(payload.message ?? fa.vendor.errorGeneric);
        return;
      }
      setResult(payload);
      if (payload.created > 0) onDone();
      setSelectedFile(null);
    } catch {
      setError(fa.vendor.errorGeneric);
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="space-y-4 rounded-heritage border border-subtle bg-matte-elevated p-6">
      <div>
        <h2 className="text-lg font-semibold text-ivory">{fa.vendor.productsBulkTitle}</h2>
        <p className="mt-1 text-sm text-silver">{fa.vendor.productsBulkHint}</p>
      </div>

      <div className="rounded-heritage border border-subtle bg-white p-4 text-sm">
        <p className="font-medium text-slate-700">{fa.vendor.productsBulkGuideTitle}</p>
        <ol className="mt-2 list-decimal space-y-1 pr-5 text-slate-600">
          <li>{fa.vendor.productsBulkGuideStep1}</li>
          <li>{fa.vendor.productsBulkGuideStep2}</li>
          <li>{fa.vendor.productsBulkGuideStep3}</li>
          <li>{fa.vendor.productsBulkGuideStep4}</li>
        </ol>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          isLoading={loadingTemplate}
          onClick={() => void downloadFile("template")}
        >
          {fa.vendor.productsBulkDownloadTemplate}
        </Button>
        <Button
          type="button"
          variant="outline"
          isLoading={loadingTemplate}
          onClick={() => void downloadFile("sample")}
        >
          {fa.vendor.productsBulkDownloadSample}
        </Button>
        <label className="inline-flex cursor-pointer items-center rounded-heritage border border-subtle bg-white px-4 py-2 text-sm text-silver hover:bg-matte">
          {selectedFile ? selectedFile.name : fa.vendor.productsBulkSelectFile}
          <input
            type="file"
            hidden
            accept={EXCEL_ACCEPT}
            onChange={(event) => {
              setError(null);
              setResult(null);
              setSelectedFile(event.currentTarget.files?.[0] ?? null);
            }}
          />
        </label>
        <Button type="button" isLoading={uploading} disabled={!canUpload} onClick={uploadExcel}>
          {fa.vendor.productsBulkUpload}
        </Button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {result ? (
        <div className="space-y-2 rounded-heritage border border-subtle bg-white p-4 text-sm">
          <p className="text-slate-700">
            {fa.vendor.productsBulkReport(result.totalRows, result.created, result.failed)}
          </p>
          {result.failed > 0 && (result.errors?.length ?? 0) > 0 ? (
            <ul className="list-disc space-y-1 pr-5 text-red-700">
              {(result.errors ?? []).slice(0, 10).map((item) => (
                <li key={`${item.row}-${item.message}`}>
                  {fa.vendor.productsBulkRowError(item.row, item.message)}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
