import { cn } from "@/lib/utils";

/// The Orech Chaim mark — the app icon (a perspective ladder whose rungs are a
/// winding path), rounded for use as a small in-app badge.
export function LogoMark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/icons/icon-192.png?v=2"
      alt="Orech Chaim"
      className={cn("rounded-[22%]", className)}
    />
  );
}

/// The mark + wordmark lockup, used in app headers.
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className="h-8 w-8" />
      <span className="text-lg font-bold tracking-tight">Orech Chaim</span>
    </span>
  );
}
