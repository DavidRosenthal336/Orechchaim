import { describe, it, expect } from "vitest";
import {
  assurBlockEnd,
  computeDayWindow,
  motzeiUnlock,
  resolveOptsFor,
  type DayUserSettings,
} from "@/lib/dayWindow";

const user: DayUserSettings = {
  id: "u",
  timezone: "America/New_York",
  inIsrael: false,
  beinHazmanimMode: false,
  beinHazmanimTargetType: "SUNDAY",
};
const opts = resolveOptsFor(user);

function at(iso: string): Date {
  return new Date(iso);
}

describe("ordinary weekday window", () => {
  // Tue Jun 10, 2025 (weekday).
  const noonJun10 = at("2025-06-10T16:00:00Z"); // 12:00 NY

  it("is OPEN today", () => {
    expect(computeDayWindow("2025-06-10", false, user, noonJun10).state).toBe("OPEN");
  });

  it("is FUTURE for tomorrow", () => {
    expect(computeDayWindow("2025-06-11", false, user, noonJun10).state).toBe("FUTURE");
  });

  it("is still OPEN for yesterday (grace window)", () => {
    expect(computeDayWindow("2025-06-09", false, user, noonJun10).state).toBe("OPEN");
  });

  it("is PAST beyond the grace window", () => {
    expect(computeDayWindow("2025-06-08", false, user, noonJun10).state).toBe("PAST");
  });
});

describe("Shabbos Motzei unlock", () => {
  // Sat Jun 14, 2025 is Shabbos (assur melacha).
  it("waits during Shabbos day", () => {
    const shabbosAfternoon = at("2025-06-14T19:00:00Z"); // 15:00 NY
    expect(
      computeDayWindow("2025-06-14", true, user, shabbosAfternoon).state,
    ).toBe("ASSUR_WAIT");
  });

  it("opens after Motzei (8:30pm local)", () => {
    const motzei = at("2025-06-15T01:30:00Z"); // 21:30 Sat NY
    expect(computeDayWindow("2025-06-14", true, user, motzei).state).toBe("OPEN");
  });

  it("locks after the grace window", () => {
    const tooLate = at("2025-06-17T05:00:00Z"); // past end of Jun 15 NY
    expect(computeDayWindow("2025-06-14", true, user, tooLate).state).toBe("PAST");
  });

  it("computes the unlock at 8:30pm local on the block end", () => {
    const unlock = motzeiUnlock("2025-06-14", user.timezone);
    // 20:30 EDT (UTC-4) = 00:30 UTC next day.
    expect(unlock.toISOString()).toBe("2025-06-15T00:30:00.000Z");
  });
});

describe("multi-day Yom Tov blocks", () => {
  it("treats 2-day Shavuos as one block ending on the second day", () => {
    // Shavuos 5785 (Diaspora): Mon Jun 2 + Tue Jun 3, 2025.
    expect(assurBlockEnd("2025-06-02", opts)).toBe("2025-06-03");
    expect(assurBlockEnd("2025-06-03", opts)).toBe("2025-06-03");
  });

  it("keeps the first yom-tov day locked until the whole block is out", () => {
    // Night of the first day — still Yom Tov, must stay locked.
    const firstNight = at("2025-06-03T02:00:00Z"); // 22:00 Mon NY
    expect(computeDayWindow("2025-06-02", true, user, firstNight).state).toBe(
      "ASSUR_WAIT",
    );
  });
});
