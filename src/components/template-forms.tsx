"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import {
  updateTemplateMeta,
  setAssignments,
  type MetaState,
  type AssignState,
} from "@/app/actions/templates";
import { Card, Button } from "@/components/ui";

const metaInitial: MetaState = {};
const assignInitial: AssignState = {};

function SavedTag() {
  return (
    <span className="inline-flex items-center gap-1 text-sm font-medium text-positive">
      <Check className="h-4 w-4" strokeWidth={3} /> Saved
    </span>
  );
}

/// Checklist name — with a Saved confirmation.
export function TemplateMetaForm({
  templateId,
  name,
}: {
  templateId: string;
  name: string;
}) {
  const [state, action, pending] = useActionState(updateTemplateMeta, metaInitial);
  return (
    <Card>
      <form action={action} className="space-y-4">
        <input type="hidden" name="templateId" value={templateId} />
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
            Checklist name
          </label>
          <input
            id="name"
            name="name"
            defaultValue={name}
            maxLength={80}
            className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-base"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
          {state.ok ? <SavedTag /> : null}
          {state.error ? (
            <span className="text-sm text-danger">{state.error}</span>
          ) : null}
        </div>
      </form>
    </Card>
  );
}

export type AssignmentRow = {
  dayType: string;
  label: string;
  hint?: string;
  checked: boolean;
  movesFrom?: string;
};

/// Day-type assignment — with a Saved confirmation.
export function AssignmentsForm({
  templateId,
  rows,
}: {
  templateId: string;
  rows: AssignmentRow[];
}) {
  const [state, action, pending] = useActionState(setAssignments, assignInitial);
  return (
    <Card>
      <form action={action} className="space-y-3">
        <input type="hidden" name="templateId" value={templateId} />
        <h2 className="text-sm font-semibold text-muted">
          Show this checklist on
        </h2>
        <div className="space-y-2">
          {rows.map((r) => (
            <label
              key={r.dayType}
              className="flex items-start gap-3 rounded-lg px-1 py-1.5"
            >
              <input
                type="checkbox"
                name="dayTypes"
                value={r.dayType}
                defaultChecked={r.checked}
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-border accent-[var(--accent)]"
              />
              <span className="min-w-0 text-sm">
                <span className="font-medium">{r.label}</span>
                {r.movesFrom ? (
                  <span className="text-xs text-warning"> — moves from {r.movesFrom}</span>
                ) : null}
                {r.hint ? (
                  <span className="mt-0.5 block text-xs leading-snug text-muted">
                    {r.hint}
                  </span>
                ) : null}
              </span>
            </label>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Saving…" : "Save assignments"}
          </Button>
          {state.ok ? <SavedTag /> : null}
        </div>
      </form>
    </Card>
  );
}
