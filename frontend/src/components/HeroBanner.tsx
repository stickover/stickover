import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api } from "../utils/api";
import { Banner } from "../types";

// Single banner box used for both mobile and desktop — same image, same 3548x1774 ratio.
const BANNER_RATIO = "3548 / 1774";

export default function HeroBanner() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    api.get("/api/banners").then((all: Banner[]) =>
      setBanners((all || []).filter((b) => b.active).sort((a, b) => a.order - b.order))
    ).catch(() => {});
  }, []);

  useEffect(() => {
    if (banners.length < 2) return;
    const t = setInterval(() => setActive((i) => (i + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length]);

  if (banners.length === 0) return null;

  return (
    <section className="max-w-[1600px] mx-auto mt-0 sm:mt-6 sm:px-10 lg:px-20">
      <div
        className="relative w-full overflow-hidden border-0 sm:border sm:border-[#f0f0f2] sm:rounded-2xl sm:shadow-[0_1px_2px_rgba(24,24,27,0.04)]"
        style={{ aspectRatio: BANNER_RATIO }}
      >
        {banners.map((b, i) => {
          const CardTag: any = b.link ? Link : "div";
          const cardProps = b.link ? { to: b.link } : {};
          return (
            <CardTag
              key={b.id}
              {...cardProps}
              className="absolute inset-0 transition-opacity duration-700"
              style={{ opacity: i === active ? 1 : 0, pointerEvents: i === active ? "auto" : "none" }}
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
                  className="w-full h-full object-cover"
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
        {banners.length > 1 && (
          <div className="absolute bottom-3 right-3 flex gap-1.5 z-10">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
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
