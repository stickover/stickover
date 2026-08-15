import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { api, API_URL } from "../../utils/api";
import { defaultOffers, Offer } from "../../utils/useOffers";
import { Product, Collection, Order, Customer, Banner, Material, MATERIAL_PRICING, MATERIAL_OPTIONS, SiteReview, ProductReview, ReviewStory } from "../../types";
import { LayoutGrid, Boxes, Package, LogOut, X, LayoutDashboard, HelpCircle, Smartphone, FileText, Settings as SettingsIcon, Copy, MessageCircle, Menu, Plus, Users, Star, IndianRupee, Clock3, Eye, BarChart3, Download, Upload, TrendingUp, Award, Repeat, Wrench, GripVertical, Layers, Palette, Brush, Truck, ShieldCheck, Headphones, Images, Trash2, Search, ShoppingCart, ArrowDownAZ, ListFilter, ZoomIn, Percent, Zap, RefreshCw } from "lucide-react";
import { DEFAULT_BRAND_MODELS } from "../../utils/brandModels";
import { AdminToastProvider, useToast } from "../../context/AdminToastContext";
import BrandLogo from "../../components/BrandLogo";
import { DEFAULT_HOME_SECTIONS, HOME_SECTION_LABELS, DEFAULT_FEATURE_BAR, FEATURE_BAR_ICON_MAP } from "../Home";
import { DEFAULT_TESTIMONIALS, Testimonial } from "../../components/CustomerReviews";
import ImageCropModal from "../../components/admin/ImageCropModal";
import DragReorderList from "../../components/admin/DragReorderList";
import { applyTheme, PAGE_TRANSITIONS } from "../../utils/theme";

const TABS = ["Overview", "Visitors", "Reports", "Orders", "Customers", "Abandoned Checkouts", "Products", "Pricing", "Material Details", "Collections", "Phone Models", "Variant Options", "Home Page", "Website Content", "Discounts", "Reviews", "Themes", "FAQs", "File Manager", "Settings"] as const;
type Tab = (typeof TABS)[number];
const TAB_ICONS: Record<Tab, any> = {
  Overview: LayoutDashboard,
  Visitors: Eye,
  Reports: BarChart3,
  Orders: Package,
  Customers: Users,
  "Abandoned Checkouts": ShoppingCart,
  Products: Boxes,
  Pricing: IndianRupee,
  "Material Details": FileText,
  Collections: Layers,
  "Phone Models": Smartphone,
  "Variant Options": ListFilter,
  "Home Page": LayoutGrid,
  "Website Content": FileText,
  Discounts: Percent,
  Reviews: Star,
  Themes: Brush,
  FAQs: HelpCircle,
  "File Manager": Images,
  Settings: Wrench,
};

// Sidebar is grouped into 5 main tools, each with its own sub-tools, so
// related pages sit together instead of one long flat list.
const NAV_GROUPS: { label: string; tabs: Tab[] }[] = [
  { label: "Dashboard", tabs: ["Overview", "Visitors", "Reports"] },
  { label: "Sales", tabs: ["Orders", "Customers", "Abandoned Checkouts"] },
  { label: "Catalog", tabs: ["Products", "Pricing", "Material Details", "Collections", "Phone Models", "Variant Options"] },
  { label: "Website", tabs: ["Home Page", "Website Content", "Discounts", "Reviews", "Themes", "FAQs", "File Manager"] },
];

const FEATURE_ICON_OPTIONS: { key: string; label: string }[] = [
  { key: "truck", label: "Truck (shipping)" },
  { key: "shield", label: "Shield (quality/security)" },
  { key: "headphones", label: "Headphones (support)" },
  { key: "star", label: "Star (rating)" },
  { key: "award", label: "Award (badge)" },
  { key: "package", label: "Package (order)" },
  { key: "clock", label: "Clock (fast dispatch)" },
  { key: "message", label: "Message (chat/support)" },
  { key: "users", label: "Users (customers)" },
  { key: "rupee", label: "Rupee (payment)" },
];

// feature: live order notification bell (polls unseen count, badges Orders nav)
// Red dot on the Orders sidebar tab: stays lit as long as at least one order
// is still "pending" — it only goes away once each order is moved to
// Processing (or further), not just because the admin opened the tab.
function usePendingOrdersCount() {
  const [pending, setPending] = useState(0);

  const refresh = async () => {
    try {
      const r = await api.getAuth("/api/orders/notifications/unseen-count");
      setPending(r?.count || 0);
    } catch {
      /* silent - admin may be mid-login */
    }
  };

  useEffect(() => {
    refresh();
    const iv = setInterval(refresh, 20000); // poll every 20s
    return () => clearInterval(iv);
  }, []);

  return pending;
}

export default function AdminDashboard() {
  return (
    <AdminToastProvider>
      <AdminDashboardInner />
    </AdminToastProvider>
  );
}

function AdminDashboardInner() {
  const [tab, setTab] = useState<Tab>("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const pendingOrders = usePendingOrdersCount();

  // Auth is now enforced by RequireAdminAuth in App.tsx *before* this component
  // ever mounts, so no separate check is needed here.

  const logout = () => {
    sessionStorage.removeItem("stickover_admin_token");
    navigate("/admin/login");
  };

  const selectTab = (t: Tab) => {
    setTab(t);
    setSidebarOpen(false);
  };

  const NavItem = ({ t }: { t: Tab }) => {
    const Icon = TAB_ICONS[t];
    const showBadge = t === "Orders" && pendingOrders > 0;
    const active = tab === t;
    return (
      <button
        key={t}
        onClick={() => selectTab(t)}
        className={`group relative w-full flex items-center gap-3 pl-3.5 pr-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          active ? "btn-liquid-dark !justify-start !rounded-lg" : "text-[#494c50] hover:bg-[#f1f1f1] hover:text-[#202223]"
        }`}
      >
        <span className="relative shrink-0">
          <Icon size={17} strokeWidth={2} className={active ? "text-white" : undefined} />
          {showBadge && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-[#f7f7f7]" />
          )}
        </span>
        <span className={`truncate ${active ? "text-white" : ""}`}>{t}</span>
      </button>
    );
  };

  const SidebarContent = () => (
    <>
      <div className="px-2.5 mb-4 md:hidden">
        <BrandLogo markClassName="h-8 w-8" textClassName="text-base" gap="gap-1.5" />
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto admin-sidebar-scroll">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3.5 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">{group.label}</p>
            <div className="space-y-0.5">
              {group.tabs.map((t) => <NavItem key={t} t={t} />)}
            </div>
          </div>
        ))}
        {/* Settings stands alone as the 5th main tool — no sub-tools underneath it */}
        <div>
          <div className="space-y-0.5">
            <NavItem t="Settings" />
          </div>
        </div>
      </nav>
      <div className="pt-3 mt-3 border-t border-zinc-200">
        <button onClick={logout} className="w-full flex items-center gap-3 pl-3.5 pr-3 py-2.5 rounded-lg text-sm font-medium text-zinc-500 hover:bg-red-50 hover:text-red-600 transition-colors">
          <LogOut size={17} /> Log out
        </button>
      </div>
    </>
  );

  return (
    <div className="h-screen flex flex-col w-full overflow-hidden bg-[#f1f1f1]">
      {/* Shopify-style black topbar — fixed, never scrolls away */}
      <div className="h-14 bg-[#1a1a1a] flex items-center gap-3 px-3 md:px-4 shrink-0">
        <button onClick={() => setSidebarOpen(true)} className="md:hidden shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-white/80 hover:bg-white/10">
          <Menu size={18} />
        </button>
        <div className="flex items-center gap-2">
          <BrandLogo markClassName="h-7 w-7" textClassName="text-sm" textColorClassName="text-white" gap="gap-1.5" />
        </div>
        <div className="flex-1" />
      </div>

      <div className="flex-1 flex w-full min-h-0">
        {/* Sidebar - desktop: fixed height, own scroll, never moves while page content scrolls */}
        <aside className="w-60 shrink-0 bg-[#f7f7f7] py-4 px-2.5 hidden md:flex flex-col h-full border-r border-[#e1e3e5]">
          <SidebarContent />
        </aside>

        {/* Sidebar - mobile drawer */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-40 flex">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
            <aside className="relative w-72 max-w-[82vw] bg-[#f7f7f7] h-full py-6 px-3 flex flex-col shadow-2xl">
              <button onClick={() => setSidebarOpen(false)} className="absolute top-6 right-3 p-1 text-zinc-400 hover:text-zinc-700">
                <X size={20} />
              </button>
              <SidebarContent />
            </aside>
          </div>
        )}

        {/* Main column - only this scrolls */}
        <div className="flex-1 min-w-0 flex flex-col overflow-y-auto overflow-x-hidden">
          {/* Page title bar */}
          <div className="px-3 md:px-6 pt-5 pb-2 flex items-center justify-between gap-3">
            <h2 className="text-xl md:text-2xl font-bold text-[#202223] truncate">{tab}</h2>
          </div>

          {/* Content */}
          <main className="flex-1 w-full px-3 md:px-6 py-4 pb-24 md:pb-8 max-w-[1800px]">
          {tab === "Overview" && <DashboardTab />}
          {tab === "Visitors" && <VisitorsTab />}
          {tab === "Reports" && <ReportsTab />}
          {tab === "Orders" && <OrdersTab />}
          {tab === "Customers" && <CustomersTab />}
          {tab === "Abandoned Checkouts" && <AbandonedCheckoutsTab />}
          {tab === "Products" && <ProductsTab />}
          {tab === "Pricing" && <PricingTab />}
          {tab === "Material Details" && <MaterialDetailsTab />}
          {tab === "Collections" && <CollectionsTab />}
          {tab === "Phone Models" && <PhoneModelsTab />}
          {tab === "Variant Options" && <VariantOptionsTab />}
          {tab === "Home Page" && <HomePageTab />}
          {tab === "Website Content" && <WebsiteContentIntegratedTab />}
          {tab === "Discounts" && <DiscountsTab />}
          {tab === "Reviews" && <ReviewsTab />}
          {tab === "Themes" && <ThemesTab />}
          {tab === "FAQs" && <FAQsTab />}
          {tab === "File Manager" && <FileManagerTab />}
          {tab === "Settings" && <SettingsTab />}
          </main>
        </div>
      </div>

      {/* Mobile floating pill tab bar — iOS 26 style, primary tabs only, rest via drawer */}
      <div
        className="md:hidden fixed bottom-0 inset-x-0 z-30 flex items-center gap-2 px-3"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 14px)" }}
      >
        <div className="flex-1 flex items-center gap-1 bg-white/90 backdrop-blur-2xl rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-zinc-200 px-1.5 py-1.5">
          {(["Overview", "Products", "Orders", "Collections"] as Tab[]).map((t) => {
            const Icon = TAB_ICONS[t];
            const active = tab === t;
            const showBadge = t === "Orders" && pendingOrders > 0;
            return (
              <button
                key={t}
                onClick={() => selectTab(t)}
                aria-label={t}
                className={`relative flex-1 flex items-center justify-center overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] py-2.5 rounded-full ${
                  active
                    ? "btn-liquid-dark !rounded-full"
                    : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 active:scale-90"
                }`}
              >
                <span className="relative shrink-0">
                  <Icon size={19} strokeWidth={active ? 2.4 : 2} className={active ? "text-white" : undefined} />
                  {showBadge && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="More"
          className="shrink-0 w-[46px] h-[46px] rounded-full bg-white/90 backdrop-blur-2xl text-zinc-700 border border-zinc-200 flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.12)] active:scale-90 transition-transform duration-200"
        >
          <LayoutGrid size={19} />
        </button>
      </div>
    </div>
  );
}

// shared field classes — Shopify admin visual language (black actions, square-ish
// radii, #e1e3e5 hairline borders, #6d7175 secondary text)
const inputCls = "w-full bg-white border border-[#c9cccf] focus:border-[#458fff] focus:ring-2 focus:ring-[#458fff]/20 rounded-lg px-3 py-2 text-[#202223] text-sm outline-none transition-all duration-150";
const btnPrimary = "btn-liquid-dark active:scale-[0.97] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#458fff]";
const btnGhost = "text-[#3f4144] hover:text-[#202223] active:opacity-70 text-sm font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const card = "bg-white border border-[#e1e3e5] rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04)]";
// Shopify-style secondary ("More actions") button
const btnSecondary = "btn-liquid-light active:scale-[0.97] text-[#202223] px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#458fff]";
// Table shell + header + row helpers used to match Shopify's Orders/Products list look
const tableWrap = "bg-white border border-[#e1e3e5] rounded-xl overflow-hidden";
const thCls = "text-left text-[12px] font-semibold text-[#6d7175] px-4 py-3 border-b border-[#e1e3e5] whitespace-nowrap";
const tdCls = "px-4 py-3 text-sm text-[#202223] border-b border-[#f1f2f3] whitespace-nowrap";
const trHover = "hover:bg-[#f6f6f7] transition-colors duration-150 cursor-pointer";
// Shopify status pill colours (payment/fulfillment style badges)
function statusPill(tone: "success" | "warning" | "info" | "neutral" | "critical" = "neutral") {
  const map: Record<string, string> = {
    success: "bg-[#aee9d1] text-[#0c5132]",
    warning: "bg-[#ffd79d] text-[#8a5a00]",
    info: "bg-[#b4e1fa] text-[#08476b]",
    neutral: "bg-[#e4e5e7] text-[#3f4144]",
    critical: "bg-[#fed3d1] text-[#8e0000]",
  };
  return `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium ${map[tone]}`;
}
// Default description used to pre-fill every new product (matches backend fallback in products.js)
const DEFAULT_PRODUCT_DESCRIPTION =
  "Protect your phone with confidence using our Premium Mobile Case, crafted from high-quality materials for long-lasting durability. Designed with reinforced edge protection, it absorbs shocks and helps safeguard your device from accidental drops and impacts. The precise fit ensures easy access to all buttons and ports while maintaining a sleek, stylish look. Its anti-slip grip offers comfortable handling and added security in everyday use. Built for both protection and elegance, this case keeps your phone safe without compromising on style.";

// ---------------- Products ----------------
const MAX_PRODUCT_IMAGES = 5;

function ProductsTab() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [materialModels, setMaterialModels] = useState<Record<string, Record<string, string[]>>>({});
  const [variantGroups, setVariantGroups] = useState<VariantGroupRow[]>([]);
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]); // feature 17: bulk product actions
  const [bulkBusy, setBulkBusy] = useState(false);
  const [sectionModal, setSectionModal] = useState<"trending" | "bestSeller" | null>(null);
  const [sectionBusy, setSectionBusy] = useState(false);
  const [autoFillBusy, setAutoFillBusy] = useState(false);

  const load = async () => {
    const [p, c, s] = await Promise.all([api.get("/api/products"), api.get("/api/collections"), api.get("/api/settings").catch(() => null)]);
    setProducts(p);
    setCollections(c);
    // Phone models are scoped per Material (Acrylic/Gold/Hard Plastic/Glass).
    // Same fallback chain as the Phone Models admin tab: prefer the new
    // per-material map, fall back to the old flat list (or the built-in
    // default catalog) for any material that hasn't been customized yet.
    const legacyFlat = s?.brandModels && Object.keys(s.brandModels).length ? s.brandModels : DEFAULT_BRAND_MODELS;
    const perMaterial = s?.materialBrandModels && Object.keys(s.materialBrandModels).length ? s.materialBrandModels : {};
    const merged: Record<string, Record<string, string[]>> = {};
    MATERIAL_OPTIONS.forEach((m) => {
      merged[m] = perMaterial[m] && Object.keys(perMaterial[m]).length ? perMaterial[m] : legacyFlat;
    });
    setMaterialModels(merged);
    setVariantGroups(Array.isArray(s?.variantGroups) ? s.variantGroups : []);
  };
  useEffect(() => { load(); }, []);

  // Brand & Model choices for the product currently being edited, scoped to
  // whichever Material is selected on that product.
  const brandModels = materialModels[editing?.material || ""] || {};

  const save = async () => {
    if (!editing || !editing.title) return;
    setSaving(true);
    try {
      if (editing.id) await api.put(`/api/products/${editing.id}`, editing);
      else await api.post("/api/products", editing, true);
      showToast(editing.id ? "Product updated" : "Product added", "success");
      setEditing(null);
      await load();
    } catch (err: any) {
      showToast(err.message || "Failed to save product", "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      await api.del(`/api/products/${id}`);
      showToast("Product deleted", "success");
      load();
    } catch (err: any) {
      showToast(err.message || "Failed to delete product", "error");
    }
  };

  // Product images go through the square Crop tool before upload — the admin
  // can select any photo (any aspect ratio) and crop it to a centered 1:1
  // square (adjustable) instead of being rejected outright. Multiple selected
  // files are queued and cropped one at a time.
  const [cropQueue, setCropQueue] = useState<File[]>([]);

  const enqueueForCrop = (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    setCropQueue((q) => [...q, ...list]);
  };

  const uploadImage = (file: File) => enqueueForCrop([file]);
  const uploadImages = (files: FileList | File[]) => enqueueForCrop(files);

  // Videos skip the square-crop tool (cropping a video isn't supported) and
  // upload straight through — same slot/order as photos in the images array.
  const uploadProductVideo = async (file: File) => {
    let full = false;
    setEditing((p) => {
      full = (p?.images || []).length >= MAX_PRODUCT_IMAGES;
      return p;
    });
    if (full) {
      showToast(`Max ${MAX_PRODUCT_IMAGES} images/videos allowed`, "error");
      return;
    }
    setUploading(true);
    try {
      const res = await api.upload(file);
      setEditing((p) => ({ ...p, images: [...(p?.images || []), res.url].slice(0, MAX_PRODUCT_IMAGES) }));
    } catch (err: any) {
      showToast(err.message || `Upload failed for "${file.name}"`, "error");
    } finally {
      setUploading(false);
    }
  };

  // Selecting files for the Product Images grid: photos go through the crop
  // queue as before, videos upload directly (one at a time, no crop step).
  const handleProductMediaSelect = (files: FileList | File[]) => {
    const arr = Array.from(files);
    const images = arr.filter((f) => f.type.startsWith("image/"));
    const videos = arr.filter((f) => f.type.startsWith("video/"));
    if (images.length) enqueueForCrop(images);
    videos.forEach((v) => uploadProductVideo(v));
  };

  const uploadCroppedFile = async (file: File) => {
    let full = false;
    setEditing((p) => {
      full = (p?.images || []).length >= MAX_PRODUCT_IMAGES;
      return p;
    });
    if (full) {
      showToast(`Max ${MAX_PRODUCT_IMAGES} images allowed`, "error");
      return;
    }
    setUploading(true);
    try {
      const res = await api.upload(file);
      setEditing((p) => ({ ...p, images: [...(p?.images || []), res.url].slice(0, MAX_PRODUCT_IMAGES) }));
    } catch (err: any) {
      showToast(err.message || `Upload failed for "${file.name}"`, "error");
    } finally {
      setUploading(false);
    }
  };

  const handleCropConfirm = async (cropped: File) => {
    await uploadCroppedFile(cropped);
    setCropQueue((q) => q.slice(1));
  };
  const handleCropCancel = () => setCropQueue((q) => q.slice(1));

  // Re-crop / re-zoom an image already attached to the product (not a fresh
  // upload). Pull the existing image back down as a File so it can go
  // through the same ImageCropModal, then swap the URL at that index in
  // place on confirm — so re-cropping never changes order or adds a slot.
  const [reCropIndex, setReCropIndex] = useState<number | null>(null);
  const [reCropFile, setReCropFile] = useState<File | null>(null);
  const [reCropBusy, setReCropBusy] = useState(false);

  const startReCrop = async (idx: number) => {
    const img = (editing?.images || [])[idx];
    if (!img) return;
    setReCropBusy(true);
    try {
      const res = await fetch(api.imageUrl(img));
      const blob = await res.blob();
      const name = img.split("/").pop() || `image-${idx}.jpg`;
      setReCropFile(new File([blob], name, { type: blob.type || "image/jpeg" }));
      setReCropIndex(idx);
    } catch {
      showToast("Couldn't load that image for editing", "error");
    } finally {
      setReCropBusy(false);
    }
  };
  const handleReCropCancel = () => {
    setReCropFile(null);
    setReCropIndex(null);
  };
  const handleReCropConfirm = async (cropped: File) => {
    const idx = reCropIndex;
    setReCropFile(null);
    setReCropIndex(null);
    if (idx === null) return;
    setUploading(true);
    try {
      const res = await api.upload(cropped);
      setEditing((p) => {
        const imgs = [...(p?.images || [])];
        imgs[idx] = res.url;
        return { ...p, images: imgs };
      });
    } catch (err: any) {
      showToast(err.message || "Re-crop upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx: number) => {
    setEditing((p) => ({ ...p, images: (p?.images || []).filter((_, i) => i !== idx) }));
  };

  // Drag-to-reorder for the product image grid (pointer events so it works on
  // touch/mobile too). The first image in the array is always shown as "Main"
  // on the storefront, so reordering here changes which photo leads.
  const [dragImgIndex, setDragImgIndex] = useState<number | null>(null);
  const [overImgIndex, setOverImgIndex] = useState<number | null>(null);
  const imgGridRef = useRef<HTMLDivElement>(null);

  const indexFromPoint = (x: number, y: number, count: number) => {
    const grid = imgGridRef.current;
    if (!grid) return null;
    const cells = Array.from(grid.querySelectorAll<HTMLElement>("[data-img-cell]"));
    let closest: number | null = null;
    let closestDist = Infinity;
    cells.forEach((cell, i) => {
      if (i >= count) return;
      const r = cell.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dist = Math.hypot(x - cx, y - cy);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    return closest;
  };

  const handleImgPointerDown = (index: number) => (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setDragImgIndex(index);
    setOverImgIndex(index);
  };

  const handleImgPointerMove = (e: React.PointerEvent) => {
    if (dragImgIndex === null) return;
    const count = (editing?.images || []).length;
    const newOver = indexFromPoint(e.clientX, e.clientY, count);
    if (newOver !== null && newOver !== overImgIndex) {
      setOverImgIndex(newOver);
      setEditing((p) => {
        const imgs = [...(p?.images || [])];
        const [moved] = imgs.splice(dragImgIndex, 1);
        imgs.splice(newOver, 0, moved);
        return { ...p, images: imgs };
      });
      setDragImgIndex(newOver);
    }
  };

  const endImgDrag = () => {
    setDragImgIndex(null);
    setOverImgIndex(null);
  };

  // ---- Trending Now / Best Sell home-page section management ----
  // Each section has its own flag (isTrending / isBestSeller) and its own
  // order field (trendingOrder / bestSellerOrder) so rearranging one section
  // never disturbs the other, or the per-collection display_order.
  const SECTION_CONFIG = {
    trending: { flag: "isTrending" as const, order: "trendingOrder" as const, label: "Trending Now", max: 20 },
    bestSeller: { flag: "isBestSeller" as const, order: "bestSellerOrder" as const, label: "Best Selling", max: 20 },
  };

  const sectionIncluded = (key: "trending" | "bestSeller") => {
    const cfg = SECTION_CONFIG[key];
    return products
      .filter((p) => (p as any)[cfg.flag])
      .sort((a, b) => ((a as any)[cfg.order] ?? 0) - ((b as any)[cfg.order] ?? 0));
  };

  const toggleInSection = async (key: "trending" | "bestSeller", product: Product) => {
    const cfg = SECTION_CONFIG[key];
    const included = sectionIncluded(key);
    const isIn = !!(product as any)[cfg.flag];
    if (!isIn && included.length >= cfg.max) {
      showToast(`Max ${cfg.max} products allowed in ${cfg.label}`, "error");
      return;
    }
    setSectionBusy(true);
    try {
      if (isIn) {
        await api.put(`/api/products/${product.id}`, { ...product, [cfg.flag]: false });
      } else {
        await api.put(`/api/products/${product.id}`, { ...product, [cfg.flag]: true, [cfg.order]: included.length });
      }
      await load();
      showToast(`${cfg.label} updated`, "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update", "error");
    } finally {
      setSectionBusy(false);
    }
  };

  const saveSectionOrder = async (key: "trending" | "bestSeller", next: Product[]) => {
    const cfg = SECTION_CONFIG[key];
    setSectionBusy(true);
    try {
      await Promise.all(next.map((p, i) => api.put(`/api/products/${p.id}`, { ...p, [cfg.order]: i })));
      await load();
    } catch (err: any) {
      showToast(err.message || "Failed to update order", "error");
    } finally {
      setSectionBusy(false);
    }
  };

  // Seeds "Best Sell" from real order history (units sold, all-time), leaving
  // room for the admin to still rearrange or swap items out afterward.
  const autoFillBestSellers = async () => {
    setAutoFillBusy(true);
    try {
      const ranked: { id: string; qty: number }[] = await api.get("/api/analytics/top-selling");
      const top = ranked.slice(0, 20);
      await Promise.all(
        top.map((r, i) => {
          const prod = products.find((p) => p.id === r.id);
          if (!prod) return Promise.resolve();
          return api.put(`/api/products/${r.id}`, { ...prod, isBestSeller: true, bestSellerOrder: i });
        })
      );
      await load();
      showToast("Best Selling filled from sales data", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to auto-fill", "error");
    } finally {
      setAutoFillBusy(false);
    }
  };

  // feature 17: bulk product actions
  const toggleSelect = (id: string) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };
  const toggleSelectAll = () => {
    setSelected((s) => (s.length === products.length ? [] : products.map((p) => p.id)));
  };
  const bulkDelete = async () => {
    if (!selected.length || !confirm(`Delete ${selected.length} selected products?`)) return;
    setBulkBusy(true);
    try {
      await api.post("/api/products/bulk-delete", { ids: selected }, true);
      showToast(`${selected.length} products deleted`, "success");
      setSelected([]);
      await load();
    } catch (err: any) {
      showToast(err.message || "Bulk delete failed", "error");
    } finally {
      setBulkBusy(false);
    }
  };
  const bulkMarkOutOfStock = async () => {
    if (!selected.length) return;
    setBulkBusy(true);
    try {
      await api.post("/api/products/bulk-update", { ids: selected, changes: { stockStatus: "out_of_stock" } }, true);
      showToast(`${selected.length} products marked out of stock`, "success");
      setSelected([]);
      await load();
    } finally {
      setBulkBusy(false);
    }
  };
  const bulkMarkInStock = async () => {
    if (!selected.length) return;
    setBulkBusy(true);
    try {
      await api.post("/api/products/bulk-update", { ids: selected, changes: { stockStatus: "in_stock" } }, true);
      setSelected([]);
      await load();
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <button onClick={() => setEditing({ title: "", price: 0, comparePrice: 0, description: DEFAULT_PRODUCT_DESCRIPTION, images: [], models: [], tags: [] })} className={btnPrimary}>
          + New Product
        </button>
        <button onClick={() => setSectionModal("trending")} className="btn-liquid-light px-4 py-2 rounded-full text-sm font-semibold">
          Manage Trending Now
        </button>
        <button onClick={() => setSectionModal("bestSeller")} className="btn-liquid-light px-4 py-2 rounded-full text-sm font-semibold">
          Manage Best Selling
        </button>
      </div>

      {sectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setSectionModal(null)}>
          <div className={`${card} w-full max-w-lg max-h-[85vh] overflow-y-auto p-6`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-black text-[#202223]">Manage {SECTION_CONFIG[sectionModal].label}</h3>
              <button onClick={() => setSectionModal(null)} className="text-[#8c9196] hover:text-[#202223]"><X size={18} /></button>
            </div>
            <p className="text-xs text-[#8c9196] mb-3">
              Pick up to {SECTION_CONFIG[sectionModal].max} products to show in this home page section, then use the arrows to set the order.
            </p>

            <p className="text-xs font-bold text-[#202223] mb-1.5">Selected ({sectionIncluded(sectionModal).length}/{SECTION_CONFIG[sectionModal].max})</p>
            <div className="mb-4">
              <DragReorderList
                items={sectionIncluded(sectionModal)}
                getKey={(p) => p.id}
                disabled={sectionBusy}
                onReorder={(next) => saveSectionOrder(sectionModal, next)}
                renderItem={(p) => (
                  <div className="flex items-center justify-between bg-[#f6f6f7] border border-[#e1e3e5] rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {p.images?.[0] ? (
                        <img src={api.imageUrl(p.images[0])} className="w-8 h-8 object-cover rounded" />
                      ) : (
                        <div className="w-8 h-8 bg-[#e1e3e5] rounded" />
                      )}
                      <span className="text-sm text-[#202223] truncate">{p.title}</span>
                    </div>
                    <button disabled={sectionBusy} onClick={() => toggleInSection(sectionModal, p)} className="w-7 h-7 flex items-center justify-center rounded border border-[#e1e3e5] text-red-500 hover:bg-white shrink-0"><X size={14} /></button>
                  </div>
                )}
              />
              {sectionIncluded(sectionModal).length === 0 && <p className="text-[#8c9196] text-sm">Nothing selected yet.</p>}
            </div>

            <p className="text-xs font-bold text-[#202223] mb-1.5">Add products</p>
            <div className="space-y-2">
              {products
                .filter((p) => !(p as any)[SECTION_CONFIG[sectionModal].flag])
                .map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-3 py-2 border border-[#e1e3e5] rounded-lg">
                    <div className="flex items-center gap-2 min-w-0">
                      {p.images?.[0] ? (
                        <img src={api.imageUrl(p.images[0])} className="w-8 h-8 object-cover rounded" />
                      ) : (
                        <div className="w-8 h-8 bg-[#f6f6f7] rounded" />
                      )}
                      <span className="text-sm text-[#202223] truncate">{p.title}</span>
                    </div>
                    <button disabled={sectionBusy} onClick={() => toggleInSection(sectionModal, p)} className="text-sm font-medium text-[#202223] hover:underline shrink-0">Add</button>
                  </div>
                ))}
              {products.filter((p) => !(p as any)[SECTION_CONFIG[sectionModal].flag]).length === 0 && (
                <p className="text-[#8c9196] text-sm">All products are already in this section.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setEditing(null)}>
          <div className={`${card} w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-[#202223]">{editing.id ? "Edit Product" : "Add New Product"}</h3>
              <button onClick={() => setEditing(null)} className="text-[#8c9196] hover:text-[#202223]"><X size={18} /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#202223] block mb-1">Product Title</label>
                <input placeholder="e.g. Divine Murugan Ultra Glossy" value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className={inputCls} />
              </div>

              <div>
                <label className="text-xs font-bold text-[#202223] block mb-1">Material</label>
                <select
                  value={(editing as any).material || ""}
                  onChange={(e) => {
                    const material = e.target.value as Material | "";
                    if (material && MATERIAL_PRICING[material as Material]) {
                      const { price, comparePrice } = MATERIAL_PRICING[material as Material];
                      setEditing({ ...editing, material, price, comparePrice, brand: "", models: [] } as any);
                    } else {
                      setEditing({ ...editing, material, brand: "", models: [] } as any);
                    }
                  }}
                  className={inputCls}
                >
                  <option value="">-- Select Material --</option>
                  {MATERIAL_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <p className="text-[10px] text-[#8c9196] mt-1">Price and compare-at are set automatically from the material (all free shipping).</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#202223] block mb-1">Price (₹)</label>
                  <input type="number" placeholder="Price" value={editing.price || ""} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#202223] block mb-1">Compare at (₹)</label>
                  <input type="number" placeholder="Compare Price" value={editing.comparePrice || ""} onChange={(e) => setEditing({ ...editing, comparePrice: Number(e.target.value) })} className={inputCls} />
                </div>
              </div>

              {/* Brand and Phone Model — each on its own line. Scoped to the
                  Material picked above (each material has its own model list). */}
              <div>
                <label className="text-xs font-bold text-[#202223] block mb-1">Brand</label>
                <select
                  disabled={!editing.material}
                  value={editing.brand || ""}
                  onChange={(e) => setEditing({ ...editing, brand: e.target.value, models: [] })}
                  className={`${inputCls} disabled:opacity-50`}
                >
                  <option value="">{editing.material ? "-- Select Brand --" : "Select a material first"}</option>
                  {Object.keys(brandModels).map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-[#202223] block mb-1">Phone Model(s)</label>
                <select
                  disabled={!editing.brand}
                  value=""
                  onChange={(e) => {
                    const m = e.target.value;
                    if (!m) return;
                    const current = editing.models || [];
                    if (!current.includes(m)) setEditing({ ...editing, models: [...current, m] });
                  }}
                  className={`${inputCls} disabled:opacity-50`}
                >
                  <option value="">{editing.brand ? "-- Add a model --" : "Select a brand first"}</option>
                  {(brandModels[editing.brand || ""] || []).map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                {(editing.models || []).length > 0 && (
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {(editing.models || []).map((m) => (
                      <span key={m} className="inline-flex items-center gap-1 bg-[#f6f6f7] border border-[#e1e3e5] rounded-full px-2.5 py-1 text-xs text-[#202223]">
                        {m}
                        <button onClick={() => setEditing({ ...editing, models: (editing.models || []).filter((x) => x !== m) })} className="text-[#8c9196] hover:text-red-500">
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-[#202223] block mb-1">Collection</label>
                <select value={editing.collectionId || ""} onChange={(e) => setEditing({ ...editing, collectionId: e.target.value, collectionIds: [e.target.value] })} className={inputCls}>
                  <option value="">-- Collection --</option>
                  {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#202223] block mb-1">Description</label>
                <textarea placeholder="Description" value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className={inputCls} rows={3} />
              </div>

              <div className={`${card} p-3 space-y-2 bg-[#fafbfb]`}>
                <p className="text-xs font-black text-[#202223]">SEO (Google search listing)</p>
                <div>
                  <label className="text-[11px] font-bold text-[#6d7175] block mb-1">SEO Title ({(editing.metaTitle || "").length}/60)</label>
                  <input
                    placeholder={editing.title ? `${editing.title} | Stickover` : "e.g. Gold Murugan Acrylic Phone Case | Stickover"}
                    value={editing.metaTitle || ""}
                    maxLength={70}
                    onChange={(e) => setEditing({ ...editing, metaTitle: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#6d7175] block mb-1">SEO Description ({(editing.metaDescription || "").length}/160)</label>
                  <textarea
                    placeholder="Buy this custom phone case online at Stickover — durable print, pan-India delivery, secure payments."
                    value={editing.metaDescription || ""}
                    maxLength={200}
                    onChange={(e) => setEditing({ ...editing, metaDescription: e.target.value })}
                    className={inputCls}
                    rows={2}
                  />
                </div>
                <p className="text-[10px] text-[#8c9196]">Leave blank to auto-use the product title/description. Mention keywords like "custom phone case", "acrylic case" or "gold case" naturally where relevant.</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#202223]">Product Images ({(editing.images || []).length}/{MAX_PRODUCT_IMAGES} — min 1, max {MAX_PRODUCT_IMAGES})</label>
                  {uploading && <span className="text-xs text-[#8c9196]">Uploading...</span>}
                </div>
                <p className="text-[10px] text-[#8c9196] mb-2 -mt-1">Photos are cropped to a square (1:1) automatically — a crop tool opens after you pick a photo so you can adjust it first. You can also add a video (uploaded as-is, no cropping). You can select multiple files at once, and drag the grip to reorder — the first item is the Main image shown on the storefront.</p>
                <div ref={imgGridRef} className="grid grid-cols-5 gap-2" onPointerMove={handleImgPointerMove} onPointerUp={endImgDrag} onPointerCancel={endImgDrag}>
                  {(editing.images || []).map((img, i) => (
                    <div
                      key={img + i}
                      data-img-cell
                      className={`relative aspect-square transition-shadow ${dragImgIndex === i ? "z-10 shadow-lg ring-2 ring-blue-300 rounded-lg" : ""}`}
                      style={{ touchAction: dragImgIndex !== null ? "none" : "pan-y" }}
                    >
                      {i === 0 && <span className="absolute top-1 left-1 z-10 bg-black text-white text-[9px] font-bold px-1.5 py-0.5 rounded">Main</span>}
                      {isVideoFile(img) ? (
                        <video src={api.imageUrl(img)} className="w-full h-full object-cover rounded-lg border border-[#e1e3e5] pointer-events-none" muted />
                      ) : (
                        <img src={api.imageUrl(img)} className="w-full h-full object-cover rounded-lg border border-[#e1e3e5] pointer-events-none" />
                      )}
                      <button
                        type="button"
                        aria-label="Drag to reorder"
                        onPointerDown={handleImgPointerDown(i)}
                        className="absolute bottom-1 left-1 bg-black/60 text-white rounded w-5 h-5 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
                      >
                        <GripVertical size={12} />
                      </button>
                      {!isVideoFile(img) && (
                        <button
                          type="button"
                          aria-label="Zoom / crop this photo"
                          title="Zoom / crop"
                          disabled={reCropBusy}
                          onClick={() => startReCrop(i)}
                          className="absolute bottom-1 right-1 bg-black/60 text-white rounded w-5 h-5 flex items-center justify-center disabled:opacity-50"
                        >
                          <ZoomIn size={12} />
                        </button>
                      )}
                      <button onClick={() => removeImage(i)} className="absolute -top-1.5 -right-1.5 bg-black text-white rounded-full w-5 h-5 flex items-center justify-center">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {(editing.images || []).length < MAX_PRODUCT_IMAGES && (
                    <label className="aspect-square rounded-lg border-2 border-dashed border-[#c9cccf] flex flex-col items-center justify-center cursor-pointer text-[#8c9196] hover:border-[#8c9196] hover:text-[#202223]">
                      <Plus size={18} />
                      <span className="text-[10px] mt-0.5">Add image{MAX_PRODUCT_IMAGES - (editing.images || []).length > 1 ? "s" : ""}/video</span>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.length) handleProductMediaSelect(e.target.files);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex gap-4 text-sm text-[#6d7175] flex-wrap pt-1">
                {["isFeatured", "isTrending", "isNewArrival", "isBestSeller"].map((f) => (
                  <label key={f} className="flex items-center gap-1.5">
                    <input type="checkbox" checked={!!(editing as any)[f]} onChange={(e) => setEditing({ ...editing, [f]: e.target.checked })} />
                    {f.replace("is", "")}
                  </label>
                ))}
                <label className="flex items-center gap-1.5 font-semibold text-emerald-700">
                  <input
                    type="checkbox"
                    checked={!!(editing as any).isCustomizable}
                    onChange={(e) => setEditing({ ...editing, isCustomizable: e.target.checked })}
                  />
                  Require image from customer
                </label>
                <label className="flex items-center gap-1.5 font-semibold text-emerald-700">
                  <input
                    type="checkbox"
                    checked={!!(editing as any).requiresCustomerName}
                    onChange={(e) => setEditing({ ...editing, requiresCustomerName: e.target.checked })}
                  />
                  Show "Name to Print" text box (optional for customer)
                </label>
              </div>

              {variantGroups.length > 0 && (
                <div className="pt-1">
                  <label className="text-xs font-semibold text-[#6d7175] block mb-1">Variant Options Dropdown (optional)</label>
                  <select
                    value={(editing as any).variantGroupId || ""}
                    onChange={(e) => setEditing({ ...editing, variantGroupId: e.target.value } as any)}
                    className={inputCls}
                  >
                    <option value="">None</option>
                    {variantGroups.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-[#8c9196] mt-1">Shows this dropdown right under the phone model picker on this product's page. Manage groups under Variant Options.</p>
                </div>
              )}

              <div className="flex gap-3 pt-2 justify-end border-t border-[#e1e3e5] mt-2">
                <button onClick={() => setEditing(null)} className={btnGhost}>Cancel</button>
                <button onClick={save} disabled={saving || !editing.title} className={`${btnPrimary} disabled:opacity-50`}>{saving ? "Saving..." : editing.id ? "Save Changes" : "Add Product"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {products.length > 0 && (
        <div className={`flex items-center gap-3 mb-3 ${card} px-4 py-2.5`}>
          <label className="flex items-center gap-2 text-xs text-[#6d7175]">
            <input type="checkbox" checked={selected.length === products.length} onChange={toggleSelectAll} />
            {selected.length ? `${selected.length} selected` : "Select all"}
          </label>
          {selected.length > 0 && (
            <div className="flex gap-3 ml-auto">
              <button onClick={bulkMarkInStock} disabled={bulkBusy} className="text-xs font-semibold text-green-600 hover:underline disabled:opacity-50">Mark In Stock</button>
              <button onClick={bulkMarkOutOfStock} disabled={bulkBusy} className="text-xs font-semibold text-[#6d7175] hover:underline disabled:opacity-50">Mark Out of Stock</button>
              <button onClick={bulkDelete} disabled={bulkBusy} className="text-xs font-semibold text-red-500 hover:underline disabled:opacity-50">Delete Selected</button>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2.5">
        {products.map((p) => (
          <div key={p.id} className={`group relative ${card} p-2 flex flex-col`}>
            <label className="absolute top-2.5 left-2.5 z-10 bg-white/90 backdrop-blur rounded shadow-sm">
              <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleSelect(p.id)} />
            </label>
            <button
              onClick={() => setEditing(p)}
              className="aspect-square w-full rounded-lg overflow-hidden bg-[#f6f6f7] border border-[#e1e3e5]"
              title="Edit product"
            >
              {p.images?.[0] ? (
                <img src={api.imageUrl(p.images[0])} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#c9cccf] text-[10px]">No image</div>
              )}
            </button>
            <p className="text-[#202223] text-[11px] sm:text-xs font-semibold mt-1.5 leading-snug line-clamp-2">{p.title}</p>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-[#8c9196] text-[11px] sm:text-xs">₹{p.price}</p>
              {p.stockStatus === "out_of_stock" && <span className="text-[9px] font-bold text-red-500">OUT</span>}
            </div>
            <div className="flex gap-2 mt-1.5 pt-1.5 border-t border-[#f0f0f0]">
              <button onClick={() => setEditing(p)} className="flex-1 text-[10px] sm:text-[11px] font-semibold text-[#202223] hover:underline">Edit</button>
              <button onClick={() => remove(p.id)} className="text-[10px] sm:text-[11px] font-semibold text-red-500 hover:underline">Delete</button>
            </div>
          </div>
        ))}
        {products.length === 0 && <p className="text-[#8c9196] text-sm col-span-full">No products yet.</p>}
      </div>

      {cropQueue[0] && (
        <ImageCropModal file={cropQueue[0]} onCancel={handleCropCancel} onConfirm={handleCropConfirm} />
      )}
      {reCropFile && (
        <ImageCropModal file={reCropFile} onCancel={handleReCropCancel} onConfirm={handleReCropConfirm} />
      )}
    </div>
  );
}

// ---------------- Pricing (bulk price/offer-price edit by product type) ----------------
// Lets the admin retag every product of a given Material ("product type" —
// Acrylic / Gold / Glass / Hard Plastic) or Collection with a new Actual Price
// (compare-at, struck-through) and Offer Price (what customers pay) in one go,
// instead of opening each product individually.
function PricingTab() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<"material" | "collection">("material");
  const [drafts, setDrafts] = useState<Record<string, { price: string; comparePrice: string }>>({});
  const [applyingKey, setApplyingKey] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([api.get("/api/products"), api.get("/api/collections")]);
      setProducts(p || []);
      setCollections(c || []);
    } catch {
      // ignore — sections just render empty
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const materialGroups: { key: string; label: string; items: Product[] }[] = MATERIAL_OPTIONS.map((m) => ({
    key: m as string,
    label: m as string,
    items: products.filter((p) => p.material === m),
  })).concat([{ key: "__none__", label: "No Type Set", items: products.filter((p) => !p.material) }]);

  const collectionGroups = collections
    .map((c) => ({
      key: c.id,
      label: c.name,
      items: products.filter((p) => p.collectionId === c.id || p.collectionIds?.includes(c.id)),
    }))
    .concat([{ key: "__none__", label: "No Collection Set", items: products.filter((p) => !p.collectionId && !p.collectionIds?.length) }]);

  const groups = (groupBy === "material" ? materialGroups : collectionGroups).filter((g) => g.items.length > 0);

  const draftFor = (key: string) => drafts[key] || { price: "", comparePrice: "" };
  const setDraft = (key: string, patch: Partial<{ price: string; comparePrice: string }>) =>
    setDrafts((prev) => ({ ...prev, [key]: { ...draftFor(key), ...patch } }));

  const applyToGroup = async (key: string, items: Product[]) => {
    const d = draftFor(key);
    const price = Number(d.price);
    const comparePrice = Number(d.comparePrice);
    if (!d.price || !price || price <= 0) {
      showToast("Enter a valid offer price", "error");
      return;
    }
    if (d.comparePrice && (isNaN(comparePrice) || comparePrice < price)) {
      showToast("Actual price should be greater than or equal to the offer price", "error");
      return;
    }
    setApplyingKey(key);
    try {
      await Promise.all(
        items.map((p) =>
          api.put(`/api/products/${p.id}`, {
            ...p,
            price,
            comparePrice: d.comparePrice ? comparePrice : p.comparePrice,
          })
        )
      );
      setProducts((prev) =>
        prev.map((p) =>
          items.some((it) => it.id === p.id)
            ? { ...p, price, comparePrice: d.comparePrice ? comparePrice : p.comparePrice }
            : p
        )
      );
      showToast(`Updated pricing for ${items.length} product${items.length === 1 ? "" : "s"}`, "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update pricing", "error");
    } finally {
      setApplyingKey(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className={`${card} p-5`}>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
          <h3 className="text-sm font-black text-[#202223]">Bulk Pricing</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setGroupBy("material")}
              className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${groupBy === "material" ? "bg-[#202223] text-white border-[#202223]" : "border-[#c9cccf] text-[#6d7175]"}`}
            >
              By Product Type
            </button>
            <button
              onClick={() => setGroupBy("collection")}
              className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${groupBy === "collection" ? "bg-[#202223] text-white border-[#202223]" : "border-[#c9cccf] text-[#6d7175]"}`}
            >
              By Collection
            </button>
          </div>
        </div>
        <p className="text-xs text-[#8c9196] mb-4">
          Set a new Actual Price (struck-through) and Offer Price (what customers pay) once, then apply it to every
          product of that {groupBy === "material" ? "type" : "collection"} in one click. Leave Actual Price blank to
          only change the Offer Price.
        </p>

        {loading ? (
          <p className="text-[#8c9196] text-sm">Loading...</p>
        ) : groups.length === 0 ? (
          <p className="text-[#8c9196] text-sm">No products yet.</p>
        ) : (
          <div className="space-y-3">
            {groups.map((g) => {
              const d = draftFor(g.key);
              const prices = g.items.map((p) => p.price);
              const minP = Math.min(...prices);
              const maxP = Math.max(...prices);
              return (
                <div key={g.key} className="bg-[#f6f6f7] border border-[#e1e3e5] rounded-lg px-4 py-3">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                    <div>
                      <span className="text-sm font-bold text-[#202223]">{g.label}</span>
                      <span className="ml-2 text-[11px] text-[#8c9196]">
                        {g.items.length} product{g.items.length === 1 ? "" : "s"} — currently ₹{minP}
                        {maxP !== minP ? ` – ₹${maxP}` : ""}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-end gap-3 flex-wrap">
                    <div>
                      <label className="text-[11px] font-bold text-[#6d7175] block mb-1">Offer Price (₹)</label>
                      <input
                        type="number"
                        placeholder="e.g. 499"
                        value={d.price}
                        onChange={(e) => setDraft(g.key, { price: e.target.value })}
                        className={`${inputCls} w-32`}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#6d7175] block mb-1">Actual Price (₹) <span className="font-normal text-[#8c9196]">(optional)</span></label>
                      <input
                        type="number"
                        placeholder="e.g. 999"
                        value={d.comparePrice}
                        onChange={(e) => setDraft(g.key, { comparePrice: e.target.value })}
                        className={`${inputCls} w-32`}
                      />
                    </div>
                    <button
                      onClick={() => applyToGroup(g.key, g.items)}
                      disabled={applyingKey === g.key || !d.price}
                      className={`${btnPrimary} disabled:opacity-50`}
                    >
                      {applyingKey === g.key ? "Applying..." : `Apply to ${g.items.length}`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------- Material Details (per-material description shown on product page) ----------------
// For each Material ("product type" — Acrylic / Gold / Glass / Hard Plastic), the admin
// writes 2 paragraphs (para 1 shows with an uploaded image above it, para 2 is text-only)
// that appear as a "Material Details" tab on every product of that material, right below
// the normal Description tab on the storefront's product page.
// ---------------- Material Details tab (Material Details + Product Descriptions) ----------------
// One tab, two sub-sections: the material-wide story (per Material type) and
// each individual product's own Description field — both editable without
// leaving this tab.
function MaterialDetailsTab() {
  const [section, setSection] = useState<"material" | "product">("material");
  return (
    <div>
      <div className="flex gap-1 bg-[#f1f1f1] rounded-lg p-1 mb-5 w-fit">
        {([
          { key: "material" as const, label: "Material Details" },
          { key: "product" as const, label: "Product Descriptions" },
        ]).map((s) => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors ${
              section === s.key ? "bg-white text-[#202223] shadow-sm" : "text-[#6d7175] hover:text-[#202223]"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      {section === "material" ? <MaterialDetailsSection /> : <ProductDescriptionsSection />}
    </div>
  );
}

// Per-product Description editor — same product Description field shown in
// the Products tab's edit form, but reachable here too so both the material
// story and each product's own description can be changed from one tab.
function ProductDescriptionsSection() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<any>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [activeMaterial, setActiveMaterial] = useState<Material>(MATERIAL_OPTIONS[0]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const s = await api.get("/api/settings");
    setSettings(s || {});
    setDrafts(s?.materialProductDescriptions || {});
  };
  useEffect(() => { load(); }, []);

  const current = drafts[activeMaterial] || "";
  const setCurrent = (value: string) => setDrafts((prev) => ({ ...prev, [activeMaterial]: value }));

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/api/settings", { ...settings, materialProductDescriptions: drafts });
      setSettings((s: any) => ({ ...s, materialProductDescriptions: drafts }));
      showToast(`${activeMaterial} description saved`, "success");
    } catch (err: any) {
      showToast(err.message || "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`${card} p-5`}>
      <h3 className="text-sm font-black text-[#202223] mb-1">Product Descriptions</h3>
      <p className="text-xs text-[#8c9196] mb-4">
        Write one Description per Material (Acrylic / Gold / Hard Plastic / Glass). Every product with that
        material selected shows this text as its Description on the product page automatically — matching how
        Material Details works. Leave a material blank to keep using each of its products' own individual
        description instead.
      </p>

      <div className="flex gap-2 flex-wrap mb-5">
        {MATERIAL_OPTIONS.map((m) => (
          <button
            key={m}
            onClick={() => setActiveMaterial(m)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
              activeMaterial === m ? "bg-[#202223] text-white border-[#202223]" : "border-[#c9cccf] text-[#6d7175]"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[11px] font-bold text-[#6d7175] block mb-1">
            {activeMaterial} — Description <span className="font-normal text-[#8c9196]">(shown on every {activeMaterial} product)</span>
          </label>
          <textarea
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            rows={8}
            placeholder={`e.g. "Our ${activeMaterial} cases are crafted from premium material for a sleek, durable finish..."`}
            className={inputCls}
          />
        </div>

        <div className="pt-1">
          <button onClick={save} disabled={saving} className={`${btnPrimary} disabled:opacity-50`}>
            {saving ? "Saving..." : `Save ${activeMaterial} Description`}
          </button>
        </div>
      </div>
    </div>
  );
}

function MaterialDetailsSection() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<any>({});
  const [drafts, setDrafts] = useState<Record<string, { image?: string; para1?: string; para2?: string }>>({});
  const [activeMaterial, setActiveMaterial] = useState<Material>(MATERIAL_OPTIONS[0]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const s = await api.get("/api/settings");
    setSettings(s || {});
    setDrafts(s?.materialDescriptions || {});
  };
  useEffect(() => { load(); }, []);

  const current = drafts[activeMaterial] || { image: "", para1: "", para2: "" };
  const setCurrent = (patch: Partial<{ image: string; para1: string; para2: string }>) =>
    setDrafts((prev) => ({ ...prev, [activeMaterial]: { ...current, ...patch } }));

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const res = await api.upload(file);
      setCurrent({ image: res.url });
    } catch (err: any) {
      showToast(err.message || "Failed to upload image", "error");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/api/settings", { ...settings, materialDescriptions: drafts });
      setSettings((s: any) => ({ ...s, materialDescriptions: drafts }));
      showToast(`${activeMaterial} material details saved`, "success");
    } catch (err: any) {
      showToast(err.message || "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className={`${card} p-5`}>
        <h3 className="text-sm font-black text-[#202223] mb-1">Material Details</h3>
        <p className="text-xs text-[#8c9196] mb-4">
          Write the material story for each product type. It shows as a "Material Details" tab (right below
          Description) on every product with that material selected. Paragraph 1 appears with the uploaded image
          above it, Paragraph 2 is text-only underneath.
        </p>

        <div className="flex gap-2 flex-wrap mb-5">
          {MATERIAL_OPTIONS.map((m) => (
            <button
              key={m}
              onClick={() => setActiveMaterial(m)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
                activeMaterial === m ? "bg-[#202223] text-white border-[#202223]" : "border-[#c9cccf] text-[#6d7175]"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-[#6d7175] block mb-1">
              Paragraph 1 <span className="font-normal text-[#8c9196]">(shown together with the image below)</span>
            </label>
            <textarea
              value={current.para1 || ""}
              onChange={(e) => setCurrent({ para1: e.target.value })}
              rows={4}
              placeholder={`e.g. "Our ${activeMaterial} cases are crafted from premium material for a sleek, durable finish..."`}
              className={inputCls}
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#6d7175] block mb-1">Image for Paragraph 1</label>
            {current.image ? (
              <div className="relative w-full max-w-sm">
                <img src={api.imageUrl(current.image)} className="w-full rounded-lg border border-[#e1e3e5] object-cover max-h-56" />
                <button onClick={() => setCurrent({ image: "" })} className="absolute -top-1.5 -right-1.5 bg-black text-white rounded-full w-5 h-5 flex items-center justify-center">
                  <X size={12} />
                </button>
              </div>
            ) : (
              <label className="w-full max-w-sm h-40 rounded-lg border-2 border-dashed border-[#c9cccf] flex flex-col items-center justify-center cursor-pointer text-[#8c9196] hover:border-[#8c9196] hover:text-[#202223]">
                <Plus size={18} />
                <span className="text-[10px] mt-0.5">{uploading ? "Uploading..." : `Add image for ${activeMaterial}`}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadImage(f);
                  }}
                />
              </label>
            )}
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#6d7175] block mb-1">
              Paragraph 2 <span className="font-normal text-[#8c9196]">(text only, no image)</span>
            </label>
            <textarea
              value={current.para2 || ""}
              onChange={(e) => setCurrent({ para2: e.target.value })}
              rows={4}
              placeholder="e.g. Care instructions, durability notes, or anything else worth mentioning about this material..."
              className={inputCls}
            />
          </div>

          <div className="pt-1">
            <button onClick={save} disabled={saving} className={`${btnPrimary} disabled:opacity-50`}>
              {saving ? "Saving..." : `Save ${activeMaterial} Details`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------- Collections ----------------
// ---------------- Home Page (section order + collection order + per-collection product order) ----------------
function HomePageTab() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<any>({});
  const [sections, setSections] = useState<string[]>([...DEFAULT_HOME_SECTIONS]);
  const [savingSections, setSavingSections] = useState(false);

  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionsBusy, setCollectionsBusy] = useState(false);

  const [productsFor, setProductsFor] = useState<Collection | null>(null);
  const [collectionProducts, setCollectionProducts] = useState<Product[]>([]);
  const [productsBusy, setProductsBusy] = useState(false);

  const [banners, setBanners] = useState<Banner[]>([]);
  const [editingBanner, setEditingBanner] = useState<Partial<Banner> | null>(null);
  const [savingBanner, setSavingBanner] = useState(false);

  const [featureBar, setFeatureBar] = useState(DEFAULT_FEATURE_BAR.map((f) => ({ ...f })));
  const [savingFeatureBar, setSavingFeatureBar] = useState(false);

  const load = async () => {
    const [s, c, b] = await Promise.all([api.get("/api/settings"), api.get("/api/collections"), api.get("/api/banners")]);
    setSettings(s || {});
    const saved: string[] = Array.isArray(s?.homeSectionsOrder) ? s.homeSectionsOrder : [];
    const valid = saved.filter((k) => (DEFAULT_HOME_SECTIONS as readonly string[]).includes(k));
    const missing = DEFAULT_HOME_SECTIONS.filter((k) => !valid.includes(k));
    setSections(valid.length ? [...valid, ...missing] : [...DEFAULT_HOME_SECTIONS]);
    setCollections([...(c || [])].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)));
    setBanners([...(b || [])].sort((x, y) => (x.order ?? 0) - (y.order ?? 0)));
    const savedFeatureBar = Array.isArray(s?.featureBar) && s.featureBar.length === 3 ? s.featureBar : DEFAULT_FEATURE_BAR;
    setFeatureBar(savedFeatureBar.map((f: any) => ({ ...f })));
  };
  useEffect(() => { load(); }, []);

  const setFeatureBarItem = (i: number, patch: Partial<{ icon: string; title: string; subtitle: string }>) => {
    setFeatureBar((prev) => prev.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
  };

  const saveFeatureBar = async () => {
    setSavingFeatureBar(true);
    try {
      await api.put("/api/settings", { ...settings, featureBar });
      setSettings((s: any) => ({ ...s, featureBar }));
      showToast("Feature bar updated", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update feature bar", "error");
    } finally {
      setSavingFeatureBar(false);
    }
  };

  const bannerHasMedia = (b: Partial<Banner> | null) =>
    !!b && (b.mediaType === "video" ? !!b.videoUrl : !!b.imageUrl);

  const saveBanner = async () => {
    if (!bannerHasMedia(editingBanner)) return;
    setSavingBanner(true);
    try {
      if (editingBanner.id) await api.put(`/api/banners/${editingBanner.id}`, editingBanner);
      else await api.post("/api/banners", editingBanner, true);
      setEditingBanner(null);
      await load();
      showToast("Banner saved", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to save banner", "error");
    } finally {
      setSavingBanner(false);
    }
  };

  const deleteBanner = async (id: string) => {
    if (!confirm("Delete this banner?")) return;
    try {
      await api.del(`/api/banners/${id}`);
      await load();
      showToast("Banner deleted", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to delete banner", "error");
    }
  };

  // Banners are shown edge-to-edge on every screen size at a 3548x1774 ratio.
  // If the source image is smaller than that, the browser has to stretch/upscale
  // it to fill the box — which is exactly what shows up as "quality loss" on
  // phones (mobile screens are often wider in CSS px than people expect once
  // scaled to full width). Warn instead of blocking, since older banners might
  // already be smaller and shouldn't suddenly fail to upload.
  const checkBannerDimensions = (file: File): Promise<{ w: number; h: number }> =>
    new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ w: img.width, h: img.height });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ w: 0, h: 0 });
      };
      img.src = url;
    });

  const uploadBannerDesktopImg = async (file: File) => {
    try {
      const { w } = await checkBannerDimensions(file);
      if (w && w < 3548) {
        showToast(`Image is ${w}px wide (recommended 3548px+) — it will be stretched and may look blurry on phones`, "error");
      }
      const res = await api.upload(file);
      setEditingBanner((b) => ({ ...b, imageUrl: res.url }));
    } catch (err: any) {
      showToast(err.message || "Failed to upload image", "error");
    }
  };

  const uploadBannerMobileImg = async (file: File) => {
    try {
      const res = await api.upload(file);
      setEditingBanner((b) => ({ ...b, mobileImageUrl: res.url }));
    } catch (err: any) {
      showToast(err.message || "Failed to upload image", "error");
    }
  };

  const [uploadingBannerVideo, setUploadingBannerVideo] = useState(false);
  const uploadBannerVideo = async (file: File) => {
    setUploadingBannerVideo(true);
    try {
      const res = await api.upload(file);
      setEditingBanner((b) => ({ ...b, videoUrl: res.url }));
    } catch (err: any) {
      showToast(err.message || "Failed to upload video", "error");
    } finally {
      setUploadingBannerVideo(false);
    }
  };

  const [savingGridCols, setSavingGridCols] = useState(false);
  const saveCollectionsGridMobileCols = async (cols: 2 | 3) => {
    setSavingGridCols(true);
    try {
      await api.put("/api/settings", { ...settings, collectionsGridMobileCols: cols });
      setSettings((s: any) => ({ ...s, collectionsGridMobileCols: cols }));
      showToast("Shop By Category layout updated", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update layout", "error");
    } finally {
      setSavingGridCols(false);
    }
  };

  const saveSectionOrder = async (next: string[]) => {
    setSections(next);
    setSavingSections(true);
    try {
      await api.put("/api/settings", { ...settings, homeSectionsOrder: next });
      setSettings((s: any) => ({ ...s, homeSectionsOrder: next }));
      showToast("Home page section order updated", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update section order", "error");
    } finally {
      setSavingSections(false);
    }
  };

  const saveCollectionOrder = async (next: Collection[]) => {
    setCollections(next);
    setCollectionsBusy(true);
    try {
      await Promise.all(next.map((c, i) => api.put(`/api/collections/${c.id}`, { ...c, displayOrder: i })));
      setCollections(next.map((c, i) => ({ ...c, displayOrder: i })));
      showToast("Collection order updated", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update collection order", "error");
    } finally {
      setCollectionsBusy(false);
    }
  };

  const openProducts = async (c: Collection) => {
    setProductsFor(c);
    const all: Product[] = await api.get("/api/products");
    setCollectionProducts(
      all
        .filter((p) => p.collectionId === c.id || p.collectionIds?.includes(c.id))
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    );
  };

  const saveProductOrder = async (next: Product[]) => {
    setCollectionProducts(next);
    setProductsBusy(true);
    try {
      await Promise.all(next.map((p, i) => api.put(`/api/products/${p.id}`, { ...p, displayOrder: i })));
      setCollectionProducts(next.map((p, i) => ({ ...p, displayOrder: i })));
      showToast("Product order updated", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update product order", "error");
    } finally {
      setProductsBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className={`${card} p-5`}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-black text-[#202223]">Home Page Banner (Hero)</h3>
          <button onClick={() => setEditingBanner({ title: "", subtitle: "", badge: "", imageUrl: "", mobileImageUrl: "", mediaType: "image", videoUrl: "", link: "", active: true, order: banners.length })} className={btnPrimary}>
            + New Banner
          </button>
        </div>
        <p className="text-xs text-[#8c9196] mb-4">The big rotating banner at the very top of the storefront home page. One image is used for both mobile and PC. Upload size: <span className="font-bold">3548 × 1774 px</span>.</p>

        {editingBanner && (
          <div className={`${card} p-4 mb-4 space-y-3 bg-[#fafbfb]`}>
            <input placeholder="Title (internal, optional)" value={editingBanner.title || ""} onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })} className={inputCls} />
            <input placeholder="Badge text (e.g. Limited Time Offer)" value={editingBanner.badge || ""} onChange={(e) => setEditingBanner({ ...editingBanner, badge: e.target.value })} className={inputCls} />
            <input placeholder="Subtitle / overlay text" value={editingBanner.subtitle || ""} onChange={(e) => setEditingBanner({ ...editingBanner, subtitle: e.target.value })} className={inputCls} />
            <input placeholder="Link (e.g. /collections/acrylic-cases)" value={editingBanner.link || ""} onChange={(e) => setEditingBanner({ ...editingBanner, link: e.target.value })} className={inputCls} />

            <div>
              <label className="text-[11px] font-bold text-[#6d7175] block mb-1">Banner Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingBanner((b) => ({ ...b, mediaType: "image" }))}
                  className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-bold ${
                    (editingBanner.mediaType || "image") === "image" ? "bg-[#202223] text-white border-[#202223]" : "border-[#c9cccf] text-[#6d7175]"
                  }`}
                >
                  Image
                </button>
                <button
                  type="button"
                  onClick={() => setEditingBanner((b) => ({ ...b, mediaType: "video" }))}
                  className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-bold ${
                    editingBanner.mediaType === "video" ? "bg-[#202223] text-white border-[#202223]" : "border-[#c9cccf] text-[#6d7175]"
                  }`}
                >
                  Video
                </button>
              </div>
            </div>

            {editingBanner.mediaType === "video" ? (
              <div>
                <label className="text-[11px] font-bold text-[#6d7175] block mb-1">
                  Banner Video * <span className="font-normal text-[#8c9196]">(same 3548 × 1774 ratio, plays on loop, muted)</span>
                </label>
                {editingBanner.videoUrl ? (
                  <div className="relative w-full" style={{ aspectRatio: "3548 / 1774" }}>
                    <video src={api.imageUrl(editingBanner.videoUrl)} className="w-full h-full object-cover rounded-lg border border-[#e1e3e5]" autoPlay loop muted playsInline />
                    <button onClick={() => setEditingBanner((b) => ({ ...b, videoUrl: "" }))} className="absolute -top-1.5 -right-1.5 bg-black text-white rounded-full w-5 h-5 flex items-center justify-center">
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <label className="w-full rounded-lg border-2 border-dashed border-[#c9cccf] flex flex-col items-center justify-center cursor-pointer text-[#8c9196] hover:border-[#8c9196] hover:text-[#202223]" style={{ aspectRatio: "3548 / 1774" }}>
                    <Plus size={18} />
                    <span className="text-[10px] mt-0.5">{uploadingBannerVideo ? "Uploading..." : "Add banner video (loops automatically)"}</span>
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      disabled={uploadingBannerVideo}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadBannerVideo(f);
                      }}
                    />
                  </label>
                )}
              </div>
            ) : (
              <div>
                <label className="text-[11px] font-bold text-[#6d7175] block mb-1">Banner Image * <span className="font-normal text-[#8c9196]">(3548 × 1774 px — used for mobile & PC)</span></label>
                {editingBanner.imageUrl ? (
                  <div className="relative w-full" style={{ aspectRatio: "3548 / 1774" }}>
                    <img src={api.imageUrl(editingBanner.imageUrl)} className="w-full h-full object-cover rounded-lg border border-[#e1e3e5]" />
                    <button onClick={() => setEditingBanner((b) => ({ ...b, imageUrl: "", mobileImageUrl: "" }))} className="absolute -top-1.5 -right-1.5 bg-black text-white rounded-full w-5 h-5 flex items-center justify-center">
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <label className="w-full rounded-lg border-2 border-dashed border-[#c9cccf] flex flex-col items-center justify-center cursor-pointer text-[#8c9196] hover:border-[#8c9196] hover:text-[#202223]" style={{ aspectRatio: "3548 / 1774" }}>
                    <Plus size={18} />
                    <span className="text-[10px] mt-0.5">Add banner image (3548 × 1774)</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          uploadBannerDesktopImg(f);
                          setEditingBanner((b) => ({ ...b, mobileImageUrl: "" }));
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            )}

            <label className="flex items-center gap-2 text-sm text-[#6d7175]">
              <input type="checkbox" checked={editingBanner.active !== false} onChange={(e) => setEditingBanner({ ...editingBanner, active: e.target.checked })} /> Active on site
            </label>
            <div className="flex gap-3 pt-1">
              <button onClick={saveBanner} disabled={savingBanner || !bannerHasMedia(editingBanner)} className={`${btnPrimary} disabled:opacity-50`}>{savingBanner ? "Saving..." : "Save"}</button>
              <button onClick={() => setEditingBanner(null)} className={btnGhost}>Cancel</button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {banners.map((b) => (
            <div key={b.id} className="flex items-center justify-between bg-[#f6f6f7] border border-[#e1e3e5] rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                {b.mediaType === "video" && b.videoUrl ? (
                  <video src={api.imageUrl(b.videoUrl)} className="w-10 h-10 object-cover rounded" muted />
                ) : b.imageUrl ? (
                  <img src={api.imageUrl(b.imageUrl)} className="w-10 h-10 object-cover rounded" />
                ) : (
                  <div className="w-10 h-10 bg-[#e1e3e5] rounded" />
                )}
                <span className="text-sm text-[#202223] truncate">{b.title || b.badge || "Untitled banner"}</span>
                {b.mediaType === "video" && <span className="text-[10px] text-[#8c9196] shrink-0">(video)</span>}
                {!b.active && <span className="text-[10px] text-[#8c9196] shrink-0">(inactive)</span>}
              </div>
              <div className="flex gap-3 shrink-0">
                <button onClick={() => setEditingBanner(b)} className="text-xs font-medium text-[#202223] hover:underline">Edit</button>
                <button onClick={() => deleteBanner(b.id)} className="text-xs font-medium text-red-500 hover:underline">Delete</button>
              </div>
            </div>
          ))}
          {banners.length === 0 && <p className="text-[#8c9196] text-sm">No banners yet — add one to show it on the home page.</p>}
        </div>
      </div>

      <div className={`${card} p-5`}>
        <h3 className="text-sm font-black text-[#202223] mb-1">Feature Bar (below the banner)</h3>
        <p className="text-xs text-[#8c9196] mb-4">The row of 3 icon + text badges shown right under the home page banner (e.g. Free Shipping, Premium Quality, Customer Support). Pick an icon and edit the title/subtitle for each.</p>
        <div className="space-y-3">
          {featureBar.map((item, i) => {
            const Icon = FEATURE_BAR_ICON_MAP[item.icon] || Truck;
            return (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 bg-[#f6f6f7] border border-[#e1e3e5] rounded-lg p-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white border border-[#e1e3e5] shrink-0">
                  <Icon size={18} className="text-amber-500" />
                </div>
                <select
                  value={item.icon}
                  onChange={(e) => setFeatureBarItem(i, { icon: e.target.value })}
                  className={`${inputCls} sm:w-52 shrink-0`}
                >
                  {FEATURE_ICON_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>{opt.label}</option>
                  ))}
                </select>
                <input
                  placeholder="Title (e.g. Free Shipping)"
                  value={item.title}
                  onChange={(e) => setFeatureBarItem(i, { title: e.target.value })}
                  className={`${inputCls} sm:flex-1`}
                />
                <input
                  placeholder="Subtitle (e.g. On order above ₹499)"
                  value={item.subtitle}
                  onChange={(e) => setFeatureBarItem(i, { subtitle: e.target.value })}
                  className={`${inputCls} sm:flex-1`}
                />
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-3 pt-3">
          <button onClick={saveFeatureBar} disabled={savingFeatureBar} className={btnPrimary}>
            {savingFeatureBar ? "Saving…" : "Save Feature Bar"}
          </button>
        </div>
      </div>

      <div className={`${card} p-5`}>
        <h3 className="text-sm font-black text-[#202223] mb-1">Home Page Section Order</h3>
        <p className="text-xs text-[#8c9196] mb-4">Controls the order these blocks appear on the storefront home page, top to bottom.</p>
        <DragReorderList
          items={sections}
          getKey={(key) => key}
          disabled={savingSections}
          onReorder={(next) => saveSectionOrder(next)}
          renderItem={(key, i) => (
            <div className="flex items-center justify-between bg-[#f6f6f7] border border-[#e1e3e5] rounded-lg px-3 py-2">
              <span className="text-sm text-[#202223]">{i + 1}. {HOME_SECTION_LABELS[key] || key}</span>
            </div>
          )}
        />
      </div>

      <div className={`${card} p-5`}>
        <h3 className="text-sm font-black text-[#202223] mb-1">Shop By Category — Mobile Layout</h3>
        <p className="text-xs text-[#8c9196] mb-4">Controls how many columns per row the Shop By Category grid uses on phone screens. Desktop always shows 5 per row.</p>
        <div className="flex gap-2 max-w-xs">
          <button
            onClick={() => saveCollectionsGridMobileCols(3)}
            disabled={savingGridCols}
            className={`flex-1 rounded-lg border px-3 py-2 text-xs font-bold disabled:opacity-50 ${
              (settings?.collectionsGridMobileCols || 3) === 3 ? "bg-[#202223] text-white border-[#202223]" : "border-[#c9cccf] text-[#6d7175]"
            }`}
          >
            3 per row
          </button>
          <button
            onClick={() => saveCollectionsGridMobileCols(2)}
            disabled={savingGridCols}
            className={`flex-1 rounded-lg border px-3 py-2 text-xs font-bold disabled:opacity-50 ${
              settings?.collectionsGridMobileCols === 2 ? "bg-[#202223] text-white border-[#202223]" : "border-[#c9cccf] text-[#6d7175]"
            }`}
          >
            2 per row
          </button>
        </div>
      </div>

      <div className={`${card} p-5`}>
        <h3 className="text-sm font-black text-[#202223] mb-1">Collection Order</h3>
        <p className="text-xs text-[#8c9196] mb-4">Controls the order collections appear in the Collections Grid and as per-collection product rows on the home page.</p>
        <DragReorderList
          items={collections}
          getKey={(c) => c.id}
          disabled={collectionsBusy}
          onReorder={saveCollectionOrder}
          renderItem={(c) => (
            <div className="flex items-center justify-between bg-[#f6f6f7] border border-[#e1e3e5] rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                {c.image ? <img src={api.imageUrl(c.image)} className="w-8 h-8 object-cover rounded" /> : <div className="w-8 h-8 bg-[#e1e3e5] rounded" />}
                <span className="text-sm text-[#202223] truncate">{c.name}</span>
                {!c.isVisible && <span className="text-[10px] text-[#8c9196] shrink-0">(hidden)</span>}
              </div>
              <button onClick={() => openProducts(c)} className="text-xs font-medium text-[#202223] hover:underline shrink-0">Reorder Products</button>
            </div>
          )}
        />
        {collections.length === 0 && <p className="text-[#8c9196] text-sm">No collections yet.</p>}
      </div>

      {productsFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setProductsFor(null)}>
          <div className={`${card} w-full max-w-lg max-h-[85vh] overflow-y-auto p-6`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-black text-[#202223]">Reorder Products — {productsFor.name}</h3>
              <button onClick={() => setProductsFor(null)} className="text-[#8c9196] hover:text-[#202223]"><X size={18} /></button>
            </div>
            <p className="text-xs text-[#8c9196] mb-4">Drag the handle to reorder how these products appear in the home page row and on this collection's page.</p>
            <DragReorderList
              items={collectionProducts}
              getKey={(p) => p.id}
              disabled={productsBusy}
              onReorder={saveProductOrder}
              renderItem={(p) => (
                <div className="flex items-center justify-between bg-[#f6f6f7] border border-[#e1e3e5] rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {p.images?.[0] ? <img src={api.imageUrl(p.images[0])} className="w-8 h-8 object-cover rounded" /> : <div className="w-8 h-8 bg-[#e1e3e5] rounded" />}
                    <span className="text-sm text-[#202223] truncate">{p.title}</span>
                  </div>
                </div>
              )}
            />
            {collectionProducts.length === 0 && <p className="text-[#8c9196] text-sm">No products in this collection yet.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function CollectionsTab() {
  const { showToast } = useToast();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [variantGroups, setVariantGroups] = useState<VariantGroupRow[]>([]);
  const [editing, setEditing] = useState<Partial<Collection> | null>(null);
  const [saving, setSaving] = useState(false);
  const [reorderingFor, setReorderingFor] = useState<Collection | null>(null);
  const [reorderProducts, setReorderProducts] = useState<Product[]>([]);
  const [reorderBusy, setReorderBusy] = useState(false);
  const [reorderCollectionsOpen, setReorderCollectionsOpen] = useState(false);

  const load = async () => {
    const c: Collection[] = await api.get("/api/collections");
    setCollections([...c].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)));
    const s = await api.get("/api/settings").catch(() => null);
    setVariantGroups(Array.isArray(s?.variantGroups) ? s.variantGroups : []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing || !editing.name || !editing.slug) return;
    setSaving(true);
    try {
      if (editing.id) await api.put(`/api/collections/${editing.id}`, editing);
      // BUG FIX: this was `api.post("/api/collections", editing)` with no third
      // argument, so no auth header was sent on create — the backend always
      // replied 401 "No token provided" and the save silently failed.
      else await api.post("/api/collections", editing, true);
      setEditing(null);
      await load();
      showToast("Collection saved", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to save collection", "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this collection?")) return;
    try {
      await api.del(`/api/collections/${id}`);
      await load();
      showToast("Collection deleted", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to delete collection", "error");
    }
  };

  // Collection tile image goes through the same square crop tool as product
  // photos — pick any photo, crop it to a centered 1:1 square, then upload.
  const [collectionCropFile, setCollectionCropFile] = useState<File | null>(null);

  const uploadImage = (file: File) => setCollectionCropFile(file);

  const uploadCroppedCollectionImage = async (file: File) => {
    try {
      const res = await api.upload(file);
      setEditing((c) => ({ ...c, image: res.url }));
    } catch (err: any) {
      showToast(err.message || "Failed to upload image", "error");
    } finally {
      setCollectionCropFile(null);
    }
  };

  const uploadBannerMobile = async (file: File) => {
    try {
      const res = await api.upload(file);
      setEditing((c) => ({ ...c, bannerMobile: res.url }));
    } catch (err: any) {
      showToast(err.message || "Failed to upload mobile banner", "error");
    }
  };

  const checkBannerDimensions = (file: File): Promise<{ w: number; h: number }> =>
    new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ w: img.width, h: img.height });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ w: 0, h: 0 });
      };
      img.src = url;
    });

  const uploadBannerDesktop = async (file: File) => {
    try {
      const { w } = await checkBannerDimensions(file);
      if (w && w < 3548) {
        showToast(`Image is ${w}px wide (recommended 3548px+) — it will be stretched and may look blurry on phones`, "error");
      }
      const res = await api.upload(file);
      setEditing((c) => ({ ...c, bannerDesktop: res.url }));
    } catch (err: any) {
      showToast(err.message || "Failed to upload desktop banner", "error");
    }
  };

  const [uploadingBannerVideo, setUploadingBannerVideo] = useState(false);
  const uploadBannerVideo = async (file: File) => {
    setUploadingBannerVideo(true);
    try {
      const res = await api.upload(file);
      setEditing((c) => ({ ...c, bannerVideoUrl: res.url }));
    } catch (err: any) {
      showToast(err.message || "Failed to upload banner video", "error");
    } finally {
      setUploadingBannerVideo(false);
    }
  };

  // Auto-generate a URL-safe slug from the collection name (e.g. "Gold Murugan
  // Cases" -> "gold-murugan-cases"). Keeps the field editable so an admin can
  // still override it by hand.
  const slugify = (s: string) =>
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const openReorder = async (c: Collection) => {
    setReorderingFor(c);
    const all: Product[] = await api.get("/api/products");
    const inCollection = all
      .filter((p) => p.collectionId === c.id || p.collectionIds?.includes(c.id))
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    setReorderProducts(inCollection);
  };

  const saveProductOrder = async (next: Product[]) => {
    setReorderProducts(next);
    setReorderBusy(true);
    try {
      // Persist sequential display_order values for the whole reordered list
      await Promise.all(next.map((p, i) => api.put(`/api/products/${p.id}`, { ...p, displayOrder: i })));
      setReorderProducts(next.map((p, i) => ({ ...p, displayOrder: i })));
      showToast("Product order updated", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update order", "error");
    } finally {
      setReorderBusy(false);
    }
  };

  const saveCollectionsOrder = async (next: Collection[]) => {
    setCollections(next);
    setReorderBusy(true);
    try {
      await Promise.all(next.map((c, i) => api.put(`/api/collections/${c.id}`, { ...c, displayOrder: i })));
      setCollections(next.map((c, i) => ({ ...c, displayOrder: i })));
      showToast("Collection order updated", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update collection order", "error");
    } finally {
      setReorderBusy(false);
    }
  };

  return (
    <div>
      <button onClick={() => setEditing({ name: "", slug: "", image: "", bannerMobile: "", bannerDesktop: "", description: "", isVisible: true })} className={`mb-4 ${btnPrimary}`}>
        + New Collection
      </button>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setEditing(null)}>
        <div className={`${card} w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-3`} onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-black text-[#202223]">{editing.id ? "Edit Collection" : "Add New Collection"}</h3>
            <button onClick={() => setEditing(null)} className="text-[#8c9196] hover:text-[#202223]"><X size={18} /></button>
          </div>
          <input
            placeholder="Name"
            value={editing.name || ""}
            onChange={(e) => {
              const name = e.target.value;
              setEditing((c) => {
                // Only auto-update the slug while it hasn't been hand-edited away
                // from what the name would generate — so typing a name always
                // drives the slug, but a manual override is never clobbered.
                const autoSlug = c?.name ? slugify(c.name) : "";
                const slugFollowsName = !c?.slug || c.slug === autoSlug;
                return { ...c, name, slug: slugFollowsName ? slugify(name) : c?.slug };
              });
            }}
            className={inputCls}
          />
          <input placeholder="Slug (auto-generated from name)" value={editing.slug || ""} onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })} className={inputCls} />
          <textarea placeholder="Description" value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className={inputCls} rows={2} />
          <div className={`${card} p-3 space-y-2 bg-[#fafbfb]`}>
            <p className="text-xs font-black text-[#202223]">SEO (Google search listing)</p>
            <input
              placeholder={editing.name ? `${editing.name} | Stickover` : "e.g. Acrylic Phone Cases | Stickover"}
              value={editing.metaTitle || ""}
              maxLength={70}
              onChange={(e) => setEditing({ ...editing, metaTitle: e.target.value })}
              className={inputCls}
            />
            <textarea
              placeholder="Shop the best acrylic / gold phone cases online at Stickover — pan-India delivery, secure payments."
              value={editing.metaDescription || ""}
              maxLength={200}
              onChange={(e) => setEditing({ ...editing, metaDescription: e.target.value })}
              className={inputCls}
              rows={2}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-[#202223] block mb-1">Collection Image</label>
            <div className="grid grid-cols-5 gap-2">
              {editing.image ? (
                <div className="relative aspect-square">
                  <span className="absolute top-1 left-1 z-10 bg-black text-white text-[9px] font-bold px-1.5 py-0.5 rounded">Main</span>
                  <img src={api.imageUrl(editing.image)} className="w-full h-full object-cover rounded-lg border border-[#e1e3e5]" />
                  <button onClick={() => setEditing((c) => ({ ...c, image: "" }))} className="absolute -top-1.5 -right-1.5 bg-black text-white rounded-full w-5 h-5 flex items-center justify-center">
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <label className="aspect-square rounded-lg border-2 border-dashed border-[#c9cccf] flex flex-col items-center justify-center cursor-pointer text-[#8c9196] hover:border-[#8c9196] hover:text-[#202223]">
                  <Plus size={18} />
                  <span className="text-[10px] mt-0.5">Add image</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
                </label>
              )}
            </div>
          </div>

          <div className={`${card} p-3 space-y-3 bg-[#fafbfb]`}>
            <p className="text-xs font-black text-[#202223]">Collection Page Banner</p>
            <p className="text-[11px] text-[#8c9196] -mt-2">Shown at the top of this collection's page. One image/video is used for both mobile and PC. Upload size: <span className="font-bold">3548 × 1774 px</span>.</p>

            <div>
              <label className="text-[11px] font-bold text-[#6d7175] block mb-1">Banner Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditing((c) => ({ ...c, bannerMediaType: "image" }))}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border ${
                    (editing.bannerMediaType || "image") === "image" ? "bg-[#202223] text-white border-[#202223]" : "border-[#c9cccf] text-[#6d7175]"
                  }`}
                >
                  Image
                </button>
                <button
                  type="button"
                  onClick={() => setEditing((c) => ({ ...c, bannerMediaType: "video" }))}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border ${
                    editing.bannerMediaType === "video" ? "bg-[#202223] text-white border-[#202223]" : "border-[#c9cccf] text-[#6d7175]"
                  }`}
                >
                  Video
                </button>
              </div>
            </div>

            {editing.bannerMediaType === "video" ? (
              <div>
                <label className="text-[11px] font-bold text-[#6d7175] block mb-1">
                  Banner Video <span className="font-normal text-[#8c9196]">(same 3548 × 1774 ratio, plays on loop, muted)</span>
                </label>
                {editing.bannerVideoUrl ? (
                  <div className="relative w-full" style={{ aspectRatio: "3548 / 1774" }}>
                    <video src={api.imageUrl(editing.bannerVideoUrl)} className="w-full h-full object-cover rounded-lg border border-[#e1e3e5]" autoPlay loop muted playsInline />
                    <button onClick={() => setEditing((c) => ({ ...c, bannerVideoUrl: "" }))} className="absolute -top-1.5 -right-1.5 bg-black text-white rounded-full w-5 h-5 flex items-center justify-center">
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <label className="w-full rounded-lg border-2 border-dashed border-[#c9cccf] flex flex-col items-center justify-center cursor-pointer text-[#8c9196] hover:border-[#8c9196] hover:text-[#202223]" style={{ aspectRatio: "3548 / 1774" }}>
                    <Plus size={18} />
                    <span className="text-[10px] mt-0.5">{uploadingBannerVideo ? "Uploading..." : "Add banner video (loops automatically)"}</span>
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      disabled={uploadingBannerVideo}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadBannerVideo(f);
                      }}
                    />
                  </label>
                )}
              </div>
            ) : (
              <div>
                <label className="text-[11px] font-bold text-[#6d7175] block mb-1">Banner Image <span className="font-normal text-[#8c9196]">(3548 × 1774 px — used for mobile & PC)</span></label>
                {editing.bannerDesktop ? (
                  <div className="relative w-full" style={{ aspectRatio: "3548 / 1774" }}>
                    <img src={api.imageUrl(editing.bannerDesktop)} className="w-full h-full object-cover rounded-lg border border-[#e1e3e5]" />
                    <button onClick={() => setEditing((c) => ({ ...c, bannerDesktop: "", bannerMobile: "" }))} className="absolute -top-1.5 -right-1.5 bg-black text-white rounded-full w-5 h-5 flex items-center justify-center">
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <label className="w-full rounded-lg border-2 border-dashed border-[#c9cccf] flex flex-col items-center justify-center cursor-pointer text-[#8c9196] hover:border-[#8c9196] hover:text-[#202223]" style={{ aspectRatio: "3548 / 1774" }}>
                    <Plus size={18} />
                    <span className="text-[10px] mt-0.5">Add banner image (3548 × 1774)</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          uploadBannerDesktop(f);
                          setEditing((c) => ({ ...c, bannerMobile: "" }));
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm text-[#6d7175]">
            <input type="checkbox" checked={editing.isVisible !== false} onChange={(e) => setEditing({ ...editing, isVisible: e.target.checked })} /> Visible on site
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-amber-700">
            <input type="checkbox" checked={!!(editing as any).isHighlighted} onChange={(e) => setEditing({ ...editing, isHighlighted: e.target.checked } as any)} />
            Highlight border on Home Page (for Special Collections / Designed Cases)
          </label>
          {variantGroups.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-[#6d7175] block mb-1">Variant Options Dropdown for this collection (optional)</label>
              <select
                value={(editing as any).variantGroupId || ""}
                onChange={(e) => setEditing({ ...editing, variantGroupId: e.target.value } as any)}
                className="w-full bg-white border border-[#c9cccf] focus:border-[#458fff] rounded-lg px-3 py-2 text-[#202223] text-sm outline-none"
              >
                <option value="">None</option>
                {variantGroups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              <p className="text-[11px] text-[#8c9196] mt-1">Applies this dropdown to every product in this collection automatically. A product's own Variant Options setting (in Admin &gt; Products) always overrides this.</p>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button onClick={save} disabled={saving || !editing.name || !editing.slug} className={`${btnPrimary} disabled:opacity-50`}>{saving ? "Saving..." : "Save"}</button>
            <button onClick={() => setEditing(null)} className={btnGhost}>Cancel</button>
          </div>
        </div>
        </div>
      )}

      {reorderingFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setReorderingFor(null)}>
          <div className={`${card} w-full max-w-lg max-h-[85vh] overflow-y-auto p-6`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-black text-[#202223]">Reorder Products — {reorderingFor.name}</h3>
              <button onClick={() => setReorderingFor(null)} className="text-[#8c9196] hover:text-[#202223]"><X size={18} /></button>
            </div>
            <p className="text-xs text-[#8c9196] mb-4">Drag the handle to set the order products appear in on this collection's page.</p>
            <DragReorderList
              items={reorderProducts}
              getKey={(p) => p.id}
              disabled={reorderBusy}
              onReorder={saveProductOrder}
              renderItem={(p) => (
                <div className="flex items-center justify-between bg-[#f6f6f7] border border-[#e1e3e5] rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {p.images?.[0] ? (
                      <img src={api.imageUrl(p.images[0])} className="w-8 h-8 object-cover rounded" />
                    ) : (
                      <div className="w-8 h-8 bg-[#e1e3e5] rounded" />
                    )}
                    <span className="text-sm text-[#202223] truncate">{p.title}</span>
                  </div>
                </div>
              )}
            />
            {reorderProducts.length === 0 && <p className="text-[#8c9196] text-sm">No products in this collection yet.</p>}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-[#8c9196]">Tap a tile's image to edit it, same as Products.</p>
        {collections.length > 1 && (
          <button onClick={() => setReorderCollectionsOpen(true)} className="text-[#202223] text-sm font-medium hover:underline shrink-0">
            Reorder Collections
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2.5">
        {collections.map((c) => (
          <div key={c.id} className={`group relative ${card} p-2 flex flex-col`}>
            <button
              onClick={() => setEditing(c)}
              className="aspect-square w-full rounded-lg overflow-hidden bg-[#f6f6f7] border border-[#e1e3e5]"
              title="Edit collection"
            >
              {c.image ? (
                <img src={api.imageUrl(c.image)} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#c9cccf] text-[10px]">No image</div>
              )}
            </button>
            <p className="text-[#202223] text-[11px] sm:text-xs font-semibold mt-1.5 leading-snug line-clamp-2">{c.name}</p>
            <p className="text-[#8c9196] text-[11px] sm:text-xs truncate">/{c.slug}</p>
            <div className="flex gap-2 mt-1.5 pt-1.5 border-t border-[#f0f0f0] flex-wrap">
              <button onClick={() => setEditing(c)} className="text-[10px] sm:text-[11px] font-semibold text-[#202223] hover:underline">Edit</button>
              <button onClick={() => openReorder(c)} className="text-[10px] sm:text-[11px] font-semibold text-[#202223] hover:underline">Products</button>
              <button onClick={() => remove(c.id)} className="text-[10px] sm:text-[11px] font-semibold text-red-500 hover:underline">Delete</button>
            </div>
          </div>
        ))}
        {collections.length === 0 && <p className="text-[#8c9196] text-sm col-span-full">No collections yet.</p>}
      </div>

      {reorderCollectionsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setReorderCollectionsOpen(false)}>
          <div className={`${card} w-full max-w-lg max-h-[85vh] overflow-y-auto p-6`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-black text-[#202223]">Reorder Collections</h3>
              <button onClick={() => setReorderCollectionsOpen(false)} className="text-[#8c9196] hover:text-[#202223]"><X size={18} /></button>
            </div>
            <p className="text-xs text-[#8c9196] mb-4">Drag the handle to change the order collections appear on the storefront.</p>
            <DragReorderList
              items={collections}
              getKey={(c) => c.id}
              disabled={reorderBusy}
              onReorder={saveCollectionsOrder}
              renderItem={(c) => (
                <div className="flex items-center justify-between bg-[#f6f6f7] border border-[#e1e3e5] rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {c.image ? (
                      <img src={api.imageUrl(c.image)} className="w-8 h-8 object-cover rounded" />
                    ) : (
                      <div className="w-8 h-8 bg-[#e1e3e5] rounded" />
                    )}
                    <span className="text-sm text-[#202223] truncate">{c.name}</span>
                  </div>
                </div>
              )}
            />
          </div>
        </div>
      )}

      {collectionCropFile && (
        <ImageCropModal
          file={collectionCropFile}
          onCancel={() => setCollectionCropFile(null)}
          onConfirm={uploadCroppedCollectionImage}
        />
      )}
    </div>
  );
}

// ---------------- Orders ----------------
const STATUSES = ["pending", "processing", "ready_to_ship", "shipped", "out_for_delivery", "delivered", "cancelled", "returned"];
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  processing: "bg-blue-50 text-blue-700",
  ready_to_ship: "bg-purple-50 text-purple-700",
  shipped: "bg-cyan-50 text-cyan-700",
  out_for_delivery: "bg-indigo-50 text-indigo-700",
  delivered: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-700",
  returned: "bg-[#f0f0f0] text-[#6d7175]",
};

function copyText(text: string) {
  navigator.clipboard?.writeText(text).catch(() => {});
}

// A customer's uploaded "print" file can be either an image or a video —
// tell them apart by extension so the Orders tab knows whether to render
// an <img> or <video> preview.
function isVideoFile(url: string) {
  return /\.(mp4|webm|mov)$/i.test(url || "");
}

// Forces a real download of a customer-uploaded file (instead of just
// opening it in a new tab, which is what a plain <a href> does for
// cross-origin URLs) by fetching it as a blob first.
async function downloadCustomerFile(pathOrUrl: string, filenameBase: string) {
  try {
    const fullUrl = api.imageUrl(pathOrUrl);
    const res = await fetch(fullUrl);
    const blob = await res.blob();
    const ext = (pathOrUrl.match(/\.[a-z0-9]+$/i) || [""])[0] || "";
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `${filenameBase}${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
  } catch {
    // Fallback: just open it so the admin can still save it manually.
    window.open(api.imageUrl(pathOrUrl), "_blank");
  }
}

// Short, friendly two-tone "ding" - built with the Web Audio API so no sound
// file needs to be bundled/hosted. Plays when a brand-new order is detected.
function playNewOrderSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration + 0.05);
    };
    playTone(880, 0, 0.15);
    playTone(1175, 0.15, 0.25);
  } catch {
    /* Web Audio unsupported/blocked - fail silently, toast still shows */
  }
}

// ---------------- Orders date-range filter ----------------
type OrderDateFilter = "all" | "today" | "yesterday" | "last7" | "last30" | "last90" | "last180" | "last365";

const ORDER_DATE_FILTERS: { key: OrderDateFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last7", label: "Last Week" },
  { key: "last30", label: "Last Month" },
  { key: "last90", label: "Last 3 Months" },
  { key: "last180", label: "Last 6 Months" },
  { key: "last365", label: "Last Year" },
];

// Orders store createdAt as a plain IST datetime string (see db.js - the
// connection session is forced to +05:30), so comparing against a local
// "now" here lines up with how the backend already buckets today/yesterday
// for the Reports tab.
function filterOrdersByDateRange(orders: Order[], filter: OrderDateFilter): Order[] {
  if (filter === "all") return orders;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let rangeStart: Date;
  let rangeEnd: Date | null = null; // exclusive upper bound, null = up to now

  switch (filter) {
    case "today":
      rangeStart = startOfToday;
      break;
    case "yesterday":
      rangeStart = new Date(startOfToday);
      rangeStart.setDate(rangeStart.getDate() - 1);
      rangeEnd = startOfToday;
      break;
    case "last7":
      rangeStart = new Date(startOfToday);
      rangeStart.setDate(rangeStart.getDate() - 7);
      break;
    case "last30":
      rangeStart = new Date(startOfToday);
      rangeStart.setDate(rangeStart.getDate() - 30);
      break;
    case "last90":
      rangeStart = new Date(startOfToday);
      rangeStart.setDate(rangeStart.getDate() - 90);
      break;
    case "last180":
      rangeStart = new Date(startOfToday);
      rangeStart.setDate(rangeStart.getDate() - 180);
      break;
    case "last365":
      rangeStart = new Date(startOfToday);
      rangeStart.setDate(rangeStart.getDate() - 365);
      break;
    default:
      return orders;
  }

  return orders.filter((o: any) => {
    if (!o.createdAt) return false;
    const created = new Date(o.createdAt);
    if (created < rangeStart) return false;
    if (rangeEnd && created >= rangeEnd) return false;
    return true;
  });
}

function OrderDateFilterBar({
  value,
  onChange,
  total,
  filteredCount,
}: {
  value: OrderDateFilter;
  onChange: (v: OrderDateFilter) => void;
  total: number;
  filteredCount: number;
}) {
  return (
    <div className={`${card} p-3 mb-1`}>
      <div className="flex items-center gap-2 flex-wrap">
        {ORDER_DATE_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
              value === f.key
                ? "btn-liquid-dark border-transparent"
                : "bg-white text-[#6d7175] border-[#e1e3e5] hover:bg-[#f6f6f7]"
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="text-xs text-[#8c9196] ml-auto">
          Showing {filteredCount} of {total} order{total === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}

function OrdersTab() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<OrderDateFilter>("all");
  // Tracks which order IDs we've already seen, so we only ding for orders
  // that are genuinely new (not on the very first load of the tab).
  const knownIdsRef = useRef<Set<string> | null>(null);

  const load = async () => {
    const fresh: Order[] = await api.getAuth("/api/orders");
    setOrders(fresh);

    const freshIds = new Set(fresh.map((o: any) => o.id));
    if (knownIdsRef.current) {
      const newOnes = fresh.filter((o: any) => !knownIdsRef.current!.has(o.id));
      if (newOnes.length > 0) {
        playNewOrderSound();
        showToast(
          newOnes.length === 1 ? `New order received: ${newOnes[0].id}` : `${newOnes.length} new orders received`,
          "success"
        );
      }
    }
    knownIdsRef.current = freshIds;
  };

  useEffect(() => {
    load();
    // Live auto-refresh so new orders (and status changes made elsewhere)
    // show up without the admin needing to manually reload the tab.
    const iv = setInterval(load, 1000);
    return () => clearInterval(iv);
  }, []);

  const updateStatus = async (id: string, status: string, trackingId?: string) => {
    try {
      await api.put(`/api/orders/${id}/status`, trackingId !== undefined ? { status, trackingId } : { status });
      showToast("Order status updated", "success");
      load();
    } catch (err: any) {
      showToast(err.message || "Failed to update status", "error");
    }
  };

  // Builds the default WhatsApp message sent to a customer for a given order:
  // order id, customer name, phone model(s), total bill, and (if available) the tracking id + link.
  const buildWaMessage = (o: any) => {
    const models = (o.items || []).map((i: any) => i.selectedModel).filter(Boolean).join(", ");
    // Courier partner depends on destination state: Tamil Nadu + Pondicherry orders
    // go out via ST Courier, every other state ships through India Post.
    const stateLower = (o.state || "").trim().toLowerCase();
    const isTNorPondy = stateLower.includes("tamil") || stateLower.includes("pondicherry") || stateLower.includes("puducherry");
    const courierLine = isTNorPondy
      ? `Courier: ST Courier — track at https://stcourier.com/track/shipment`
      : `Courier: India Post — track at https://www.indiapost.gov.in/`;
    const lines = [
      `Hi ${o.customerName || "there"}, greetings from Stickover! 👋`,
      ``,
      `Order ID: ${o.id}`,
      models ? `Phone Model: ${models}` : null,
      `Total Bill: ₹${o.total}`,
      o.trackingId ? `Tracking ID: ${o.trackingId}` : `Tracking ID: will be shared once shipped`,
      courierLine,
    ].filter(Boolean);
    return lines.join("\n");
  };

  // Sent automatically (via a fresh WhatsApp tab) once an order is marked Delivered:
  // thanks the customer, and asks them to share a photo + leave a review, linking
  // straight to the storefront's review page.
  const buildDeliveredMessage = (o: any) => {
    const lines = [
      `Hi ${o.customerName || "there"}, thanks for shopping with us! 🙏`,
      ``,
      `Order ID: ${o.id}`,
      `Kindly share the image of the product and also make a review here:`,
      `https://stickover.in/reviews`,
    ];
    return lines.join("\n");
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this order?")) return;
    try {
      await api.del(`/api/orders/${id}`);
      showToast("Order deleted", "success");
      load();
    } catch (err: any) {
      showToast(err.message || "Failed to delete order", "error");
    }
  };

  const filteredOrders = filterOrdersByDateRange(orders, dateFilter);

  return (
    <div className="space-y-2">
      <OrderDateFilterBar value={dateFilter} onChange={setDateFilter} total={orders.length} filteredCount={filteredOrders.length} />
      {filteredOrders.map((o: any) => {
        const isOpen = expanded === o.id;
        const waNumber = (o.customerPhone || "").replace(/\D/g, "");
        return (
          <div key={o.id} className={card}>
            <div
              onClick={() => setExpanded(isOpen ? null : o.id)}
              className="px-4 py-3 flex items-center justify-between flex-wrap gap-2 cursor-pointer"
            >
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[#202223] text-sm font-mono font-bold">{o.id}</p>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${STATUS_COLORS[o.status] || "bg-[#f0f0f0] text-[#6d7175]"}`}>
                    {o.status.replace(/_/g, " ")}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-[#8c9196]">{o.paymentMethod}</span>
                  {o.previewRequested && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#25D366]/10 text-[#0c8a3e]" title="Customer requested a preview image on WhatsApp">
                      Preview requested
                    </span>
                  )}
                </div>
                <p className="text-[#8c9196] text-xs mt-1">
                  {o.customerName} · {o.customerPhone} · {o.city}, {o.state} · ₹{o.total}
                  {" · "}
                  <span className="font-semibold">
                    {(o.state || "").trim().toLowerCase().includes("tamil") ? "ST Courier" : "India Post"}
                  </span>
                  {o.trackingId && <span className="ml-2 text-emerald-700 font-bold">· Tracking: {o.trackingId}</span>}
                  {o.createdAt && (
                    <span className="ml-2 text-[#8c9196]">
                      · {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      {" "}
                      {new Date(o.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <select
                  value={o.status}
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    if (newStatus === "ready_to_ship") {
                      const tid = window.prompt("Enter the tracking ID for this shipment:", o.trackingId || "");
                      if (tid === null) return; // admin cancelled
                      if (!tid.trim()) { showToast("Tracking ID is required to mark as Ready to Ship", "error"); return; }
                      updateStatus(o.id, newStatus, tid.trim());
                    } else if (newStatus === "delivered") {
                      updateStatus(o.id, newStatus);
                      if (waNumber) {
                        window.open(
                          `https://wa.me/91${waNumber.slice(-10)}?text=${encodeURIComponent(buildDeliveredMessage(o))}`,
                          "_blank"
                        );
                      }
                    } else {
                      updateStatus(o.id, newStatus);
                    }
                  }}
                  className="bg-white border border-[#c9cccf] rounded-lg px-2.5 py-1.5 text-[#202223] text-sm"
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                </select>
                {waNumber && (
                  <a
                    href={`https://wa.me/91${waNumber.slice(-10)}?text=${encodeURIComponent(buildWaMessage(o))}`}
                    target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-green-600 border border-green-200 rounded-lg px-2 py-1.5 text-xs font-semibold hover:bg-green-50"
                  >
                    <MessageCircle size={13} /> WhatsApp
                  </a>
                )}
                <button onClick={() => remove(o.id)} className="text-red-400 hover:text-red-600 p-1.5">
                  <X size={15} />
                </button>
              </div>
            </div>

            {isOpen && (
              <div className="border-t border-[#e1e3e5] p-4 grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-bold uppercase text-[#8c9196] mb-2">Customer</h4>
                  <div className="bg-[#f6f6f7] rounded-lg p-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#202223]">{o.customerName}</span>
                      <button onClick={() => copyText(o.customerName)} className="text-[#8c9196] hover:text-[#202223]"><Copy size={13} /></button>
                    </div>
                    <div className="flex items-center justify-between text-[#6d7175]">
                      <span>{o.customerPhone}</span>
                      <button onClick={() => copyText(o.customerPhone)} className="text-[#8c9196] hover:text-[#202223]"><Copy size={13} /></button>
                    </div>
                    {o.customerAltPhone && (
                      <div className="flex items-center justify-between text-[#6d7175] text-xs">
                        <span>ALT: {o.customerAltPhone}</span>
                        <button onClick={() => copyText(o.customerAltPhone)} className="text-[#8c9196] hover:text-[#202223]"><Copy size={13} /></button>
                      </div>
                    )}
                    {o.customerEmail && <div className="text-[#6d7175] text-xs">{o.customerEmail}</div>}
                  </div>
                  <h4 className="text-xs font-bold uppercase text-[#8c9196] mb-2 mt-3">Ship To</h4>
                  <div className="bg-[#f6f6f7] rounded-lg p-3 text-sm text-[#202223] space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <span>{o.shippingAddress}</span>
                      <button onClick={() => copyText(o.shippingAddress)} className="text-[#8c9196] hover:text-[#202223] shrink-0"><Copy size={13} /></button>
                    </div>
                    <p className="text-[#6d7175]">{o.city}, {o.state}</p>
                    <p className="font-bold text-[#202223]">PIN: {o.pincode}</p>
                  </div>
                  <h4 className="text-xs font-bold uppercase text-[#8c9196] mb-2 mt-3">Tracking</h4>
                  <div className="bg-[#f6f6f7] rounded-lg p-3 text-sm text-[#202223] flex items-center justify-between gap-2">
                    <span className={o.trackingId ? "font-bold text-emerald-700" : "text-[#8c9196]"}>
                      {o.trackingId || "No tracking ID yet"}
                    </span>
                    <button
                      onClick={() => {
                        const tid = window.prompt("Enter / update the tracking ID:", o.trackingId || "");
                        if (tid === null) return;
                        updateStatus(o.id, o.status, tid.trim());
                      }}
                      className="text-[#8c9196] hover:text-[#202223] shrink-0 text-xs font-semibold"
                    >
                      {o.trackingId ? "Edit" : "Add"}
                    </button>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase text-[#8c9196] mb-2">Order Items ({o.items?.length || 0})</h4>
                  <div className="space-y-2">
                    {(o.items || []).map((item: any, i: number) => (
                      <div key={i} className="bg-[#f6f6f7] rounded-lg p-3 flex items-center gap-3">
                        {item.product?.images?.[0] && (
                          <img src={api.imageUrl(item.product.images[0])} className="w-12 h-12 rounded-lg object-cover border border-[#c9cccf]" />
                        )}
                        <div className="flex-1 text-sm">
                          <p className="font-semibold text-[#202223]">{item.product?.title}</p>
                          {item.selectedModel && <p className="text-xs text-blue-600 font-medium">{item.selectedModel}</p>}
                          <p className="text-xs text-[#8c9196]">Qty: {item.quantity}</p>
                          {item.customName && (
                            <p className="text-xs font-bold text-emerald-700 mt-0.5">Text 1: "{item.customName}"</p>
                          )}
                          {item.customName2 && (
                            <p className="text-xs font-bold text-emerald-700 mt-0.5">Text 2: "{item.customName2}"</p>
                          )}
                          {item.customVariant && (
                            <p className="text-xs font-bold text-emerald-700 mt-0.5">{item.customVariant}</p>
                          )}
                        </div>
                        {item.customImage && (
                          <div className="flex flex-col items-center gap-1 shrink-0">
                            <a
                              href={api.imageUrl(item.customImage)}
                              target="_blank"
                              rel="noreferrer"
                              title={`Customer's uploaded ${isVideoFile(item.customImage) ? "video" : "photo"} — click to view full size`}
                            >
                              {isVideoFile(item.customImage) ? (
                                <video src={api.imageUrl(item.customImage)} className="w-12 h-12 rounded-lg object-cover ring-2 ring-emerald-500" muted />
                              ) : (
                                <img src={api.imageUrl(item.customImage)} className="w-12 h-12 rounded-lg object-cover ring-2 ring-emerald-500" />
                              )}
                            </a>
                            <span className="text-[9px] font-bold text-emerald-600 uppercase">{item.customImage2 ? "Photo 1" : (isVideoFile(item.customImage) ? "Print video" : "Print photo")}</span>
                            <button
                              onClick={() => downloadCustomerFile(item.customImage, `${o.id}-${i + 1}-1`)}
                              className="text-[9px] font-bold text-[#6d7175] hover:text-[#202223] flex items-center gap-0.5"
                              title="Download this file"
                            >
                              <Download size={10} /> Download
                            </button>
                          </div>
                        )}
                        {item.customImage2 && (
                          <div className="flex flex-col items-center gap-1 shrink-0">
                            <a
                              href={api.imageUrl(item.customImage2)}
                              target="_blank"
                              rel="noreferrer"
                              title="Customer's uploaded photo 2 — click to view full size"
                            >
                              <img src={api.imageUrl(item.customImage2)} className="w-12 h-12 rounded-lg object-cover ring-2 ring-emerald-500" />
                            </a>
                            <span className="text-[9px] font-bold text-emerald-600 uppercase">Photo 2</span>
                            <button
                              onClick={() => downloadCustomerFile(item.customImage2, `${o.id}-${i + 1}-2`)}
                              className="text-[9px] font-bold text-[#6d7175] hover:text-[#202223] flex items-center gap-0.5"
                              title="Download this file"
                            >
                              <Download size={10} /> Download
                            </button>
                          </div>
                        )}
                        <p className="text-sm font-bold text-[#202223]">₹{(item.product?.price || 0) * item.quantity}</p>
                      </div>
                    ))}
                  </div>
                  <div className="text-sm mt-3 space-y-1 text-[#6d7175]">
                    <div className="flex justify-between"><span>Subtotal</span><span>₹{o.subtotal}</span></div>
                    <div className="flex justify-between"><span>Shipping</span><span>{o.shipping ? `₹${o.shipping}` : "Free"}</span></div>
                    <div className="flex justify-between font-bold text-[#202223]"><span>Total</span><span>₹{o.total}</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {orders.length === 0 && <p className="text-[#8c9196] text-sm">No orders yet.</p>}
    </div>
  );
}

// ---------------- Customers (derived from orders, grouped by phone number) ----------------
function CustomersTab() {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.getAuth("/api/customers")
      .then(setCustomers)
      .catch((err: any) => showToast(err.message || "Failed to load customers", "error"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return c.phone.includes(q) || (c.name || "").toLowerCase().includes(q) || (c.city || "").toLowerCase().includes(q);
  });

  const frequentCount = customers.filter((c) => c.isFrequent).length;

  return (
    <div className="space-y-3">
      <div className={`flex items-center justify-between gap-3 ${card} px-4 py-3 flex-wrap`}>
        <div className="flex items-center gap-4 text-xs text-[#6d7175]">
          <span><strong className="text-[#202223]">{customers.length}</strong> total customers</span>
          <span className="flex items-center gap-1 text-amber-600 font-semibold">
            <Star size={13} fill="currentColor" /> {frequentCount} frequent (2+ orders)
          </span>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by phone, name or city…"
          className="bg-white border border-[#c9cccf] rounded-lg px-3 py-1.5 text-sm text-[#202223] w-full sm:w-64"
        />
      </div>

      {loading ? (
        <p className="text-[#8c9196] text-sm">Loading customers…</p>
      ) : filtered.length === 0 ? (
        <p className="text-[#8c9196] text-sm">No customers found.</p>
      ) : (
        <div className={`${card} overflow-x-auto`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-bold uppercase text-[#8c9196] border-b border-[#e1e3e5]">
                <th className="px-4 py-2.5">Customer</th>
                <th className="px-4 py-2.5">Phone</th>
                <th className="px-4 py-2.5">City</th>
                <th className="px-4 py-2.5">Orders</th>
                <th className="px-4 py-2.5">Total Spent</th>
                <th className="px-4 py-2.5">Last Order</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.phone} className="border-b border-[#f0f0f0] last:border-0 hover:bg-[#fafbfb]">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[#202223]">{c.name || "—"}</span>
                      {c.isFrequent && (
                        <span className="flex items-center gap-0.5 text-[9px] font-bold uppercase text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-1.5 py-0.5">
                          <Star size={9} fill="currentColor" /> Frequent
                        </span>
                      )}
                    </div>
                    {c.email && <div className="text-[#8c9196] text-xs mt-0.5">{c.email}</div>}
                  </td>
                  <td className="px-4 py-2.5 text-[#202223]">{c.phone}</td>
                  <td className="px-4 py-2.5 text-[#6d7175]">{c.city || "—"}</td>
                  <td className="px-4 py-2.5 font-bold text-[#202223]">{c.orderCount}</td>
                  <td className="px-4 py-2.5 font-bold text-[#202223]">₹{c.totalSpent}</td>
                  <td className="px-4 py-2.5 text-[#6d7175] text-xs">{new Date(c.lastOrderAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  const w = 80, h = 32;
  const pts = data.map((v, i) => `${(i / Math.max(data.length - 1, 1)) * w},${h - (v / max) * h}`).join(" ");
  const gradId = `grad-${color.replace("#", "")}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#${gradId})`} />
      {data.length > 0 && (() => {
        const last = data[data.length - 1];
        return <circle cx={w} cy={h - (last / max) * h} r="3" fill={color} />;
      })()}
    </svg>
  );
}

function TrendBadge({ pct }: { pct: number | null }) {
  if (pct === null) return null;
  const up = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${up ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
      {up ? "↑" : "↓"} {Math.abs(pct)}%
    </span>
  );
}

// Neat SVG line chart for the revenue card. Dates are rendered in the
// browser's local timezone (Asia/Kolkata for IST admins) so labels always
// match what the admin sees on their own clock, not server/UTC time.
function RevenueLineChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) return <div className="h-40" />;

  const values = data.map((d) => Number(d.revenue));
  const max = Math.max(1, ...values);

  const formatDay = (day: string) => {
    const d = new Date(day);
    if (isNaN(d.getTime())) return day;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
  };

  return (
    <div className="flex items-end gap-2 h-48">
      {data.map((d: any, i: number) => (
        <div key={d.day ?? i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
          <div className="text-[9px] font-bold text-[#202223] mb-1 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-5 whitespace-nowrap">
            ₹{Number(d.revenue).toLocaleString("en-IN")}
          </div>
          <div
            className="w-full max-w-[36px] rounded-t-md bg-[#2c6ecb] hover:bg-[#1a56b0] transition-colors"
            style={{ height: `${Math.max(4, (Number(d.revenue) / max) * 100)}%` }}
          />
          <span className="text-[9px] text-[#8c9196] font-semibold mt-1.5">{formatDay(d.day)}</span>
        </div>
      ))}
    </div>
  );
}

function trendOf(arr: number[]) {
  const last = arr[arr.length - 1] ?? 0;
  const prev = arr[arr.length - 2] ?? 0;
  if (prev === 0) return null;
  return Math.round(((last - prev) / prev) * 100);
}

const PERIOD_OPTIONS: { key: string; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "this_week", label: "This Week" },
  { key: "last_week", label: "Last Week" },
  { key: "this_month", label: "This Month" },
  { key: "last_month", label: "Last Month" },
  { key: "last_3_months", label: "Last 3 Months" },
  { key: "last_6_months", label: "Last 6 Months" },
  { key: "last_1_year", label: "Last 1 Year" },
];

function DashboardTab() {
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState<string>("today");
  const [visitors, setVisitors] = useState<any[]>([]);
  const [visitorStats, setVisitorStats] = useState<{ today: number; yesterday: number; last7Days: number }>({ today: 0, yesterday: 0, last7Days: 0 });
  const [liveLoading, setLiveLoading] = useState(false);

  useEffect(() => {
    api.getAuth(`/api/analytics/dashboard?period=${period}`).then(setData).catch(() => {});
  }, [period]);

  useEffect(() => {
    api.getAuth("/api/analytics/visitor-stats").then(setVisitorStats).catch(() => {});
  }, []);

  const loadLive = () => {
    setLiveLoading(true);
    api.getAuth("/api/analytics/live-visitors").catch(() => [])
      .then((v) => setVisitors(v))
      .finally(() => setLiveLoading(false));
  };
  useEffect(() => {
    loadLive();
    // Live Activity panel refreshes every 1 second for a near-real-time feed
    const iv = setInterval(loadLive, 1000);
    return () => clearInterval(iv);
  }, []);

  if (!data) return <p className="text-[#8c9196] text-sm">Loading analytics...</p>;

  // last 7 days of the 30-day revenue series, for sparklines
  const last7 = data.dailyRevenue.slice(-7);
  const dailySales = last7.map((d: any) => Number(d.revenue));
  const dailyOrders = last7.map((d: any) => Number(d.orders));
  const pendingCount = (data.statusBreakdown.find((s: any) => s.status === "pending")?.count) || 0;
  const totalOrdersInBreakdown = data.statusBreakdown.reduce((s: number, x: any) => s + Number(x.count), 0);
  const maxRevenue = Math.max(1, ...data.dailyRevenue.map((d: any) => Number(d.revenue)));

  const periodLabel = PERIOD_OPTIONS.find((p) => p.key === period)?.label || "Today";
  const periodRevenue = Number(data.period?.revenueInPeriod ?? data.today.revenueToday);
  const periodOrders = Number(data.period?.ordersInPeriod ?? data.today.ordersToday);
  const periodPending = data.period?.pendingInPeriod ?? pendingCount;

  const kpis = [
    {
      label: "Total Sales", value: `₹${periodRevenue.toLocaleString("en-IN")}`,
      sub: `${periodOrders} orders · ${periodLabel}`, color: "#000000", icon: IndianRupee, sparkData: dailySales, trendPct: trendOf(dailySales),
    },
    {
      label: "Orders", value: periodOrders,
      sub: periodLabel, color: "#2c6ecb", icon: Package, sparkData: dailyOrders, trendPct: trendOf(dailyOrders),
    },
    {
      label: "Pending Orders", value: periodPending, sub: `need attention · ${periodLabel}`,
      color: "#10b981", icon: Clock3, sparkData: dailySales, trendPct: null,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-[#6d7175] font-medium">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-[#f6f6f7] border border-[#e1e3e5] rounded-full p-1 overflow-x-auto max-w-full no-scrollbar">
          {PERIOD_OPTIONS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`text-[11px] font-bold px-3.5 py-2 rounded-full whitespace-nowrap transition-colors shrink-0 ${
                period === p.key ? "btn-liquid-dark" : "text-[#6d7175] hover:bg-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards with sparklines */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k, i) => (
          <div key={i} className="bg-white border border-[#e1e3e5] rounded-2xl p-4 flex flex-col justify-between min-h-[120px] hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${k.color}1a`, color: k.color }}>
                    <k.icon size={13} />
                  </span>
                  <p className="text-[10px] font-bold text-[#6d7175] uppercase tracking-wider truncate">{k.label}</p>
                </div>
                <p className="text-2xl font-black text-[#202223] mt-1.5 leading-none">{k.value}</p>
                <p className="text-[10px] text-[#8c9196] mt-1">{k.sub}</p>
              </div>
              <TrendBadge pct={k.trendPct} />
            </div>
            <div className="mt-3">
              <Sparkline data={k.sparkData.length ? k.sparkData : [0]} color={k.color} />
              <p className="text-[9px] text-[#c9cccf] mt-1">Last 7 days</p>
            </div>
          </div>
        ))}

        {/* Total Visitors - distinct visitor counts, not a live "browsing now" count */}
        <div className="bg-white border border-[#e1e3e5] rounded-2xl p-4 flex flex-col justify-between min-h-[120px] hover:shadow-md transition-shadow">
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-[#f3e8ff] text-[#9333ea]">
              <Eye size={13} />
            </span>
            <p className="text-[10px] font-bold text-[#6d7175] uppercase tracking-wider truncate">Total Visitors</p>
          </div>
          <div className="mt-2.5 space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] text-[#8c9196] font-medium">Today</span>
              <span className="text-base font-black text-[#202223] leading-none">{visitorStats.today}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] text-[#8c9196] font-medium">Yesterday</span>
              <span className="text-base font-black text-[#202223] leading-none">{visitorStats.yesterday}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] text-[#8c9196] font-medium">Last 7 Days</span>
              <span className="text-base font-black text-[#202223] leading-none">{visitorStats.last7Days}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue chart */}
      <div className={`${card} p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-bold text-[#202223]">Revenue — {periodLabel}</h3>
          <div className="flex items-center gap-1 bg-[#f6f6f7] border border-[#e1e3e5] rounded-full p-1">
            {[
              { key: "today", label: "Today" },
              { key: "yesterday", label: "Yesterday" },
              { key: "this_week", label: "Last 7 Days" },
            ].map((q) => (
              <button
                key={q.key}
                onClick={() => setPeriod(q.key)}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition-colors ${
                  period === q.key ? "btn-liquid-dark" : "text-[#6d7175] hover:bg-white"
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>
        <RevenueLineChart data={data.dailyRevenue} />
        {data.dailyRevenue.length === 0 && <p className="text-[#8c9196] text-sm mt-2">No orders in this period.</p>}
      </div>

      {/* Order fulfillment breakdown */}
      <div className={`${card} p-5`}>
        <h3 className="text-sm font-bold text-[#202223] mb-4">Order Fulfillment — {periodLabel}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {data.statusBreakdown.map((s: any) => (
            <div key={s.status} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-bold text-xs text-[#202223]">{s.status.replace(/_/g, " ")}</span>
                <span className="font-bold text-[#202223]">{s.count}</span>
              </div>
              <div className="h-2 bg-[#f0f0f0] rounded-full overflow-hidden">
                <div className="h-full bg-[#2c6ecb] rounded-full" style={{ width: `${totalOrdersInBreakdown > 0 ? Math.round((s.count / totalOrdersInBreakdown) * 100) : 0}%` }} />
              </div>
              <p className="text-xs text-[#6d7175]">{totalOrdersInBreakdown > 0 ? Math.round((s.count / totalOrdersInBreakdown) * 100) : 0}% of orders</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top selling products */}
      <div className={`${card} p-5`}>
        <h3 className="text-sm font-bold text-[#202223] mb-4">Top Selling Products</h3>
        <div className="space-y-2">
          {data.topProducts.map((p: any, i: number) => (
            <div key={p.id} className="flex items-center justify-between text-sm">
              <span className="text-[#202223]">{i + 1}. {p.title}</span>
              <span className="text-[#8c9196]">{p.qty} sold</span>
            </div>
          ))}
          {data.topProducts.length === 0 && <p className="text-[#8c9196] text-sm">No sales yet.</p>}
        </div>
      </div>

      {/* Live Activity: visitors browsing the storefront right now */}
      <div className={`${card} overflow-hidden`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e1e3e5]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <h3 className="font-bold text-[#202223] text-sm">Live Activity — Visitors ({visitors.length})</h3>
          </div>
          <button onClick={loadLive} className={`p-1.5 rounded-lg bg-[#f6f6f7] hover:bg-[#e1e3e5] text-[#6d7175] transition-all ${liveLoading ? "animate-spin" : ""}`}>
            <RefreshCwIcon />
          </button>
        </div>

        {visitors.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm font-semibold text-[#6d7175]">No active visitors right now</p>
              <p className="text-xs text-[#9ca3af] mt-1">Auto-refreshes every 1s</p>
            </div>
          ) : (
            <div className="divide-y divide-[#f1f1f1]">
              {visitors.map((v) => {
                const secondsOn = Math.max(0, Math.floor((Date.now() - new Date(v.firstSeen).getTime()) / 1000));
                const mins = Math.floor(secondsOn / 60);
                const durationLabel = mins > 0 ? `${mins}m ${secondsOn % 60}s` : `${secondsOn}s`;
                const knownName = v.customerName || v.customerPhone;
                return (
                  <div key={v.id} className="px-5 py-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                        <span className="font-medium text-[#202223] truncate">
                          {knownName ? knownName : (v.page === "/" ? "Homepage" : (v.pageLabel || v.page))}
                        </span>
                        {v.isCheckout && (
                          <span className="text-[9px] font-bold uppercase text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-1.5 py-0.5 shrink-0">
                            At Checkout
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#6d7175] shrink-0">
                        {v.cartCount > 0 && <span className="bg-[#e8f0ff] text-[#2c6ecb] px-2 py-0.5 rounded-full font-semibold">{v.cartCount} in cart</span>}
                        <span className="flex items-center gap-1"><Clock3 size={11} /> {durationLabel}</span>
                      </div>
                    </div>

                    {/* Secondary line: what they're viewing right now + any info captured at checkout */}
                    <div className="pl-3.5 mt-1 text-xs text-[#6d7175] flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span>{v.page === "/" ? "Homepage" : (v.pageLabel || v.page)}</span>
                      {v.ipAddress && (
                        <>
                          <span className="text-[#c9cccf]">·</span>
                          <span className="truncate">
                            {v.geoLocation ? v.geoLocation : "IP"} ({v.ipAddress})
                          </span>
                        </>
                      )}
                      {v.customerPhone && (
                        <>
                          <span className="text-[#c9cccf]">·</span>
                          <span>{v.customerPhone}</span>
                        </>
                      )}
                      {v.customerEmail && (
                        <>
                          <span className="text-[#c9cccf]">·</span>
                          <span className="truncate">{v.customerEmail}</span>
                        </>
                      )}
                      {(v.shippingAddress || v.city) && (
                        <>
                          <span className="text-[#c9cccf]">·</span>
                          <span className="truncate">
                            {[v.shippingAddress, v.apartment, v.city, v.state, v.pincode].filter(Boolean).join(", ")}
                          </span>
                        </>
                      )}
                      {v.checkoutTotal ? (
                        <>
                          <span className="text-[#c9cccf]">·</span>
                          <span className="font-semibold text-[#202223]">₹{v.checkoutTotal} cart value</span>
                        </>
                      ) : null}
                      {v.customerPhone && (
                        <a
                          href={`https://wa.me/91${v.customerPhone.replace(/\D/g, "").slice(-10)}`}
                          target="_blank" rel="noreferrer"
                          className="font-semibold text-emerald-600 hover:underline ml-auto"
                        >
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>

      <a href={`${API_URL}/api/analytics/feed.xml`} target="_blank" rel="noreferrer" className="inline-block text-sm text-[#6d7175] hover:underline">
        View merchant feed (Google Shopping / Meta catalog) →
      </a>
    </div>
  );
}

// ---------------- Abandoned Checkouts ----------------
// Carts where a visitor entered checkout details but never completed the
// order — pulled out of the old Dashboard "Live Activity" toggle into its
// own Sales sub-tab so it's easier to find and act on.

type AbandonedRangeFilter = "today" | "yesterday" | "this_week" | "last_week" | "this_month" | "all";

const ABANDONED_RANGE_OPTIONS: { value: AbandonedRangeFilter; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this_week", label: "This Week" },
  { value: "last_week", label: "Last Week" },
  { value: "this_month", label: "This Month" },
  { value: "all", label: "All" },
];

// Monday-start week boundaries (matches how most IN businesses think of "this week").
function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfWeek(d: Date) {
  const x = startOfDay(d);
  const day = (x.getDay() + 6) % 7; // 0 = Monday
  x.setDate(x.getDate() - day);
  return x;
}
function inRange(date: Date, filter: AbandonedRangeFilter): boolean {
  const now = new Date();
  if (filter === "all") return true;
  if (filter === "today") return startOfDay(date).getTime() === startOfDay(now).getTime();
  if (filter === "yesterday") {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    return startOfDay(date).getTime() === startOfDay(y).getTime();
  }
  if (filter === "this_week") {
    return date.getTime() >= startOfWeek(now).getTime();
  }
  if (filter === "last_week") {
    const thisWeekStart = startOfWeek(now);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    return date.getTime() >= lastWeekStart.getTime() && date.getTime() < thisWeekStart.getTime();
  }
  if (filter === "this_month") {
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }
  return true;
}

// e.g. "Today, 4:32 PM" / "Yesterday, 11:05 AM" / "12 Aug, 6:40 PM"
function formatAbandonedTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const time = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
  if (startOfDay(d).getTime() === startOfDay(now).getTime()) return `Today, ${time}`;
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  if (startOfDay(d).getTime() === startOfDay(y).getTime()) return `Yesterday, ${time}`;
  const datePart = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
  return `${datePart}, ${time}`;
}

// ---- Abandoned Checkout WhatsApp follow-up message templates ----
// Admin sets up two message templates in Settings (Tamil Nadu & Puducherry
// vs every other state). Clicking WhatsApp on an abandoned checkout builds
// the actual message from whichever template matches that customer's state,
// filling in the products (each with its own working product-page link),
// phone model, personalization text/photo, address, etc.
const STORE_BASE_URL = "https://stickover.in";
const DEFAULT_INSTAGRAM_URL = "https://instagram.com/stickover";

const DEFAULT_ABANDONED_MSG_TN_PONDY =
  `STICKOVER Mobile Covers\nHi {name}! COD இல்லைன்னு தயக்கமா?\nஎங்க Real Reviews & Customer Orders பாருங்க\n@stickover\n{instagram}\n\n50K+ Happy Customers\n\nYour Pick:\n{products}\n\nOrder Continue: {website}\nDoubt இருந்தா DM பண்ணுங்க!`;

const DEFAULT_ABANDONED_MSG_OTHER_STATES =
  `STICKOVER Mobile Covers\nHi {name}! COD unavailable? No worries!\nCheck our Real Reviews & Customer Orders\n@stickover\n{instagram}\n\n50K+ Happy Customers\n\nYour Pick:\n{products}\n\nContinue Order: {website}\nNeed help? DM us!`;

// Tamil Nadu & Puducherry get free shipping (see ProductPage's "Free shipping
// within Tamil Nadu only" note) — every other state pays door-delivery, so
// the two templates need different messaging.
function isTNorPondy(state: string): boolean {
  const s = (state || "").trim().toLowerCase();
  return /tamil\s*nadu|^tn$|pondicherr?y|puducherry/.test(s);
}

// One line per cart item: product name (linked to its actual product page),
// phone model, and any personalization (photo uploaded / text typed / plate
// style chosen) — everything the admin needs to manually re-create the order
// on a call, without opening the admin panel.
function buildAbandonedProductLines(items: any[]): string {
  if (!items || !items.length) return "";
  return items
    .map((i, idx) => {
      const product = i.product || {};
      const link = product.id ? `${STORE_BASE_URL}/product/${product.id}` : "";
      const lines = [`${idx + 1}. ${product.title || "Product"}${link ? ` — ${link}` : ""}`];
      if (i.selectedModel) lines.push(`   Model: ${i.selectedModel}`);
      if (i.customVariant) lines.push(`   ${i.customVariant}`);
      if (i.customName) lines.push(`   Name to print: "${i.customName}"`);
      if (i.customImage) lines.push(`   Photo uploaded: ${API_URL}${i.customImage}`);
      if (i.customImage2) lines.push(`   2nd photo uploaded: ${API_URL}${i.customImage2}`);
      if (i.customName2) lines.push(`   2nd name to print: "${i.customName2}"`);
      if (i.quantity > 1) lines.push(`   Qty: ${i.quantity}`);
      return lines.join("\n");
    })
    .join("\n\n");
}

function buildAbandonedWhatsAppText(cart: any, template: string, instagramUrl?: string): string {
  const productsBlock = buildAbandonedProductLines(cart.items || []);
  const address = [cart.shippingAddress, cart.apartment, cart.city, cart.state, cart.pincode].filter(Boolean).join(", ");
  return template
    .replace(/\{name\}/g, cart.customerName || "there")
    .replace(/\{phone\}/g, cart.customerPhone || "")
    .replace(/\{address\}/g, address || "-")
    .replace(/\{total\}/g, cart.total != null ? `₹${cart.total}` : "")
    .replace(/\{products\}/g, productsBlock)
    .replace(/\{instagram\}/g, instagramUrl || DEFAULT_INSTAGRAM_URL)
    .replace(/\{website\}/g, STORE_BASE_URL);
}

function AbandonedCheckoutsTab() {
  const [abandoned, setAbandoned] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<AbandonedRangeFilter>("all");
  const [msgSettings, setMsgSettings] = useState<{ tnPondy: string; otherStates: string; instagramUrl: string }>({
    tnPondy: DEFAULT_ABANDONED_MSG_TN_PONDY,
    otherStates: DEFAULT_ABANDONED_MSG_OTHER_STATES,
    instagramUrl: DEFAULT_INSTAGRAM_URL,
  });

  const load = () => {
    setLoading(true);
    api.getAuth("/api/analytics/abandoned-carts").catch(() => [])
      .then(setAbandoned)
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
    api.get("/api/settings").then((s) => {
      setMsgSettings({
        tnPondy: s?.abandonedMsgTNPondy || DEFAULT_ABANDONED_MSG_TN_PONDY,
        otherStates: s?.abandonedMsgOtherStates || DEFAULT_ABANDONED_MSG_OTHER_STATES,
        instagramUrl: s?.abandonedInstagramUrl || DEFAULT_INSTAGRAM_URL,
      });
    }).catch(() => {});
    const iv = setInterval(load, 15000); // refresh every 15s — no need for 1s polling here
    return () => clearInterval(iv);
  }, []);

  const dismiss = async (sessionId: string) => {
    try {
      await api.del(`/api/analytics/abandoned-carts/${sessionId}`);
      setAbandoned((prev) => prev.filter((c) => c.id !== sessionId));
    } catch {
      /* ignore */
    }
  };

  // Builds the wa.me link with the right template (TN/Pondy vs other
  // states) pre-filled with this exact cart's products (each with its own
  // working product link), phone model, personalization text/photo, and
  // address — so the WhatsApp chat opens with the full follow-up ready to send.
  const whatsappHref = (c: any) => {
    if (!c.customerPhone) return "";
    const template = isTNorPondy(c.state) ? msgSettings.tnPondy : msgSettings.otherStates;
    const text = buildAbandonedWhatsAppText(c, template, msgSettings.instagramUrl);
    return `https://wa.me/91${c.customerPhone.replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(text)}`;
  };

  const filtered = abandoned.filter((c) => c.updatedAt && inRange(new Date(c.updatedAt), range));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-[#202223] tracking-tight">Abandoned Checkouts</h1>
          <p className="text-xs text-[#6d7175] mt-0.5 font-medium">Visitors who started checkout but didn't complete the order</p>
        </div>
        <button onClick={load} className={`p-2 rounded-lg bg-[#f6f6f7] hover:bg-[#e1e3e5] text-[#6d7175] transition-all ${loading ? "animate-spin" : ""}`}>
          <RefreshCwIcon />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {ABANDONED_RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setRange(opt.value)}
            className={`text-xs font-bold rounded-full px-3.5 py-1.5 border transition ${
              range === opt.value
                ? "bg-[#202223] text-white border-[#202223]"
                : "bg-white text-[#6d7175] border-[#e1e3e5] hover:border-[#c9cccf]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className={`${card} overflow-hidden`}>
        {filtered.length === 0 ? (
          <div className="text-center py-14">
            <p className="text-sm font-semibold text-[#6d7175]">
              {abandoned.length === 0 ? "No abandoned carts yet" : "No abandoned carts in this range"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#f1f1f1]">
            {filtered.map((c) => (
              <div key={c.id} className="px-5 py-4 flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-[#202223] truncate">{c.customerName || "Unnamed visitor"}</p>
                    {c.updatedAt && (
                      <span className="text-[10px] font-bold text-[#6d7175] bg-[#f6f6f7] rounded-full px-2 py-0.5 shrink-0">
                        {formatAbandonedTime(c.updatedAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6d7175] truncate">
                    {[c.customerPhone, c.customerAltPhone && `alt: ${c.customerAltPhone}`, c.customerEmail].filter(Boolean).join(" · ")}
                  </p>
                  {(c.shippingAddress || c.city) && (
                    <p className="text-xs text-[#6d7175] truncate">
                      {[c.shippingAddress, c.apartment, c.city, c.state, c.pincode].filter(Boolean).join(", ")}
                    </p>
                  )}
                  <p className="text-xs text-[#6d7175]">{c.items.length} item(s) · ₹{c.total}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {c.customerPhone && (
                    <a
                      href={whatsappHref(c)}
                      target="_blank" rel="noreferrer"
                      className="text-xs font-semibold text-emerald-600 hover:underline"
                    >
                      WhatsApp
                    </a>
                  )}
                  <button onClick={() => dismiss(c.id)} className="text-xs font-semibold text-[#8c9196] hover:text-red-600">
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------- Report Analysis (dedicated 1-year deep-dive report) ----------------
function formatBytes(bytes: number): string {
  if (!bytes) return "0 KB";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

// File Manager — every image ever uploaded to the site's /uploads folder,
// whether it came in through an admin "upload image" button (products,
// banners, collections, content blocks, etc.) or through a shopper's own
// customer photo-case upload on the storefront (both write into this exact
// same folder), so nothing is missed either way. Backed by GET/DELETE
// /api/upload/list & /api/upload/:filename.
function FileManagerTab() {
  const { showToast } = useToast();
  const [files, setFiles] = useState<{ filename: string; url: string; size: number; uploadedAt: string }[]>([]);
  const [total, setTotal] = useState(0);
  const [totalSize, setTotalSize] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<{ filename: string; url: string } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = (p = page, q = search) => {
    setLoading(true);
    api
      .getAuth(`/api/upload/list?page=${p}&pageSize=60&search=${encodeURIComponent(q)}`)
      .then((r) => {
        setFiles(r.files || []);
        setTotal(r.total || 0);
        setTotalSize(r.totalSize || 0);
        setTotalPages(r.totalPages || 1);
      })
      .catch(() => showToast("Failed to load uploaded images", "error"))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(1, search); setPage(1); }, [search]);
  useEffect(() => { load(page, search); }, [page]);

  const downloadFile = (f: { filename: string; url: string }) => {
    // Plain navigation, not fetch+blob: the live server's /uploads static
    // serving doesn't send CORS headers, so a JS fetch() to it gets blocked
    // by the browser even though the exact same URL loads fine in an <img>
    // tag. Navigating a link isn't subject to CORS at all, and the backend
    // route below sends Content-Disposition: attachment so it downloads
    // instead of just opening in the tab.
    const a = document.createElement("a");
    a.href = `${API_URL}/api/upload/file/${f.filename}`;
    a.download = f.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const deleteFile = async (filename: string) => {
    if (!confirm("Delete this image permanently? This can't be undone.")) return;
    setDeleting(filename);
    try {
      await api.postAuthJson(`/api/upload/remove`, { filename });
      setPreview(null);
      showToast("Image deleted", "success");
      load(page, search);
    } catch (err: any) {
      showToast(err.message || "Failed to delete image", "error");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-[#202223] tracking-tight">File Manager</h1>
          <p className="text-xs text-[#6d7175] mt-0.5 font-medium">
            Every image uploaded to Stickover — product photos, banners, and customer photo-case uploads — all in one place.
          </p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8c9196]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search filename..."
            className={`${inputCls} pl-8 w-56`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className={`${card} p-4`}>
          <div className="flex items-center gap-1.5 text-[#6d7175]"><Images size={13} /><p className="text-[10px] font-bold uppercase tracking-wider">Total Images</p></div>
          <p className="text-2xl font-black text-[#202223] mt-1.5">{total}</p>
        </div>
        <div className={`${card} p-4`}>
          <div className="flex items-center gap-1.5 text-[#6d7175]"><Upload size={13} /><p className="text-[10px] font-bold uppercase tracking-wider">Storage Used</p></div>
          <p className="text-2xl font-black text-[#202223] mt-1.5">{formatBytes(totalSize)}</p>
        </div>
      </div>

      <div className={`${card} p-5`}>
        {loading ? (
          <p className="text-[#8c9196] text-sm">Loading images...</p>
        ) : files.length === 0 ? (
          <p className="text-[#8c9196] text-sm">{search ? "No images match that search." : "No images uploaded yet."}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {files.map((f) => (
                <div
                  key={f.filename}
                  className="group relative rounded-lg overflow-hidden border border-[#e1e3e5] bg-[#f6f6f7] aspect-square text-left"
                >
                  <button onClick={() => setPreview(f)} className="block w-full h-full">
                    <img src={api.thumbUrl(f.url, 240)} alt={f.filename} className="w-full h-full object-cover" loading="lazy" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); downloadFile(f); }}
                    title="Download"
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-md bg-black/60 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                  >
                    <Download size={12} />
                  </button>
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <p className="text-[9px] text-white font-semibold truncate">{f.filename}</p>
                    <p className="text-[8px] text-white/70">{formatBytes(f.size)}</p>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className={`${btnPrimary} disabled:opacity-40`}
                >
                  Prev
                </button>
                <span className="text-xs font-semibold text-[#6d7175]">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className={`${btnPrimary} disabled:opacity-40`}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Preview / delete modal */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className={`${card} max-w-lg w-full p-4 space-y-3`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-[#202223] truncate">{preview.filename}</p>
              <button onClick={() => setPreview(null)} className="text-[#8c9196] hover:text-[#202223]"><X size={16} /></button>
            </div>
            <img src={api.imageUrl(preview.url)} alt={preview.filename} className="w-full max-h-[60vh] object-contain rounded-lg bg-[#f6f6f7]" />
            <div className="flex items-center gap-3 pt-1">
              <a href={api.imageUrl(preview.url)} target="_blank" rel="noreferrer" className={btnPrimary}>Open Full Size</a>
              <button
                onClick={() => downloadFile(preview)}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#2c6ecb] hover:underline"
              >
                <Download size={13} /> Download
              </button>
              <button
                onClick={() => deleteFile(preview.filename)}
                disabled={deleting === preview.filename}
                className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
              >
                <Trash2 size={13} /> {deleting === preview.filename ? "Deleting..." : "Delete image"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- Visitors / Views Analytics ----------------
// Detailed "who's coming to the site" tab: unique visitor counts for
// Today / Yesterday / Last 7 Days / Last 28 Days, a daily trend chart,
// where visitors are dropping off (last page seen), and which channel
// brought them in (Google Search, Instagram, Direct, etc.)
const VISITOR_PERIODS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "7d", label: "Last 7 Days" },
  { key: "28d", label: "Last 28 Days" },
] as const;
type VisitorPeriod = (typeof VISITOR_PERIODS)[number]["key"];

const SOURCE_COLORS: Record<string, string> = {
  "Google Search": "#4285F4",
  "Bing Search": "#008373",
  "Yahoo Search": "#6001D2",
  "DuckDuckGo Search": "#DE5833",
  Instagram: "#E1306C",
  Facebook: "#1877F2",
  WhatsApp: "#25D366",
  YouTube: "#FF0000",
  "Twitter / X": "#000000",
  Pinterest: "#E60023",
  LinkedIn: "#0A66C2",
  Direct: "#8c9196",
};
const sourceColor = (s: string) => SOURCE_COLORS[s] || "#2c6ecb";

function VisitorsTab() {
  const [period, setPeriod] = useState<VisitorPeriod>("today");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = (p: VisitorPeriod) => {
    setLoading(true);
    api
      .getAuth(`/api/analytics/visitor-analytics?period=${p}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(period); }, [period]);

  const periodLabel = VISITOR_PERIODS.find((p) => p.key === period)?.label || "Today";
  const byDay: { date: string; count: number }[] = data?.byDay || [];
  const maxDay = Math.max(1, ...byDay.map((d) => Number(d.count)));
  const totalSourceCount = (data?.sources || []).reduce((s: number, x: any) => s + Number(x.count), 0) || 1;
  const maxPageCount = Math.max(1, ...(data?.landingPages || []).map((p: any) => Number(p.count)), ...(data?.exitPages || []).map((p: any) => Number(p.count)));

  const formatDay = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-black text-[#202223] tracking-tight">Visitors</h1>
          <p className="text-xs text-[#6d7175] mt-0.5 font-medium">How many people came to the site, where they landed, and where they came from</p>
        </div>
        <div className="flex gap-1 bg-[#f1f1f1] rounded-lg p-1 overflow-x-auto max-w-full">
          {VISITOR_PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-bold transition-colors whitespace-nowrap ${
                period === p.key ? "bg-white text-[#202223] shadow-sm" : "text-[#6d7175] hover:text-[#202223]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading || !data ? (
        <p className="text-[#8c9196] text-sm">Loading visitor analytics...</p>
      ) : (
        <>
          {/* Headline KPI */}
          <div className={`${card} p-5 flex items-center gap-4`}>
            <div className="w-11 h-11 rounded-xl bg-[#e6f0ff] flex items-center justify-center text-[#2c6ecb] shrink-0">
              <Eye size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#8c9196]">Unique Visitors — {periodLabel}</p>
              <p className="text-3xl font-black text-[#202223] leading-tight">{data.total}</p>
            </div>
          </div>

          {/* Daily trend — always last 28 days for context, selected period highlighted */}
          <div className={`${card} p-5`}>
            <h3 className="text-sm font-bold text-[#202223] mb-4">Daily Visitors — Last 28 Days</h3>
            {byDay.length === 0 ? (
              <p className="text-[#8c9196] text-sm">No visitor data yet.</p>
            ) : (
              <div className="flex items-end gap-1 h-40 overflow-x-auto">
                {byDay.map((d) => {
                  const isToday = d.date.slice(0, 10) === new Date().toISOString().slice(0, 10);
                  return (
                    <div key={d.date} className="flex-1 min-w-[10px] flex flex-col items-center justify-end h-full group relative">
                      <div className="text-[9px] font-bold text-[#202223] mb-1 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-5 whitespace-nowrap">
                        {d.count} on {formatDay(d.date)}
                      </div>
                      <div
                        className={`w-full max-w-[14px] rounded-t-md transition-colors ${isToday ? "bg-[#1a56b0]" : "bg-[#2c6ecb] hover:bg-[#1a56b0]"}`}
                        style={{ height: `${Math.max(3, (Number(d.count) / maxDay) * 100)}%` }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Traffic sources — where visitors came from (Google, Instagram, Direct...) */}
            <div className={`${card} p-5 min-w-0`}>
              <h3 className="text-sm font-bold text-[#202223] mb-1">Traffic Sources — {periodLabel}</h3>
              <p className="text-[11px] text-[#8c9196] mb-4">Where visitors came from before landing on the site</p>
              {(data.sources || []).length === 0 ? (
                <p className="text-[#8c9196] text-sm">No data for this period.</p>
              ) : (
                <div className="space-y-2.5">
                  {data.sources.map((s: any) => {
                    const pct = Math.round((Number(s.count) / totalSourceCount) * 100);
                    return (
                      <div key={s.source} className="min-w-0">
                        <div className="flex items-center justify-between text-xs mb-1 gap-2">
                          <span className="font-semibold text-[#202223] truncate min-w-0">{s.source}</span>
                          <span className="text-[#6d7175] font-medium shrink-0">{s.count} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[#f1f1f1] overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: sourceColor(s.source) }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Landing pages — first page visitors arrived on */}
            <div className={`${card} p-5 min-w-0`}>
              <h3 className="text-sm font-bold text-[#202223] mb-1">Landing Pages — {periodLabel}</h3>
              <p className="text-[11px] text-[#8c9196] mb-4">The page each visitor first arrived on</p>
              {(data.landingPages || []).length === 0 ? (
                <p className="text-[#8c9196] text-sm">No data for this period.</p>
              ) : (
                <div className="space-y-2.5">
                  {data.landingPages.map((p: any) => (
                    <div key={p.label} className="min-w-0">
                      <div className="flex items-center justify-between text-xs mb-1 gap-2">
                        <span className="font-semibold text-[#202223] truncate min-w-0">{p.label}</span>
                        <span className="text-[#6d7175] font-medium shrink-0">{p.count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#f1f1f1] overflow-hidden">
                        <div className="h-full rounded-full bg-[#00a884]" style={{ width: `${(Number(p.count) / maxPageCount) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Exit / last-seen pages — where visitors were last active (proxy for where they left off) */}
          <div className={`${card} p-5`}>
            <h3 className="text-sm font-bold text-[#202223] mb-1">Pages Visitors Left From — {periodLabel}</h3>
            <p className="text-[11px] text-[#8c9196] mb-4">The last page each visitor was seen on before going inactive — a high "Home" count here usually means people are browsing but bouncing before reaching a product.</p>
            {(data.exitPages || []).length === 0 ? (
              <p className="text-[#8c9196] text-sm">No data for this period.</p>
            ) : (
              <div className="space-y-2.5">
                {data.exitPages.map((p: any) => (
                  <div key={p.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-[#202223] truncate">{p.label}</span>
                      <span className="text-[#6d7175] font-medium shrink-0 ml-2">{p.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#f1f1f1] overflow-hidden">
                      <div className="h-full rounded-full bg-[#e07c24]" style={{ width: `${(Number(p.count) / maxPageCount) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ReportsTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [productView, setProductView] = useState<"qty" | "revenue">("revenue");

  const load = () => {
    setLoading(true);
    api.getAuth("/api/analytics/report").then(setData).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const exportCSV = () => {
    if (!data) return;
    const rows: string[] = [];
    rows.push("Stickover Report Analysis — Last 1 Year");
    rows.push(`Generated,${new Date(data.generatedAt).toLocaleString("en-IN")}`);
    rows.push("");
    rows.push("Month,Revenue,Orders");
    data.monthlyRevenue.forEach((m: any) => rows.push(`${m.month},${m.revenue},${m.orders}`));
    rows.push("");
    rows.push("Top Products (by revenue),Qty Sold,Revenue");
    data.topProductsByRevenue.forEach((p: any) => rows.push(`"${p.title}",${p.qty},${p.revenue.toFixed(2)}`));
    rows.push("");
    rows.push("Brand,Qty Sold,Revenue");
    data.brandBreakdown.forEach((b: any) => rows.push(`"${b.brand}",${b.qty},${b.revenue.toFixed(2)}`));
    rows.push("");
    rows.push("Collection,Qty Sold,Revenue");
    data.collectionBreakdown.forEach((c: any) => rows.push(`"${c.collection}",${c.qty},${c.revenue.toFixed(2)}`));
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stickover-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading || !data) return <p className="text-[#8c9196] text-sm">Loading report...</p>;

  const monthlyMax = Math.max(1, ...data.monthlyRevenue.map((m: any) => Number(m.revenue)));
  const formatMonth = (m: string) => {
    const [y, mo] = m.split("-");
    return new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
  };
  const productList = productView === "qty" ? data.topProductsByQty : data.topProductsByRevenue;
  const maxProductVal = Math.max(1, ...productList.map((p: any) => (productView === "qty" ? p.qty : p.revenue)));
  const maxBrandRevenue = Math.max(1, ...data.brandBreakdown.map((b: any) => b.revenue));
  const totalYearOrders = data.statusBreakdownYear.reduce((s: number, x: any) => s + Number(x.count), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-[#202223] tracking-tight">Report Analysis</h1>
          <p className="text-xs text-[#6d7175] mt-0.5 font-medium">Accurate sales & revenue breakdown — {data.windowLabel}</p>
        </div>
        <button onClick={exportCSV} className={`${btnPrimary} flex items-center gap-1.5`}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Top summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={`${card} p-4`}>
          <div className="flex items-center gap-1.5 text-[#6d7175]"><IndianRupee size={13} /><p className="text-[10px] font-bold uppercase tracking-wider">Revenue (1yr)</p></div>
          <p className="text-2xl font-black text-[#202223] mt-1.5">₹{Number(data.yearTotals.totalRevenue).toLocaleString("en-IN")}</p>
          <p className="text-[10px] text-[#8c9196] mt-1">All-time: ₹{Number(data.allTimeTotals.totalRevenue).toLocaleString("en-IN")}</p>
        </div>
        <div className={`${card} p-4`}>
          <div className="flex items-center gap-1.5 text-[#6d7175]"><Package size={13} /><p className="text-[10px] font-bold uppercase tracking-wider">Orders (1yr)</p></div>
          <p className="text-2xl font-black text-[#202223] mt-1.5">{data.yearTotals.totalOrders}</p>
          <p className="text-[10px] text-[#8c9196] mt-1">All-time: {data.allTimeTotals.totalOrders}</p>
        </div>
        <div className={`${card} p-4`}>
          <div className="flex items-center gap-1.5 text-[#6d7175]"><TrendingUp size={13} /><p className="text-[10px] font-bold uppercase tracking-wider">Avg Order Value</p></div>
          <p className="text-2xl font-black text-[#202223] mt-1.5">₹{Math.round(Number(data.yearTotals.avgOrderValue)).toLocaleString("en-IN")}</p>
          <p className="text-[10px] text-[#8c9196] mt-1">per order, last 1 year</p>
        </div>
        <div className={`${card} p-4`}>
          <div className="flex items-center gap-1.5 text-[#6d7175]"><Repeat size={13} /><p className="text-[10px] font-bold uppercase tracking-wider">New vs Returning</p></div>
          <p className="text-2xl font-black text-[#202223] mt-1.5">{data.customerInsights.newCustomers} / {data.customerInsights.returningCustomers}</p>
          <p className="text-[10px] text-[#8c9196] mt-1">new / returning customers</p>
        </div>
      </div>

      {/* Monthly revenue bar chart (12 months) */}
      <div className={`${card} p-5`}>
        <h3 className="text-sm font-bold text-[#202223] mb-4">Monthly Revenue — Last 12 Months</h3>
        {data.monthlyRevenue.length === 0 ? (
          <p className="text-[#8c9196] text-sm">No orders in the last 12 months.</p>
        ) : (
          <div className="flex items-end gap-2 h-48">
            {data.monthlyRevenue.map((m: any) => (
              <div key={m.month} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                <div className="text-[9px] font-bold text-[#202223] mb-1 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-5">₹{Number(m.revenue).toLocaleString("en-IN")}</div>
                <div
                  className="w-full max-w-[36px] rounded-t-md bg-[#2c6ecb] hover:bg-[#1a56b0] transition-colors"
                  style={{ height: `${Math.max(4, (Number(m.revenue) / monthlyMax) * 100)}%` }}
                />
                <span className="text-[9px] text-[#8c9196] font-semibold mt-1.5">{formatMonth(m.month)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order status breakdown (full year) */}
      <div className={`${card} p-5`}>
        <h3 className="text-sm font-bold text-[#202223] mb-4">Order Fulfillment — Last 1 Year</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {data.statusBreakdownYear.map((s: any) => (
            <div key={s.status} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-bold text-xs text-[#202223] capitalize">{s.status.replace(/_/g, " ")}</span>
                <span className="font-bold text-[#202223]">{s.count}</span>
              </div>
              <div className="h-2 bg-[#f0f0f0] rounded-full overflow-hidden">
                <div className="h-full bg-[#2c6ecb] rounded-full" style={{ width: `${totalYearOrders > 0 ? Math.round((s.count / totalYearOrders) * 100) : 0}%` }} />
              </div>
              <p className="text-[10px] text-[#8c9196]">₹{Number(s.revenue).toLocaleString("en-IN")} revenue</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top products */}
      <div className={`${card} p-5`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-[#202223] flex items-center gap-1.5"><Award size={15} /> Best Selling Products</h3>
          <div className="flex items-center gap-1 bg-[#f6f6f7] border border-[#e1e3e5] rounded-full p-1">
            {(["revenue", "qty"] as const).map((v) => (
              <button key={v} onClick={() => setProductView(v)} className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition-colors ${productView === v ? "btn-liquid-dark" : "text-[#6d7175]"}`}>
                {v === "revenue" ? "By Revenue" : "By Units Sold"}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2.5">
          {productList.map((p: any, i: number) => (
            <div key={p.id} className="flex items-center gap-3 text-sm">
              <span className="text-[#8c9196] font-bold text-xs w-5 shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#202223] font-medium truncate flex items-center gap-1.5">
                    {p.title}
                    {p.isBestSeller && <span className="text-[9px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full font-bold shrink-0">BEST SELLER</span>}
                    {p.isTrending && <span className="text-[9px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-full font-bold shrink-0">TRENDING</span>}
                  </span>
                  <span className="text-[#6d7175] text-xs font-semibold shrink-0">{productView === "qty" ? `${p.qty} sold` : `₹${p.revenue.toLocaleString("en-IN")}`}</span>
                </div>
                <div className="h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-[#202223] rounded-full" style={{ width: `${((productView === "qty" ? p.qty : p.revenue) / maxProductVal) * 100}%` }} />
                </div>
              </div>
            </div>
          ))}
          {productList.length === 0 && <p className="text-[#8c9196] text-sm">No sales data yet.</p>}
        </div>
      </div>

      {/* Brand + Collection breakdown side by side */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className={`${card} p-5`}>
          <h3 className="text-sm font-bold text-[#202223] mb-4">Revenue by Brand</h3>
          <div className="space-y-2.5">
            {data.brandBreakdown.slice(0, 10).map((b: any) => (
              <div key={b.brand} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-[#202223]">{b.brand}</span>
                  <span className="text-[#6d7175]">₹{b.revenue.toLocaleString("en-IN")} · {b.qty} units</span>
                </div>
                <div className="h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                  <div className="h-full bg-[#10b981] rounded-full" style={{ width: `${(b.revenue / maxBrandRevenue) * 100}%` }} />
                </div>
              </div>
            ))}
            {data.brandBreakdown.length === 0 && <p className="text-[#8c9196] text-sm">No data yet.</p>}
          </div>
        </div>

        <div className={`${card} p-5`}>
          <h3 className="text-sm font-bold text-[#202223] mb-4">Revenue by Collection</h3>
          <div className="space-y-2.5">
            {data.collectionBreakdown.slice(0, 10).map((c: any) => (
              <div key={c.collection} className="flex items-center justify-between text-sm">
                <span className="text-[#202223] font-medium truncate">{c.collection}</span>
                <span className="text-[#6d7175] text-xs font-semibold shrink-0">₹{c.revenue.toLocaleString("en-IN")} · {c.qty} units</span>
              </div>
            ))}
            {data.collectionBreakdown.length === 0 && <p className="text-[#8c9196] text-sm">No data yet.</p>}
          </div>
        </div>
      </div>

      {/* Top customers */}
      <div className={`${card} p-5`}>
        <h3 className="text-sm font-bold text-[#202223] mb-4">Top Customers (by spend, last 1 year)</h3>
        <div className="divide-y divide-[#f1f1f1]">
          {data.customerInsights.topCustomers.map((c: any, i: number) => (
            <div key={c.customer_phone} className="flex items-center justify-between py-2.5 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-[#8c9196] font-bold text-xs w-5">{i + 1}</span>
                <span className="text-[#202223] font-medium">{c.customer_phone}</span>
              </div>
              <span className="text-[#6d7175] text-xs font-semibold">₹{Number(c.totalSpent).toLocaleString("en-IN")} · {c.orderCount} orders</span>
            </div>
          ))}
          {data.customerInsights.topCustomers.length === 0 && <p className="text-[#8c9196] text-sm">No customer data yet.</p>}
        </div>
      </div>

      <p className="text-[10px] text-[#8c9196]">Generated {new Date(data.generatedAt).toLocaleString("en-IN")} · figures exclude cancelled orders</p>
    </div>
  );
}

// ---------------- Settings (Maintenance Mode, WhatsApp toggle, key site settings overview) ----------------
function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-[#10b981]" : "bg-[#d1d5db]"}`}
    >
      <span className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

const MAX_ANNOUNCEMENT_ITEMS = 5;

function AnnouncementMessagesEditor({
  messages,
  onChange,
  onSave,
}: {
  messages: string[];
  onChange: (next: string[]) => void;
  onSave: () => void;
}) {
  const update = (i: number, value: string) => {
    const next = [...messages];
    next[i] = value;
    onChange(next);
  };
  const remove = (i: number) => {
    const next = messages.filter((_, idx) => idx !== i);
    onChange(next);
    onSave();
  };
  const add = () => {
    if (messages.length >= MAX_ANNOUNCEMENT_ITEMS) return;
    onChange([...messages, ""]);
  };

  return (
    <div className="pt-4 border-t border-[#e1e3e5]">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-[#202223]">Announcement Items ({messages.length}/{MAX_ANNOUNCEMENT_ITEMS})</p>
        <button
          type="button"
          onClick={add}
          disabled={messages.length >= MAX_ANNOUNCEMENT_ITEMS}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          + Add item
        </button>
      </div>
      <div className="space-y-2">
        {messages.map((m, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={m}
              onChange={(e) => update(i, e.target.value)}
              onBlur={onSave}
              maxLength={80}
              placeholder={`Announcement ${i + 1}`}
              className={`${inputCls} flex-1`}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50"
              aria-label="Remove"
            >
              <X size={16} />
            </button>
          </div>
        ))}
        {messages.length === 0 && (
          <p className="text-xs text-[#8c9196]">No items yet — add up to {MAX_ANNOUNCEMENT_ITEMS} to show in the scrolling bar.</p>
        )}
      </div>
      <p className="text-[11px] text-[#8c9196] mt-2">These scroll continuously in the bar under the nav bar. Max {MAX_ANNOUNCEMENT_ITEMS} items, changes save automatically.</p>
    </div>
  );
}

// Lets the admin enter/rotate Razorpay Key ID + Key Secret and turn online
// payment on/off, without touching the server's .env file at all — this is
// stored in the `payment_credentials` DB table via /api/payment/admin-config.
// The saved Key Secret is never sent back from the server (hasSecret only
// tells us whether one is already saved), so this field starts blank and is
// only submitted when the admin actually types a new value.
function PaymentSettingsCard() {
  const [loading, setLoading] = useState(true);
  const [keyId, setKeyId] = useState("");
  const [keySecret, setKeySecret] = useState("");
  const [hasSecret, setHasSecret] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const cfg = await api.getAuth("/api/payment/admin-config");
      setKeyId(cfg.keyId || "");
      setHasSecret(!!cfg.hasSecret);
      setEnabled(!!cfg.enabled);
    } catch {
      // ignore — admin can still fill the form and save
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const save = async (nextEnabled = enabled) => {
    setSaving(true);
    setMsg(null);
    try {
      await api.put("/api/payment/admin-config", { keyId: keyId.trim(), keySecret: keySecret.trim(), enabled: nextEnabled });
      setEnabled(nextEnabled);
      if (keySecret.trim()) setHasSecret(true);
      setKeySecret("");
      setMsg({ type: "ok", text: "Payment settings saved ✓" });
      setTimeout(() => setMsg(null), 2000);
    } catch (err: any) {
      setMsg({ type: "err", text: err.message || "Failed to save" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`${card} p-5 space-y-4`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#202223]">Payment — Razorpay</h3>
          <p className="text-xs text-[#6d7175] mt-1">
            Enter your Razorpay Key ID &amp; Key Secret here (from Razorpay Dashboard → Settings → API Keys). No server
            config needed — checkout uses whatever is saved here. Leave Key Secret blank on later edits to keep the one
            already saved.
          </p>
        </div>
        <ToggleSwitch checked={enabled} onChange={(v) => save(v)} />
      </div>

      {!loading && (
        <div className="space-y-3 pt-1">
          <div>
            <label className="text-xs font-bold text-[#202223] block mb-1">Key ID</label>
            <input
              value={keyId}
              onChange={(e) => setKeyId(e.target.value)}
              placeholder="rzp_live_xxxxxxxxxxxx"
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-[#202223] block mb-1">
              Key Secret {hasSecret && <span className="text-green-600 font-medium">(already saved — leave blank to keep it)</span>}
            </label>
            <input
              value={keySecret}
              onChange={(e) => setKeySecret(e.target.value)}
              type="password"
              placeholder={hasSecret ? "••••••••••••" : "your_razorpay_key_secret"}
              className={inputCls}
            />
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button type="button" onClick={() => save()} disabled={saving} className={btnPrimary}>
              {saving ? "Saving…" : "Save"}
            </button>
            {msg && (
              <span className={`text-xs font-semibold ${msg.type === "ok" ? "text-green-600" : "text-red-600"}`}>
                {msg.text}
              </span>
            )}
          </div>
          {!enabled && (
            <p className="text-[11px] text-[#8c9196]">
              Online payment is currently OFF — customers can't check out until this is turned on with valid keys.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Settings-tab card: two WhatsApp message templates for following up on
// abandoned checkouts — one for Tamil Nadu/Puducherry customers (free
// shipping), one for every other state (door-delivery charge applies).
// Supports {name}, {phone}, {address}, {total}, {products} placeholders —
// {products} expands to each cart item's title + working product link,
// phone model, and any personalization text/photo.
const ABANDONED_PLACEHOLDERS = ["{name}", "{products}", "{address}", "{phone}", "{total}", "{instagram}", "{website}"];

// A plain, fully-editable textarea for each state group, plus quick-insert
// chips that drop a placeholder token at the cursor — so Hari can write
// whatever wording he wants and still easily place the dynamic bits.
function AbandonedWhatsAppTemplatesCard({ form, set, save }: { form: any; set: (k: string, v: any) => void; save: () => void }) {
  const tnRef = useRef<HTMLTextAreaElement>(null);
  const otherRef = useRef<HTMLTextAreaElement>(null);

  const insertPlaceholder = (key: string, ref: React.RefObject<HTMLTextAreaElement>, fallback: string) => (token: string) => {
    const el = ref.current;
    const current = form[key] ?? fallback;
    if (!el) { set(key, current + token); save(); return; }
    const start = el.selectionStart ?? current.length;
    const end = el.selectionEnd ?? current.length;
    const next = current.slice(0, start) + token + current.slice(end);
    set(key, next);
    save();
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const insertTN = insertPlaceholder("abandonedMsgTNPondy", tnRef, DEFAULT_ABANDONED_MSG_TN_PONDY);
  const insertOther = insertPlaceholder("abandonedMsgOtherStates", otherRef, DEFAULT_ABANDONED_MSG_OTHER_STATES);

  return (
    <div className={`${card} p-5 space-y-4`}>
      <div>
        <h3 className="text-sm font-bold text-[#202223]">Abandoned Checkout — WhatsApp Message</h3>
        <p className="text-xs text-[#6d7175] mt-1">
          Fully customizable text for each field — write it however you like. When you click WhatsApp on an abandoned checkout, this message is auto-filled with that customer's products (each with a working product link), phone model, personalization text/photo, and address wherever you place the placeholders below.
        </p>
      </div>

      <div>
        <label className="text-xs font-bold text-[#202223] block mb-1">Instagram Link (used by {"{instagram}"})</label>
        <input
          type="text"
          value={form.abandonedInstagramUrl ?? DEFAULT_INSTAGRAM_URL}
          onChange={(e) => set("abandonedInstagramUrl", e.target.value)}
          onBlur={save}
          placeholder="https://instagram.com/stickover"
          className={inputCls}
        />
      </div>

      <div>
        <label className="text-xs font-bold text-[#202223] block mb-1">Tamil Nadu &amp; Puducherry (Free Shipping)</label>
        <div className="flex flex-wrap gap-1.5 mb-1.5">
          {ABANDONED_PLACEHOLDERS.map((p) => (
            <button key={p} type="button" onClick={() => insertTN(p)} className="text-[10px] font-bold text-[#202223] bg-[#f6f6f7] hover:bg-[#e1e3e5] rounded-full px-2 py-1 transition">
              + {p}
            </button>
          ))}
        </div>
        <textarea
          ref={tnRef}
          value={form.abandonedMsgTNPondy ?? DEFAULT_ABANDONED_MSG_TN_PONDY}
          onChange={(e) => set("abandonedMsgTNPondy", e.target.value)}
          onBlur={save}
          rows={5}
          placeholder="Write your custom WhatsApp message for Tamil Nadu / Puducherry customers..."
          className={inputCls}
        />
      </div>

      <div>
        <label className="text-xs font-bold text-[#202223] block mb-1">Other States (Door Delivery Charge)</label>
        <div className="flex flex-wrap gap-1.5 mb-1.5">
          {ABANDONED_PLACEHOLDERS.map((p) => (
            <button key={p} type="button" onClick={() => insertOther(p)} className="text-[10px] font-bold text-[#202223] bg-[#f6f6f7] hover:bg-[#e1e3e5] rounded-full px-2 py-1 transition">
              + {p}
            </button>
          ))}
        </div>
        <textarea
          ref={otherRef}
          value={form.abandonedMsgOtherStates ?? DEFAULT_ABANDONED_MSG_OTHER_STATES}
          onChange={(e) => set("abandonedMsgOtherStates", e.target.value)}
          onBlur={save}
          rows={5}
          placeholder="Write your custom WhatsApp message for other states..."
          className={inputCls}
        />
      </div>
    </div>
  );
}

function SettingsTab() {
  const [settings, setSettings] = useState<any>({});
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const load = async () => {
    const s = await api.get("/api/settings");
    setSettings(s || {});
    setForm(s || {});
  };
  useEffect(() => { load(); }, []);

  const set = (key: string, value: any) => setForm((f: any) => ({ ...f, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/api/settings", { ...settings, ...form });
      setSettings((s: any) => ({ ...s, ...form }));
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 1500);
    } finally {
      setSaving(false);
    }
  };

  // Save immediately on toggle flip (no need to hit the main Save button for on/off switches)
  const setAndSave = async (key: string, value: any) => {
    set(key, value);
    setSaving(true);
    try {
      const next = { ...settings, ...form, [key]: value };
      await api.put("/api/settings", next);
      setSettings(next);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-[#202223] tracking-tight">Settings</h1>
          <p className="text-xs text-[#6d7175] mt-0.5 font-medium">Site-wide switches and a quick overview of important website settings.</p>
        </div>
        {savedMsg && <span className="text-xs text-green-600 font-semibold">Saved ✓</span>}
      </div>

      {/* Maintenance Mode */}
      <div className={`${card} p-5`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#202223]">Maintenance Mode</h3>
            <p className="text-xs text-[#6d7175] mt-1">
              {form.maintenanceMode
                ? "Storefront is currently showing the maintenance page to visitors. Admin panel stays accessible."
                : "Storefront is live. Turn this on to take the site offline for visitors while you make changes."}
            </p>
          </div>
          <ToggleSwitch checked={!!form.maintenanceMode} onChange={(v) => setAndSave("maintenanceMode", v)} />
        </div>
        {form.maintenanceMode && (
          <div className="mt-4 pt-4 border-t border-[#e1e3e5]">
            <label className="text-xs text-[#6d7175] block mb-1 font-medium">Maintenance Page Message</label>
            <textarea
              value={form.maintenanceMessage || ""}
              onChange={(e) => set("maintenanceMessage", e.target.value)}
              onBlur={save}
              rows={2}
              className={inputCls}
              placeholder="We're upgrading Stickover right now. Back shortly — thanks for your patience!"
            />
          </div>
        )}
      </div>

      {/* Payment — Razorpay credentials, stored in the DB (no .env needed) */}
      <PaymentSettingsCard />

      {/* SEO & Google Merchant Center */}
      <div className={`${card} p-5 space-y-4`}>
        <div>
          <h3 className="text-sm font-bold text-[#202223]">SEO &amp; Google Shopping Feed</h3>
          <p className="text-xs text-[#6d7175] mt-1">
            Every product and collection now has an editable SEO title/description (edit them from the Products and Collections tabs), and the site outputs structured data so Google can show rich results.
            Use the feed below to list products on Google Shopping via Merchant Center.
          </p>
        </div>
        <div>
          <label className="text-xs font-bold text-[#202223] block mb-1">Merchant Center Feed URL (Scheduled fetch)</label>
          <div className="flex gap-2">
            <input readOnly value={`${API_URL}/api/merchant-feed.xml`} className={`${inputCls} bg-[#f6f6f7]`} onFocus={(e) => e.target.select()} />
            <button
              onClick={() => { navigator.clipboard?.writeText(`${API_URL}/api/merchant-feed.xml`); }}
              className={btnGhost}
              type="button"
            >
              Copy
            </button>
          </div>
          <p className="text-[11px] text-[#8c9196] mt-1">
            In Merchant Center: Products → Feeds → Add feed → Google Sheets/Scheduled fetch → paste this URL. It updates automatically as products change — no re-upload needed.
          </p>
        </div>
        <div className="flex items-center gap-3 pt-1">
          <a href={`${API_URL}/api/merchant-feed.csv`} target="_blank" rel="noopener noreferrer" className={btnPrimary}>
            Download CSV Feed
          </a>
          <a href={`${API_URL}/api/merchant-feed.xml`} target="_blank" rel="noopener noreferrer" className={btnGhost}>
            View XML Feed
          </a>
        </div>
      </div>

      {/* Abandoned Checkout — WhatsApp follow-up message templates */}
      <AbandonedWhatsAppTemplatesCard form={form} set={set} save={save} />

      {/* Website Widgets */}
      <div className={`${card} p-5 space-y-4`}>
        <h3 className="text-sm font-bold text-[#202223]">Website Widgets</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#202223]">Floating WhatsApp Button</p>
            <p className="text-xs text-[#6d7175] mt-0.5">Show the floating WhatsApp chat button on Home, Product, Collections, About & Contact pages.</p>
          </div>
          <ToggleSwitch checked={form.whatsappFloatingEnabled !== false} onChange={(v) => setAndSave("whatsappFloatingEnabled", v)} />
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-[#e1e3e5]">
          <div>
            <p className="text-sm font-medium text-[#202223]">Announcement Bar</p>
            <p className="text-xs text-[#6d7175] mt-0.5">Scrolling announcement strip directly under the nav bar.</p>
          </div>
          <ToggleSwitch checked={form.announcementBarEnabled !== false} onChange={(v) => setAndSave("announcementBarEnabled", v)} />
        </div>
        {form.announcementBarEnabled !== false && (
          <AnnouncementMessagesEditor
            messages={form.announcementMessages && form.announcementMessages.length ? form.announcementMessages : [
              "Trusted By Millions — Est. 2015",
              "1 Crore+ Photos Printed",
              "Crafted With Premium Materials",
              "Professional Grade Printing",
            ]}
            onChange={(next) => set("announcementMessages", next)}
            onSave={save}
          />
        )}
        <div className="flex items-center justify-between pt-4 border-t border-[#e1e3e5]">
          <div>
            <p className="text-sm font-medium text-[#202223]">Trust Bar (Cart & Checkout)</p>
            <p className="text-xs text-[#6d7175] mt-0.5">Scrolling trust strip shown only on the Cart and Checkout pages, right before customers pay.</p>
          </div>
          <ToggleSwitch checked={form.trustBarEnabled !== false} onChange={(v) => setAndSave("trustBarEnabled", v)} />
        </div>
        {form.trustBarEnabled !== false && (
          <AnnouncementMessagesEditor
            messages={form.trustBarMessages && form.trustBarMessages.length ? form.trustBarMessages : [
              "Serving Customers Since 2018 💗",
              "📸 59K+ Instagram Followers",
              "❤️ 50,000+ Happy Customers",
              "📍 Based in Tamil Nadu Serving All India",
              "🚚 All India Fast Delivery",
            ]}
            onChange={(next) => set("trustBarMessages", next)}
            onSave={save}
          />
        )}
      </div>

      {/* Quick overview of key website settings, sourced from the same settings store used across the panel */}
      <div className={`${card} p-5`}>
        <h3 className="text-sm font-bold text-[#202223] mb-4">Website Settings Overview</h3>
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <OverviewRow label="Store Name / Logo Text" value={settings.logoText || "Stickover"} />
          <OverviewRow label="Tagline" value={settings.tagline || "—"} />
          <OverviewRow label="Contact Phone" value={settings.contactPhone || "—"} />
          <OverviewRow label="Contact Email" value={settings.contactEmail || "—"} />
          <OverviewRow label="WhatsApp Number" value={settings.whatsappNumber || "—"} />
          <OverviewRow label="Free Shipping States" value={settings.shippingFreeStates?.length ? settings.shippingFreeStates.join(", ") : "Tamil Nadu, Puducherry"} />
          <OverviewRow label="Shipping Fee (other states)" value={`₹${settings.shippingFeeOtherStates ?? 50}`} />
          <OverviewRow label="Serviceable Pincodes" value={settings.servicablePincodes?.length ? `${settings.servicablePincodes.length} pincodes` : "All (no restriction)"} />
          <OverviewRow label="Instagram" value={settings.instagramUrl || "—"} />
          <OverviewRow label="Facebook" value={settings.facebookUrl || "—"} />
          <OverviewRow label="Homepage SEO Title" value={settings.seoHomeTitle || "—"} />
          <OverviewRow label="Maintenance Mode" value={form.maintenanceMode ? "ON" : "OFF"} />
        </div>
        <p className="text-[11px] text-[#8c9196] mt-4">
          These are edited in detail from the <span className="font-semibold text-[#202223]">Content</span> tab (Branding / Social & Chat / Store Config / SEO Tools). This panel is a quick read-only snapshot.
        </p>
      </div>

      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className={`${btnPrimary} disabled:opacity-50`}>{saving ? "Saving..." : "Save Changes"}</button>
      </div>
    </div>
  );
}

function OverviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[#f1f1f1] pb-2">
      <span className="text-[#6d7175] text-xs font-medium">{label}</span>
      <span className="text-[#202223] font-semibold text-xs truncate max-w-[55%] text-right">{value}</span>
    </div>
  );
}

// ---------------- Discounts (Offers) ----------------
// Manages settings.offers[] — each is a "Buy X qty, get ₹Y off" automatic
// discount. The enabled offer with the highest discount the cart qualifies
// for is applied automatically at Cart/Checkout (no code needed). The same
// list also drives the storefront countdown bar (the first live offer that
// has an end date). Coupon codes are a separate, currently-disabled input on
// the Checkout page — not managed here.
function DiscountsTab() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<any>({});
  const [offers, setOffers] = useState<Offer[]>([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const s = await api.get("/api/settings");
    setSettings(s || {});
    const existing = Array.isArray(s?.offers) && s.offers.length ? s.offers : defaultOffers();
    setOffers(existing);
    // Persist the seeded defaults immediately on first-ever load, so the
    // storefront and this panel never drift out of sync.
    if (!Array.isArray(s?.offers) || !s.offers.length) {
      await api.put("/api/settings", { ...s, offers: existing });
    }
  };
  useEffect(() => { load(); }, []);

  const save = async (next: Offer[]) => {
    setSaving(true);
    try {
      const payload = { ...settings, offers: next };
      await api.put("/api/settings", payload);
      setSettings(payload);
      setOffers(next);
      showToast("Discounts saved", "success");
    } catch {
      showToast("Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  const updateOffer = (id: string, patch: Partial<Offer>) => {
    setOffers((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  };

  const toggleOffer = (id: string, enabled: boolean) => {
    const next = offers.map((o) => (o.id === id ? { ...o, enabled } : o));
    save(next);
  };

  const restartOffer = (id: string, hours: number) => {
    const endsAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    const next = offers.map((o) => (o.id === id ? { ...o, endsAt } : o));
    save(next);
  };

  const addOffer = () => {
    const id = `offer_${Date.now()}`;
    const next: Offer[] = [
      ...offers,
      { id, label: "New Offer", badgeText: "New Offer", minQty: 2, discountAmount: 50, enabled: false, endsAt: null },
    ];
    save(next);
  };

  const removeOffer = (id: string) => {
    save(offers.filter((o) => o.id !== id));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-[#202223] tracking-tight">Discounts</h1>
          <p className="text-xs text-[#6d7175] mt-0.5 font-medium">
            Automatic "Buy X, Get ₹Y off" offers — applied at Cart &amp; Checkout without any code. The best live one the customer qualifies for wins.
          </p>
        </div>
        <button onClick={addOffer} disabled={saving} className={`${btnGhost} inline-flex items-center gap-1.5 disabled:opacity-50`} type="button">
          <Plus size={14} /> Add Offer
        </button>
      </div>

      <div className="space-y-4">
        {offers.map((offer) => (
          <OfferCard
            key={offer.id}
            offer={offer}
            saving={saving}
            onFieldChange={(patch) => updateOffer(offer.id, patch)}
            onSave={() => save(offers)}
            onToggle={(v) => toggleOffer(offer.id, v)}
            onRestart={(hours) => restartOffer(offer.id, hours)}
            onRemove={() => removeOffer(offer.id)}
          />
        ))}
        {offers.length === 0 && (
          <div className={`${card} p-8 text-center text-sm text-[#6d7175]`}>No offers yet — click "Add Offer" to create one.</div>
        )}
      </div>

      <div className={`${card} p-5`}>
        <h3 className="text-sm font-bold text-[#202223] mb-1">Coupon Codes</h3>
        <p className="text-xs text-[#6d7175]">
          The manual coupon-code field on Checkout is temporarily disabled (greyed out) while these automatic offers are the active discount mechanism.
        </p>
      </div>
    </div>
  );
}

function OfferCard({
  offer,
  saving,
  onFieldChange,
  onSave,
  onToggle,
  onRestart,
  onRemove,
}: {
  offer: Offer;
  saving: boolean;
  onFieldChange: (patch: Partial<Offer>) => void;
  onSave: () => void;
  onToggle: (v: boolean) => void;
  onRestart: (hours: number) => void;
  onRemove: () => void;
}) {
  const [restartHours, setRestartHours] = useState(48);
  const isLive = offer.enabled && (!offer.endsAt || new Date(offer.endsAt).getTime() > Date.now());
  const isExpired = offer.enabled && !!offer.endsAt && new Date(offer.endsAt).getTime() <= Date.now();

  return (
    <div className={`${card} p-5 space-y-4`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-[#202223] flex items-center gap-1.5 truncate">
            <Zap size={15} className="text-amber-500 shrink-0" /> {offer.label || "Untitled Offer"}
          </h3>
          <p className="text-xs text-[#6d7175] mt-1">
            {!offer.enabled ? "Off — not applied to any cart." : isExpired ? "Enabled, but its timer ran out — restart below." : "Live — applies automatically when a cart qualifies."}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {isLive && <span className="text-[10px] font-black uppercase tracking-wide text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">Live</span>}
          <ToggleSwitch checked={!!offer.enabled} onChange={onToggle} />
          <button onClick={onRemove} className="text-zinc-400 hover:text-rose-500 p-1.5 hover:bg-rose-50 rounded-lg" type="button" aria-label="Remove offer">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="pt-4 border-t border-[#e1e3e5] space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-[#202223] block mb-1">Internal Name</label>
            <input value={offer.label} onChange={(e) => onFieldChange({ label: e.target.value })} onBlur={onSave} className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-bold text-[#202223] block mb-1">Badge Text (shown to customers)</label>
            <input value={offer.badgeText} onChange={(e) => onFieldChange({ badgeText: e.target.value })} onBlur={onSave} placeholder="Buy 2 & Get ₹100 OFF" className={inputCls} />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-[#202223] block mb-1">Minimum Quantity in Cart</label>
            <input type="number" min={1} value={offer.minQty} onChange={(e) => onFieldChange({ minQty: Number(e.target.value) || 1 })} onBlur={onSave} className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-bold text-[#202223] block mb-1">Discount Amount (₹)</label>
            <input type="number" min={0} value={offer.discountAmount} onChange={(e) => onFieldChange({ discountAmount: Number(e.target.value) || 0 })} onBlur={onSave} className={inputCls} />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 items-end">
          <div>
            <label className="text-xs font-bold text-[#202223] block mb-1">Offer Ends At (optional)</label>
            <input
              type="datetime-local"
              value={offer.endsAt ? toDatetimeLocal(offer.endsAt) : ""}
              onChange={(e) => onFieldChange({ endsAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
              onBlur={onSave}
              className={inputCls}
            />
            <p className="text-[11px] text-[#8c9196] mt-1">Leave empty for an always-on offer (no countdown shown).</p>
          </div>
          <div className="flex items-center gap-2">
            <input type="number" min={1} value={restartHours} onChange={(e) => setRestartHours(Number(e.target.value) || 1)} className={`${inputCls} w-20`} />
            <button onClick={() => onRestart(restartHours)} disabled={saving} className={`${btnGhost} inline-flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap`} type="button">
              <RefreshCw size={13} /> Restart ({restartHours}h)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// datetime-local inputs need "YYYY-MM-DDTHH:mm" in the browser's local time
function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function ThemesTab() {
  const [settings, setSettings] = useState<any>({});
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const load = async () => {
    const s = await api.get("/api/settings");
    setSettings(s || {});
    setForm(s || {});
  };
  useEffect(() => { load(); }, []);

  // Live-preview every change instantly across the open admin tab too, the
  // same way the storefront will update once saved.
  useEffect(() => { applyTheme(form); }, [form]);
  // Restore whatever the storefront/site actually has saved if this tab unmounts.
  useEffect(() => () => { applyTheme(settings); }, [settings]);

  const set = (key: string, value: any) => setForm((f: any) => ({ ...f, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/api/settings", { ...settings, ...form });
      setSettings((s: any) => ({ ...s, ...form }));
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 1500);
    } finally {
      setSaving(false);
    }
  };

  const card = "bg-white rounded-xl border border-[#e1e3e5]";
  const inputCls = "w-full border border-[#c9cccf] rounded-lg px-3 py-2 text-sm text-[#202223] focus:outline-none focus:ring-2 focus:ring-[#202223]/10 focus:border-[#8c9196]";
  const btnPrimary = "btn-liquid-dark text-white text-sm font-bold px-4 py-2 rounded-lg";

  const shapeOptions: { key: string; label: string; radius: string }[] = [
    { key: "pill", label: "Pill (rounded)", radius: "9999px" },
    { key: "rounded", label: "Rounded corners", radius: "10px" },
    { key: "square", label: "Square", radius: "2px" },
  ];
  const fontOptions: { key: string; label: string; family: string }[] = [
    { key: "default", label: "Default (DM Sans)", family: '"DM Sans", sans-serif' },
    { key: "dmsans", label: "DM Sans (matches 3dcasemakers.com)", family: '"DM Sans", sans-serif' },
    { key: "inter", label: "Inter", family: '"Inter", sans-serif' },
    { key: "baloo", label: "Baloo 2 (rounded, playful)", family: '"Baloo 2", sans-serif' },
    { key: "coolvetica", label: "Coolvetica (display/condensed)", family: '"Coolvetica", sans-serif' },
    { key: "jost", label: "Jost (geometric)", family: '"Jost", sans-serif' },
  ];
  const sizeOptions: { key: string; label: string }[] = [
    { key: "sm", label: "Small" },
    { key: "md", label: "Medium (default)" },
    { key: "lg", label: "Large" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#202223]">Themes</h2>
          <p className="text-xs text-[#6d7175] mt-0.5">
            Customize how the storefront looks — colors, button shape, fonts and the mobile bottom menu.
            Changes preview live below and apply site-wide once saved.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {savedMsg && <span className="text-xs font-semibold text-emerald-600">Saved ✓</span>}
          <button onClick={save} disabled={saving} className={`${btnPrimary} disabled:opacity-50`}>
            {saving ? "Saving..." : "Save Theme"}
          </button>
        </div>
      </div>

      {/* Brand color */}
      <div className={`${card} p-5 space-y-4`}>
        <div>
          <h3 className="text-sm font-bold text-[#202223]">Brand Color</h3>
          <p className="text-xs text-[#6d7175] mt-1">
            Colors "Buy Now" / primary buttons, links, badges and highlights across the whole storefront.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={form.themePrimaryColor || "#2563eb"}
              onChange={(e) => set("themePrimaryColor", e.target.value)}
              className="w-12 h-12 rounded-lg border border-[#e1e3e5] cursor-pointer p-1 bg-white"
              aria-label="Pick brand color"
            />
            <input
              type="text"
              value={form.themePrimaryColor || "#2563eb"}
              onChange={(e) => set("themePrimaryColor", e.target.value)}
              placeholder="#2563eb"
              maxLength={7}
              className={`${inputCls} w-32 font-mono uppercase`}
            />
          </div>
          <div className="flex items-center gap-2">
            {["#2563eb", "#dc2626", "#059669", "#d97706", "#7c3aed", "#0f172a", "#db2777"].map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => set("themePrimaryColor", hex)}
                className={`w-7 h-7 rounded-full border-2 ${form.themePrimaryColor === hex ? "border-[#202223] scale-110" : "border-white"} shadow-sm transition-transform`}
                style={{ background: hex }}
                aria-label={`Use ${hex}`}
              />
            ))}
          </div>
          <button type="button" onClick={() => set("themePrimaryColor", "")} className="text-xs font-semibold text-[#6d7175] hover:text-[#202223] hover:underline">
            Reset
          </button>
        </div>
      </div>

      {/* Button shape */}
      <div className={`${card} p-5 space-y-4`}>
        <h3 className="text-sm font-bold text-[#202223]">Button Shape</h3>
        <div className="flex flex-wrap gap-3">
          {shapeOptions.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => set("themeButtonShape", opt.key)}
              className={`flex items-center gap-3 px-4 py-3 border-2 ${(form.themeButtonShape || "pill") === opt.key ? "border-[#202223]" : "border-[#e1e3e5]"} rounded-xl`}
            >
              <span
                className="glass-btn-primary text-white font-black text-[11px] px-4 py-2"
                style={{ borderRadius: opt.radius }}
              >
                Buy Now
              </span>
              <span className="text-xs font-semibold text-[#202223]">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Font */}
      <div className={`${card} p-5 space-y-4`}>
        <h3 className="text-sm font-bold text-[#202223]">Font</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fontOptions.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => set("themeFont", opt.key)}
              className={`text-left px-4 py-3 border-2 ${(form.themeFont || "default") === opt.key ? "border-[#202223]" : "border-[#e1e3e5]"} rounded-xl`}
            >
              <div className="text-base font-bold text-[#202223]" style={{ fontFamily: opt.family }}>Stickover</div>
              <div className="text-[11px] text-[#6d7175] mt-0.5">{opt.label}</div>
            </button>
          ))}
        </div>

        <div className="pt-2 border-t border-[#e1e3e5]">
          <h4 className="text-xs font-bold text-[#202223] mb-2">Text Size</h4>
          <div className="flex gap-2">
            {sizeOptions.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => set("themeFontSize", opt.key)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold border-2 ${(form.themeFontSize || "md") === opt.key ? "border-[#202223] bg-[#202223] text-white" : "border-[#e1e3e5] text-[#202223]"}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Page transition */}
      <div className={`${card} p-5 space-y-4`}>
        <div>
          <h3 className="text-sm font-bold text-[#202223]">Page Transition</h3>
          <p className="text-xs text-[#6d7175] mt-1">
            Animation played on the storefront whenever a visitor navigates from one page to another
            (clicking a product, collection, or menu link).
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {PAGE_TRANSITIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => set("pageTransition", opt.key)}
              className={`text-left px-3.5 py-2.5 border-2 rounded-xl text-xs font-semibold ${
                (form.pageTransition || "fade") === opt.key ? "border-[#202223] bg-[#f6f6f7] text-[#202223]" : "border-[#e1e3e5] text-[#6d7175] hover:border-[#c9cccf]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className={`${card} p-5 space-y-4`}>
        <div>
          <h3 className="text-sm font-bold text-[#202223]">Mobile Bottom Menu</h3>
          <p className="text-xs text-[#6d7175] mt-1">Colors for the Home / Collections / Cart / Reviews / Menu bar shown on phones.</p>
        </div>
        <div className="flex flex-wrap gap-6">
          {[
            { key: "themeMobileNavBg", label: "Background", def: "#000000" },
            { key: "themeMobileNavText", label: "Inactive icon/text", def: "#a1a1aa" },
            { key: "themeMobileNavActive", label: "Active icon/text", def: "#f59e0b" },
          ].map((row) => (
            <div key={row.key} className="flex items-center gap-2">
              <input
                type="color"
                value={form[row.key] || row.def}
                onChange={(e) => set(row.key, e.target.value)}
                className="w-10 h-10 rounded-lg border border-[#e1e3e5] cursor-pointer p-1 bg-white"
                aria-label={row.label}
              />
              <span className="text-xs font-semibold text-[#202223]">{row.label}</span>
            </div>
          ))}
        </div>

        {/* Live preview of the bar itself */}
        <div
          className="flex items-stretch rounded-xl overflow-hidden border border-[#e1e3e5] max-w-sm"
          style={{ background: form.themeMobileNavBg || "#000000" }}
        >
          {[
            { label: "Home", active: true },
            { label: "Collections", active: false },
            { label: "Cart", active: false },
            { label: "Reviews", active: false },
            { label: "Menu", active: false },
          ].map((tab) => (
            <div key={tab.label} className="flex-1 flex flex-col items-center justify-center gap-1 py-3">
              <span
                className="w-4 h-4 rounded-full"
                style={{ background: tab.active ? (form.themeMobileNavActive || "#f59e0b") : (form.themeMobileNavText || "#a1a1aa") }}
              />
              <span
                className="text-[9px] font-bold"
                style={{ color: tab.active ? (form.themeMobileNavActive || "#f59e0b") : (form.themeMobileNavText || "#a1a1aa") }}
              >
                {tab.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className={`${btnPrimary} disabled:opacity-50`}>
          {saving ? "Saving..." : "Save Theme"}
        </button>
      </div>
    </div>
  );
}

function RefreshCwIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}

// ---------------- FAQs (feature 7 admin side) ----------------
const FAQ_CATEGORIES = [
  "About Stickover",
  "Product Customization",
  "How to Place Order?",
  "Payment and Security",
  "Shipping and Delivery",
  "Cancellation and Returns",
  "Coupons and Offers",
];

function FAQsTab() {
  const { showToast } = useToast();
  const [faqs, setFaqs] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [reorderBusy, setReorderBusy] = useState(false);
  const [subTab, setSubTab] = useState<"questions" | "categories">("questions");
  const [filterCategory, setFilterCategory] = useState<string>("All");

  // Category manager state
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [renamingCategory, setRenamingCategory] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [categoryBusy, setCategoryBusy] = useState(false);

  const load = async () => {
    const f: any[] = await api.getAuth("/api/faqs/all");
    setFaqs([...f].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)));
  };
  useEffect(() => {
    load();
    try {
      const stored = localStorage.getItem("stickover_faq_custom_categories");
      if (stored) setCustomCategories(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  // Full category list = built-in defaults + any custom ones created in the admin,
  // plus any category names already used on existing FAQs (covers renames done elsewhere).
  const allCategories = Array.from(new Set([
    ...FAQ_CATEGORIES,
    ...customCategories,
    ...faqs.map((f) => f.category).filter(Boolean),
  ]));

  const persistCustomCategories = (next: string[]) => {
    setCustomCategories(next);
    localStorage.setItem("stickover_faq_custom_categories", JSON.stringify(next));
  };

  const addCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    if (allCategories.includes(name)) {
      showToast("That category already exists", "error");
      return;
    }
    persistCustomCategories([...customCategories, name]);
    setNewCategoryName("");
    showToast("Category added", "success");
  };

  // Renames a category everywhere: updates every FAQ currently tagged with the old
  // name (so existing Q/A move over automatically) and swaps the name in the list.
  const renameCategory = async (oldName: string) => {
    const newName = renameValue.trim();
    if (!newName || newName === oldName) { setRenamingCategory(null); return; }
    if (allCategories.includes(newName)) {
      showToast("A category with that name already exists", "error");
      return;
    }
    setCategoryBusy(true);
    try {
      const affected = faqs.filter((f) => (f.category || FAQ_CATEGORIES[0]) === oldName);
      await Promise.all(affected.map((f) => api.put(`/api/faqs/${f.id}`, { ...f, category: newName })));
      persistCustomCategories(customCategories.map((c) => (c === oldName ? newName : c)));
      await load();
      showToast(`Renamed "${oldName}" to "${newName}"`, "success");
    } catch (err: any) {
      showToast(err.message || "Failed to rename category", "error");
    } finally {
      setCategoryBusy(false);
      setRenamingCategory(null);
      setRenameValue("");
    }
  };

  // Deletes a category. FAQs still tagged with it fall back to the default category
  // rather than disappearing, so nothing is silently lost.
  const deleteCategory = async (name: string) => {
    const affected = faqs.filter((f) => (f.category || FAQ_CATEGORIES[0]) === name);
    const msg = affected.length
      ? `Delete "${name}"? ${affected.length} FAQ(s) using it will move to "${FAQ_CATEGORIES[0]}".`
      : `Delete "${name}"?`;
    if (!confirm(msg)) return;
    setCategoryBusy(true);
    try {
      await Promise.all(affected.map((f) => api.put(`/api/faqs/${f.id}`, { ...f, category: FAQ_CATEGORIES[0] })));
      persistCustomCategories(customCategories.filter((c) => c !== name));
      await load();
      showToast("Category deleted", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to delete category", "error");
    } finally {
      setCategoryBusy(false);
    }
  };

  const saveFaqOrder = async (next: any[]) => {
    setFaqs(next);
    setReorderBusy(true);
    try {
      await Promise.all(next.map((f, i) => api.put(`/api/faqs/${f.id}`, { ...f, displayOrder: i })));
      setFaqs(next.map((f, i) => ({ ...f, displayOrder: i })));
      showToast("FAQ order updated", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update FAQ order", "error");
    } finally {
      setReorderBusy(false);
    }
  };

  const save = async () => {
    if (!editing || !editing.question || !editing.answer) return;
    setSaving(true);
    try {
      if (editing.id) await api.put(`/api/faqs/${editing.id}`, editing);
      else await api.post("/api/faqs", editing, true);
      setEditing(null);
      await load();
      showToast("FAQ saved", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to save FAQ", "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this FAQ?")) return;
    await api.del(`/api/faqs/${id}`);
    load();
  };

  const visibleFaqs = filterCategory === "All" ? faqs : faqs.filter((f) => (f.category || FAQ_CATEGORIES[0]) === filterCategory);

  return (
    <div>
      {/* Sub-nav: Q&A list vs Category manager */}
      <div className="flex items-center gap-1 mb-5 bg-[#f1f1f1] p-1 rounded-lg w-fit">
        {(["questions", "categories"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSubTab(s)}
            className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${subTab === s ? "bg-white text-[#202223] shadow-sm" : "text-[#6d7175] hover:text-[#202223]"}`}
          >
            {s === "questions" ? "Questions & Answers" : "Categories"}
          </button>
        ))}
      </div>

      {subTab === "categories" ? (
        <div className="space-y-5 max-w-xl">
          <div className={`${card} p-4`}>
            <p className="text-sm font-semibold text-[#202223] mb-3">Add a new category</p>
            <div className="flex gap-2">
              <input
                placeholder="e.g. Warranty"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCategory()}
                className={inputCls}
              />
              <button onClick={addCategory} className={`${btnPrimary} shrink-0`}>Add</button>
            </div>
          </div>

          <div className={`${tableWrap}`}>
            {allCategories.map((c) => {
              const count = faqs.filter((f) => (f.category || FAQ_CATEGORIES[0]) === c).length;
              const isRenaming = renamingCategory === c;
              return (
                <div key={c} className={`flex items-center justify-between gap-3 px-4 py-3 border-b border-[#f1f2f3] last:border-b-0 ${trHover}`}>
                  {isRenaming ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && renameCategory(c)}
                      className={`${inputCls} py-1.5`}
                    />
                  ) : (
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#202223] truncate">{c}</p>
                      <p className="text-[11px] text-[#8c9196]">{count} question{count === 1 ? "" : "s"}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-3 shrink-0">
                    {isRenaming ? (
                      <>
                        <button disabled={categoryBusy} onClick={() => renameCategory(c)} className="text-[#202223] text-sm font-medium hover:underline disabled:opacity-50">Save</button>
                        <button onClick={() => { setRenamingCategory(null); setRenameValue(""); }} className={btnGhost}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setRenamingCategory(c); setRenameValue(c); }} className="text-[#202223] text-sm font-medium hover:underline">Rename</button>
                        {c !== FAQ_CATEGORIES[0] && (
                          <button disabled={categoryBusy} onClick={() => deleteCategory(c)} className="text-red-600 text-sm font-medium hover:underline disabled:opacity-50">Delete</button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-[#8c9196]">Renaming a category updates every FAQ that uses it. Deleting a category moves its FAQs to "{FAQ_CATEGORIES[0]}" instead of removing them.</p>
        </div>
      ) : (
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <button onClick={() => setEditing({ question: "", answer: "", category: filterCategory !== "All" ? filterCategory : allCategories[0], displayOrder: faqs.length, isVisible: true })} className={btnPrimary}>
              + New FAQ
            </button>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className={`${inputCls} w-auto`}>
              <option value="All">All categories</option>
              {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {editing && (
            <div className={`${card} p-5 mb-6 space-y-3`}>
              <input placeholder="Question" value={editing.question || ""} onChange={(e) => setEditing({ ...editing, question: e.target.value })} className={inputCls} />
              <textarea placeholder="Answer" value={editing.answer || ""} onChange={(e) => setEditing({ ...editing, answer: e.target.value })} className={inputCls} rows={3} />
              <div>
                <label className="text-xs text-[#6d7175] block mb-1 font-medium">Category</label>
                <select value={editing.category || allCategories[0]} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className={inputCls}>
                  {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-[#6d7175]">
                <input type="checkbox" checked={editing.isVisible !== false} onChange={(e) => setEditing({ ...editing, isVisible: e.target.checked })} /> Visible on site
              </label>
              <div className="flex gap-3 pt-1">
                <button onClick={save} disabled={saving} className={`${btnPrimary} disabled:opacity-50`}>{saving ? "Saving..." : "Save"}</button>
                <button onClick={() => setEditing(null)} className={btnGhost}>Cancel</button>
              </div>
            </div>
          )}

          <p className="text-xs text-[#8c9196] mb-2">Drag the handle to change the order FAQs appear on the FAQ page.</p>
          <DragReorderList
            items={visibleFaqs}
            getKey={(f) => f.id}
            disabled={reorderBusy}
            onReorder={filterCategory === "All" ? saveFaqOrder : () => {}}
            renderItem={(f) => (
              <div className={`flex items-center justify-between ${card} px-4 py-3`}>
                <div className="min-w-0">
                  <p className="text-[#202223] text-sm truncate">{f.question}</p>
                  <p className="text-[#8c9196] text-[11px] font-medium mt-0.5">{f.category || FAQ_CATEGORIES[0]}</p>
                </div>
                <div className="flex gap-4 shrink-0">
                  <button onClick={() => setEditing(f)} className="text-[#202223] text-sm font-medium hover:underline">Edit</button>
                  <button onClick={() => remove(f.id)} className="text-red-500 text-sm font-medium hover:underline">Delete</button>
                </div>
              </div>
            )}
          />
          {visibleFaqs.length === 0 && <p className="text-[#8c9196] text-sm">No FAQs in this category yet.</p>}
        </div>
      )}
    </div>
  );
}

// ---------------- Phone Models (brand -> model list, used by Product Page selector) ----------------
// ---- Variant Options: admin-defined extra dropdowns (e.g. "Charger Type") ----
// Stored in store_settings.variantGroups (same pattern as Phone Models' brandModels),
// so no dedicated DB table is needed. Each product picks at most one group via
// product.variantGroupId (see Products tab), and the storefront shows that group's
// dropdown right under the phone model picker.
interface VariantOptionRow { id: string; label: string; isCustomText?: boolean }
interface VariantGroupRow { id: string; name: string; options: VariantOptionRow[]; required?: boolean }

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function VariantOptionsTab() {
  const { showToast } = useToast();
  const [groups, setGroups] = useState<VariantGroupRow[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [newOptionLabel, setNewOptionLabel] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const s = await api.get("/api/settings");
      setSettings(s || {});
      const g: VariantGroupRow[] = Array.isArray(s?.variantGroups) ? s.variantGroups : [];
      setGroups(g);
      setActiveGroupId(g[0]?.id || null);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const persist = async (next: VariantGroupRow[]) => {
    setGroups(next);
    setSaving(true);
    try {
      await api.put("/api/settings", { ...settings, variantGroups: next });
      setSettings((s: any) => ({ ...s, variantGroups: next }));
      showToast("Saved", "success");
    } catch {
      showToast("Couldn't save, please try again", "error");
    } finally {
      setSaving(false);
    }
  };

  const activeGroup = groups.find((g) => g.id === activeGroupId) || null;

  const addGroup = () => {
    const name = newGroupName.trim();
    if (!name) return;
    const g: VariantGroupRow = { id: uid(), name, options: [], required: true };
    const next = [...groups, g];
    persist(next);
    setActiveGroupId(g.id);
    setNewGroupName("");
  };

  const renameGroup = (id: string, name: string) => {
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, name } : g)));
  };

  const toggleRequired = (id: string, required: boolean) => {
    const next = groups.map((g) => (g.id === id ? { ...g, required } : g));
    persist(next);
  };

  const deleteGroup = (id: string) => {
    if (!confirm("Delete this variant option group? Any products using it will stop showing this dropdown.")) return;
    const next = groups.filter((g) => g.id !== id);
    persist(next);
    if (activeGroupId === id) setActiveGroupId(next[0]?.id || null);
  };

  const addOption = () => {
    const label = newOptionLabel.trim();
    if (!label || !activeGroup) return;
    const next = groups.map((g) =>
      g.id === activeGroup.id ? { ...g, options: [...g.options, { id: uid(), label, isCustomText: false }] } : g
    );
    persist(next);
    setNewOptionLabel("");
  };

  const updateOption = (optionId: string, patch: Partial<VariantOptionRow>) => {
    if (!activeGroup) return;
    const next = groups.map((g) =>
      g.id === activeGroup.id ? { ...g, options: g.options.map((o) => (o.id === optionId ? { ...o, ...patch } : o)) } : g
    );
    setGroups(next);
  };

  const commitOptions = () => persist(groups);

  const deleteOption = (optionId: string) => {
    if (!activeGroup) return;
    const next = groups.map((g) =>
      g.id === activeGroup.id ? { ...g, options: g.options.filter((o) => o.id !== optionId) } : g
    );
    persist(next);
  };

  const moveOption = (optionId: string, dir: -1 | 1) => {
    if (!activeGroup) return;
    const opts = [...activeGroup.options];
    const idx = opts.findIndex((o) => o.id === optionId);
    const swapIdx = idx + dir;
    if (idx < 0 || swapIdx < 0 || swapIdx >= opts.length) return;
    [opts[idx], opts[swapIdx]] = [opts[swapIdx], opts[idx]];
    const next = groups.map((g) => (g.id === activeGroup.id ? { ...g, options: opts } : g));
    persist(next);
  };

  if (loading) return <div className="text-sm text-[#6d7175] py-10 text-center">Loading…</div>;

  return (
    <div className="space-y-4 max-w-5xl">
      <div className={`${card} p-4`}>
        <p className="text-sm text-[#6d7175] mb-1">
          Create dropdowns (e.g. "Charger Type") with your own options. Assign a group to any product from the
          Products tab — it'll show right under the phone model dropdown on that product's page. Mark one option as
          "Create your own text" to let the customer type something custom instead of picking from the list.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Groups list */}
        <div className={`${card} p-4 space-y-3 md:col-span-1`}>
          <p className="text-xs font-bold uppercase tracking-wider text-[#6d7175]">Variant Groups</p>
          <div className="space-y-1">
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => setActiveGroupId(g.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeGroupId === g.id ? "bg-[#202223] text-white" : "hover:bg-[#f1f1f1] text-[#3f4144]"
                }`}
              >
                {g.name} <span className="opacity-60 text-xs">({g.options.length})</span>
              </button>
            ))}
            {groups.length === 0 && <p className="text-xs text-[#8c9196] px-1">No groups yet — add one below.</p>}
          </div>
          <div className="flex gap-2 pt-2 border-t border-[#e1e3e5]">
            <input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addGroup()}
              placeholder="New group name e.g. Charger Type"
              className={inputCls}
            />
            <button onClick={addGroup} disabled={!newGroupName.trim() || saving} className={`${btnPrimary} shrink-0`}>
              <Plus size={15} />
            </button>
          </div>
        </div>

        {/* Options editor */}
        <div className={`${card} p-4 space-y-3 md:col-span-2`}>
          {!activeGroup ? (
            <p className="text-sm text-[#8c9196] py-8 text-center">Select or create a group to manage its options.</p>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <input
                  value={activeGroup.name}
                  onChange={(e) => renameGroup(activeGroup.id, e.target.value)}
                  onBlur={commitOptions}
                  className={`${inputCls} font-semibold`}
                />
                <button onClick={() => deleteGroup(activeGroup.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg shrink-0">
                  <Trash2 size={16} />
                </button>
              </div>

              <label className="flex items-center gap-2 text-xs font-medium text-[#3f4144] cursor-pointer w-fit">
                <input
                  type="checkbox"
                  checked={activeGroup.required !== false}
                  onChange={(e) => toggleRequired(activeGroup.id, e.target.checked)}
                />
                Required — customer must pick an option to proceed
                <span className="text-[#8c9196]">
                  {activeGroup.required !== false ? "(compulsory)" : "(optional — skippable)"}
                </span>
              </label>

              <div className="space-y-2">
                {activeGroup.options.map((o, i) => (
                  <div key={o.id} className="flex items-center gap-2 bg-[#f6f6f7] rounded-lg p-2">
                    <div className="flex flex-col">
                      <button onClick={() => moveOption(o.id, -1)} disabled={i === 0} className="text-[#8c9196] disabled:opacity-30 hover:text-[#202223]">
                        <GripVertical size={14} />
                      </button>
                    </div>
                    <input
                      value={o.label}
                      onChange={(e) => updateOption(o.id, { label: e.target.value })}
                      onBlur={commitOptions}
                      className="flex-1 bg-white border border-[#c9cccf] rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-[#458fff]"
                    />
                    <label className="flex items-center gap-1.5 text-xs text-[#6d7175] font-medium shrink-0 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={!!o.isCustomText}
                        onChange={(e) => { updateOption(o.id, { isCustomText: e.target.checked }); }}
                      />
                      Show text box
                    </label>
                    <button onClick={() => deleteOption(o.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {activeGroup.options.length === 0 && (
                  <p className="text-xs text-[#8c9196]">No options yet. Add entries below — e.g. "Type-C", "Micro USB", and a final "Create your own text" option with "Show text box" checked.</p>
                )}
              </div>

              <div className="flex gap-2 pt-2 border-t border-[#e1e3e5]">
                <input
                  value={newOptionLabel}
                  onChange={(e) => setNewOptionLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addOption()}
                  placeholder='Add option e.g. "Create your own text"'
                  className={inputCls}
                />
                <button onClick={addOption} disabled={!newOptionLabel.trim() || saving} className={`${btnPrimary} shrink-0`}>
                  <Plus size={15} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PhoneModelsTab() {
  // Phone models are now grouped per Material (Acrylic / Gold / Hard Plastic /
  // Glass) first, then by Brand, then by Model — since different case
  // materials support different phone models. Stored in
  // store_settings.materialBrandModels: { [material]: { [brand]: string[] } }.
  const [activeMaterial, setActiveMaterial] = useState<Material>(MATERIAL_OPTIONS[0]);
  const [allMaterialModels, setAllMaterialModels] = useState<Record<string, Record<string, string[]>>>({});
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const [activeBrand, setActiveBrand] = useState<string | null>(null);
  const [newBrand, setNewBrand] = useState("");
  const [newModel, setNewModel] = useState("");
  const [bulkModels, setBulkModels] = useState("");
  const [dragBrand, setDragBrand] = useState<string | null>(null);
  const [dragOverBrand, setDragOverBrand] = useState<string | null>(null);
  const [dragModel, setDragModel] = useState<string | null>(null);
  const [dragOverModel, setDragOverModel] = useState<string | null>(null);

  const brandModels = allMaterialModels[activeMaterial] || {};

  const load = async () => {
    setLoading(true);
    try {
      const s = await api.get("/api/settings");
      setSettings(s || {});
      // Fallback chain per material: use the new per-material map if it's
      // already been customized, otherwise fall back to the old flat
      // brandModels (pre-migration data) or the built-in default catalog —
      // so every material starts out fully populated instead of empty.
      const legacyFlat = s?.brandModels && Object.keys(s.brandModels).length ? s.brandModels : DEFAULT_BRAND_MODELS;
      const perMaterial = s?.materialBrandModels && Object.keys(s.materialBrandModels).length ? s.materialBrandModels : {};
      const merged: Record<string, Record<string, string[]>> = {};
      MATERIAL_OPTIONS.forEach((m) => {
        merged[m] = perMaterial[m] && Object.keys(perMaterial[m]).length ? perMaterial[m] : legacyFlat;
      });
      setAllMaterialModels(merged);
      const firstMaterial = MATERIAL_OPTIONS[0];
      setActiveMaterial(firstMaterial);
      setActiveBrand(Object.keys(merged[firstMaterial] || {})[0] || null);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const selectMaterial = (m: Material) => {
    setActiveMaterial(m);
    setActiveBrand(Object.keys(allMaterialModels[m] || {})[0] || null);
  };

  const persist = async (next: Record<string, string[]>) => {
    const nextAll = { ...allMaterialModels, [activeMaterial]: next };
    setAllMaterialModels(nextAll);
    setSaving(true);
    try {
      await api.put("/api/settings", { ...settings, materialBrandModels: nextAll });
      setSettings((s: any) => ({ ...s, materialBrandModels: nextAll }));
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 1500);
    } finally {
      setSaving(false);
    }
  };

  // ---- CSV export/import for Brand,Model pairs (scoped to the active material) ----
  const csvEscape = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

  const exportCSV = () => {
    const rows = [["Brand", "Model"]];
    Object.keys(brandModels).forEach((b) => {
      const models = brandModels[b] || [];
      if (models.length === 0) rows.push([b, ""]);
      else models.forEach((m) => rows.push([b, m]));
    });
    const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `phone-models-${activeMaterial.toLowerCase().replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): string[][] => {
    const rows: string[][] = [];
    let row: string[] = [];
    let field = "";
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (c === '"') inQuotes = false;
        else field += c;
      } else {
        if (c === '"') inQuotes = true;
        else if (c === ",") { row.push(field); field = ""; }
        else if (c === "\n" || c === "\r") {
          if (c === "\r" && text[i + 1] === "\n") i++;
          row.push(field); field = "";
          if (row.some((f) => f.trim() !== "")) rows.push(row);
          row = [];
        } else field += c;
      }
    }
    if (field !== "" || row.length) { row.push(field); rows.push(row); }
    return rows;
  };

  const importFileRef = useRef<HTMLInputElement>(null);

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (!rows.length) return;
      const header = rows[0].map((h) => h.trim().toLowerCase());
      const hasHeader = header[0] === "brand";
      const dataRows = hasHeader ? rows.slice(1) : rows;

      const next: Record<string, string[]> = {};
      dataRows.forEach(([brand, model]) => {
        const b = (brand || "").trim();
        const m = (model || "").trim();
        if (!b) return;
        if (!next[b]) next[b] = [];
        if (m && !next[b].includes(m)) next[b].push(m);
      });

      if (!confirm(`Import ${Object.keys(next).length} brand(s) from CSV for ${activeMaterial}? This replaces the current Phone Models list for ${activeMaterial} only.`)) return;
      persist(next);
      setActiveBrand(Object.keys(next)[0] || null);
    } catch (err) {
      alert("Couldn't read that CSV file. Please check the format and try again.");
    } finally {
      if (importFileRef.current) importFileRef.current.value = "";
    }
  };

  const addBrand = () => {
    const name = newBrand.trim();
    if (!name || brandModels[name]) return;
    const next = { ...brandModels, [name]: [] };
    persist(next);
    setActiveBrand(name);
    setNewBrand("");
  };

  const removeBrand = (brand: string) => {
    if (!confirm(`Delete brand "${brand}" and all its models from ${activeMaterial}?`)) return;
    const next = { ...brandModels };
    delete next[brand];
    persist(next);
    if (activeBrand === brand) setActiveBrand(Object.keys(next)[0] || null);
  };

  const addModel = () => {
    if (!activeBrand) return;
    const name = newModel.trim();
    if (!name || brandModels[activeBrand]?.includes(name)) return;
    const next = { ...brandModels, [activeBrand]: [...(brandModels[activeBrand] || []), name] };
    persist(next);
    setNewModel("");
  };

  const addModelsBulk = () => {
    if (!activeBrand || !bulkModels.trim()) return;
    const names = bulkModels.split("\n").map((s) => s.trim()).filter(Boolean);
    const existing = brandModels[activeBrand] || [];
    const merged = [...existing, ...names.filter((n) => !existing.includes(n))];
    persist({ ...brandModels, [activeBrand]: merged });
    setBulkModels("");
  };

  const removeModel = (brand: string, model: string) => {
    const next = { ...brandModels, [brand]: (brandModels[brand] || []).filter((m) => m !== model) };
    persist(next);
  };

  // Drag-and-drop reorder for brands (order of keys) — rebuild the object in the new key order.
  const reorderBrands = (from: string, to: string) => {
    if (from === to) return;
    const order = Object.keys(brandModels);
    const fromIdx = order.indexOf(from);
    const toIdx = order.indexOf(to);
    if (fromIdx === -1 || toIdx === -1) return;
    order.splice(fromIdx, 1);
    order.splice(toIdx, 0, from);
    const next: Record<string, string[]> = {};
    order.forEach((b) => { next[b] = brandModels[b]; });
    persist(next);
  };

  // Sort the active brand's models alphabetically (A-Z).
  const sortModelsAZ = (brand: string) => {
    const list = [...(brandModels[brand] || [])].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
    persist({ ...brandModels, [brand]: list });
  };


  const reorderModels = (from: string, to: string) => {
    if (!activeBrand || from === to) return;
    const list = [...(brandModels[activeBrand] || [])];
    const fromIdx = list.indexOf(from);
    const toIdx = list.indexOf(to);
    if (fromIdx === -1 || toIdx === -1) return;
    list.splice(fromIdx, 1);
    list.splice(toIdx, 0, from);
    persist({ ...brandModels, [activeBrand]: list });
  };

  if (loading) return <p className="text-[#8c9196] text-sm">Loading...</p>;

  const brands = Object.keys(brandModels);

  return (
    <div>
      {/* Step 1: pick which Material's phone-model list you're editing —
          Acrylic, Gold, Hard Plastic and Glass each have their own list,
          since not every case material supports every phone model. */}
      <div className={`${card} p-4 mb-4`}>
        <p className="text-xs font-black text-[#202223] mb-2">Which material's phone models?</p>
        <div className="flex flex-wrap gap-2">
          {MATERIAL_OPTIONS.map((m) => (
            <button
              key={m}
              onClick={() => selectMaterial(m)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                activeMaterial === m ? "bg-[#202223] text-white border-[#202223]" : "border-[#c9cccf] text-[#6d7175] hover:bg-[#f6f6f7]"
              }`}
            >
              {m} <span className={activeMaterial === m ? "text-[#c9cccf]" : "text-[#8c9196]"}>({Object.values(allMaterialModels[m] || {}).reduce((n, arr) => n + arr.length, 0)})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <p className="text-sm text-[#6d7175]">
          This list powers the Brand &amp; Model selector for <span className="font-semibold text-[#202223]">{activeMaterial}</span> products.
        </p>
        {saving && <span className="text-xs text-[#8c9196]">Saving...</span>}
        {savedMsg && <span className="text-xs text-green-600 font-semibold">Saved ✓</span>}
        <div className="ml-auto flex items-center gap-2">
          <button onClick={exportCSV} className="btn-liquid-light flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5">
            <Download size={13} /> Export CSV
          </button>
          <button onClick={() => importFileRef.current?.click()} className="btn-liquid-light flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5">
            <Upload size={13} /> Import CSV
          </button>
          <input ref={importFileRef} type="file" accept=".csv,text/csv" onChange={handleImportFile} className="hidden" />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {/* Brands column */}
        <div className={`${card} p-4`}>
          <h3 className="text-sm font-black text-[#202223] mb-3">Brands ({brands.length}) <span className="font-normal text-[#8c9196]">— drag to reorder</span></h3>
          <div className="space-y-1 max-h-96 overflow-y-auto mb-3">
            {brands.map((b) => (
              <div
                key={b}
                draggable
                onDragStart={() => setDragBrand(b)}
                onDragOver={(e) => { e.preventDefault(); if (b !== dragOverBrand) setDragOverBrand(b); }}
                onDrop={(e) => { e.preventDefault(); if (dragBrand) reorderBrands(dragBrand, b); setDragBrand(null); setDragOverBrand(null); }}
                onDragEnd={() => { setDragBrand(null); setDragOverBrand(null); }}
                onClick={() => setActiveBrand(b)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-grab active:cursor-grabbing ${
                  activeBrand === b ? "btn-liquid-dark" : "text-[#6d7175] hover:bg-[#f6f6f7]"
                } ${dragOverBrand === b && dragBrand && dragBrand !== b ? "ring-2 ring-[#3b93f0]" : ""} ${dragBrand === b ? "opacity-50" : ""}`}
              >
                <span className="flex items-center gap-2 font-medium">
                  <GripVertical size={13} className={activeBrand === b ? "text-[#c9cccf]" : "text-[#c9cccf]"} />
                  {b}
                </span>
                <span className="flex items-center gap-2">
                  <span className={`text-xs ${activeBrand === b ? "text-[#c9cccf]" : "text-[#8c9196]"}`}>{brandModels[b]?.length || 0}</span>
                  <button onClick={(e) => { e.stopPropagation(); removeBrand(b); }} className={activeBrand === b ? "text-red-300" : "text-red-400"}>
                    <X size={13} />
                  </button>
                </span>
              </div>
            ))}
            {brands.length === 0 && <p className="text-[#8c9196] text-xs">No brands yet for {activeMaterial}.</p>}
          </div>
          <div className="flex gap-2">
            <input
              placeholder="New brand e.g. Google"
              value={newBrand}
              onChange={(e) => setNewBrand(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addBrand()}
              className={inputCls}
            />
            <button onClick={addBrand} className={btnPrimary}>Add</button>
          </div>
        </div>

        {/* Models column */}
        <div className={`${card} p-4 md:col-span-2`}>
          <h3 className="text-sm font-black text-[#202223] mb-3 flex items-center justify-between gap-2 flex-wrap">
            <span>
              {activeBrand ? <>Models — {activeBrand} <span className="font-normal text-[#8c9196]">— drag to reorder</span></> : "Select a brand"}
            </span>
            {activeBrand && (brandModels[activeBrand] || []).length > 1 && (
              <button
                onClick={() => sortModelsAZ(activeBrand)}
                className="text-xs font-bold text-[#3b93f0] hover:underline flex items-center gap-1"
              >
                <ArrowDownAZ size={13} /> Sort A-Z
              </button>
            )}
          </h3>

          {activeBrand && (
            <>
              <div className="flex flex-wrap gap-2 mb-4 max-h-72 overflow-y-auto">
                {(brandModels[activeBrand] || []).map((m) => (
                  <span
                    key={m}
                    draggable
                    onDragStart={() => setDragModel(m)}
                    onDragOver={(e) => { e.preventDefault(); if (m !== dragOverModel) setDragOverModel(m); }}
                    onDrop={(e) => { e.preventDefault(); if (dragModel) reorderModels(dragModel, m); setDragModel(null); setDragOverModel(null); }}
                    onDragEnd={() => { setDragModel(null); setDragOverModel(null); }}
                    className={`flex items-center gap-1.5 bg-[#f6f6f7] border border-[#e1e3e5] rounded-full px-3 py-1.5 text-xs text-[#202223] cursor-grab active:cursor-grabbing ${
                      dragOverModel === m && dragModel && dragModel !== m ? "ring-2 ring-[#3b93f0]" : ""
                    } ${dragModel === m ? "opacity-50" : ""}`}
                  >
                    <GripVertical size={11} className="text-[#c9cccf]" />
                    {m}
                    <button onClick={() => removeModel(activeBrand, m)} className="text-[#8c9196] hover:text-red-500">
                      <X size={11} />
                    </button>
                  </span>
                ))}
                {(brandModels[activeBrand] || []).length === 0 && <p className="text-[#8c9196] text-xs">No models yet — add below.</p>}
              </div>

              <div className="flex gap-2 mb-3">
                <input
                  placeholder="Add single model e.g. IPHONE 17 PRO"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addModel()}
                  className={inputCls}
                />
                <button onClick={addModel} className={btnPrimary}>Add</button>
              </div>

              <div>
                <label className="text-xs text-[#6d7175] block mb-1 font-medium">Bulk add (one model per line)</label>
                <textarea
                  value={bulkModels}
                  onChange={(e) => setBulkModels(e.target.value)}
                  rows={4}
                  placeholder={"IPHONE 18\nIPHONE 18 PRO\nIPHONE 18 PRO MAX"}
                  className={inputCls}
                />
                <button onClick={addModelsBulk} className={`${btnPrimary} mt-2`}>Add All Lines</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------- Serviceability (pincode delivery availability) ----------------
function ServiceabilityTab() {
  const [settings, setSettings] = useState<any>({});
  const [pincodes, setPincodes] = useState<string[]>([]);
  const [checkInput, setCheckInput] = useState("");
  const [checkResult, setCheckResult] = useState<null | boolean>(null);
  const [bulkInput, setBulkInput] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const s = await api.get("/api/settings");
    setSettings(s || {});
    setPincodes(s?.servicablePincodes || []);
  };
  useEffect(() => { load(); }, []);

  const persist = async (next: string[]) => {
    setPincodes(next);
    setSaving(true);
    try {
      await api.put("/api/settings", { ...settings, servicablePincodes: next });
      setSettings((s: any) => ({ ...s, servicablePincodes: next }));
    } finally {
      setSaving(false);
    }
  };

  const addBulk = () => {
    const codes = bulkInput.split(/[\n,]/).map((s) => s.trim()).filter((s) => /^\d{6}$/.test(s));
    const merged = Array.from(new Set([...pincodes, ...codes]));
    persist(merged);
    setBulkInput("");
  };

  const removeCode = (code: string) => persist(pincodes.filter((p) => p !== code));

  const check = () => {
    if (!/^\d{6}$/.test(checkInput.trim())) { setCheckResult(null); return; }
    setCheckResult(pincodes.length === 0 ? true : pincodes.includes(checkInput.trim()));
  };

  return (
    <div>
      <p className="text-sm text-[#6d7175] mb-4">
        Add pincodes you deliver to. If the list is empty, every pincode is treated as serviceable (no restriction).
        {saving && <span className="text-[#8c9196] ml-2">Saving...</span>}
      </p>

      <div className="grid md:grid-cols-2 gap-5">
        <div className={`${card} p-4`}>
          <h3 className="text-sm font-black text-[#202223] mb-3">Add Pincodes</h3>
          <textarea
            value={bulkInput}
            onChange={(e) => setBulkInput(e.target.value)}
            rows={5}
            placeholder={"641601\n641602, 641603\n625007"}
            className={inputCls}
          />
          <button onClick={addBulk} className={`${btnPrimary} mt-2`}>Add Pincodes</button>

          <h3 className="text-sm font-black text-[#202223] mt-6 mb-2">Serviceable Pincodes ({pincodes.length})</h3>
          <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto">
            {pincodes.map((p) => (
              <span key={p} className="flex items-center gap-1 bg-[#f6f6f7] border border-[#e1e3e5] rounded-full px-2.5 py-1 text-xs text-[#202223]">
                {p}
                <button onClick={() => removeCode(p)} className="text-[#8c9196] hover:text-red-500"><X size={11} /></button>
              </span>
            ))}
            {pincodes.length === 0 && <p className="text-[#8c9196] text-xs">No restriction set — all pincodes serviceable.</p>}
          </div>
        </div>

        <div className={`${card} p-4`}>
          <h3 className="text-sm font-black text-[#202223] mb-3">Check a Pincode</h3>
          <div className="flex gap-2">
            <input
              placeholder="e.g. 641601"
              value={checkInput}
              onChange={(e) => { setCheckInput(e.target.value); setCheckResult(null); }}
              onKeyDown={(e) => e.key === "Enter" && check()}
              className={inputCls}
              maxLength={6}
            />
            <button onClick={check} className={btnPrimary}>Check</button>
          </div>
          {checkResult !== null && (
            <p className={`mt-3 text-sm font-semibold ${checkResult ? "text-green-600" : "text-red-500"}`}>
              {checkResult ? "✓ Deliverable" : "✗ Not serviceable yet"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------- Website Content (homepage About/Reviews/Contact section text) ----------------
// Renamed from the old standalone "Website Content" tab — now rendered as
// the "Page Text" sub-section inside the merged WebsiteContentIntegratedTab.
// ---------------- Reviews (dedicated moderation page) ----------------
// Every review a customer submits — whether from a product page's "Write a
// Review" tab or the general /reviews page — lands here pending, and never
// shows up on the storefront until an admin approves it.
const REVIEWS_SUBTABS = ["Product Reviews", "General Reviews", "Stories"] as const;

function ReviewsTab() {
  const [sub, setSub] = useState<(typeof REVIEWS_SUBTABS)[number]>("Product Reviews");

  return (
    <div>
      <div className="flex gap-2 mb-5 border-b border-[#e1e3e5] overflow-x-auto">
        {REVIEWS_SUBTABS.map((s) => (
          <button
            key={s}
            onClick={() => setSub(s)}
            className={`px-4 py-2.5 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
              sub === s ? "border-[#202223] text-[#202223]" : "border-transparent text-[#8c9196] hover:text-[#202223]"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      {sub === "Product Reviews" && <ProductReviewsQueue />}
      {sub === "General Reviews" && <SiteReviewsQueue />}
      {sub === "Stories" && <ReviewStoriesManager />}
    </div>
  );
}

// Moderation queue for reviews left on individual product pages (the
// "Customer Reviews" tab on each product). Approving one makes it live on
// that product's page instantly and folds it into the product's star rating.
function ProductReviewsQueue() {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const rows = await api.getAuth("/api/reviews/admin/all");
      setReviews(rows || []);
    } catch {
      // ignore — section just shows empty state
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const approve = async (id: string, isApproved: boolean) => {
    setBusyId(id);
    try {
      await api.put(`/api/reviews/${id}/approve`, { isApproved });
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, is_approved: isApproved } : r)));
      showToast(isApproved ? "Review approved — now live on the product page" : "Review unapproved", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update review", "error");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this review permanently?")) return;
    setBusyId(id);
    try {
      await api.del(`/api/reviews/${id}`);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      showToast("Review deleted", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to delete review", "error");
    } finally {
      setBusyId(null);
    }
  };

  const pending = reviews.filter((r) => !r.is_approved);
  const approved = reviews.filter((r) => r.is_approved);

  const ReviewRow = ({ r, approvedRow }: { r: ProductReview; approvedRow: boolean }) => (
    <div className={`border rounded-lg px-3 py-2.5 ${approvedRow ? "bg-[#f6f6f7] border-[#e1e3e5]" : "bg-amber-50 border-amber-200"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {r.image && (
            <img src={api.imageUrl(r.image)} alt="Review" className="w-12 h-12 object-cover rounded-lg border border-[#e1e3e5] shrink-0" />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              <span className="text-sm font-bold text-[#202223]">{r.name}</span>
              <span className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={11} className={i < r.rating ? "fill-amber-400 text-amber-400" : "text-zinc-200"} />
                ))}
              </span>
              {r.product_title && (
                <span className="text-[10px] font-semibold text-[#6d7175] bg-white border border-[#e1e3e5] rounded-full px-2 py-0.5 truncate max-w-[200px]">
                  {r.product_title}
                </span>
              )}
            </div>
            {r.comment && <p className="text-xs text-[#6d7175]">{r.comment}</p>}
          </div>
        </div>
        <div className="flex gap-3 shrink-0">
          {approvedRow ? (
            <>
              <button onClick={() => approve(r.id, false)} disabled={busyId === r.id} className="text-xs font-medium text-[#202223] hover:underline disabled:opacity-50">Unpublish</button>
              <button onClick={() => remove(r.id)} disabled={busyId === r.id} className="text-xs font-medium text-red-500 hover:underline disabled:opacity-50">Delete</button>
            </>
          ) : (
            <>
              <button onClick={() => approve(r.id, true)} disabled={busyId === r.id} className="text-xs font-bold text-green-600 hover:underline disabled:opacity-50">Approve</button>
              <button onClick={() => remove(r.id)} disabled={busyId === r.id} className="text-xs font-bold text-red-500 hover:underline disabled:opacity-50">Reject</button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`${card} p-5`}>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-black text-[#202223]">Product Reviews Approval Queue</h3>
        {pending.length > 0 && (
          <span className="text-[10px] font-bold text-white bg-amber-500 rounded-full px-2 py-0.5">{pending.length} pending</span>
        )}
      </div>
      <p className="text-xs text-[#8c9196] mb-4">
        Reviews submitted through the "Customer Reviews" tab on a product page. Approve to make one go live on that
        product (and count toward its star rating); reject to remove it.
      </p>

      {loading ? (
        <p className="text-[#8c9196] text-sm">Loading...</p>
      ) : reviews.length === 0 ? (
        <p className="text-[#8c9196] text-sm">No product reviews yet.</p>
      ) : (
        <div className="space-y-4">
          {pending.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-[#8c9196] uppercase tracking-wide mb-2">Pending</p>
              <div className="space-y-2">
                {pending.map((r) => <ReviewRow key={r.id} r={r} approvedRow={false} />)}
              </div>
            </div>
          )}
          {approved.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-[#8c9196] uppercase tracking-wide mb-2">Live on site</p>
              <div className="space-y-2">
                {approved.map((r) => <ReviewRow key={r.id} r={r} approvedRow={true} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// "Stories" — admin posts a screenshot/photo daily, Instagram Highlights
// style. Shown as a row of circular bubbles at the top of the public
// /reviews page; customers tap through them full-screen.
function ReviewStoriesManager() {
  const { showToast } = useToast();
  const [stories, setStories] = useState<ReviewStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [name, setName] = useState("");
  const [caption, setCaption] = useState("");
  const [thumbUrl, setThumbUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [posting, setPosting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  // The thumbnail the admin uploads here is also the exact image shown
  // full-screen in the storefront's portrait story viewer (see
  // ReviewStories.tsx). It used to be uploaded raw with no cropping step,
  // so whatever the admin picked (often a square/landscape screenshot)
  // didn't match the portrait frame customers actually see it in - hence
  // needing to scroll/hunt to see the part of the photo that mattered.
  // Cropping to the same 9:16 portrait ratio here makes the preview and
  // the live story pixel-exact.
  const [cropFile, setCropFile] = useState<File | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const rows = await api.getAuth("/api/review-stories/admin/all");
      setStories(rows || []);
    } catch {
      // ignore — section just shows empty state
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const uploadThumb = async (file: File) => {
    setUploadingThumb(true);
    try {
      const res = await api.upload(file);
      setThumbUrl(res.url);
    } catch (err: any) {
      showToast(err.message || "Thumbnail upload failed", "error");
    } finally {
      setUploadingThumb(false);
    }
  };

  const uploadVideo = async (file: File) => {
    setUploadingVideo(true);
    try {
      const res = await api.upload(file);
      setVideoUrl(res.url);
    } catch (err: any) {
      showToast(err.message || "Video upload failed", "error");
    } finally {
      setUploadingVideo(false);
    }
  };

  const postStory = async () => {
    if (!name.trim()) {
      showToast("Give the story a name first", "error");
      return;
    }
    if (!thumbUrl) {
      showToast("Add a thumbnail image first", "error");
      return;
    }
    setPosting(true);
    try {
      await api.post(
        "/api/review-stories",
        {
          image: thumbUrl,
          video: videoUrl || undefined,
          mediaType: videoUrl ? "video" : "image",
          name: name.trim(),
          caption: caption.trim(),
          displayOrder: 0,
        },
        true
      );
      setName("");
      setCaption("");
      setThumbUrl("");
      setVideoUrl("");
      showToast("Story posted — now live on /reviews", "success");
      load();
    } catch (err: any) {
      showToast(err.message || "Failed to post story", "error");
    } finally {
      setPosting(false);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    setBusyId(id);
    try {
      await api.put(`/api/review-stories/${id}`, { isActive });
      setStories((prev) => prev.map((s) => (s.id === id ? { ...s, is_active: isActive } : s)));
    } catch (err: any) {
      showToast(err.message || "Failed to update story", "error");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this story permanently?")) return;
    setBusyId(id);
    try {
      await api.del(`/api/review-stories/${id}`);
      setStories((prev) => prev.filter((s) => s.id !== id));
      showToast("Story deleted", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to delete story", "error");
    } finally {
      setBusyId(null);
    }
  };

  const reorder = async (next: ReviewStory[]) => {
    setStories(next);
    try {
      await api.put("/api/review-stories/reorder/all", { ids: next.map((s) => s.id) });
    } catch (err: any) {
      showToast(err.message || "Failed to save order", "error");
    }
  };

  return (
    <div className={`${card} p-5`}>
      <h3 className="text-sm font-black text-[#202223] mb-1">Stories (Instagram Highlights style)</h3>
      <p className="text-xs text-[#8c9196] mb-4">
        Post a screenshot or photo — it shows up as a circular story bubble at the top of the public /reviews page.
        Customers tap through them full-screen, just like Instagram. Stories stay up permanently (like Instagram
        Highlights) — no auto-expiry. Unpublish or delete a story anytime to take it down.
      </p>

      <div className="bg-[#f6f6f7] border border-[#e1e3e5] rounded-lg p-3 mb-5 space-y-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Story name (required, e.g. Priya's Unboxing) — shown under the circle"
          className={inputCls}
        />
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Caption (optional, shown when the story is opened)"
          className={inputCls}
        />

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <label className={`flex items-center justify-center gap-1.5 text-xs font-bold rounded-lg px-3 py-2.5 w-fit cursor-pointer ${thumbUrl ? "bg-white border border-[#e1e3e5] text-[#202223]" : "bg-[#202223] text-white hover:bg-black"}`}>
            {thumbUrl && <img src={api.imageUrl(thumbUrl)} alt="Thumbnail" className="w-5 h-5 rounded-full object-cover" />}
            <Upload size={13} />
            {uploadingThumb ? "Uploading..." : thumbUrl ? "Change thumbnail" : "Upload thumbnail (required)"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploadingThumb}
              onChange={(e) => {
                if (e.target.files?.[0]) setCropFile(e.target.files[0]);
                e.target.value = "";
              }}
            />
          </label>

          <label className={`flex items-center justify-center gap-1.5 text-xs font-bold rounded-lg px-3 py-2.5 w-fit cursor-pointer ${videoUrl ? "bg-white border border-[#e1e3e5] text-[#202223]" : "bg-white border border-dashed border-[#c9cccf] text-[#6d7175] hover:border-[#8c9196]"}`}>
            <Upload size={13} />
            {uploadingVideo ? "Uploading..." : videoUrl ? "Video attached ✓ (tap to change)" : "Attach video (optional, plays with sound)"}
            <input
              type="file"
              accept="video/*"
              className="hidden"
              disabled={uploadingVideo}
              onChange={(e) => e.target.files?.[0] && uploadVideo(e.target.files[0])}
            />
          </label>
          {videoUrl && (
            <button type="button" onClick={() => setVideoUrl("")} className="text-xs font-medium text-red-500 hover:underline">
              Remove video
            </button>
          )}
        </div>
        <p className="text-[11px] text-[#8c9196]">
          Thumbnail is the small circle shown before the story is opened. If you attach a video, that plays
          full-screen with sound when the customer opens the story — otherwise the thumbnail image itself is shown full-screen,
          so you'll crop it to the same portrait frame customers see it in.
        </p>

        {cropFile && (
          <ImageCropModal
            file={cropFile}
            aspectW={9}
            aspectH={16}
            onCancel={() => setCropFile(null)}
            onConfirm={(croppedFile) => {
              setCropFile(null);
              uploadThumb(croppedFile);
            }}
          />
        )}

        <button
          type="button"
          onClick={postStory}
          disabled={posting || uploadingThumb || uploadingVideo || !name.trim() || !thumbUrl}
          className={`text-xs font-bold text-white rounded-lg px-4 py-2.5 w-fit ${posting || uploadingThumb || uploadingVideo || !name.trim() || !thumbUrl ? "bg-[#c9cccf] cursor-not-allowed" : "bg-[#202223] cursor-pointer hover:bg-black"}`}
        >
          {posting ? "Posting..." : "Post today's story"}
        </button>
      </div>

      {loading ? (
        <p className="text-[#8c9196] text-sm">Loading...</p>
      ) : stories.length === 0 ? (
        <p className="text-[#8c9196] text-sm">No stories posted yet.</p>
      ) : (
        <DragReorderList
          items={stories}
          getKey={(s) => s.id}
          onReorder={reorder}
          renderItem={(s) => {
            const expired = Date.now() - new Date(s.created_at).getTime() > 24 * 60 * 60 * 1000;
            return (
            <div className={`flex items-center gap-3 bg-white border rounded-lg px-3 py-2.5 ${!s.is_active || expired ? "border-dashed border-[#c9cccf] opacity-60" : "border-[#e1e3e5]"}`}>
              <GripVertical size={14} className="text-[#c9cccf] shrink-0" />
              <img
                src={api.imageUrl(s.image)}
                alt={s.name}
                className="rounded-full object-cover border-2 border-[#e1e3e5] shrink-0 aspect-square"
                style={{ width: 48, height: 48 }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-[#202223] truncate">{s.name}</p>
                  {s.media_type === "video" && s.video && (
                    <span className="text-[9px] font-bold text-white bg-purple-600 rounded-full px-1.5 py-0.5 shrink-0">Video</span>
                  )}
                  {expired ? (
                    <span className="text-[9px] font-bold text-white bg-[#8c9196] rounded-full px-1.5 py-0.5 shrink-0">Highlights</span>
                  ) : s.is_active ? (
                    <span className="text-[9px] font-bold text-white bg-green-600 rounded-full px-1.5 py-0.5 shrink-0">Live</span>
                  ) : (
                    <span className="text-[9px] font-bold text-white bg-[#c9cccf] rounded-full px-1.5 py-0.5 shrink-0">Unpublished</span>
                  )}
                </div>
                {s.caption && <p className="text-[11px] text-[#6d7175] truncate">{s.caption}</p>}
                <p className="text-[10px] text-[#8c9196]">{new Date(s.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
              </div>
              <div className="flex gap-3 shrink-0">
                <button onClick={() => toggleActive(s.id, !s.is_active)} disabled={busyId === s.id} className="text-xs font-medium text-[#202223] hover:underline disabled:opacity-50">
                  {s.is_active ? "Unpublish" : "Publish"}
                </button>
                <button onClick={() => remove(s.id)} disabled={busyId === s.id} className="text-xs font-medium text-red-500 hover:underline disabled:opacity-50">Delete</button>
              </div>
            </div>
            );
          }}
        />
      )}
    </div>
  );
}

function WebsiteContentSection() {
  const [settings, setSettings] = useState<any>({});
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const load = async () => {
    const s = await api.get("/api/settings");
    setSettings(s || {});
    setForm(s || {});
  };
  useEffect(() => { load(); }, []);

  const set = (key: string, value: string) => setForm((f: any) => ({ ...f, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/api/settings", { ...settings, ...form });
      setSettings((s: any) => ({ ...s, ...form }));
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 1500);
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, k, textarea = false }: { label: string; k: string; textarea?: boolean }) => (
    <div>
      <label className="text-xs text-[#6d7175] block mb-1 font-medium">{label}</label>
      {textarea ? (
        <textarea value={form[k] || ""} onChange={(e) => set(k, e.target.value)} rows={2} className={inputCls} />
      ) : (
        <input value={form[k] || ""} onChange={(e) => set(k, e.target.value)} className={inputCls} />
      )}
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button onClick={save} disabled={saving} className={`${btnPrimary} disabled:opacity-50`}>{saving ? "Saving..." : "Save All Content"}</button>
        {savedMsg && <span className="text-xs text-green-600 font-semibold">Saved ✓</span>}
      </div>

      <div className="space-y-6">
        <div className={`${card} p-5`}>
          <h3 className="text-sm font-black text-[#202223] mb-4">About / Brand Story Section</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Section Title" k="aboutSectionTitle" />
          </div>
          <div className="mt-4 space-y-4">
            <Field label="Subtitle" k="aboutSectionSubtitle" textarea />
            <Field label="Paragraph 1" k="aboutSectionDesc1" textarea />
            <Field label="Paragraph 2" k="aboutSectionDesc2" textarea />
          </div>
        </div>

        <div className={`${card} p-5`}>
          <h3 className="text-sm font-black text-[#202223] mb-4">Contact / Support Section</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Title" k="contactTitle" />
            <Field label="Subtitle" k="contactSubtitle" />
          </div>
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <Field label="Contact Email" k="contactEmail" />
            <Field label="Contact Phone" k="contactPhone" />
            <Field label="Contact Address" k="contactAddress" />
          </div>
        </div>

        <div className={`${card} p-5`}>
          <h3 className="text-sm font-black text-[#202223] mb-4">Site Text — Home &amp; Global</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label='"Our Collections" Heading' k="homeCollectionsTitle" />
            <Field label='"Featured" Heading' k="homeFeaturedTitle" />
            <Field label='"Best Selling" Heading' k="homeBestSellersTitle" />
            <Field label='"Trending Now" Heading' k="homeTrendingTitle" />
          </div>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <Field label="Newsletter Title" k="newsletterTitle" />
            <Field label="Newsletter Subtitle" k="newsletterSubtitle" />
          </div>
          <div className="mt-4">
            <Field label="Footer Disclaimer / Brand Blurb" k="footerDisclaimer" textarea />
          </div>
        </div>
      </div>
    </div>
  );
}

// Moderation queue for reviews submitted by real site visitors via the
// "Write a Review" form on the public /reviews page. Every submission lands
// pending; approving it makes it go live instantly on /reviews (merged
// alongside the admin-authored testimonials below).
function SiteReviewsQueue() {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<SiteReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const rows = await api.getAuth("/api/site-reviews/admin/all");
      setReviews(rows || []);
    } catch {
      // ignore — section just shows empty state
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const approve = async (id: string, isApproved: boolean) => {
    setBusyId(id);
    try {
      await api.put(`/api/site-reviews/${id}/approve`, { isApproved });
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, isApproved } : r)));
      showToast(isApproved ? "Review approved — now live on /reviews" : "Review unapproved", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update review", "error");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this review permanently?")) return;
    setBusyId(id);
    try {
      await api.del(`/api/site-reviews/${id}`);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      showToast("Review deleted", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to delete review", "error");
    } finally {
      setBusyId(null);
    }
  };

  const pending = reviews.filter((r) => !r.isApproved);
  const approved = reviews.filter((r) => r.isApproved);

  return (
    <div className={`${card} p-5`}>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-black text-[#202223]">Reviews Approval Queue (from visitors)</h3>
        {pending.length > 0 && (
          <span className="text-[10px] font-bold text-white bg-amber-500 rounded-full px-2 py-0.5">{pending.length} pending</span>
        )}
      </div>
      <p className="text-xs text-[#8c9196] mb-4">
        Reviews submitted by visitors through the "Write a Review" button on the public /reviews page. Approve to make them
        go live instantly; delete to reject.
      </p>

      {loading ? (
        <p className="text-[#8c9196] text-sm">Loading...</p>
      ) : reviews.length === 0 ? (
        <p className="text-[#8c9196] text-sm">No visitor-submitted reviews yet.</p>
      ) : (
        <div className="space-y-4">
          {pending.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-[#8c9196] uppercase tracking-wide mb-2">Pending</p>
              <div className="space-y-2">
                {pending.map((r) => (
                  <div key={r.id} className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-sm font-bold text-[#202223]">{r.name}</span>
                          <span className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} size={11} className={i < r.rating ? "fill-amber-400 text-amber-400" : "text-zinc-200"} />
                            ))}
                          </span>
                        </div>
                        {r.comment && <p className="text-xs text-[#6d7175]">{r.comment}</p>}
                      </div>
                      <div className="flex gap-3 shrink-0">
                        <button onClick={() => approve(r.id, true)} disabled={busyId === r.id} className="text-xs font-bold text-green-600 hover:underline disabled:opacity-50">Approve</button>
                        <button onClick={() => remove(r.id)} disabled={busyId === r.id} className="text-xs font-bold text-red-500 hover:underline disabled:opacity-50">Reject</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {approved.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-[#8c9196] uppercase tracking-wide mb-2">Live on site</p>
              <div className="space-y-2">
                {approved.map((r) => (
                  <div key={r.id} className="bg-[#f6f6f7] border border-[#e1e3e5] rounded-lg px-3 py-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-sm font-bold text-[#202223]">{r.name}</span>
                          <span className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} size={11} className={i < r.rating ? "fill-amber-400 text-amber-400" : "text-zinc-200"} />
                            ))}
                          </span>
                        </div>
                        {r.comment && <p className="text-xs text-[#6d7175]">{r.comment}</p>}
                      </div>
                      <div className="flex gap-3 shrink-0">
                        <button onClick={() => approve(r.id, false)} disabled={busyId === r.id} className="text-xs font-medium text-[#202223] hover:underline disabled:opacity-50">Unpublish</button>
                        <button onClick={() => remove(r.id)} disabled={busyId === r.id} className="text-xs font-medium text-red-500 hover:underline disabled:opacity-50">Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Customer Reviews shown on the Cart page AND on the public /reviews page —
// plain admin-entered testimonials, never claimed to be pulled from Google/Meta.
// Stored as settings.siteTestimonials. Admin can post a review on behalf of a
// customer (e.g. one they sent over WhatsApp) with an optional photo and an
// optional "which product" tag — it shows up immediately on the storefront's
// Reviews page and the Cart page carousel, no customer login needed.
function TestimonialsEditor({ form, set }: { form: any; set: (k: string, v: any) => void }) {
  const { showToast } = useToast();
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const list: Testimonial[] = form.siteTestimonials && form.siteTestimonials.length ? form.siteTestimonials : DEFAULT_TESTIMONIALS;

  const update = (next: Testimonial[]) => set("siteTestimonials", next);

  const addOne = () => {
    update([{ id: crypto.randomUUID(), name: "", rating: 5, comment: "", image: "", productTitle: "" }, ...list]);
  };
  const editOne = (id: string, patch: Partial<Testimonial>) => {
    update(list.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };
  const removeOne = (id: string) => {
    update(list.filter((t) => t.id !== id));
  };

  const uploadReviewImage = async (id: string, file: File) => {
    setUploadingId(id);
    try {
      const res = await api.upload(file);
      editOne(id, { image: res.url });
      showToast("Review photo uploaded", "success");
    } catch (err: any) {
      showToast(err.message || "Upload failed", "error");
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div className={`${card} p-5`}>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-black text-[#202223]">Customer Reviews (Cart page + /reviews)</h3>
        <button onClick={addOne} className="text-xs font-bold text-[#202223] hover:underline">+ Post Review</button>
      </div>
      <p className="text-xs text-[#8c9196] mb-4">
        Post a review on behalf of a customer — with their name, rating, comment, an optional photo (e.g. a WhatsApp
        screenshot they sent you), and which product it's about. It appears instantly on the storefront's Reviews page
        once you hit "Save All Content" below.
      </p>
      <div className="space-y-3">
        {list.map((t) => (
          <div key={t.id} className="bg-[#f6f6f7] border border-[#e1e3e5] rounded-lg p-3 space-y-2">
            <div className="flex gap-2">
              <input value={t.name} onChange={(e) => editOne(t.id, { name: e.target.value })} placeholder="Customer name" className={inputCls} />
              <select value={t.rating} onChange={(e) => editOne(t.id, { rating: Number(e.target.value) })} className={`${inputCls} w-24`}>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}
              </select>
              <button onClick={() => removeOne(t.id)} className="text-red-500 text-xs font-medium px-2 shrink-0">Delete</button>
            </div>
            <textarea value={t.comment} onChange={(e) => editOne(t.id, { comment: e.target.value })} placeholder="Review text" rows={2} className={inputCls} />
            <input
              value={t.productTitle || ""}
              onChange={(e) => editOne(t.id, { productTitle: e.target.value })}
              placeholder="Product name (optional, e.g. Custom Photo Case)"
              className={inputCls}
            />
            <div className="flex items-center gap-3">
              {t.image ? (
                <div className="relative">
                  <img src={api.imageUrl(t.image)} alt="Review" className="w-16 h-16 object-cover rounded-lg border border-[#e1e3e5]" />
                  <button
                    onClick={() => editOne(t.id, { image: "" })}
                    className="absolute -top-2 -right-2 bg-white border border-[#e1e3e5] rounded-full w-5 h-5 flex items-center justify-center text-[#6d7175] hover:text-red-500"
                    title="Remove photo"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-1.5 text-xs font-bold text-[#202223] cursor-pointer border border-dashed border-[#c9cccf] rounded-lg px-3 py-2 hover:bg-white">
                  <Upload size={13} />
                  {uploadingId === t.id ? "Uploading..." : "Attach photo"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingId === t.id}
                    onChange={(e) => e.target.files?.[0] && uploadReviewImage(t.id, e.target.files[0])}
                  />
                </label>
              )}
            </div>
          </div>
        ))}
        {list.length === 0 && <p className="text-[#8c9196] text-sm">No reviews yet — click "+ Post Review".</p>}
      </div>
    </div>
  );
}

// ---------------- Content (Branding / Social / Store Config / SEO) ----------------
const CONTENT_SUBTABS = ["Branding", "Social & Chat", "Store Config", "SEO Tools"] as const;

// ---------------- Website Content (integrated) ----------------
// Merges the old separate "Website Content" (page copy: About, taglines etc.)
// and "Content" (site-wide content blocks) tabs into a single sidebar entry
// with an internal sub-tab switch, per the requested 5-tool sidebar layout.
function WebsiteContentIntegratedTab() {
  const [section, setSection] = useState<"page" | "site">("page");
  return (
    <div>
      <div className="flex gap-1 bg-[#f1f1f1] rounded-lg p-1 mb-5 w-fit">
        {([
          { key: "page" as const, label: "Page Text" },
          { key: "site" as const, label: "Site Content" },
        ]).map((s) => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors ${
              section === s.key ? "bg-white text-[#202223] shadow-sm" : "text-[#6d7175] hover:text-[#202223]"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      {section === "page" ? <WebsiteContentSection /> : <ContentSection />}
    </div>
  );
}

function ContentSection() {
  const [sub, setSub] = useState<(typeof CONTENT_SUBTABS)[number]>("Branding");
  const [settings, setSettings] = useState<any>({});
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const s = await api.get("/api/settings");
    setSettings(s || {});
    setForm(s || {});
  };
  useEffect(() => { load(); }, []);

  const set = (key: string, value: any) => setForm((f: any) => ({ ...f, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/api/settings", { ...settings, ...form });
      setSettings((s: any) => ({ ...s, ...form }));
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 1500);
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async (file: File) => {
    setUploading(true);
    try {
      const res = await api.upload(file);
      set("logoUrl", res.url);
    } finally {
      setUploading(false);
    }
  };

  const Field = ({ label, k }: { label: string; k: string }) => (
    <div>
      <label className="text-xs text-[#6d7175] block mb-1 font-medium">{label}</label>
      <input value={form[k] || ""} onChange={(e) => set(k, e.target.value)} className={inputCls} />
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {CONTENT_SUBTABS.map((s) => (
          <button
            key={s}
            onClick={() => setSub(s)}
            className={`text-sm font-semibold px-3 py-1.5 rounded-lg ${sub === s ? "btn-liquid-dark" : "text-[#6d7175] hover:bg-[#f6f6f7]"}`}
          >
            {s}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-3">
          {savedMsg && <span className="text-xs text-green-600 font-semibold">Saved ✓</span>}
          <button onClick={save} disabled={saving} className={`${btnPrimary} disabled:opacity-50`}>{saving ? "Saving..." : "Save"}</button>
        </div>
      </div>

      {sub === "Branding" && (
        <div className={`${card} p-5 space-y-4`}>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Logo Text" k="logoText" />
            <Field label="Tagline" k="tagline" />
          </div>
          <div>
            <label className="text-xs text-[#6d7175] block mb-1 font-medium">Logo Image</label>
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} className="text-[#6d7175] text-sm" />
            {uploading && <p className="text-xs text-[#8c9196] mt-1">Uploading...</p>}
            {form.logoUrl && <img src={api.imageUrl(form.logoUrl)} className="w-16 h-16 mt-2 rounded-lg border border-[#e1e3e5] object-contain bg-[#f6f6f7]" />}
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <Field label="Contact Phone" k="contactPhone" />
            <Field label="Contact Email" k="contactEmail" />
            <Field label="Address" k="contactAddress" />
          </div>
          <Field label="Footer Disclaimer" k="footerDisclaimer" />
        </div>
      )}

      {sub === "Social & Chat" && (
        <div className={`${card} p-5 space-y-4`}>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Instagram URL" k="instagramUrl" />
            <Field label="Facebook URL" k="facebookUrl" />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="WhatsApp Number (with country code)" k="whatsappNumber" />
            <Field label="YouTube URL (optional)" k="youtubeUrl" />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Instagram Followers (shown on About Us, e.g. 12.5K)" k="instagramFollowers" />
            <Field label="YouTube Subscribers (shown on About Us, e.g. 3.2K)" k="youtubeSubscribers" />
          </div>
          <div>
            <label className="text-xs text-[#6d7175] block mb-1 font-medium">WhatsApp Floating Button — Default Message</label>
            <textarea
              value={form.whatsappMessage || ""}
              onChange={(e) => set("whatsappMessage", e.target.value)}
              rows={2}
              className={inputCls}
              placeholder="Hi Stickover! I'd like to know more about your products."
            />
            <p className="text-[11px] text-[#8c9196] mt-1">Pre-filled text that opens with the storefront's floating WhatsApp button.</p>
          </div>
        </div>
      )}

      {sub === "Store Config" && (
        <div className={`${card} p-5 space-y-4`}>
          <div>
            <h3 className="text-sm font-bold text-[#202223]">Shipping by State</h3>
            <p className="text-xs text-[#6d7175] mt-1">
              Orders shipping to the states listed below are free. Every other state is charged the flat fee set here at checkout.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#6d7175] block mb-1 font-medium">Free Shipping States (comma separated)</label>
              <input
                value={
                  form.shippingFreeStates
                    ? form.shippingFreeStates.join(", ")
                    : "Tamil Nadu, Puducherry"
                }
                onChange={(e) =>
                  set(
                    "shippingFreeStates",
                    e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean)
                  )
                }
                className={inputCls}
                placeholder="Tamil Nadu, Puducherry"
              />
              <p className="text-[11px] text-[#8c9196] mt-1">Must match the state names exactly as they appear in the checkout dropdown (e.g. "Puducherry", not "Pondicherry").</p>
            </div>
            <Field label="Shipping Fee for Other States (₹)" k="shippingFeeOtherStates" />
          </div>
        </div>
      )}

      {sub === "SEO Tools" && (
        <div className={`${card} p-5 space-y-4`}>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Homepage SEO Title" k="seoHomeTitle" />
            <Field label="Homepage SEO Keywords (comma separated)" k="seoHomeKeywords" />
          </div>
          <div>
            <label className="text-xs text-[#6d7175] block mb-1 font-medium">Homepage Meta Description</label>
            <textarea value={form.seoHomeDescription || ""} onChange={(e) => set("seoHomeDescription", e.target.value)} rows={2} className={inputCls} />
          </div>
          <p className="text-xs text-[#8c9196]">
            These override the default homepage SEO tags. Product and collection pages generate their own SEO tags automatically from their title/description.
          </p>
        </div>
      )}
    </div>
  );
}

