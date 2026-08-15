import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { api } from "../utils/api";

const DEFAULT_MESSAGES = [
  "Trusted By Millions — Est. 2015",
  "1 Crore+ Photos Printed",
  "Crafted With Premium Materials",
  "Professional Grade Printing",
];

const MAX_ITEMS = 5;

// Pixels the strip should travel per second — higher = faster scroll.
// Duration is derived from this + the actual rendered width, so speed stays
// consistent no matter how many/few messages the admin sets.
const PIXELS_PER_SECOND = 45;
const MIN_DURATION = 6;

// Continuously scrolling ("movable") announcement strip that sits directly
// under the nav bar. Content comes from Admin -> Settings -> Announcement
// Bar (up to 5 items). Falls back to sensible defaults if admin hasn't set
// anything yet. Can be fully hidden via announcementBarEnabled.
export default function AnnouncementBar() {
  const [messages, setMessages] = useState<string[]>(DEFAULT_MESSAGES);
  const [enabled, setEnabled] = useState(true);
  const [duration, setDuration] = useState(14);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    api
      .get("/api/settings")
      .then((s) => {
        if (Array.isArray(s.announcementMessages) && s.announcementMessages.length) {
          setMessages(s.announcementMessages.filter((m: string) => m && m.trim()).slice(0, MAX_ITEMS));
        }
        setEnabled(s.announcementBarEnabled !== false);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!trackRef.current) return;
    // Track renders two copies back-to-back, so a single copy's width is half.
    const singleWidth = trackRef.current.scrollWidth / 2;
    const computed = singleWidth / PIXELS_PER_SECOND;
    setDuration(Math.max(MIN_DURATION, computed));
  }, [messages]);

  if (!enabled || messages.length === 0) return null;

  const track = (
    <div className="flex items-center gap-6 sm:gap-10 shrink-0 px-3">
      <span className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap bg-amber-400 text-[#0b1a3a] text-[11px] sm:text-[13px] font-black uppercase tracking-wide px-3 py-1 rounded-full shrink-0">
        <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
        <b className="font-black">Since 2018</b>
      </span>
      {messages.map((m, i) => (
        <span key={i} className="flex items-center gap-2 sm:gap-2.5 whitespace-nowrap">
          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
          <span className="text-white/90 text-[11px] sm:text-[13px] font-bold">{m}</span>
        </span>
      ))}
    </div>
  );

  return (
    <div className="bg-black overflow-hidden py-2.5">
      <div
        ref={trackRef}
        className="flex w-max animate-marquee hover:[animation-play-state:paused]"
        style={{ animationDuration: `${duration}s` }}
      >
        {track}
        {track}
      </div>
    </div>
  );
}
