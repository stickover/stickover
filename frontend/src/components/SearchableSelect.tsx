import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  error?: boolean;
}

// A plain, accessible combobox: click to open, type to filter, click/enter to pick.
// Used for Brand + Model selection on the product page so shoppers with long
// brand/model lists (e.g. Apple, Samsung) can search instead of scrolling.
export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder = "Search...",
  disabled = false,
  error = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const filtered = options.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase()));

  const handleSelect = (opt: string) => {
    onChange(opt);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`w-full bg-white border rounded-xl px-3.5 py-3 text-xs font-bold text-left flex items-center justify-between gap-2 disabled:opacity-70 focus:ring-1 focus:ring-zinc-900 ${
          value ? "text-zinc-900" : "text-zinc-400"
        } ${error ? "border-red-400" : "border-zinc-200 focus:border-zinc-900"}`}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && !disabled && (
        <div className="absolute z-30 mt-1.5 w-full bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-100">
            <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full text-xs font-bold text-zinc-900 outline-none placeholder:text-zinc-400 placeholder:font-medium"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear search">
                <X className="w-3.5 h-3.5 text-zinc-400" />
              </button>
            )}
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length ? (
              filtered.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={`w-full text-left px-3.5 py-2.5 text-xs font-bold hover:bg-zinc-50 ${
                    opt === value ? "bg-zinc-100 text-zinc-900" : "text-zinc-700"
                  }`}
                >
                  {opt}
                </button>
              ))
            ) : (
              <div className="px-3.5 py-3 text-xs font-medium text-zinc-400">No matches found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
