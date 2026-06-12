// Shared "enum-like" unions. These are stored as plain strings in the DB
// (for SQLite/Postgres portability) and validated here in TypeScript.

export const ROLES = ["STUDENT", "REBBE"] as const;
export type Role = (typeof ROLES)[number];

/// Day-types, in resolution-precedence order (highest first). The day-type
/// engine picks the first one that matches a given date. SHABBOS outranks
/// CHOL_HAMOED because Shabbos Chol Hamoed is still Shabbos (no phone).
/// SPECIAL is applied only via the manual override, never auto-detected.
export const DAY_TYPES = [
  "YOM_TOV",
  "SHABBOS",
  "CHOL_HAMOED",
  "EREV_SHABBOS",
  "ROSH_CHODESH",
  "SUNDAY",
  "WEEKDAY",
  "SPECIAL",
] as const;
export type DayType = (typeof DAY_TYPES)[number];

export const DAY_TYPE_LABELS: Record<DayType, string> = {
  YOM_TOV: "Yom Tov",
  CHOL_HAMOED: "Chol Hamoed",
  SHABBOS: "Shabbos",
  EREV_SHABBOS: "Erev Shabbos",
  ROSH_CHODESH: "Rosh Chodesh",
  SUNDAY: "Sunday",
  SPECIAL: "Special event",
  WEEKDAY: "Weekday",
};

/// Day-types the student can assign a checklist to in the UI. SPECIAL is
/// applied via the manual override rather than auto-detected, but is still a
/// valid assignment target.
export const ASSIGNABLE_DAY_TYPES: DayType[] = [
  "WEEKDAY",
  "SUNDAY",
  "EREV_SHABBOS",
  "SHABBOS",
  "YOM_TOV",
  "CHOL_HAMOED",
  "ROSH_CHODESH",
  "SPECIAL",
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
