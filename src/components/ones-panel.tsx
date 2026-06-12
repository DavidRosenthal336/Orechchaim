"use client";

import { useActionState, useState } from "react";
import { requestOnes, cancelOnes, type OnesState } from "@/app/actions/day";
import { Button } from "@/components/ui";

const initial: OnesState = {};

export function OnesPanel({
  dayEntryId,
  onesStatus,
  onesReason,
  editable,
}: {
  dayEntryId: string;
  onesStatus: string | null;
  onesReason: string | null;
  editable: boolean;
}) {
  const [state, action, pending] = useActionState(requestOnes, initial);
  const [open, setOpen] = useState(false);

  // Already filed — show its status.
  if (onesStatus) {
    const styles: Record<string, string> = {
      PENDING: "bg-warning-soft text-warning",
      ACCEPTED: "bg-positive-soft text-positive",
      DENIED: "bg-danger-soft text-danger",
    };
    const labels: Record<string, string> = {
      PENDING: "אונס — awaiting your rebbe",
      ACCEPTED: "אונס accepted — counted as a good day",
      DENIED: "אונס denied",
    };
    return (
      <div className="space-y-2">
        <div className={`rounded-xl px-4 py-3 text-sm ${styles[onesStatus] ?? ""}`}>
          <span className="font-medium">{labels[onesStatus] ?? onesStatus}</span>
          {onesReason ? (
            <p className="mt-1 opacity-90">“{onesReason}”</p>
          ) : null}
        </div>
        {editable && onesStatus === "PENDING" ? (
          <form action={cancelOnes}>
            <input type="hidden" name="dayEntryId" value={dayEntryId} />
            <button
              type="submit"
              className="text-xs font-medium text-muted hover:underline"
            >
              Retract אונס
            </button>
          </form>
        ) : null}
      </div>
    );
  }

  if (!editable) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-accent hover:underline"
      >
        Mark <span className="heb">אונס</span> for today
      </button>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="dayEntryId" value={dayEntryId} />
      <div>
        <label htmlFor="reason" className="mb-1.5 block text-sm font-medium">
          Reason for <span className="heb">אונס</span>{" "}
          <span className="text-muted">(required)</span>
        </label>
        <textarea
          id="reason"
          name="reason"
          required
          rows={3}
          placeholder="What kept you from your usual today?"
          className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
        />
        <p className="mt-1.5 text-xs text-muted">
          Your rebbe reviews this. If accepted, a short day is counted as a good
          day.
        </p>
      </div>
      {state.error ? (
        <p className="text-sm text-danger">{state.error}</p>
      ) : null}
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Submitting…" : "Submit אונס"}
        </Button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-muted hover:underline"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
