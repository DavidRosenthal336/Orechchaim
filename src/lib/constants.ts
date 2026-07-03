// Shared "enum-like" unions. These are stored as plain strings in the DB
// (for SQLite/Postgres portability) and validated here in TypeScript.

export const ROLES = ["STUDENT", "REBBE"] as const;
export type Role = (typeof ROLES)[number];

/// Day-types, in resolution-precedence order (highest first). The day-type
/// engine picks the first one that matches a given date. SHABBOS outranks
/// CHOL_HAMOED because Shabbos Chol Hamoed is still Shabbos (no phone).
/// FAST_DAY is auto-detected on public fasts (never Shabbos/Yom Tov).
/// BEIN_HAZMANIM replaces a plain weekday while Bein Hazmanim mode is on.
/// SPECIAL is applied only via the manual override, never auto-detected.
export const DAY_TYPES = [
  "YOM_TOV",
  "SHABBOS",
  "CHOL_HAMOED",
  "FAST_DAY",
  "EREV_SHABBOS",
  "ROSH_CHODESH",
  "SUNDAY",
  "BEIN_HAZMANIM",
  "WEEKDAY",
  "SPECIAL",
] as const;
export type DayType = (typeof DAY_TYPES)[number];

export const DAY_TYPE_LABELS: Record<DayType, string> = {
  YOM_TOV: "Yom Tov",
  CHOL_HAMOED: "Chol Hamoed",
  SHABBOS: "Shabbos",
  FAST_DAY: "Fast day",
  EREV_SHABBOS: "Erev Shabbos",
  ROSH_CHODESH: "Rosh Chodesh",
  SUNDAY: "Sunday",
  BEIN_HAZMANIM: "Bein Hazmanim",
  SPECIAL: "Special event",
  WEEKDAY: "Weekday",
};

/// Short hints shown under a day-type in the assignment picker.
export const DAY_TYPE_HINTS: Partial<Record<DayType, string>> = {
  BEIN_HAZMANIM:
    "used on weekdays & Sundays while Bein Hazmanim mode is on. Falls back to your Sunday list if unset.",
  FAST_DAY:
    "auto-detected on fasts (Tzom Gedaliah, Asara B'Teves, Taanis Esther, Shiva Asar B'Tammuz, Tisha B'Av).",
};

/// Day-types the student can assign a checklist to in the UI. SPECIAL is not
/// listed — a special event is declared per-day rather than pre-assigned.
export const ASSIGNABLE_DAY_TYPES: DayType[] = [
  "WEEKDAY",
  "BEIN_HAZMANIM",
  "SUNDAY",
  "EREV_SHABBOS",
  "SHABBOS",
  "YOM_TOV",
  "CHOL_HAMOED",
  "FAST_DAY",
];

/// Day-types on which the device can't be used in real time, so the checklist
/// is filled in Motzei (after the day ends).
export const MOTZEI_FILL_DAY_TYPES: DayType[] = ["SHABBOS", "YOM_TOV"];

export const DAY_ENTRY_STATUSES = ["OPEN", "SUBMITTED"] as const;
export type DayEntryStatus = (typeof DAY_ENTRY_STATUSES)[number];

export const ONES_STATUSES = ["PENDING", "ACCEPTED", "DENIED"] as const;
export type OnesStatus = (typeof ONES_STATUSES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function isDayType(value: unknown): value is DayType {
  return (
    typeof value === "string" && (DAY_TYPES as readonly string[]).includes(value)
  );
}
