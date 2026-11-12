import { Link } from "react-router";
import { Product } from "../types";
import { api } from "../utils/api";
import { toTitleCase } from "../utils/textFormat";

export default function ProductCard({ product }: { product: Product }) {
  // Listing thumbnails only support photos — if the admin put a video first,
  // fall back to the first actual photo so the card never shows broken art.
  const img = (product.images || []).find((i) => !/\.(mp4|webm|mov)$/i.test(i || ""));
  const hasDiscount = product.comparePrice && product.comparePrice > product.price;
  const discountPct = hasDiscount ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;

  return (
    <Link
      to={`/product/${product.id}`}
      className="group bg-white border border-zinc-100 shadow-sm hover:shadow-lg transition-shadow rounded-2xl overflow-hidden flex flex-col"
    >
      <div className="relative bg-zinc-50/40 flex items-center justify-center aspect-square overflow-hidden rounded-t-2xl">
        {hasDiscount && (
          <span className="absolute top-2 left-2 z-10 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
            Sale
          </span>
        )}
        {!hasDiscount && product.isBestSeller && (
          <span className="absolute top-2 left-2 z-10 bg-black text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full italic">
            Best Seller
          </span>
        )}
        {!hasDiscount && product.isTrending && (
          <span className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full italic">
            Viral Drop
          </span>
        )}
        {!hasDiscount && product.isNewArrival && !product.isBestSeller && !product.isTrending && (
          <span className="absolute top-2 left-2 z-10 bg-zinc-900 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
            New Arrival
          </span>
        )}

        {img ? (
          <img
            src={api.thumbUrl(img, 480)}
            alt={product.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover rounded-t-2xl group-hover:scale-105 transition duration-300"
            onError={(e) => {
              const el = e.currentTarget;
              el.onerror = null;
              el.style.display = "none";
              el.parentElement?.insertAdjacentHTML(
                "beforeend",
                '<div class="w-full h-full flex items-center justify-center text-zinc-400 text-sm">No image</div>'
              );
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-400 text-sm">No image</div>
        )}
      </div>

      <div className="p-1.5 sm:p-3">
        <h3 className="text-[10px] sm:text-sm text-zinc-500 sm:text-zinc-900 font-semibold sm:font-bold break-words whitespace-normal line-clamp-1 sm:line-clamp-2">{toTitleCase(product.title)}</h3>
        <div className="flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-1.5">
          <span className="text-zinc-900 font-black text-sm sm:text-base">₹{product.price}</span>
          {hasDiscount && (
            <>
              <span className="text-zinc-400 text-[10px] sm:text-xs line-through">₹{product.comparePrice}</span>
              <span className="text-green-600 text-[10px] sm:text-xs font-semibold">{discountPct}% off</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
