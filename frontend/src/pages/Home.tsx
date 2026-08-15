import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Truck, ShieldCheck, Headphones, Users, Star, Award, Package, Clock3, MessageCircle, IndianRupee } from "lucide-react";
import { api } from "../utils/api";
import { Product, Collection } from "../types";
import ProductCard from "../components/ProductCard";
import FAQSection from "../components/FAQSection";
import HeroBanner from "../components/HeroBanner";
import { setSEO, setJSONLD, absUrl } from "../utils/useSEO";
import { titleCase } from "../utils/text";

// A single horizontally-laid-out product row, used once per collection so every
// heading on the homepage ("Wall Decoratives", "TVK Acrylic Cases", etc in the
// reference site) maps 1:1 to a real, admin-managed Collection.
function CollectionRow({ collection, products }: { collection: Collection; products: Product[] }) {
  if (!products.length) return null;
  return (
    <section className="mt-14">
      <div className="mb-5">
        <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-wide">{titleCase(collection.name)}</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
        {products.slice(0, 8).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

// Feature bar (the 3 icon+text badges under the hero banner) — fully admin
// editable from Admin -> Home Page -> Feature Bar. Icon key is stored in
// settings.featureBar; this map is how that key renders as an actual icon.
export const FEATURE_BAR_ICON_MAP: Record<string, any> = {
  truck: Truck,
  shield: ShieldCheck,
  headphones: Headphones,
  star: Star,
  award: Award,
  package: Package,
  clock: Clock3,
  message: MessageCircle,
  users: Users,
  rupee: IndianRupee,
};

export const DEFAULT_FEATURE_BAR = [
  { icon: "truck", title: "Free Shipping", subtitle: "On order above ₹499" },
  { icon: "shield", title: "Premium Quality", subtitle: "Acrylic strong glass" },
  { icon: "headphones", title: "Customer Support", subtitle: "We're here to help" },
];

export const DEFAULT_HOME_SECTIONS = [
  "collectionsGrid",
  "popularProducts",
  "newIn",
  "collectionRows",
  "trending",
  "bestSellers",
  "featured",
  "trustStrip",
  "visionStats",
  "faq",
] as const;

export const HOME_SECTION_LABELS: Record<string, string> = {
  collectionsGrid: "Collections Grid",
  popularProducts: "Popular Products",
  newIn: "New In",
  collectionRows: "Per-Collection Product Rows",
  trending: "Trending Now",
  bestSellers: "Best Selling",
  featured: "Featured",
  trustStrip: "Trust Strip (delivery/return badges)",
  visionStats: "Our Vision + Stats",
  faq: "FAQ",
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/api/products").then(setProducts).catch(() => {});
    api.get("/api/collections").then(setCollections).catch(() => {});
    api.get("/api/settings").then(setSettings).catch(() => {});
  }, []);

  useEffect(() => {
    setSEO({
      title: "Custom, Acrylic & Gold Phone Cases India",
      description:
        "Buy strong acrylic & glass phone cases at Stickover, India's custom case store. Premium photo cases, gold finishes, on sale with pan-India delivery.",
      keywords:
        "custom phone case, acrylic phone case, strong acrylic case, glass phone case, gold phone case, gold case, premium phone case, personalised phone case India, phone case sale",
      url: "/",
    });
    setJSONLD("organization", {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Stickover",
      alternateName: "Stickover.in",
      url: absUrl("/"),
      logo: absUrl("/favicon-512.png"),
      description:
        "Stickover sells custom phone cases, acrylic phone cases and gold phone cases online across India.",
      sameAs: [],
    });
    setJSONLD("website", {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Stickover",
      url: absUrl("/"),
      potentialAction: {
        "@type": "SearchAction",
        target: `${absUrl("/search")}?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    });
    // Clear any leftover product-page structured data from a prior route
    setJSONLD("product", null);
    setJSONLD("breadcrumb", null);
  }, []);

  const visibleCollections = useMemo(
    () =>
      collections
        .filter((c) => c.isVisible)
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
    [collections]
  );

  const [showAllPopular, setShowAllPopular] = useState(false);
  const popularProducts = useMemo(
    () => [...products].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
    [products]
  );
  const popularPreview = popularProducts.slice(0, 9);

  const productsByCollection = useMemo(() => {
    const map: Record<string, Product[]> = {};
    for (const c of visibleCollections) {
      map[c.id] = products
        .filter((p) => p.collectionId === c.id || p.collectionIds?.includes(c.id))
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
        .slice(0, 12);
    }
    return map;
  }, [products, visibleCollections]);

  const newArrivals = useMemo(
    () => products.filter((p) => p.isNewArrival).slice(0, 5),
    [products]
  );
  const trending = products
    .filter((p) => p.isTrending)
    .sort((a, b) => (a.trendingOrder ?? 0) - (b.trendingOrder ?? 0))
    .slice(0, 20);
  const bestSellers = products
    .filter((p) => p.isBestSeller)
    .sort((a, b) => (a.bestSellerOrder ?? 0) - (b.bestSellerOrder ?? 0))
    .slice(0, 20);
  const featured = products.filter((p) => p.isFeatured).slice(0, 8);

  const orderedSections = useMemo(() => {
    const saved: string[] = Array.isArray(settings?.homeSectionsOrder) ? settings.homeSectionsOrder : [];
    const valid = saved.filter((k) => (DEFAULT_HOME_SECTIONS as readonly string[]).includes(k));
    const missing = DEFAULT_HOME_SECTIONS.filter((k) => !valid.includes(k));
    return valid.length ? [...valid, ...missing] : [...DEFAULT_HOME_SECTIONS];
  }, [settings]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <>
    <HeroBanner />

    {/* Feature bar: 3 icon+text badges, fully editable from Admin -> Home Page -> Feature Bar */}
    <section className="max-w-[1600px] mx-auto px-4 sm:px-10 lg:px-20 mt-3 sm:mt-6">
      <div className="grid grid-cols-3 gap-1.5 sm:gap-6 bg-white rounded-xl sm:rounded-2xl border border-zinc-100 shadow-sm px-1.5 py-2.5 sm:px-8 sm:py-6">
        {(Array.isArray(settings?.featureBar) && settings.featureBar.length === 3 ? settings.featureBar : DEFAULT_FEATURE_BAR).map(
          (item: { icon: string; title: string; subtitle: string }, i: number) => {
            const Icon = FEATURE_BAR_ICON_MAP[item.icon] || Truck;
            return (
              <div key={i} className="flex flex-col items-center gap-1 sm:gap-2 text-center">
                <Icon className="w-4 h-4 sm:w-7 sm:h-7 text-amber-500" />
                <span className="text-[7.5px] sm:text-xs font-black text-zinc-900 uppercase tracking-wide leading-tight">{item.title}</span>
                <span className="hidden sm:block text-[11px] text-zinc-500">{item.subtitle}</span>
              </div>
            );
          }
        )}
      </div>
    </section>

    <h1 className="sr-only">Custom Phone Cases, Acrylic Cases &amp; Gold Cases Online — Stickover</h1>

    
    <div className="max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-20">
      {orderedSections.map((key) => {
        switch (key) {
          case "collectionsGrid":
            return visibleCollections.length > 0 ? (
              <section key={key} className="mt-8 sm:mt-14">
                <div className="flex items-center justify-between mb-5 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl font-black text-zinc-900 uppercase tracking-wide">
                    {settings?.homeCollectionsTitle || "Shop By Category"}
                  </h2>
                  <Link to="/collections" className="text-xs sm:text-sm font-bold text-zinc-900 border border-zinc-200 rounded-full px-3 py-1.5 hover:bg-zinc-50 whitespace-nowrap">
                    View all →
                  </Link>
                </div>
                <div className={`grid ${settings?.collectionsGridMobileCols === 2 ? "grid-cols-2" : "grid-cols-3"} md:grid-cols-5 gap-3 sm:gap-6`}>
                  {visibleCollections.map((c) => (
                    <Link key={c.id} to={`/collections/${c.slug}`} className="group flex flex-col items-center">
                      <div
                        className={`aspect-square w-full overflow-hidden rounded-2xl bg-zinc-100 shadow-sm ${
                          c.isHighlighted
                            ? "border-2 border-amber-400 ring-2 ring-amber-300/60"
                            : "border border-zinc-200"
                        }`}
                      >
                        {c.image ? (
                          <img src={api.thumbUrl(c.image, 480)} alt={titleCase(c.name)} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-300 text-xs">{titleCase(c.name)}</div>
                        )}
                      </div>
                      <span className={`mt-2 text-[11px] sm:text-sm font-bold leading-snug text-center ${c.isHighlighted ? "text-amber-600" : "text-zinc-800"}`}>{titleCase(c.name)}</span>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null;

          case "popularProducts":
            return popularProducts.length > 0 ? (
              <section key={key} className="mt-14">
                <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 mb-6 text-center uppercase tracking-wide">
                  Popular Products
                </h2>

                {!showAllPopular ? (
                  <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-none">
                    {popularPreview.map((p) => (
                      <div key={p.id} className="w-[46%] sm:w-[220px] shrink-0 snap-start">
                        <ProductCard product={p} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
                    {popularProducts.map((p) => <ProductCard key={p.id} product={p} />)}
                  </div>
                )}

                {popularProducts.length > 9 && (
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={() => setShowAllPopular((v) => !v)}
                      className="glass-btn-primary text-white font-bold px-6 py-2.5 rounded-full text-sm"
                    >
                      {showAllPopular ? "Show Less" : "Show More"}
                    </button>
                  </div>
                )}
              </section>
            ) : null;

          case "newIn":
            // Hidden per store owner request (below Popular Products).
            return null;

          case "collectionRows":
            // One row per admin-managed Collection ("Wall Decoratives", "TVK Acrylic
            // Cases", etc): create the Collection in Admin → Home Page / Collections,
            // tick "Visible on Home", assign products, and it shows up here in the
            // order set from Admin → Home Page.
            return (
              <div key={key}>
                {visibleCollections.map((c) => (
                  <CollectionRow key={c.id} collection={c} products={productsByCollection[c.id] || []} />
                ))}
              </div>
            );

          case "trending":
            return trending.length > 0 ? (
              <section key={key} className="mt-14">
                <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 mb-6 text-center uppercase tracking-wide">{(settings?.homeTrendingTitle || "Trending Now").toUpperCase()}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  {trending.map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
              </section>
            ) : null;

          case "bestSellers":
            return bestSellers.length > 0 ? (
              <section key={key} className="mt-14">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl sm:text-2xl font-black text-zinc-900 uppercase tracking-wide">{(settings?.homeBestSellersTitle || "Best Sellers").toUpperCase()}</h2>
                  <Link to="/collections" className="text-xs sm:text-sm font-bold text-zinc-900 border border-zinc-200 rounded-full px-3 py-1.5 hover:bg-zinc-50 whitespace-nowrap">
                    View all →
                  </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  {bestSellers.map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
              </section>
            ) : null;

          case "featured":
            return featured.length > 0 ? (
              <section key={key} className="mt-14">
                <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 mb-6 text-center uppercase tracking-wide">{(settings?.homeFeaturedTitle || "Featured").toUpperCase()}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  {featured.map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
              </section>
            ) : null;

          case "trustStrip":
            return (
              <section key={key} className="mt-16 mx-1 sm:mx-0 bg-zinc-950 rounded-2xl sm:rounded-3xl px-4 sm:px-8 py-8">
                <div className="grid grid-cols-2 gap-4 text-center max-w-md mx-auto">
                  <div className="flex flex-col items-center gap-1.5">
                    <Users className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400" />
                    <p className="text-lg sm:text-2xl font-black text-white">50,000+</p>
                    <p className="text-[10px] sm:text-xs text-zinc-400 font-semibold">Happy Customers</p>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <Star className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400" />
                    <p className="text-lg sm:text-2xl font-black text-white">4.9/5</p>
                    <p className="text-[10px] sm:text-xs text-zinc-400 font-semibold">Average Rating</p>
                  </div>
                </div>
              </section>
            );

          case "visionStats":
            // "We Are Homegrown" panel removed per store owner request; Our
            // Vision text kept on its own, full-width.
            return (
              <section key={key} className="mt-16">
                <h3 className="text-2xl font-black text-zinc-900 mb-4">Our Vision</h3>
                <p className="text-zinc-500 leading-relaxed max-w-2xl">
                  {settings?.visionText ||
                    "In line with our vision, we wish to be recognized as an organization renowned for its creative solutions, innovation, and quality. We also aim to re-calibrate the benchmark standards in designing and printing products tailored to meet the needs of a diverse customer base."}
                </p>
              </section>
            );

          case "faq":
            return <FAQSection key={key} />;

          default:
            return null;
        }
      })}
    </div>
    </>
  );
}
