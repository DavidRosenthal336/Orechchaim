"use client";

import { useActionState } from "react";
import { inviteRebbe, removeRebbe, type InviteState } from "@/app/actions/pairing";
import { Card, Button } from "@/components/ui";

const initial: InviteState = {};

export function RebbeInvite({ currentEmail }: { currentEmail: string | null }) {
  const [state, action, pending] = useActionState(inviteRebbe, initial);

  const linkedTo = state.ok ? state.sentTo : currentEmail;

  return (
    <Card className="space-y-4">
      <h2 className="text-sm font-semibold text-muted">Your rebbe</h2>

      {linkedTo ? (
        <div className="space-y-3">
          <p className="text-sm">
            Linked to{" "}
            <span className="font-medium text-foreground">{linkedTo}</span>.
            {state.ok ? " A sign-in link was sent." : ""}
          </p>
          <p className="text-xs text-muted">
            Your rebbe gets a weekly report and can review your{" "}
            <span className="heb">אונס</span> requests.
          </p>
          <form action={removeRebbe}>
            <button
              type="submit"
              className="text-sm font-medium text-danger hover:underline"
            >
              Unlink rebbe
            </button>
          </form>
        </div>
      ) : (
        <form action={action} className="space-y-3">
          <p className="text-sm text-muted">
            Add your rebbe by email. They&apos;ll get a sign-in link and your
            weekly reports.
          </p>
          <input
            name="email"
            type="email"
            required
            placeholder="rebbe@example.com"
            className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-base"
          />
          {state.error ? (
            <p className="text-sm text-danger">{state.error}</p>
          ) : null}
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Sending…" : "Send invite"}
          </Button>
        </form>
      )}
    </Card>
  );
}
