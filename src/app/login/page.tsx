import Link from "next/link";
import { Card } from "@/components/ui";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";
import { LoginForm } from "./login-form";

const ERRORS: Record<string, string> = {
  expired: "That sign-in link has expired or was already used. Please request a new one.",
  invalid: "That sign-in link was invalid. Please request a new one.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessage = error ? ERRORS[error] : undefined;

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5">
      <header className="flex items-center justify-between py-5">
        <Link href="/" aria-label="Orechchaim home">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 flex-col justify-center py-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted">
            Sign in to fill in today&apos;s checklist.
          </p>
        </div>

        {errorMessage ? (
          <p className="mb-4 rounded-xl bg-danger-soft px-4 py-3 text-center text-sm text-danger">
            {errorMessage}
          </p>
        ) : null}

        <Card>
          <LoginForm />
        </Card>
      </main>
    </div>
  );
}
