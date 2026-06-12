import { redirect } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui";

export default async function TodayPage() {
  const user = await requireUser();
  if (user.role === "REBBE") redirect("/rebbe");

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5">
      <AppHeader />
      <main className="flex-1 py-4">
        <h1 className="text-2xl font-bold tracking-tight">Today</h1>
        <p className="mt-1 text-sm text-muted">
          Signed in as {user.email}
        </p>

        <Card className="mt-6">
          <p className="text-sm leading-relaxed text-muted">
            Your daily checklist will live here. Foundation is in place —
            sign-in, accounts, theming, and the database are working. Next:
            building your checklists and the Jewish-calendar day engine.
          </p>
        </Card>
      </main>
    </div>
  );
}
