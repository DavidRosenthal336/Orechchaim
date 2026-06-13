import Link from "next/link";
import { ChevronLeft, LogOut } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { signOut } from "@/app/actions/auth";
import { SettingsForm } from "./settings-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card } from "@/components/ui";

function timezones(): string[] {
  const supported = (
    Intl as unknown as { supportedValuesOf?: (k: string) => string[] }
  ).supportedValuesOf?.("timeZone");
  return supported ?? ["America/New_York", "Asia/Jerusalem", "UTC"];
}

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5">
      <header className="flex items-center gap-2 py-5">
        <Link
          href="/today"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface hover:bg-surface-2"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold tracking-tight">Settings</h1>
      </header>

      <main className="flex-1 space-y-5 pb-10">
        <SettingsForm
          timezones={timezones()}
          initial={{
            name: user.name ?? "",
            timezone: user.timezone,
            inIsrael: user.inIsrael,
            beinHazmanimMode: user.beinHazmanimMode,
            rebbeName: user.rebbeName ?? "",
            rebbeEmail: user.rebbeEmail ?? "",
          }}
        />

        <Card className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Appearance</p>
            <p className="mt-0.5 text-xs text-muted">
              Switch between light and dark.
            </p>
          </div>
          <ThemeToggle />
        </Card>

        <div className="pt-2">
          <form action={signOut}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-danger"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
