import * as XLSX from "xlsx";

export type ExcelRow = Record<string, string>;

const EXCEL_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function cellToString(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value).trim();
}

export function serializeExcelBuffer(
  headers: string[],
  rows: Array<Record<string, unknown>>
): Uint8Array {
  const sheetRows: unknown[][] = [
    headers,
    ...rows.map((row) => headers.map((header) => row[header] ?? "")),
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(sheetRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Uint8Array;
}

export function parseExcelBuffer(buffer: ArrayBuffer): { headers: string[]; rows: ExcelRow[] } {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { headers: [], rows: [] };

  const sheet = workbook.Sheets[sheetName];
  const table = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  if (table.length === 0) return { headers: [], rows: [] };

  const headers = (table[0] ?? []).map((cell) => cellToString(cell)).filter(Boolean);
  if (headers.length === 0) return { headers: [], rows: [] };

  const rows: ExcelRow[] = [];
  for (let i = 1; i < table.length; i += 1) {
    const values = table[i] ?? [];
    const row: ExcelRow = {};
    let hasValue = false;
    headers.forEach((header, idx) => {
      const value = cellToString(values[idx]);
      row[header] = value;
      if (value) hasValue = true;
    });
    if (hasValue) rows.push(row);
  }

  return { headers, rows };
}

export function excelResponse(filename: string, buffer: Uint8Array): Response {
  const body = Buffer.from(buffer);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": EXCEL_MIME,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
