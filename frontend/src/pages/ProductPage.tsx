import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router";
import { Share2, ImagePlus, X, Loader2, CheckCircle2, ArrowLeft, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { api } from "../utils/api";
import { Product, Collection, VariantGroup } from "../types";
import { useCart } from "../context/CartContext";
import { useOffers, getPrimaryDisplayOffer } from "../utils/useOffers";
import ProductCard from "../components/ProductCard";
import ProductReviews from "../components/ProductReviews";
import { DEFAULT_BRAND_MODELS } from "../utils/brandModels";
import { Material, GelTextStyle, GEL_TEXT_PLATE_SURCHARGE } from "../types";
import SearchableSelect from "../components/SearchableSelect";
import gelTextPlateImg from "../assets/gel-text/text-plate-gold.png";
import gelTextPrintImg from "../assets/gel-text/text-print.png";
import { setSEO, setJSONLD, absUrl } from "../utils/useSEO";
import { trackViewContent } from "../utils/metaPixel";

// Fixed info graphic (engraving quality / visibility notes) appended as the
// last product image for every Gold-material product — existing and future,
// since it's driven off product.material rather than stored per-product.
const GOLD_CASE_INFO_IMAGE = "https://stickover.in/gold-case-info.png";

// A product's image slot can be a photo or a video (admin can upload either) —
// tell them apart by extension so the gallery renders the right tag.
function isVideoFile(url: string) {
  return /\.(mp4|webm|mov)$/i.test(url || "");
}

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeImg, setActiveImg] = useState(0);
  const [brandModels, setBrandModels] = useState<Record<string, string[]>>(DEFAULT_BRAND_MODELS);
  // Raw settings kept around so we can re-derive the model list once we know
  // the product's material (admin now manages models per-material).
  const [rawSettings, setRawSettings] = useState<any>(null);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [model, setModel] = useState("");
  const [modelError, setModelError] = useState(false);
  const [variantGroups, setVariantGroups] = useState<VariantGroup[]>([]);
  const [selectedVariantOption, setSelectedVariantOption] = useState("");
  const [variantCustomText, setVariantCustomText] = useState("");
  const [variantError, setVariantError] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const offers = useOffers();
  const currentOffer = getPrimaryDisplayOffer(offers);
  const { addItem, openDrawer } = useCart();
  const touchStartX = useRef<number | null>(null);

  // Custom / photo-case products: ask the customer to upload their own image to print
  const [customImage, setCustomImage] = useState<string>("");
  const [customPreview, setCustomPreview] = useState<string>("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [photoError, setPhotoError] = useState(false);
  const [customIsVideo, setCustomIsVideo] = useState(false);

  // "Magic Cases" material: a SECOND mandatory photo slot, plus two optional
  // text boxes (name1 reuses customName below, this is name2).
  const [customImage2, setCustomImage2] = useState<string>("");
  const [customPreview2, setCustomPreview2] = useState<string>("");
  const [uploadingPhoto2, setUploadingPhoto2] = useState(false);
  const [uploadError2, setUploadError2] = useState("");
  const [photoError2, setPhotoError2] = useState(false);
  const [customName2, setCustomName2] = useState<string>("");

  // Custom name to be printed on the product (when admin requires it)
  const [customName, setCustomName] = useState<string>("");

  // "Gel Cases" material: word/name to personalize + which style (image print
  // vs physical engraved plate, +₹99).
  const [gelPlateText, setGelPlateText] = useState<string>("");
  const [gelPlateStyle, setGelPlateStyle] = useState<GelTextStyle | "">("");
  const [gelPlateError, setGelPlateError] = useState(false);

  const [related, setRelated] = useState<Product[]>([]);
  const [materialDescriptions, setMaterialDescriptions] = useState<Record<string, { image?: string; para1?: string; para2?: string }>>({});
  const [materialProductDescriptions, setMaterialProductDescriptions] = useState<Record<string, string>>({});

  useEffect(() => {
    api.get("/api/settings").then((s) => {
      setRawSettings(s || {});
      // Legacy fallback (pre-material admin data) — real source of truth is
      // materialBrandModels, resolved once we know the product's material below.
      if (s?.brandModels && Object.keys(s.brandModels).length) setBrandModels(s.brandModels);
      if (Array.isArray(s?.variantGroups)) setVariantGroups(s.variantGroups);
      if (s?.materialDescriptions) setMaterialDescriptions(s.materialDescriptions);
      if (s?.materialProductDescriptions) setMaterialProductDescriptions(s.materialProductDescriptions);
    }).catch(() => {});
    api.get("/api/collections").then(setCollections).catch(() => {});
  }, []);

  // The admin panel manages phone models per case-material now
  // (settings.materialBrandModels[material][brand] = models[]), so the model
  // dropdown here must key off the product's own material instead of the old
  // flat settings.brandModels list — otherwise models added for a material
  // (e.g. IQOO 15R under Glass) never show up on the product page.
  useEffect(() => {
    if (!rawSettings || !product) return;
    const material = (product.material || "") as Material;
    const perMaterial = rawSettings.materialBrandModels?.[material];
    if (perMaterial && Object.keys(perMaterial).length) {
      setBrandModels(perMaterial);
    } else if (rawSettings.brandModels && Object.keys(rawSettings.brandModels).length) {
      setBrandModels(rawSettings.brandModels);
    } else {
      setBrandModels(DEFAULT_BRAND_MODELS);
    }
  }, [rawSettings, product]);

  useEffect(() => {
    if (!id) return;
    setProduct(null);
    api.get(`/api/products/${id}`).then((p) => {
      // Gold-material products always show the engraving/visibility info
      // graphic as their last image — appended here so it applies to every
      // existing and future Gold product automatically.
      if ((p.material || "").trim().toLowerCase() === "gold") {
        const imgs = p.images || [];
        if (!imgs.includes(GOLD_CASE_INFO_IMAGE)) {
          p.images = [...imgs, GOLD_CASE_INFO_IMAGE];
        }
      }
      setProduct(p);
      trackViewContent({ productId: p.id, productName: p.title, price: p.price });
      setActiveImg(0);
      setSelectedBrand(p.brand && (p.models || []).length ? p.brand : "");
      setModel("");
      setCustomImage("");
      setCustomPreview("");
      setPhotoError(false);
      setUploadError("");
      setCustomName("");
      setCustomImage2("");
      setCustomPreview2("");
      setPhotoError2(false);
      setUploadError2("");
      setCustomName2("");
      setGelPlateText("");
      setGelPlateStyle("");
      setGelPlateError(false);
      setSelectedVariantOption("");
      setVariantCustomText("");
      setVariantError(false);
      const seoImages = (p.images || []).filter((img: string) => !isVideoFile(img));
      setSEO({
        title: p.metaTitle || p.title,
        description: p.metaDescription || (p.description || "").slice(0, 160) || `Buy ${p.title} at Stickover — custom phone case, durable print, secure online payments across India.`,
        keywords: `${p.title}, ${p.brand ? p.brand + " phone case, " : ""}custom phone case, acrylic phone case, gold phone case`,
        image: seoImages[0] ? api.imageUrl(seoImages[0]) : undefined,
        url: `/product/${p.id}`,
      });
      setJSONLD("product", {
        "@context": "https://schema.org",
        "@type": "Product",
        name: p.title,
        description: p.metaDescription || (p.description || "").slice(0, 500),
        image: seoImages.map((img: string) => api.imageUrl(img)),
        sku: p.id,
        brand: { "@type": "Brand", name: "Stickover" },
        ...(p.rating && p.reviewsCount
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: p.rating,
                reviewCount: p.reviewsCount,
              },
            }
          : {}),
        offers: {
          "@type": "Offer",
          url: absUrl(`/product/${p.id}`),
          priceCurrency: "INR",
          price: p.price,
          availability:
            p.stockStatus === "out_of_stock"
              ? "https://schema.org/OutOfStock"
              : "https://schema.org/InStock",
          itemCondition: "https://schema.org/NewCondition",
        },
      });
      setJSONLD("breadcrumb", {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absUrl("/") },
          { "@type": "ListItem", position: 2, name: "Products", item: absUrl("/collections") },
          { "@type": "ListItem", position: 3, name: p.title, item: absUrl(`/product/${p.id}`) },
        ],
      });
    }).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (product) {
      api.get("/api/products").then((all: Product[]) => {
        const sameCollection = all.filter(
          (p) => p.id !== product.id && p.collectionId === product.collectionId
        );
        const pool = sameCollection.length ? sameCollection : all.filter((p) => p.id !== product.id);
        setRelated(pool.slice(0, 4));
      }).catch(() => {});
    }
  }, [product]);

  if (!product) {
    return (
      <div className="max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-20 py-24 text-center">
        <div className="w-10 h-10 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  const hasDiscount = product.comparePrice && product.comparePrice > product.price;
  const discountPct = hasDiscount ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;
  // If the admin specified a brand + models list for this exact product, restrict the
  // buyer's choice to only those models — otherwise fall back to the full global list.
  const hasModelRestriction = !!product.brand && (product.models || []).length > 0;

  // Buyers now pick just a phone model from a single searchable field — no
  // separate brand step. We still need to know which brand a model belongs
  // to (for order records), so build a flat model list + a model->brand map.
  const modelToBrand: Record<string, string> = {};
  let availableModels: string[];
  if (hasModelRestriction) {
    availableModels = product.models || [];
    (product.models || []).forEach((m) => { modelToBrand[m] = product.brand as string; });
  } else {
    availableModels = [];
    Object.entries(brandModels).forEach(([brand, models]) => {
      models.forEach((m) => {
        if (!(m in modelToBrand)) modelToBrand[m] = brand;
        availableModels.push(m);
      });
    });
  }
  const collectionName = (collections.find((c) => c.id === product.collectionId)?.name || product.collectionId || "").replace(/-/g, " ");

  // Admin-assigned "Variant Options" dropdown (e.g. Charger Type) shown under the phone model picker.
  // A product's own setting always wins; otherwise fall back to whichever of its
  // collections has a group assigned (Admin > Collections).
  const collectionVariantGroupId = (() => {
    const ids = (product.collectionIds && product.collectionIds.length ? product.collectionIds : [product.collectionId]).filter(Boolean);
    for (const cid of ids) {
      const match = collections.find((c) => c.id === cid && c.variantGroupId);
      if (match?.variantGroupId) return match.variantGroupId;
    }
    return "";
  })();
  const effectiveVariantGroupId = product.variantGroupId || collectionVariantGroupId;
  const activeVariantGroup = variantGroups.find((g) => g.id === effectiveVariantGroupId && g.options.length > 0) || null;
  const selectedVariantOptionObj = activeVariantGroup?.options.find((o) => o.id === selectedVariantOption) || null;
  const variantNeedsCustomText = !!selectedVariantOptionObj?.isCustomText;

  // A product counts as customizable if the admin flagged it, or its title/tags/collection
  // mention custom / customized / photo case — so the shopper is asked to upload their photo.
  const customKeywords = /custom|photo\s*case|personali[sz]ed/i;
  const isCustomizable =
    !!product.isCustomizable ||
    customKeywords.test(product.title || "") ||
    (product.tags || []).some((t) => customKeywords.test(t)) ||
    customKeywords.test(collectionName || "");

  // "Magic Cases" material products always ask for 2 mandatory photos + 2
  // optional text boxes, instead of the normal single-photo customization
  // flow above — driven purely off the material, so it applies to every
  // existing and future Magic Cases product automatically.
  const isMagicCase = product.material === "Magic Cases";

  // "Gel Cases" material products: ask for a word/name to personalize, then
  // whether it goes on as a print (free) or a physical engraved plate (+₹99).
  const isGelCase = product.material === "Gel Cases";
  const gelSurcharge = gelPlateStyle === "plate" ? GEL_TEXT_PLATE_SURCHARGE : 0;

  // Checks that an uploaded video is square (1:1) before it's allowed through —
  // that's the only aspect ratio the print pipeline supports for video uploads.
  const checkVideoIsSquare = (file: File): Promise<boolean> =>
    new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve(video.videoWidth > 0 && video.videoWidth === video.videoHeight);
      };
      video.onerror = () => resolve(false);
      video.src = URL.createObjectURL(file);
    });

  const handlePhotoSelect = async (file: File | null) => {
    if (!file) return;
    setUploadError("");

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) { setUploadError("Please choose an image or video file."); return; }
    if (isMagicCase && isVideo) { setUploadError("This product only accepts photos, not videos."); return; }

    const maxSize = isVideo ? 60 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError(isVideo ? "Video must be under 60MB." : "Image must be under 5MB.");
      return;
    }

    if (isVideo) {
      const isSquare = await checkVideoIsSquare(file);
      if (!isSquare) {
        setUploadError("Only 1:1 (square) resolution videos are supported. Please crop your video to a square first.");
        return;
      }
    }

    setCustomPreview(URL.createObjectURL(file));
    setCustomIsVideo(isVideo);
    setUploadingPhoto(true);
    try {
      const res = await api.customerUpload(file);
      setCustomImage(res.url);
      setPhotoError(false);
    } catch {
      setUploadError("Upload failed, please try again.");
      setCustomPreview("");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = () => {
    setCustomImage("");
    setCustomPreview("");
    setCustomIsVideo(false);
  };

  // Second photo slot for "Magic Cases" — images only (no video), mandatory.
  const handlePhotoSelect2 = async (file: File | null) => {
    if (!file) return;
    setUploadError2("");
    if (!file.type.startsWith("image/")) { setUploadError2("Please choose an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setUploadError2("Image must be under 5MB."); return; }

    setCustomPreview2(URL.createObjectURL(file));
    setUploadingPhoto2(true);
    try {
      const res = await api.customerUpload(file);
      setCustomImage2(res.url);
      setPhotoError2(false);
    } catch {
      setUploadError2("Upload failed, please try again.");
      setCustomPreview2("");
    } finally {
      setUploadingPhoto2(false);
    }
  };

  const removePhoto2 = () => {
    setCustomImage2("");
    setCustomPreview2("");
  };

  const requiresName = !!product.requiresCustomerName;

  const validateSelection = () => {
    let ok = true;
    if (!selectedBrand || !model) { setModelError(true); ok = false; }
    if (isMagicCase) {
      if (!customImage) { setPhotoError(true); ok = false; }
      if (!customImage2) { setPhotoError2(true); ok = false; }
    } else if (isCustomizable && !customImage) {
      setPhotoError(true); ok = false;
    }
    // NOTE: the "text to print" box is optional by design — the admin
    // toggle only controls whether the box is SHOWN, not whether it must be
    // filled in. It stays empty by default; if the customer types something
    // it's carried through to the order, but leaving it blank never blocks
    // add-to-cart / buy-now.
    if (activeVariantGroup) {
      const variantIsRequired = activeVariantGroup.required !== false;
      if (!selectedVariantOptionObj) {
        if (variantIsRequired) { setVariantError(true); ok = false; }
      } else if (variantNeedsCustomText && !variantCustomText.trim()) {
        setVariantError(true); ok = false;
      }
    }
    // Gel Cases personalization is fully optional — but IF a font style is
    // picked (Text Plate / Text Print), the text field must be filled.
    if (isGelCase && gelPlateStyle && !gelPlateText.trim()) {
      setGelPlateError(true); ok = false;
    }
    return ok;
  };

  const buildVariantText = () => {
    if (!activeVariantGroup || !selectedVariantOptionObj) return undefined;
    const value = variantNeedsCustomText ? variantCustomText.trim() : selectedVariantOptionObj.label;
    return value ? `${activeVariantGroup.name}: ${value}` : undefined;
  };

  // Combines the generic variant-group text (if any) with the Gel Cases
  // personalization text, since both share the CartItem.customVariant slot
  // that's already wired up everywhere (cart, checkout, admin orders).
  const buildCombinedVariantText = () => {
    const parts: string[] = [];
    const v = buildVariantText();
    if (v) parts.push(v);
    if (isGelCase && gelPlateStyle && gelPlateText.trim()) {
      const styleLabel = gelPlateStyle === "plate" ? `Gold Plate (+₹${GEL_TEXT_PLATE_SURCHARGE})` : "Print (Free)";
      parts.push(`Text: "${gelPlateText.trim()}" — ${styleLabel}`);
    }
    return parts.length ? parts.join(" | ") : undefined;
  };

  // When the customer picks the physical engraved plate, ₹99 is folded
  // straight into this cart line's product price/comparePrice — that way the
  // cart subtotal, checkout total, Razorpay amount, and admin order totals
  // all pick it up automatically with zero changes anywhere else.
  const buildCartProduct = (): Product => {
    if (!gelSurcharge) return product;
    return { ...product, price: product.price + gelSurcharge, comparePrice: (product.comparePrice || product.price) + gelSurcharge };
  };

  const handleAdd = () => {
    if (!validateSelection()) return;
    addItem(buildCartProduct(), `${selectedBrand} - ${model}`, 1, customImage || undefined, customName.trim() || undefined, buildCombinedVariantText(), customImage2 || undefined, customName2.trim() || undefined);
    openDrawer(); // "Add to Cart" always lands on the full /cart page now
  };

  const handleBuyNow = () => {
    if (!validateSelection()) return;
    addItem(buildCartProduct(), `${selectedBrand} - ${model}`, 1, customImage || undefined, customName.trim() || undefined, buildCombinedVariantText(), customImage2 || undefined, customName2.trim() || undefined);
    // Buy Now also lands on the full /cart page now, same as Add to Cart -
    // checkout only ever starts from the cart's own "Proceed to Checkout"
    // button, so the customer always sees the full order (offers, "You may
    // also like", everything) before paying, regardless of which button
    // they tapped on the product page.
    openDrawer();
  };

  const handleModelChange = (m: string) => {
    setModel(m);
    setSelectedBrand(hasModelRestriction ? (product.brand as string) : (modelToBrand[m] || ""));
    setModelError(false);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  return (
    <div className="py-4 sm:py-10 bg-white font-sans min-h-screen">
      <div className="max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-20">

        {/* Back */}
        <div className="mb-5">
          <Link
            to={collections.find((c) => c.id === product.collectionId)?.slug ? `/collections/${collections.find((c) => c.id === product.collectionId)?.slug}` : "/collections"}
            aria-label="Back"
            className="w-10 h-10 sm:w-8 sm:h-8 rounded-lg border border-zinc-200 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 transition-all inline-flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">

          {/* Gallery */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="lg:sticky lg:top-28 w-full space-y-4">
              <div
                className="bg-zinc-100/40 rounded-3xl w-full mx-auto flex items-center justify-center relative overflow-hidden border border-zinc-100"
                style={{ aspectRatio: "1/1", maxHeight: "520px", maxWidth: "520px" }}
                onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
                onTouchEnd={(e) => {
                  if (touchStartX.current === null || !product.images || product.images.length < 2) return;
                  const deltaX = e.changedTouches[0].clientX - touchStartX.current;
                  const SWIPE_THRESHOLD = 40;
                  if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
                    const goingLeft = deltaX < 0;
                    setActiveImg((prev) => {
                      const len = product.images.length;
                      if (goingLeft) return (prev + 1) % len; // swipe left -> next
                      return (prev - 1 + len) % len; // swipe right -> prev
                    });
                  }
                  touchStartX.current = null;
                }}
              >
                {product.images?.[activeImg] ? (
                  isVideoFile(product.images[activeImg]) ? (
                    <video
                      key={activeImg}
                      src={api.imageUrl(product.images[activeImg])}
                      className="w-full h-full object-cover rounded-3xl select-none"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      key={activeImg}
                      src={api.imageUrl(product.images[activeImg])}
                      alt={product.title}
                      className="w-full h-full object-cover rounded-3xl select-none"
                      draggable={false}
                      loading={activeImg === 0 ? "eager" : "lazy"}
                      // @ts-ignore - fetchpriority isn't in older React DOM typings yet
                      fetchpriority={activeImg === 0 ? "high" : undefined}
                      decoding="async"
                      onError={(e) => {
                        const el = e.currentTarget;
                        el.onerror = null;
                        el.style.display = "none";
                        el.parentElement?.insertAdjacentHTML(
                          "beforeend",
                          '<div class="w-full h-full flex items-center justify-center text-zinc-400">No image</div>'
                        );
                      }}
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-400">No image</div>
                )}

                {product.images?.length > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="Previous image"
                      onClick={() =>
                        setActiveImg((prev) => (prev - 1 + product.images.length) % product.images.length)
                      }
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-8 sm:h-8 text-zinc-500/70 hover:text-zinc-900 flex items-center justify-center transition-colors"
                    >
                      <ChevronLeft className="w-6 h-6" strokeWidth={2} />
                    </button>
                    <button
                      type="button"
                      aria-label="Next image"
                      onClick={() =>
                        setActiveImg((prev) => (prev + 1) % product.images.length)
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-8 sm:h-8 text-zinc-500/70 hover:text-zinc-900 flex items-center justify-center transition-colors"
                    >
                      <ChevronRight className="w-6 h-6" strokeWidth={2} />
                    </button>

                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-white/70 backdrop-blur text-[11px] font-medium text-zinc-600 tabular-nums">
                      {activeImg + 1}/{product.images.length}
                    </div>
                  </>
                )}

              </div>

              {product.images?.length > 1 && (
                <div className="flex sm:justify-center gap-3 w-full overflow-x-auto scrollbar-none px-0.5 -mx-0.5 snap-x snap-mandatory">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={`w-16 h-16 shrink-0 snap-start bg-zinc-100/40 rounded-2xl overflow-hidden flex items-center justify-center transition-all hover:scale-105 ${
                        i === activeImg ? "ring-2 ring-zinc-900 opacity-100" : "opacity-70 hover:opacity-100"
                      }`}
                    >
                      {isVideoFile(img) ? (
                        <video
                          src={`${api.imageUrl(img)}#t=0.1`}
                          muted
                          playsInline
                          preload="metadata"
                          className="w-full h-full object-cover rounded-2xl"
                        />
                      ) : (
                        <img
                          src={api.thumbUrl(img, 160)}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover rounded-2xl"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.style.opacity = "0.2";
                          }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}

            </div>
          </div>

          {/* Details / Buy box */}
          <div className="lg:col-span-6 space-y-7">
            <div className="space-y-3">
              <h1 className="text-2xl md:text-3xl tracking-tight font-black text-zinc-900 leading-tight">
                {product.title}
              </h1>
            </div>

            <div className="py-1 space-y-1">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-3xl font-black text-zinc-900">₹{product.price + gelSurcharge}</span>
                  {gelSurcharge > 0 && (
                    <span className="text-[10px] font-bold text-amber-600 uppercase">incl. +₹{gelSurcharge} plate</span>
                  )}
                  {hasDiscount && (
                    <>
                      <span className="text-lg line-through text-zinc-400 font-medium">₹{product.comparePrice}</span>
                      <span className="text-emerald-600 text-sm font-bold">{discountPct}% off</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {currentOffer && (
                    <span className="inline-flex items-center gap-1 bg-amber-400 text-black text-[10px] sm:text-[11px] font-black uppercase tracking-wide px-2.5 py-1.5 rounded-full whitespace-nowrap">
                      <Zap className="w-3 h-3 shrink-0" />
                      {currentOffer.badgeText}
                    </span>
                  )}
                  <button
                    onClick={handleShare}
                    aria-label="Share"
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                      shareCopied ? "bg-emerald-500 text-white border-emerald-500" : "text-zinc-900 hover:text-white hover:bg-zinc-900 bg-transparent border-zinc-900"
                    }`}
                  >
                    {shareCopied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <p className="text-xs font-medium text-zinc-400">Free shipping within Tamil Nadu only. Additional charges (Door Delivery) apply for other states.</p>
            </div>

            <div className={`space-y-3 rounded-2xl p-4 bg-zinc-50 border border-zinc-200 ${modelError ? "ring-1 ring-red-400" : ""}`}>
              <div className="flex items-center gap-2 font-bold text-zinc-900">
                <span className="text-xs tracking-wider uppercase font-black">Choose Your Phone Model</span>
              </div>
              <SearchableSelect
                value={model}
                onChange={handleModelChange}
                options={availableModels}
                placeholder="-- Choose your phone model --"
                searchPlaceholder="Search your phone model..."
                error={modelError && !model}
              />
              {modelError && <p className="text-red-500 text-[11px] font-bold">Please select your phone model</p>}
              <p className="text-[11px] text-zinc-500 font-medium">
                If your model is not found, kindly message us on WhatsApp.
              </p>
            </div>

            {isGelCase && (
              <div className={`space-y-3 rounded-2xl p-4 bg-zinc-50 border border-zinc-200 ${gelPlateError ? "ring-1 ring-red-400" : ""}`}>
                <div className="flex items-center gap-2 font-bold text-zinc-900">
                  <span className="text-xs tracking-wider uppercase font-black">If any Text need Type Here</span>
                  <span className="text-[10px] font-semibold tracking-wide text-zinc-400 normal-case">(optional)</span>
                </div>
                <input
                  type="text"
                  value={gelPlateText}
                  maxLength={20}
                  onChange={(e) => { setGelPlateText(e.target.value); setGelPlateError(false); }}
                  placeholder="Type name / word to personalize (optional)"
                  className={`w-full bg-white border rounded-xl px-3.5 py-3 text-xs font-bold text-zinc-900 outline-none focus:ring-1 focus:ring-zinc-900 ${gelPlateError ? "border-red-400" : "border-zinc-200 focus:border-zinc-900"}`}
                />
                <p className="text-xs font-bold text-zinc-900">
                  Text: <span className="font-semibold text-zinc-600">Gold Plate / Print</span>
                  {gelPlateStyle === "plate" && <span className="text-amber-600"> (+₹{GEL_TEXT_PLATE_SURCHARGE})</span>}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setGelPlateStyle(gelPlateStyle === "plate" ? "" : "plate"); setGelPlateError(false); }}
                    title={`Gold Plate (+₹${GEL_TEXT_PLATE_SURCHARGE})`}
                    className={`w-[54px] h-[54px] shrink-0 rounded-lg border-2 overflow-hidden bg-white flex items-center justify-center transition-all cursor-pointer ${gelPlateStyle === "plate" ? "border-zinc-900" : "border-zinc-200 hover:border-zinc-400"}`}
                  >
                    <img src={gelTextPlateImg} alt="Gold Plate" className="w-full h-full object-contain p-1" />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setGelPlateStyle(gelPlateStyle === "image" ? "" : "image"); setGelPlateError(false); }}
                    title="Print (Free)"
                    className={`w-[54px] h-[54px] shrink-0 rounded-lg border-2 overflow-hidden bg-white flex items-center justify-center transition-all cursor-pointer ${gelPlateStyle === "image" ? "border-zinc-900" : "border-zinc-200 hover:border-zinc-400"}`}
                  >
                    <img src={gelTextPrintImg} alt="Print" className="w-full h-full object-contain p-1" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500">
                  <span className="w-[54px] text-center">Gold Plate</span>
                  <span className="w-[54px] text-center">Print</span>
                </div>
                {gelPlateError && (
                  <p className="text-red-500 text-[11px] font-bold">Please type the text you want on the {gelPlateStyle === "plate" ? "Gold Plate" : "Print"}</p>
                )}
              </div>
            )}

            {activeVariantGroup && (
              <div className={`space-y-3 rounded-2xl p-4 bg-zinc-50 border border-zinc-200 ${variantError && !selectedVariantOptionObj ? "ring-1 ring-red-400" : ""}`}>
                <div className="flex items-center gap-2 font-bold text-zinc-900">
                  <span className="text-xs tracking-wider uppercase font-black">{activeVariantGroup.name}</span>
                  {activeVariantGroup.required === false && (
                    <span className="text-[10px] font-semibold tracking-wide text-zinc-400 normal-case">(optional)</span>
                  )}
                </div>
                <select
                  value={selectedVariantOption}
                  onChange={(e) => {
                    setSelectedVariantOption(e.target.value);
                    setVariantError(false);
                    if (!activeVariantGroup.options.find((o) => o.id === e.target.value)?.isCustomText) setVariantCustomText("");
                  }}
                  className={`w-full bg-white border rounded-xl px-3.5 py-3 text-xs font-bold text-zinc-900 outline-none focus:ring-1 focus:ring-zinc-900 ${variantError && !selectedVariantOptionObj ? "border-red-400" : "border-zinc-200 focus:border-zinc-900"}`}
                >
                  <option value="">
                    {activeVariantGroup.required === false
                      ? `-- Choose ${activeVariantGroup.name} (optional) --`
                      : `-- Choose ${activeVariantGroup.name} --`}
                  </option>
                  {activeVariantGroup.options.map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
                {variantError && !selectedVariantOptionObj && (
                  <p className="text-red-500 text-[11px] font-bold">Please select an option</p>
                )}
                {variantNeedsCustomText && (
                  <>
                    <input
                      type="text"
                      value={variantCustomText}
                      maxLength={80}
                      onChange={(e) => { setVariantCustomText(e.target.value); setVariantError(false); }}
                      placeholder="Type your own text here"
                      className={`w-full bg-white border rounded-xl px-3.5 py-3 text-xs font-bold text-zinc-900 outline-none focus:ring-1 focus:ring-zinc-900 ${variantError && !variantCustomText.trim() ? "border-red-400" : "border-zinc-200 focus:border-zinc-900"}`}
                    />
                    {variantError && !variantCustomText.trim() && (
                      <p className="text-red-500 text-[11px] font-bold">Please type your text</p>
                    )}
                  </>
                )}
              </div>
            )}

            {isCustomizable && !isMagicCase && (
              <div className={`space-y-3 glass rounded-2xl p-4 ${photoError ? "ring-1 ring-red-400" : ""}`}>
                <div className="flex items-center gap-2 font-bold text-zinc-900">
                  <ImagePlus className="w-4 h-4" />
                  <span className="text-xs tracking-wider uppercase font-black">Upload Your Photo</span>
                </div>
                <p className="text-[11px] text-zinc-500 font-medium -mt-1">
                  This is a customized product — upload the photo or video you'd like printed on it.
                </p>

                {!customPreview ? (
                  <label className="glass-pill flex flex-col items-center justify-center gap-2 rounded-2xl py-8 cursor-pointer text-zinc-500 hover:text-zinc-900">
                    <ImagePlus className="w-6 h-6" />
                    <span className="text-xs font-bold">Tap to choose a photo or video</span>
                    <span className="text-[10px] text-zinc-400">JPG/PNG up to 5MB, or a 1:1 (square) video up to 60MB</span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={(e) => handlePhotoSelect(e.target.files?.[0] || null)}
                    />
                  </label>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden glass shrink-0">
                      {customIsVideo ? (
                        <video src={customPreview} className="w-full h-full object-cover" muted playsInline />
                      ) : (
                        <img src={customPreview} alt="Your upload" className="w-full h-full object-cover" />
                      )}
                      {uploadingPhoto && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 text-zinc-900 animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {uploadingPhoto ? (
                        <p className="text-xs font-bold text-zinc-500">Uploading…</p>
                      ) : customImage ? (
                        <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {customIsVideo ? "Video" : "Photo"} ready to print
                        </p>
                      ) : null}
                      <button
                        onClick={removePhoto}
                        className="mt-1.5 text-[11px] font-bold text-zinc-500 hover:text-red-500 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3 h-3" /> Remove & choose another
                      </button>
                    </div>
                  </div>
                )}

                {uploadError && <p className="text-red-500 text-[11px] font-bold">{uploadError}</p>}
                {photoError && !uploadError && (
                  <p className="text-red-500 text-[11px] font-bold">Please upload your photo to continue</p>
                )}
              </div>
            )}

            {isMagicCase && (
              <div className="space-y-4 glass rounded-2xl p-4">
                <div className="flex items-center gap-2 font-bold text-zinc-900">
                  <ImagePlus className="w-4 h-4" />
                  <span className="text-xs tracking-wider uppercase font-black">Upload Your 2 Photos</span>
                </div>
                <p className="text-[11px] text-zinc-500 font-medium -mt-1">
                  This Magic Case needs 2 photos to print — both are required.
                </p>

                {([
                  { n: 1, preview: customPreview, image: customImage, uploading: uploadingPhoto, error: uploadError, photoErr: photoError, select: handlePhotoSelect, remove: removePhoto },
                  { n: 2, preview: customPreview2, image: customImage2, uploading: uploadingPhoto2, error: uploadError2, photoErr: photoError2, select: handlePhotoSelect2, remove: removePhoto2 },
                ] as const).map((slot) => (
                  <div key={slot.n} className={`space-y-2 rounded-2xl p-3 border ${slot.photoErr ? "border-red-400" : "border-zinc-200"}`}>
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide">Photo {slot.n}</span>
                    {!slot.preview ? (
                      <label className="glass-pill flex flex-col items-center justify-center gap-2 rounded-2xl py-6 cursor-pointer text-zinc-500 hover:text-zinc-900">
                        <ImagePlus className="w-5 h-5" />
                        <span className="text-xs font-bold">Tap to choose photo {slot.n}</span>
                        <span className="text-[10px] text-zinc-400">JPG or PNG, up to 5MB</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => slot.select(e.target.files?.[0] || null)}
                        />
                      </label>
                    ) : (
                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 rounded-2xl overflow-hidden glass shrink-0">
                          <img src={slot.preview} alt={`Your upload ${slot.n}`} className="w-full h-full object-cover" />
                          {slot.uploading && (
                            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                              <Loader2 className="w-4 h-4 text-zinc-900 animate-spin" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          {slot.uploading ? (
                            <p className="text-xs font-bold text-zinc-500">Uploading…</p>
                          ) : slot.image ? (
                            <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Photo ready to print
                            </p>
                          ) : null}
                          <button
                            onClick={slot.remove}
                            className="mt-1.5 text-[11px] font-bold text-zinc-500 hover:text-red-500 inline-flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3 h-3" /> Remove & choose another
                          </button>
                        </div>
                      </div>
                    )}
                    {slot.error && <p className="text-red-500 text-[11px] font-bold">{slot.error}</p>}
                    {slot.photoErr && !slot.error && (
                      <p className="text-red-500 text-[11px] font-bold">Please upload photo {slot.n} to continue</p>
                    )}
                  </div>
                ))}

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs tracking-wider uppercase font-black text-zinc-900 block">
                      Text 1 <span className="text-zinc-400 normal-case font-semibold">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={customName}
                      maxLength={40}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="e.g. Priya"
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-3 text-xs font-bold text-zinc-900 outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs tracking-wider uppercase font-black text-zinc-900 block">
                      Text 2 <span className="text-zinc-400 normal-case font-semibold">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={customName2}
                      maxLength={40}
                      onChange={(e) => setCustomName2(e.target.value)}
                      placeholder="e.g. Kumar"
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-3 text-xs font-bold text-zinc-900 outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {requiresName && !isMagicCase && (
              <div className="space-y-2 glass rounded-2xl p-4">
                <label className="text-xs tracking-wider uppercase font-black text-zinc-900 block">
                  Name to Print <span className="text-zinc-400 normal-case font-semibold">(optional)</span>
                </label>
                <p className="text-[11px] text-zinc-500 font-medium -mt-1">
                  Want a name printed on this product? Type it below — leave it blank to skip.
                </p>
                <input
                  type="text"
                  value={customName}
                  maxLength={40}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Priya"
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-3 text-xs font-bold text-zinc-900 outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={handleAdd} className="flex-1 glass-btn-grey text-white font-black text-sm py-3.5 rounded-full cursor-pointer">
                Add to Cart
              </button>
              <button onClick={handleBuyNow} className="flex-1 glass-btn-gold font-black text-sm py-3.5 rounded-full cursor-pointer">
                Buy Now
              </button>
            </div>

            {(() => {
              const matInfo = product.material ? materialDescriptions[product.material] : undefined;
              const hasMatInfo = !!(matInfo && (matInfo.para1 || matInfo.para2 || matInfo.image));
              const matProductDesc = product.material ? materialProductDescriptions[product.material] : undefined;
              const displayDescription = matProductDesc?.trim() ? matProductDesc : product.description;
              return (
                <div className="pt-2 space-y-5">
                  <p className="text-zinc-600 text-sm whitespace-pre-line leading-relaxed">{displayDescription}</p>

                  {hasMatInfo && (
                    <div className="pt-4 border-t border-zinc-100">
                      <h3 className="text-xs font-black uppercase tracking-wide text-zinc-900 mb-3">Material Details</h3>
                      <div className="space-y-4">
                        {matInfo?.para1 && (
                          <div className="flex flex-row gap-4 items-start">
                            {matInfo.image && (
                              <img
                                src={api.imageUrl(matInfo.image)}
                                alt={`${product.material} material`}
                                className="w-1/2 max-w-[220px] rounded-xl object-cover shrink-0"
                                loading="lazy"
                              />
                            )}
                            <p className="text-zinc-600 text-sm whitespace-pre-line leading-relaxed flex-1">{matInfo.para1}</p>
                          </div>
                        )}
                        {matInfo?.para2 && (
                          <p className="text-zinc-600 text-sm whitespace-pre-line leading-relaxed">{matInfo.para2}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          <ProductReviews productId={product.id} />

          {related.length > 0 && (
            <div className="lg:col-span-12 mt-6 pt-8 border-t border-zinc-100">
              <h2 className="text-lg font-black text-zinc-900 mb-4 uppercase tracking-tight">You may also like</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {related.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
