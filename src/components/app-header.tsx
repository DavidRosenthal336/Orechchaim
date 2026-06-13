import Link from "next/link";
import { Settings } from "lucide-react";
import { Logo } from "@/components/logo";

export function AppHeader() {
  return (
    <header className="flex items-center justify-between py-5">
      <Link href="/today" aria-label="Orechchaim home">
        <Logo />
      </Link>
      <Link
        href="/settings"
        aria-label="Settings"
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-foreground hover:bg-surface-2"
      >
        <Settings className="h-5 w-5" />
      </Link>
    </header>
  );
}
