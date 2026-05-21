import type { ExtractedTelegramSignal, TelegramProductAttributes } from "@/lib/server/telegram/types";

const ATTRIBUTE_SPLIT_RE = /[:=|\-]/;
const TAG_RE = /#[\w\u0600-\u06FF-]+/g;

function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function parseNumeric(value: string): string | number | boolean {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "";
  if (["true", "yes", "بله"].includes(normalized)) return true;
  if (["false", "no", "خیر"].includes(normalized)) return false;
  const numericRaw = normalized.replace(/[,_\s]/g, "");
  if (/^-?\d+(\.\d+)?$/.test(numericRaw)) {
    const numberValue = Number(numericRaw);
    if (Number.isFinite(numberValue)) return numberValue;
  }
  return value.trim();
}

function parseAttributeLine(line: string): [string, string | number | boolean] | null {
  const cleaned = line.trim().replace(/^[\-\*\u2022]\s*/, "");
  if (!cleaned) return null;
  const parts = cleaned.split(ATTRIBUTE_SPLIT_RE);
  if (parts.length < 2) return null;
  const key = normalizeWhitespace(parts[0] ?? "");
  const rawValue = normalizeWhitespace(parts.slice(1).join(":"));
  if (!key || !rawValue) return null;
  return [key, parseNumeric(rawValue)];
}

function inferTitle(lines: string[]): string | null {
  for (const line of lines) {
    const cleaned = normalizeWhitespace(line.replace(TAG_RE, ""));
    if (cleaned.length >= 3) return cleaned.slice(0, 180);
  }
  return null;
}

function collectAttributes(lines: string[]): TelegramProductAttributes {
  const attributes: TelegramProductAttributes = {};
  for (const line of lines) {
    const parsed = parseAttributeLine(line);
    if (!parsed) continue;
    const [key, value] = parsed;
    attributes[key] = value;
  }
  return attributes;
}

function detectSignal(lines: string[], tags: string[], attributes: TelegramProductAttributes): boolean {
  if (tags.length > 0) return true;
  if (Object.keys(attributes).length > 0) return true;
  return lines.some((line) => normalizeWhitespace(line).length >= 5);
}

export function extractTelegramSignal(text: string | undefined | null): ExtractedTelegramSignal {
  const rawText = text?.trim() || null;
  const lines = (rawText ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const tags = Array.from(new Set((rawText ?? "").match(TAG_RE) ?? []));
  const attributes = collectAttributes(lines);
  const title = inferTitle(lines);
  const description = normalizeWhitespace(lines.join("\n")) || "";
  const hasProductSignal = detectSignal(lines, tags, attributes);

  return {
    title,
    description,
    tags,
    attributes,
    rawText,
    hasProductSignal,
  };
}

