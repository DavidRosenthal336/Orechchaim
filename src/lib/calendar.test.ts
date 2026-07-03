import { describe, it, expect } from "vitest";
import { resolveDayType, resolveDayTypeForYmd, todayKey } from "@/lib/calendar";

// All dates use the Diaspora schedule (inIsrael: false) unless noted.

describe("day-type resolution", () => {
  it("detects an ordinary weekday", () => {
    // Tue, Apr 22, 2025 — no holiday.
    const r = resolveDayTypeForYmd(2025, 4, 22);
    expect(r.baseDayType).toBe("WEEKDAY");
    expect(r.isAssurMelacha).toBe(false);
  });

  it("detects Sunday and Erev Shabbos by day of week", () => {
    expect(resolveDayTypeForYmd(2025, 6, 15).baseDayType).toBe("SUNDAY"); // Sun
    expect(resolveDayTypeForYmd(2025, 6, 13).baseDayType).toBe("EREV_SHABBOS"); // Fri
  });

  it("detects a plain Shabbos", () => {
    const r = resolveDayTypeForYmd(2025, 6, 14); // Sat
    expect(r.baseDayType).toBe("SHABBOS");
    expect(r.isAssurMelacha).toBe(true);
  });

  it("detects Yom Tov (Pesach I) and marks it assur melacha", () => {
    const r = resolveDayTypeForYmd(2025, 4, 13);
    expect(r.baseDayType).toBe("YOM_TOV");
    expect(r.isAssurMelacha).toBe(true);
    expect(r.holidays.join(" ")).toMatch(/Pesach/);
  });

  it("treats Yom Kippur as Yom Tov (no phone)", () => {
    const r = resolveDayTypeForYmd(2025, 10, 2);
    expect(r.baseDayType).toBe("YOM_TOV");
    expect(r.isAssurMelacha).toBe(true);
  });

  it("detects Chol Hamoed on a weekday", () => {
    const r = resolveDayTypeForYmd(2025, 4, 16); // Pesach Chol Hamoed (Wed)
    expect(r.baseDayType).toBe("CHOL_HAMOED");
    expect(r.isAssurMelacha).toBe(false);
  });

  it("Shabbos outranks Chol Hamoed (Shabbos Chol Hamoed is Shabbos)", () => {
    const r = resolveDayTypeForYmd(2025, 4, 19); // Pesach VII falls Sat
    // Pesach VII is itself Yom Tov; ensure it is at least assur melacha.
    expect(r.isAssurMelacha).toBe(true);
  });

  it("detects Rosh Chodesh on a weekday", () => {
    // Rosh Chodesh Sivan 5785 = Wed May 28, 2025.
    const r = resolveDayTypeForYmd(2025, 5, 28);
    expect(r.baseDayType).toBe("ROSH_CHODESH");
  });

  it("Israel vs Diaspora differ on the 8th day of Pesach", () => {
    // Apr 20, 2025: Diaspora = Pesach VIII (Yom Tov); Israel = ordinary day.
    expect(resolveDayTypeForYmd(2025, 4, 20, { inIsrael: false }).baseDayType).toBe(
      "YOM_TOV",
    );
    expect(resolveDayTypeForYmd(2025, 4, 20, { inIsrael: true }).baseDayType).not.toBe(
      "YOM_TOV",
    );
  });
});

describe("Bein Hazmanim mode", () => {
  const opts = { beinHazmanim: true, beinHazmanimTarget: "SUNDAY" as const };

  it("remaps an ordinary weekday to the Bein Hazmanim checklist", () => {
    const r = resolveDayTypeForYmd(2025, 4, 22, opts); // Tue
    expect(r.baseDayType).toBe("WEEKDAY");
    expect(r.dayType).toBe("BEIN_HAZMANIM");
    expect(r.beinHazmanimApplied).toBe(true);
    // Falls back to the Sunday list when no Bein Hazmanim list is assigned.
    expect(r.checklistCandidates).toEqual(["BEIN_HAZMANIM", "SUNDAY"]);
  });

  it("does not touch Shabbos", () => {
    const r = resolveDayTypeForYmd(2025, 6, 14, opts); // Sat
    expect(r.dayType).toBe("SHABBOS");
    expect(r.beinHazmanimApplied).toBe(false);
  });

  it("does not touch Yom Tov", () => {
    const r = resolveDayTypeForYmd(2025, 4, 13, opts); // Pesach I
    expect(r.dayType).toBe("YOM_TOV");
    expect(r.beinHazmanimApplied).toBe(false);
  });

  it("leaves Sunday and Friday on their own assignments", () => {
    expect(resolveDayTypeForYmd(2025, 6, 15, opts).beinHazmanimApplied).toBe(false); // Sun
    expect(resolveDayTypeForYmd(2025, 6, 13, opts).beinHazmanimApplied).toBe(false); // Fri
  });

  it("is inert when the mode is off", () => {
    const r = resolveDayTypeForYmd(2025, 4, 22, { beinHazmanim: false });
    expect(r.dayType).toBe("WEEKDAY");
    expect(r.beinHazmanimApplied).toBe(false);
  });
});

describe("Fast days", () => {
  it("detects Taanis Esther (a weekday fast) and falls back to WEEKDAY", () => {
    const r = resolveDayTypeForYmd(2025, 3, 13); // Thu — Ta'anit Esther
    expect(r.isFastDay).toBe(true);
    expect(r.baseDayType).toBe("WEEKDAY");
    expect(r.dayType).toBe("FAST_DAY");
    expect(r.checklistCandidates).toEqual(["FAST_DAY", "WEEKDAY"]);
  });

  it("detects Asara B'Teves even when it lands on Erev Shabbos", () => {
    const r = resolveDayTypeForYmd(2025, 1, 10); // Fri — Asara B'Tevet
    expect(r.isFastDay).toBe(true);
    expect(r.baseDayType).toBe("EREV_SHABBOS");
    expect(r.dayType).toBe("FAST_DAY");
    expect(r.checklistCandidates).toEqual(["FAST_DAY", "EREV_SHABBOS"]);
  });

  it("does NOT treat Yom Kippur as a fast day (it stays Yom Tov)", () => {
    const r = resolveDayTypeForYmd(2025, 10, 2); // Yom Kippur
    expect(r.isFastDay).toBe(false);
    expect(r.dayType).toBe("YOM_TOV");
  });

  it("a fast day survives Bein Hazmanim and falls back through it", () => {
    const r = resolveDayTypeForYmd(2025, 3, 13, {
      beinHazmanim: true,
      beinHazmanimTarget: "SUNDAY",
    }); // Thu fast during bein hazmanim
    expect(r.dayType).toBe("FAST_DAY");
    expect(r.checklistCandidates).toEqual(["FAST_DAY", "BEIN_HAZMANIM", "SUNDAY"]);
  });
});

describe("date helpers", () => {
  it("computes the civil date key for a timezone", () => {
    // A moment that is still the previous day in New York.
    const m = new Date("2025-06-11T02:30:00Z"); // 22:30 Jun 10 in NY
    expect(todayKey("America/New_York", m)).toBe("2025-06-10");
    expect(todayKey("Asia/Jerusalem", m)).toBe("2025-06-11");
  });

  it("resolves from a YYYY-MM-DD key", () => {
    expect(resolveDayType("2025-06-14").baseDayType).toBe("SHABBOS");
  });
});
