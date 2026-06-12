"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

/// A labelled on/off switch backed by a hidden checkbox so it submits with a
/// plain <form> (value "on" when checked).
export function Switch({
  name,
  defaultChecked = false,
  label,
  description,
}: {
  name: string;
  defaultChecked?: boolean;
  label: React.ReactNode;
  description?: React.ReactNode;
}) {
  const id = useId();
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start justify-between gap-4"
    >
      <span>
        <span className="block text-sm font-medium text-foreground">
          {label}
        </span>
        {description ? (
          <span className="mt-0.5 block text-xs text-muted">{description}</span>
        ) : null}
      </span>
      <span className="relative mt-0.5 shrink-0">
        <input
          id={id}
          type="checkbox"
          name={name}
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="peer sr-only"
        />
        <span
          className={cn(
            "block h-6 w-11 rounded-full border border-border bg-surface-2 transition-colors",
            checked && "border-accent bg-accent",
          )}
        />
        <span
          className={cn(
            "absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow transition-transform",
            checked && "translate-x-5",
          )}
        />
      </span>
    </label>
  );
}
