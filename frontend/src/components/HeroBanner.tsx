import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { api } from "../utils/api";
import { Banner } from "../types";

// Single banner box used for both mobile and desktop — same image, same 3548x1774 ratio.
const BANNER_RATIO = "3548 / 1774";

// Home page shows at most this many banners (admin is limited to the same number).
export const MAX_HERO_BANNERS = 5;
// Auto-scroll delay options (ms) the admin can choose from.
export const HERO_INTERVAL_OPTIONS = [3000, 5000] as const;
const DEFAULT_INTERVAL = 5000;

// After the shopper touches / drags the banner, auto-scroll waits this long
// before moving again so it never yanks the slide away mid-swipe.
const INTERACTION_PAUSE_MS = 6000;

export default function HeroBanner() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [active, setActive] = useState(0);
  const [intervalMs, setIntervalMs] = useState<number>(DEFAULT_INTERVAL);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const lastInteraction = useRef(0);
  const scrollTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    api.get("/api/banners").then((all: Banner[]) =>
      setBanners(
        (all || [])
          .filter((b) => b.active)
          .sort((a, b) => a.order - b.order)
          .slice(0, MAX_HERO_BANNERS)
      )
    ).catch(() => {});
    api.get("/api/settings").then((s: any) => {
      const v = Number(s?.heroBannerInterval);
      if ((HERO_INTERVAL_OPTIONS as readonly number[]).includes(v)) setIntervalMs(v);
    }).catch(() => {});
  }, []);

  const goTo = useCallback((i: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
    setActive(i);
  }, []);

  // Auto-scroll: every 3s / 5s (admin setting). Skipped while the shopper is
  // swiping or just finished swiping.
  useEffect(() => {
    if (banners.length < 2) return;
    const t = setInterval(() => {
      if (Date.now() - lastInteraction.current < INTERACTION_PAUSE_MS) return;
      const el = trackRef.current;
      if (!el) return;
      const current = Math.round(el.scrollLeft / el.clientWidth);
      goTo((current + 1) % banners.length);
    }, intervalMs);
    return () => clearInterval(t);
  }, [banners.length, intervalMs, goTo]);

  // Keep the dots in sync when the shopper swipes by hand.
  const handleScroll = () => {
    window.clearTimeout(scrollTimer.current);
    scrollTimer.current = window.setTimeout(() => {
      const el = trackRef.current;
      if (!el || !el.clientWidth) return;
      setActive(Math.round(el.scrollLeft / el.clientWidth));
    }, 60);
  };

  const markInteraction = () => { lastInteraction.current = Date.now(); };

  if (banners.length === 0) return null;

  return (
    <section className="max-w-[1600px] mx-auto mt-0 sm:mt-6 sm:px-10 lg:px-20">
      <div
        className="relative w-full overflow-hidden border-0 sm:border sm:border-[#f0f0f2] sm:rounded-2xl sm:shadow-[0_1px_2px_rgba(24,24,27,0.04)]"
        style={{ aspectRatio: BANNER_RATIO }}
      >
        <div
          ref={trackRef}
          onScroll={handleScroll}
          onTouchStart={markInteraction}
          onTouchMove={markInteraction}
          onPointerDown={markInteraction}
          onWheel={markInteraction}
          className="flex w-full h-full overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch", overscrollBehaviorX: "contain" }}
        >
          {banners.map((b, i) => {
            const CardTag: any = b.link ? Link : "div";
            const cardProps = b.link ? { to: b.link, draggable: false } : {};
            return (
              <CardTag
                key={b.id}
                {...cardProps}
                className="relative shrink-0 w-full h-full snap-start snap-always block"
              >
                {b.mediaType === "video" && b.videoUrl ? (
                  <video
                    src={api.imageUrl(b.videoUrl)}
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload={i === 0 ? "auto" : "none"}
                  />
                ) : (
                  <img
                    src={api.imageUrl(b.imageUrl)}
                    alt={b.title || "Banner"}
                    className="w-full h-full object-cover select-none"
                    draggable={false}
                    loading={i === 0 ? "eager" : "lazy"}
                    decoding="async"
                  />
                )}
                {(b.subtitle || b.badge) && (
                  <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-8 bg-gradient-to-t from-black/40 via-black/0 to-black/0">
                    {b.badge && (
                      <span className="inline-block w-fit px-3 py-1 bg-white/90 text-zinc-900 text-[10px] tracking-[0.2em] uppercase rounded-md mb-2 font-bold">
                        {b.badge}
                      </span>
                    )}
                    {b.subtitle && <p className="text-white text-sm sm:text-lg font-semibold max-w-md drop-shadow">{b.subtitle}</p>}
                  </div>
                )}
              </CardTag>
            );
          })}
        </div>
        {banners.length > 1 && (
          <div className="absolute bottom-3 right-3 flex gap-1.5 z-10">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => { markInteraction(); goTo(i); }}
                aria-label={`Show banner ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === active ? "w-6 bg-white" : "w-1.5 bg-white/50"}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
