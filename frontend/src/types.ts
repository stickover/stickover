export type Material = "Acrylic" | "Gold" | "Glass" | "Hard Plastic" | "Magic Cases" | "Gel Cases";

// Fixed pricing per material — offer price is what customers pay, actual price is the
// struck-through "compare at" price. All materials ship free.
export const MATERIAL_PRICING: Record<Material, { price: number; comparePrice: number }> = {
  Acrylic: { price: 499, comparePrice: 999 },
  Gold: { price: 499, comparePrice: 999 },
  Glass: { price: 399, comparePrice: 899 },
  "Hard Plastic": { price: 299, comparePrice: 599 },
  "Magic Cases": { price: 599, comparePrice: 999 },
  "Gel Cases": { price: 599, comparePrice: 999 },
};

export const MATERIAL_OPTIONS: Material[] = ["Acrylic", "Gold", "Glass", "Hard Plastic", "Magic Cases", "Gel Cases"];

// "Gel Cases" material products let the customer type a word/name to be
// personalized, then choose whether it's printed directly on the case image
// (free) or added as a raised/engraved physical text plate (+₹99).
export const GEL_TEXT_PLATE_SURCHARGE = 99;
export type GelTextStyle = "image" | "plate";

export interface Product {
  id: string;
  title: string;
  price: number;
  comparePrice: number;
  discount: number;
  description: string;
  collectionId: string;
  collectionIds: string[];
  tags: string[];
  // Case material — driving the fixed price/comparePrice per MATERIAL_PRICING.
  material?: Material;
  stockStatus: "in_stock" | "low_stock" | "out_of_stock";
  isFeatured: boolean;
  isTrending: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  images: string[];
  models: string[];
  // Admin-assigned "Variant Options" dropdown group id (see store_settings.variantGroups).
  // Empty/undefined = product has no extra variant dropdown.
  variantGroupId?: string;
  brand?: string;
  rating?: number;
  reviewsCount?: number;
  displayOrder?: number;
  trendingOrder?: number;
  bestSellerOrder?: number;
  createdAt?: string;
  updatedAt?: string;
  metaTitle?: string;
  metaDescription?: string;
  // Custom / photo-case products ask the customer to upload their own image to print.
  isCustomizable?: boolean;
  // Ask the customer to type a name to be printed on the product.
  requiresCustomerName?: boolean;
}

export interface SubCollection {
  id: string;
  name: string;
  image?: string;
  displayOrder?: number;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  image: string;
  bannerMobile?: string;
  bannerDesktop?: string;
  // Collection page banner can be a looping video instead of a static image,
  // same as the home page Hero banner. Defaults to "image" when unset.
  bannerMediaType?: "image" | "video";
  bannerVideoUrl?: string;
  description: string;
  isVisible: boolean;
  displayOrder?: number;
  subcollections?: SubCollection[];
  metaTitle?: string;
  metaDescription?: string;
  // Special/Designed Cases collections get a highlighted border on the home page grid.
  isHighlighted?: boolean;
  // Collection-wide "Variant Options" dropdown — applies to every product inside this
  // collection unless a product has its own override set (see Product.variantGroupId).
  variantGroupId?: string;
}

// Public "Write a Review" submission on the storefront's /reviews page.
// Lands as isApproved=false until an admin approves it in the admin panel.
export interface SiteReview {
  id: string;
  name: string;
  rating: number;
  comment: string;
  image?: string;
  isApproved: boolean;
  createdAt: string;
}

// Per-product review submitted via the "Write a Review" form on a product page.
// Lands as is_approved=0 until an admin approves it in the admin panel.
export interface ProductReview {
  id: string;
  product_id: string;
  product_title?: string;
  name: string;
  rating: number;
  comment: string;
  image?: string;
  is_approved: number | boolean;
  created_at: string;
}

// Admin-posted "story" (Instagram Highlights style) shown as circular
// bubbles at the top of the public /reviews page.
export interface ReviewStory {
  id: string;
  image: string;
  video?: string | null;
  media_type?: "image" | "video";
  name: string;
  caption?: string;
  display_order: number;
  is_active: number | boolean;
  created_at: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  mediaType?: "image" | "video";
  videoUrl?: string;
  link: string;
  active: boolean;
  order: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedModel: string;
  // Uploaded reference photo for customized/photo-case products (server path, e.g. /uploads/xyz.jpg)
  customImage?: string;
  // Name typed by the customer to be printed on the product.
  customName?: string;
  // Selected value from the product's admin-assigned "Variant Options" dropdown
  // (e.g. "Charger Type: Type-C"), plus free text if they picked "Create your own text".
  customVariant?: string;
  // "Magic Cases" material products take a SECOND mandatory photo + an
  // optional second text box (e.g. two people/photos printed on one case).
  customImage2?: string;
  customName2?: string;
  // "Gel Cases" material products: the word/name typed by the customer, plus
  // which style they picked — printed on the case image (free) or a physical
  // raised/engraved text plate (+₹99, folded into product.price on this item).
  gelPlateText?: string;
  gelPlateStyle?: GelTextStyle;
}

export interface VariantOption {
  id: string;
  label: string;
  // When true, selecting this option reveals a free-text box under the dropdown.
  isCustomText?: boolean;
}

export interface VariantGroup {
  id: string;
  name: string;
  options: VariantOption[];
  // Defaults to true (backward-compatible with groups saved before this setting
  // existed) - when false, customers can submit without picking an option.
  required?: boolean;
}

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  customerAltPhone?: string;
  shippingAddress: string;
  city: string;
  state: string;
  pincode: string;
  paymentMethod: "razorpay";
  paymentStatus?: "paid" | "failed" | "refunded";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  status: string;
  trackingId?: string;
  previewRequested?: boolean;
  previewRequestedAt?: string | null;
  createdAt: string;
}

export interface Customer {
  phone: string;
  name: string;
  email?: string;
  altPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string;
  isFrequent: boolean;
}
