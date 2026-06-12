import { redirect } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui";

export default async function RebbePage() {
  const user = await requireUser();
  if (user.role !== "REBBE") redirect("/today");

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5">
      <AppHeader home="/rebbe" />
      <main className="flex-1 py-4">
        <h1 className="text-2xl font-bold tracking-tight">Rebbe dashboard</h1>
        <p className="mt-1 text-sm text-muted">Signed in as {user.email}</p>

        <Card className="mt-6">
          <p className="text-sm leading-relaxed text-muted">
            Your talmid&apos;s weekly reports, history, and pending{" "}
            <span className="heb">אונס</span> requests will appear here.
          </p>
        </Card>
      </main>
    </div>
  );
}
