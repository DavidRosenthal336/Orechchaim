import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { SettingsForm } from "./settings-form";

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

      <main className="flex-1 pb-10">
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
      </main>
    </div>
  );
}
