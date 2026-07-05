import { ButtonLink } from "@/components/ui";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";

export default function LandingPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5">
      <header className="flex items-center justify-between py-5">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="flex flex-1 flex-col justify-center py-8">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-accent">
          Daily growth, on the Jewish calendar
        </p>
        <h1 className="text-3xl font-bold leading-tight tracking-tight">
          Maintain. Grow.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted">
          A simple, trust-based daily checklist. Check off what you did each
          day, note an <span className="heb">אונס</span> when life gets in the
          way, and your rebbe gets a weekly report to help keep you on track.
        </p>

        <div className="mt-8">
          <ButtonLink href="/login" size="lg" className="w-full">
            Get started
          </ButtonLink>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-muted">
        Built for growth, b&apos;ezras Hashem.
      </footer>
    </div>
  );
}
