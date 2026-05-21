export type MetalType = "sterling" | "oxidized" | "rhodium" | "matte-silver";

export type StoneType =
  | "diamond"
  | "emerald"
  | "sapphire"
  | "ruby"
  | "turquoise"
  | "onyx"
  | "zabarjad"
  | "yemen-aqeeq"
  | "durr-najaf"
  | "moral";

export type StoneShape = "round" | "oval" | "cushion" | "princess" | "pear" | "marquise";

export type BandStyle = "classic" | "twisted" | "pave" | "filigree" | "hammered" | "channel";

export type EngravingStyle = "nastaliq" | "naskh" | "thuluth" | "kufic" | "modern";

export type CarvingStyle = "none" | "minimal" | "geometric" | "floral" | "khatai" | "eslimi";

export type TextureStyle = "polished" | "brushed" | "matte" | "hammered" | "sandblasted";

export type RingStyle = "solitaire" | "halo" | "vintage" | "signet" | "eternity" | "stackable";

export type ProductAvailability = "ready" | "preorder" | "sold" | "luxury" | "made-to-order";

export type ProductCondition = "new" | "pre-owned";

export type PreOwnedGrade = "excellent" | "very-good" | "good";

export type ShankMasterId = "ebrahim-azari" | "tehrani-azari" | "heritage-atelier";

export type EngravingMasterId =
  | "kourosh"
  | "naderi"
  | "rahimi"
  | "lotif"
  | "sadeghi"
  | "hakhamaneshi";

export type StoneCategory = "religious" | "collection";

export interface CustomizerState {
  bandStyle: BandStyle;
  thickness: number;
  size: number;
  metal: MetalType;
  stone: StoneType;
  stoneColor: string;
  stoneShape: StoneShape;
  engravingText: string;
  engravingStyle: EngravingStyle;
  texture: TextureStyle;
  carving: CarvingStyle;
  shankMaster: ShankMasterId;
  shankModelId: string;
  bandCarvingEnabled: boolean;
  bandEngravingEnabled: boolean;
  bandEngravingMasterId: EngravingMasterId | null;
  stoneCategory: StoneCategory;
  stoneEngravingEnabled: boolean;
  stoneEngravingMasterId: EngravingMasterId | null;
  stoneInscriptionId: string | null;
}

export interface ProductListing {
  tier: "premium" | "economy";
  headline: string;
  details: string[];
  extraTags?: ("pre-owned")[];
}

export interface PreOwnedInfo {
  originalPrice: number;
  depreciationPercent: number;
  grade: PreOwnedGrade;
  certifiedRefurbished: boolean;
  canRemake: boolean;
  buybackRatePercent: number;
  story?: string;
}

export interface Product {
  id: string;
  name: string;
  namePersian: string;
  listing: ProductListing;
  price: number;
  listPrice?: number;
  discountPercent?: number;
  image: string;
  images?: string[];
  category: RingStyle;
  metal: MetalType;
  stone: StoneType;
  stoneShape: StoneShape;
  engravingType: EngravingStyle | "none";
  availability: ProductAvailability;
  stock: number;
  featured: boolean;
  bestseller: boolean;
  collection?: string;
  collectionId?: string;
  initialSalesCount?: number;
  condition: ProductCondition;
  preOwned?: PreOwnedInfo;
}

export interface PromoCodeDefinition {
  id: string;
  code: string;
  label: string;
  type: "percent" | "fixed";
  value: number;
  minSubtotal: number;
  replacesSiteWide: boolean;
}

export interface CartItem {
  id: string;
  productId?: string;
  name: string;
  price: number;
  listPrice?: number;
  quantity: number;
  image: string;
  availability?: ProductAvailability;
  customizerState?: CustomizerState;
}

export interface OrderPaymentSummary {
  status: string;
  gateway: string;
  refId?: string;
  verifiedAt?: string;
}

export interface OrderShipping {
  fullName: string;
  mobile: string;
  province: string;
  city: string;
  address: string;
  postalCode: string;
  orderNote: string;
  method: string;
  methodLabel: string;
  cost: number;
}

export interface Order {
  id: string;
  date: string;
  updatedAt?: string;
  status:
    | "pending_payment"
    | "payment_failed"
    | "processing"
    | "crafting"
    | "shipped"
    | "delivered";
  total: number;
  subtotalList?: number;
  totalFurooh?: number;
  promoCode?: string | null;
  shipping?: OrderShipping;
  trackingCode?: string;
  payment?: OrderPaymentSummary;
  items: CartItem[];
}

export interface AdminOrder extends Order {
  customer: {
    name: string;
    phone: string;
  };
}

export type ShopCollectionFilter = "all" | "bestseller" | "featured";
export type ShopCollectionId = "royal-heritage" | "ancient-dynasty" | "modern-nobility";

export interface ShopFilters {
  stones: StoneType[];
  priceRange: [number, number];
  styles: RingStyle[];
  engravingTypes: (EngravingStyle | "none")[];
  availabilities: ProductAvailability[];
  collections: Exclude<ShopCollectionFilter, "all">[];
  collectionIds: ShopCollectionId[];
  conditions: ProductCondition[];
  query: string;
}

export interface SavedDesign {
  id: string;
  name: string;
  state: CustomizerState;
  price: number;
  createdAt: string;
  /** ISO timestamp for merge conflict resolution (defaults to createdAt). */
  updatedAt?: string;
}

export type CustomizerQuoteStatus =
  | "pending-quote"
  | "quoted"
  | "accepted"
  | "rejected"
  | "cancelled";

export interface CustomizerQuoteRequest {
  id: string;
  date: string;
  updatedAt: string;
  status: CustomizerQuoteStatus;
  title: string;
  estimateTotal: number;
  quotedTotal?: number;
  customerNote?: string;
  workshopReply?: string;
  configuration: CustomizerState;
}

export interface ProductComment {
  id: string;
  productId: string;
  authorName: string;
  body: string;
  rating: number;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  firstName?: string | null;
  lastName?: string | null;
  birthDate?: string | null;
  postalCode?: string | null;
  addressLine?: string | null;
  province?: string | null;
  city?: string | null;
  nationalCode?: string | null;
  landlinePhone?: string | null;
  gender?: "male" | "female" | "other" | null;
  role?: "user" | "admin";
  memberSince: string;
  tier: "gold" | "platinum" | "royal";
}

export type TradeInSubmissionStatus = "pending" | "reviewed" | "rejected";

export interface TradeInSubmission {
  id: string;
  fullName: string;
  phone: string;
  ringDescription: string;
  estimatedOriginalPrice: number;
  notes?: string;
  wantsRemake?: boolean;
  createdAt: string;
  status: TradeInSubmissionStatus;
}

export interface AdminTradeInSubmission extends TradeInSubmission {
  internalNotes?: string;
  updatedAt: string;
}

export type SupportRequestKind = "return" | "support";

export type SupportRequestStatus = "pending" | "in_progress" | "resolved" | "rejected";

export interface SupportRequest {
  id: string;
  kind: SupportRequestKind;
  category: string;
  fullName: string;
  phone: string;
  email?: string;
  message: string;
  orderId?: string;
  status: SupportRequestStatus;
  createdAt: string;
}

export interface AdminSupportRequest extends SupportRequest {
  userId?: string;
  internalNotes?: string;
  updatedAt: string;
}
