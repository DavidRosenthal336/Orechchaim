export const metadata = { title: "Offline · Orechchaim" };

export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-5 text-center">
      <h1 className="text-2xl font-bold tracking-tight">You&apos;re offline</h1>
      <p className="mt-2 text-sm text-muted">
        Orechchaim needs a connection to load your checklist. Reconnect and try
        again.
      </p>
    </div>
  );
}
