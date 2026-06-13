import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";

export function AppHeader({ home = "/today" }: { home?: string }) {
  return (
    <header className="flex items-center justify-between py-5">
      <Link href={home} aria-label="Orechchaim home">
        <Logo />
      </Link>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <form action={signOut}>
          <button
            type="submit"
            aria-label="Sign out"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-foreground hover:bg-surface-2"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </form>
      </div>
    </header>
  );
}
