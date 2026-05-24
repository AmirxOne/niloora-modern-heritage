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

export type KnownStoneGuideId =
  | StoneType
  | "amethyst"
  | "topaz"
  | "opal"
  | "lapis-lazuli"
  | "jade"
  | "garnet"
  | "pearl"
  | "citrine";

export type StoneShape = "round" | "oval" | "cushion" | "princess" | "pear" | "marquise";

export type BandStyle = "classic" | "twisted" | "pave" | "filigree" | "hammered" | "channel";

export type EngravingStyle = "nastaliq" | "naskh" | "thuluth" | "kufic" | "modern";

export type CarvingStyle = "none" | "minimal" | "geometric" | "floral" | "khatai" | "eslimi";

export type TextureStyle = "polished" | "brushed" | "matte" | "hammered" | "sandblasted";

export type RingStyle = "solitaire" | "halo" | "vintage" | "signet" | "eternity" | "stackable";

export type StoneSettingType = "prong" | "bezel" | "channel" | "pave" | "flush" | "gypsy";

export type StoneClarityGrade =
  | "FL"
  | "IF"
  | "VVS"
  | "VS"
  | "SI"
  | "I"
  | "eye-clean"
  | "natural-inclusions";

export type ProductOccasion =
  | "engagement"
  | "wedding"
  | "anniversary"
  | "birthday"
  | "gift"
  | "eid"
  | "religious"
  | "graduation"
  | "everyday";

export type ProductAvailability = "ready" | "preorder" | "sold" | "luxury" | "made-to-order";

/**
 * نوع کلی محصول — ستون فقرات شناسهٔ اثر (Piece Code) و دسته‌بندی فروشگاه.
 * با اضافه‌شدن دسته‌های جدید (تسبیح، گردنبند، …) این اتحادیه گسترش می‌یابد
 * و کد ۳-حرفی متناظر در `PRODUCT_TYPE_CODES` (lib/products/piece-code.ts) ثبت می‌شود.
 */
export type ProductType =
  | "ring-men"      // RGM — انگشتر مردانه (پیش‌فرض فعلی فروشگاه)
  | "ring-women"    // RGW — انگشتر زنانه
  | "necklace"      // NCK — گردنبند
  | "pendant"       // PND — آویز
  | "bracelet"      // BRC — دستبند
  | "bangle"        // BNG — النگو
  | "earring"       // ERR — گوشواره
  | "tasbih"        // TSB — تسبیح
  | "cufflink"      // CFL — دکمه سرآستین
  | "brooch"        // BRH — گل سینه
  | "other";        // OTH — سایر آثار

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

export interface ProductArtisanAssignments {
  /** استاد اصلی طراحی و ساخت رکاب */
  shankDesignerId?: ShankMasterId;
  /** استاد قلم‌کاری و نقش روی رکاب */
  carvingMasterId?: EngravingMasterId;
  /** استاد خوشنویسی/حکاکی روی رکاب */
  bandEngraverId?: EngravingMasterId;
  /** استاد حکاکی روی نگین */
  stoneEngraverId?: EngravingMasterId;
}

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
  introVideoUrl?: string;
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
  /** ISO 8601 — پایان تخفیف اختصاصی محصول (اولویت بر تایمر جشنواره) */
  discountEndsAt?: string;

  // ——— مشخصات تکمیلی (تمامی فیلدها اختیاری‌اند؛ در صورت نبود، مقادیر پیش‌فرض از سایر فیلدها استخراج می‌شود) ———
  /**
   * نوع کلی اثر برای شناسهٔ اثر (Piece Code) و آمار گالری.
   * اگر تعیین نشود، «انگشتر مردانه» در نظر گرفته می‌شود.
   */
  productType?: ProductType;
  /**
   * شناسهٔ اثر اختصاصی (مثل «NL-RGM-0042»).
   * در صورت نبود، به‌صورت قطعی از `id` و `productType` تولید می‌شود
   * تا هر اثر شناسهٔ یکتای پایدار و قابل اعلام به مشتری داشته باشد.
   */
  pieceCode?: string;
  /** کد یکتای کارگاهی برای ردیابی اثر (deprecated — از `pieceCode` استفاده شود) */
  sku?: string;
  /** سایز پیش‌فرض انگشتر (نمرهٔ بین‌المللی) */
  ringSize?: number;
  /** بازهٔ سایز قابل تنظیم رایگان (پایین، بالا) */
  ringSizeRange?: [number, number];
  /** وزن کل اثر به گرم */
  weightGrams?: number;
  /** ابعاد نگین (متن آماده، مثال: «۸×۶ میلی‌متر») */
  stoneDimensionsMm?: string;
  /** وزن نگین به قیراط */
  stoneWeightCarat?: number;
  /** عرض رکاب در باریک‌ترین نقطه (میلی‌متر) */
  bandWidthMm?: number;
  /** نوع نشاندن نگین */
  stoneSettingType?: StoneSettingType;
  /** درجهٔ وضوح نگین */
  stoneClarity?: StoneClarityGrade;
  /** برچسب رنگ نگین (متن آزاد) */
  stoneColorLabel?: string;
  /** مهر/عیار فلز (مثل «0.925») — در صورت نبودن، از نوع فلز استخراج می‌شود */
  metalStamp?: string;
  /** برچسب رنگ ظاهری رکاب */
  metalColorLabel?: string;
  /** فهرست مناسبت‌های پیشنهادی برای هدیه */
  occasions?: ProductOccasion[];
  /** مدت گارانتی به سال */
  warrantyYears?: number;
  /** عدم وجود نیکل */
  isNickelFree?: boolean;
  /** ضدحساسیت */
  isHypoallergenic?: boolean;
  /** محل ساخت (پیش‌فرض: «ایران») */
  craftedIn?: string;
  /** نام کارگاه/استاد سازنده */
  craftedBy?: string;
  /** اتصال محصول به پروفایل استادکاران */
  artisanAssignments?: ProductArtisanAssignments;
  /** آیا تغییر سایز رایگان ارائه می‌شود */
  freeResize?: boolean;
  /** تاریخ نخستین عرضه (ISO) — برای نمایش «در گالری از…» */
  firstAvailableAt?: string;
  ugcMedia?: ProductUgcMedia[];
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

export type BundleOfferDiscountType = "percent" | "fixed";

export interface BundleOfferDefinition {
  id: string;
  title: string;
  description?: string;
  discountType: BundleOfferDiscountType;
  discountValue: number;
  requiredProductIds: string[];
  active: boolean;
}

export interface AppliedBundleOffer {
  bundle: BundleOfferDefinition;
  amount: number;
}

export interface AppliedGiftCard {
  code: string;
  appliedAmount: number;
  remainingAmount?: number;
}

export interface GiftCard {
  id: string;
  code: string;
  initialAmount: number;
  remainingAmount: number;
  active: boolean;
  expiresAt?: string | null;
  note?: string;
  recipientName?: string;
  recipientContact?: string;
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

export type CheckoutPaymentMethod = "zarinpal" | "bnpl";
export type LoyaltyTier = "bronze" | "silver" | "gold" | "platinum";

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
  bundleDiscount?: number;
  appliedBundles?: Array<{ id: string; title: string; amount: number }>;
  promoCode?: string | null;
  paymentMethod?: CheckoutPaymentMethod;
  installmentMonths?: number;
  installmentAmount?: number;
  giftCardCode?: string | null;
  giftCardAppliedAmount?: number;
  loyaltyTier?: LoyaltyTier;
  loyaltyDiscountAmount?: number;
  loyaltyPointsEarned?: number;
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
export type ShopWeightBand = "light" | "medium" | "heavy";
export type ShopBudgetBand = "entry" | "mid" | "premium" | "luxury";
export type ShopMetalStamp = "0.925" | "0.750" | "0.585";

export interface ShopFilters {
  stones: StoneType[];
  priceRange: [number, number];
  styles: RingStyle[];
  engravingTypes: (EngravingStyle | "none")[];
  weightBands: ShopWeightBand[];
  metalStamps: ShopMetalStamp[];
  budgetBands: ShopBudgetBand[];
  occasions: ProductOccasion[];
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

export type CustomizerQuoteLiveStage =
  | "received"
  | "design-review"
  | "material-prep"
  | "workshop-crafting"
  | "qc"
  | "ready-dispatch";

export interface CustomizerQuoteRequest {
  id: string;
  date: string;
  updatedAt: string;
  status: CustomizerQuoteStatus;
  liveStage: CustomizerQuoteLiveStage;
  etaDays?: number;
  etaUpdatedAt?: string;
  workshopLiveMessage?: string;
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
  ratingBuildQuality: number;
  ratingBeauty: number;
  ratingValue: number;
  ratingPackaging: number;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  isVerifiedBuyer?: boolean;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface ProductAuthenticityVerificationEvent {
  id: string;
  pieceCodeInput: string;
  pieceCodeNormalized: string;
  status: "verified" | "not_found" | "invalid";
  productId?: string;
  verifiedAt: string;
}

export interface ProductAuthenticitySummary {
  pieceCodeInput: string;
  pieceCodeNormalized: string;
  status: "verified" | "not_found" | "invalid";
  checkedAt: string;
  product?: Product;
  history: {
    totalChecks: number;
    successfulChecks: number;
    lastVerifiedAt?: string;
    recent: ProductAuthenticityVerificationEvent[];
  };
}

export interface ProductQuestionAnswer {
  id: string;
  questionId: string;
  authorName: string;
  body: string;
  status: "pending" | "approved" | "rejected";
  isOfficial: boolean;
  createdAt: string;
}

export interface ProductQuestion {
  id: string;
  productId: string;
  authorName: string;
  body: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  answers: ProductQuestionAnswer[];
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  referralCode?: string;
  referralCredit?: number;
  referralEarnedTotal?: number;
  loyaltyPoints?: number;
  loyaltyTier?: LoyaltyTier;
  loyaltyLifetimeSpend?: number;
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
  favoriteStone?: StoneType | null;
  favoriteStyle?: RingStyle | null;
  favoriteBudgetBand?: ShopBudgetBand | null;
  role?: "user" | "editor" | "reviewer" | "admin";
  memberSince: string;
  tier: "gold" | "platinum" | "royal";
}

export interface PreferenceProfile {
  favoriteStone?: StoneType;
  favoriteStyle?: RingStyle;
  favoriteBudgetBand?: ShopBudgetBand;
}

export interface LoyaltySummary {
  points: number;
  lifetimeSpend: number;
  tier: LoyaltyTier;
  tierDiscountPercent: number;
  perks: string[];
  nextTier?: LoyaltyTier;
  amountToNextTier?: number;
}

export type ReferralInviteStatus = "registered" | "rewarded" | "blocked";

export interface ReferralInviteSummaryItem {
  id: string;
  status: ReferralInviteStatus;
  antiFraudReason?: string | null;
  inviterReward: number;
  inviteeReward: number;
  createdAt: string;
  rewardedAt?: string | null;
  invitee: {
    id: string;
    phone: string;
    name: string;
  };
}

export interface ReferralSummary {
  referralCode: string;
  referralCredit: number;
  referralEarnedTotal: number;
  summary: {
    totalInvites: number;
    registeredCount: number;
    rewardedCount: number;
    blockedCount: number;
  };
  recentInvites: ReferralInviteSummaryItem[];
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

export type BackInStockAlertChannel = "sms" | "email";
export type BackInStockAlertStatus = "pending" | "sent" | "failed" | "cancelled";
export type AbandonedCartRecoveryStatus = "pending" | "sent" | "recovered" | "cancelled" | "failed";
export type ProductUgcMediaType = "image" | "video";
export type ProductUgcMediaStatus = "pending" | "approved" | "rejected";

export interface BackInStockAlert {
  id: string;
  productId: string;
  userId?: string;
  name?: string;
  channel: BackInStockAlertChannel;
  contact: string;
  status: BackInStockAlertStatus;
  sourceAvailability?: ProductAvailability;
  requestedAt: string;
  notifiedAt?: string;
  notifyAttempts: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminBackInStockAlert extends BackInStockAlert {
  productName?: string;
  productNamePersian?: string;
  productImage?: string;
}

export interface AbandonedCartRecovery {
  id: string;
  token: string;
  userId?: string;
  name?: string;
  channel: BackInStockAlertChannel;
  contact: string;
  status: AbandonedCartRecoveryStatus;
  cartSnapshot: CartItem[];
  shippingSnapshot?: Record<string, unknown>;
  checkoutPath: string;
  lastActivityAt: string;
  nextReminderAt?: string;
  reminderSentAt?: string;
  reminderCount: number;
  recoveredAt?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductUgcMedia {
  id: string;
  productId: string;
  userId: string;
  orderId?: string;
  mediaUrl: string;
  mediaType: ProductUgcMediaType;
  caption?: string;
  status: ProductUgcMediaStatus;
  approvedAt?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductUgcMediaAdmin extends ProductUgcMedia {
  productName?: string;
  productNamePersian?: string;
  productImage?: string;
  userName?: string;
  userPhone?: string;
}

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
