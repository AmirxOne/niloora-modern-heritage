import { createHash } from "node:crypto";
import type { ProductAuthenticitySummary, ProductAuthenticityVerificationEvent } from "@/lib/types";
import { normalizePieceCode, parsePieceCode, resolvePieceCode } from "@/lib/products/piece-code";
import { prisma } from "@/lib/server/prisma";
import { getCatalogProducts, getProductByIdFromDb } from "@/lib/server/products";

function readRequestIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.trim() ?? "";
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "";
  return request.headers.get("x-real-ip")?.trim() ?? "";
}

function hashIp(ip: string): string | null {
  const value = ip.trim();
  if (!value) return null;
  return createHash("sha256").update(value).digest("hex");
}

function mapStatus(status: string): "verified" | "not_found" | "invalid" {
  if (status === "verified" || status === "not_found" || status === "invalid") return status;
  return "invalid";
}

function toEvent(row: {
  id: string;
  pieceCodeInput: string;
  pieceCodeNormalized: string;
  status: string;
  productId: string | null;
  verifiedAt: Date;
}): ProductAuthenticityVerificationEvent {
  return {
    id: row.id,
    pieceCodeInput: row.pieceCodeInput,
    pieceCodeNormalized: row.pieceCodeNormalized,
    status: mapStatus(row.status),
    productId: row.productId ?? undefined,
    verifiedAt: row.verifiedAt.toISOString(),
  };
}

export async function verifyPieceCodePublic(
  pieceCodeInput: string,
  request: Request
): Promise<ProductAuthenticitySummary> {
  const normalized = normalizePieceCode(pieceCodeInput);
  const parsed = parsePieceCode(normalized);
  const checkedAt = new Date();

  const ipHash = hashIp(readRequestIp(request));
  const userAgent = request.headers.get("user-agent")?.slice(0, 500) ?? null;

  if (!parsed) {
    await prisma.productAuthenticityVerification.create({
      data: {
        pieceCodeInput,
        pieceCodeNormalized: normalized,
        status: "invalid",
        ipHash,
        userAgent,
      },
    });

    return {
      pieceCodeInput,
      pieceCodeNormalized: normalized,
      status: "invalid",
      checkedAt: checkedAt.toISOString(),
      history: {
        totalChecks: 0,
        successfulChecks: 0,
        recent: [],
      },
    };
  }

  const products = await getCatalogProducts();
  const matched = products.find((p) => resolvePieceCode(p) === normalized) ?? null;

  const status = matched ? "verified" : "not_found";
  const created = await prisma.productAuthenticityVerification.create({
    data: {
      pieceCodeInput,
      pieceCodeNormalized: normalized,
      status,
      productId: matched?.id ?? null,
      ipHash,
      userAgent,
    },
  });

  const historyRows = await prisma.productAuthenticityVerification.findMany({
    where: { pieceCodeNormalized: normalized },
    orderBy: { verifiedAt: "desc" },
    take: 10,
    select: {
      id: true,
      pieceCodeInput: true,
      pieceCodeNormalized: true,
      status: true,
      productId: true,
      verifiedAt: true,
    },
  });

  const totalChecks = await prisma.productAuthenticityVerification.count({
    where: { pieceCodeNormalized: normalized },
  });

  const successfulChecks = await prisma.productAuthenticityVerification.count({
    where: { pieceCodeNormalized: normalized, status: "verified" },
  });

  const lastVerified = await prisma.productAuthenticityVerification.findFirst({
    where: { pieceCodeNormalized: normalized, status: "verified" },
    orderBy: { verifiedAt: "desc" },
    select: { verifiedAt: true },
  });

  const product = matched ? await getProductByIdFromDb(matched.id) : null;

  return {
    pieceCodeInput,
    pieceCodeNormalized: normalized,
    status,
    checkedAt: created.verifiedAt.toISOString(),
    product: product ?? undefined,
    history: {
      totalChecks,
      successfulChecks,
      lastVerifiedAt: lastVerified?.verifiedAt.toISOString(),
      recent: historyRows.map(toEvent),
    },
  };
}
