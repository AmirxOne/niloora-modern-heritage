import type { VendorPayoutLedgerStatus } from "@prisma/client";

export type VendorPayoutEntryDto = {
  id: string;
  orderId: string;
  orderItemId: string;
  createdAt: string;
  orderFinalizedAt: string | null;
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
  status: VendorPayoutLedgerStatus;
  paidAt: string | null;
  reversedAt: string | null;
};

export type VendorPayoutsSummaryDto = {
  pendingTotal: number;
  earnedTotal: number;
  paidTotal: number;
};

export type VendorPayoutsDto = VendorPayoutsSummaryDto & {
  entries: VendorPayoutEntryDto[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};
