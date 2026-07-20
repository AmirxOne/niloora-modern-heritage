export type VendorStatus =
  | "draft"
  | "pending_review"
  | "active"
  | "suspended"
  | "rejected"
  | "archived";

export type VendorMemberRole = "owner" | "staff";

export interface VendorSettingsDto {
  maxActiveProducts: number;
  maxPendingSubmissions: number;
  quotaMode: "fixed" | "unlimited";
}

export interface VendorProfileDto {
  id: string;
  slug: string;
  displayName: string;
  displayNameFa?: string;
  description?: string;
  profileImageUrl?: string;
  bannerImageUrl?: string;
  contactPhone?: string;
  contactEmail?: string;
  status: VendorStatus;
  rejectionReason?: string;
  submittedAt?: string;
  approvedAt?: string;
  settings: VendorSettingsDto;
  memberRole: VendorMemberRole;
}
