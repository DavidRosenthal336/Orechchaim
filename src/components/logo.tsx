import { cn } from "@/lib/utils";

/// The Orechchaim mark — a ladder of ascent whose rungs are a winding path
/// climbing upward (the "way of life"). On the brand-blue badge; matches the
/// home-screen app icon. Always blue + white, so it reads in light and dark.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      className={className}
      role="img"
      aria-label="Orechchaim"
    >
      <rect width="512" height="512" rx="116" fill="#3B6FB0" />
      <g
        fill="none"
        stroke="#ffffff"
        strokeWidth="22"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M168 396 L200 168" />
        <path d="M344 396 L312 168" />
        <path
          d="M256 392 C 298 376, 298 356, 256 342 C 214 328, 214 308, 256 294 C 294 281, 294 263, 256 250 C 222 238, 222 222, 256 210"
        />
        <path d="M256 214 L256 150" />
        <path d="M230 176 L256 148 L282 176" />
      </g>
    </svg>
  );
}

/// The mark + wordmark lockup, used in app headers.
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className="h-8 w-8" />
      <span className="text-lg font-bold tracking-tight">Orechchaim</span>
    </span>
  );
}
