export type AdminVendorFinanceRowDto = {
  vendorId: string;
  displayName: string;
  displayNameFa: string | null;
  slug: string;
  grossAmount: number;
  commissionAmount: number;
  netPending: number;
  orderCount: number;
};

export type AdminVendorFinancePlatformDto = {
  grossAmount: number;
  commissionAmount: number;
  netPending: number;
  orderCount: number;
};

export type AdminVendorFinanceDto = {
  platform: AdminVendorFinancePlatformDto;
  vendors: AdminVendorFinanceRowDto[];
  topByGross: AdminVendorFinanceRowDto[];
};
