import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/// Merge Tailwind class names, resolving conflicts (last wins).
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/// True if the string contains Hebrew characters (for RTL rendering).
export function isHebrew(text: string): boolean {
  return /[֐-׿]/.test(text);
}
