import { apiFetch } from "@/lib/api/client-fetch";

const EXCEL_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export const EXCEL_ACCEPT =
  ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function downloadExcelFromResponse(
  response: Response,
  fallbackFilename: string
): Promise<boolean> {
  if (!response.ok) return false;

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename="([^"]+)"/i);
  const filename = match?.[1] ?? fallbackFilename;

  const url = URL.createObjectURL(new Blob([blob], { type: EXCEL_MIME }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return true;
}

export async function postExcelFile(url: string, file: File): Promise<Response> {
  const buffer = await file.arrayBuffer();
  return apiFetch(url, {
    method: "POST",
    headers: {
      "Content-Type": EXCEL_MIME,
    },
    body: buffer,
  });
}
