import { describe, it, expect } from "vitest";
import {
  weekStartKey,
  weekEndKey,
  weekDayKeys,
  formatWeekRange,
} from "@/lib/week";

describe("week boundaries (Sunday → Shabbos)", () => {
  it("finds the Sunday for any weekday", () => {
    // Week of Sun Jun 8 – Sat Jun 14, 2025.
    expect(weekStartKey("2025-06-08")).toBe("2025-06-08"); // Sunday
    expect(weekStartKey("2025-06-10")).toBe("2025-06-08"); // Tuesday
    expect(weekStartKey("2025-06-13")).toBe("2025-06-08"); // Friday
    expect(weekStartKey("2025-06-14")).toBe("2025-06-08"); // Shabbos
  });

  it("ends the week on Shabbos", () => {
    expect(weekEndKey("2025-06-08")).toBe("2025-06-14");
  });

  it("lists the seven days Sun..Shabbos", () => {
    const days = weekDayKeys("2025-06-08");
    expect(days).toHaveLength(7);
    expect(days[0]).toBe("2025-06-08");
    expect(days[6]).toBe("2025-06-14");
  });

  it("formats a same-month and cross-month range", () => {
    expect(formatWeekRange("2025-06-08")).toBe("Jun 8 – 14");
    expect(formatWeekRange("2025-06-29")).toBe("Jun 29 – Jul 5");
  });
});
