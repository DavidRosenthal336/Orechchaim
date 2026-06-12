"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "light" | "dark";

function currentMode(): Mode {
  if (typeof document === "undefined") return "light";
  if (document.documentElement.classList.contains("theme-dark")) return "dark";
  if (document.documentElement.classList.contains("theme-light")) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeToggle({ className }: { className?: string }) {
  const [mode, setMode] = useState<Mode>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMode(currentMode());
    setMounted(true);
  }, []);

  function toggle() {
    const next: Mode = mode === "dark" ? "light" : "dark";
    const root = document.documentElement;
    root.classList.remove("theme-dark", "theme-light");
    root.classList.add(next === "dark" ? "theme-dark" : "theme-light");
    try {
      localStorage.setItem("orech-theme", next);
    } catch {}
    setMode(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle light and dark mode"
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-foreground hover:bg-surface-2",
        className,
      )}
    >
      {mounted && mode === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}
