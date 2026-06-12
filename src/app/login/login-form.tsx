"use client";

import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import { requestMagicLink, type RequestLinkState } from "@/app/actions/auth";
import { Button } from "@/components/ui";

const initialState: RequestLinkState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    requestMagicLink,
    initialState,
  );

  if (state.ok) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-positive-soft text-positive">
          <MailCheck className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold">Check your email</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          We sent a sign-in link to{" "}
          <span className="font-medium text-foreground">{state.sentTo}</span>.
          It expires in 15 minutes.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-base text-foreground placeholder:text-muted focus-visible:outline-2 focus-visible:outline-accent"
        />
      </div>

      {state.error ? (
        <p className="text-sm text-danger">{state.error}</p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Email me a sign-in link"}
      </Button>

      <p className="text-center text-xs text-muted">
        No password needed — we&apos;ll email you a secure link.
      </p>
    </form>
  );
}
