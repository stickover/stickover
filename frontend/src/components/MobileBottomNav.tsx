import { useLocation, useNavigate } from "react-router";
import { Home as HomeIcon, LayoutGrid, ShoppingBag, Star, Menu } from "lucide-react";
import { useCart } from "../context/CartContext";

// Fixed bottom tab bar shown ONLY on mobile (hidden from lg breakpoint up,
// where the existing top navbar already covers everything). Mirrors the
// "Home / Collections / Cart / Reviews / Menu" layout Hari wants, with the
// current page's tab highlighted.
const TABS = [
  { key: "home", label: "Home", path: "/", icon: HomeIcon },
  { key: "collections", label: "Collections", path: "/collections", icon: LayoutGrid },
  { key: "cart", label: "Cart", path: "/cart", icon: ShoppingBag },
  { key: "reviews", label: "Reviews", path: "/reviews", icon: Star },
  { key: "menu", label: "Menu", path: null, icon: Menu },
] as const;

function isActive(path: string | null, pathname: string) {
  if (path === null) return false;
  if (path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(path + "/");
}

export default function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { count, openDrawer } = useCart();

  const handleTap = (tab: (typeof TABS)[number]) => {
    if (tab.key === "cart") {
      openDrawer();
      return;
    }
    if (tab.key === "menu") {
      // Reuses the existing hamburger popup already built into Navbar,
      // instead of duplicating that menu markup here.
      window.dispatchEvent(new CustomEvent("stickover:open-mobile-menu"));
      return;
    }
    if (tab.path) navigate(tab.path);
  };

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t flex items-stretch"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
        background: "var(--mobile-nav-bg, #000)",
        borderColor: "rgba(255,255,255,0.08)",
      }}
      aria-label="Mobile navigation"
    >
      {TABS.map((tab) => {
        const active = isActive(tab.path, location.pathname);
        const Icon = tab.icon;
        return (
          <button
            key={tab.key}
            onClick={() => handleTap(tab)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 cursor-pointer border-none bg-transparent relative"
          >
            <span className="relative">
              <Icon
                size={22}
                strokeWidth={active ? 2.25 : 1.75}
                style={{ color: active ? "var(--mobile-nav-active, #f59e0b)" : "var(--mobile-nav-text, #a1a1aa)" }}
              />
              {tab.key === "cart" && count > 0 && (
                <span
                  className="absolute -top-1.5 -right-2 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center ring-2"
                  style={{ background: "var(--mobile-nav-active, #f59e0b)", boxShadow: "0 0 0 2px var(--mobile-nav-bg, #000)" }}
                >
                  {count}
                </span>
              )}
            </span>
            <span
              className={`text-[10px] leading-none ${active ? "font-bold" : "font-medium"}`}
              style={{ color: active ? "var(--mobile-nav-active, #f59e0b)" : "var(--mobile-nav-text, #a1a1aa)" }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
