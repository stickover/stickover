import logoMark from "../assets/logo-mark.png";

// Shared "shop mark + STICKOVER" lockup used in the navbar (mobile-center,
// desktop-top-right) and the footer. The mark is the exact logo image
// supplied by the store owner — used as-is, not re-drawn.
export default function BrandLogo({
  markClassName = "h-10 w-10",
  textClassName = "text-xl",
  textColorClassName = "text-zinc-950",
  gap = "gap-2",
}: {
  markClassName?: string;
  textClassName?: string;
  textColorClassName?: string;
  gap?: string;
}) {
  return (
    <span className={`inline-flex items-center ${gap}`}>
      <img
        src={logoMark}
        alt="Stickover"
        className={`${markClassName} object-contain select-none pointer-events-none shrink-0`}
        draggable={false}
      />
      <span className={`font-coolvetica font-black ${textClassName} ${textColorClassName} leading-none tracking-wide uppercase`}>
        STICKOVER
      </span>
    </span>
  );
}
