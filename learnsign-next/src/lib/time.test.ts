import { describe, expect, it } from "vitest";
import { dayKey, nextStreak, previousDayKey } from "./time";

const IST = "Asia/Kolkata";

// 21:00 UTC on the 1st is already 02:30 IST on the 2nd — the case the old
// toISOString()-based key got wrong.
const LATE_NIGHT_IST = new Date("2026-03-01T21:00:00Z");

describe("dayKey", () => {
  it("formats as YYYY-MM-DD", () => {
    expect(dayKey(new Date("2026-03-01T12:00:00Z"), IST)).toBe("2026-03-01");
  });

  it("uses the configured timezone, not UTC", () => {
    // Same instant, two different calendar days.
    expect(dayKey(LATE_NIGHT_IST, "UTC")).toBe("2026-03-01");
    expect(dayKey(LATE_NIGHT_IST, IST)).toBe("2026-03-02");
  });

  it("rolls over at local midnight, not 05:30 local", () => {
    // 18:35 UTC = 00:05 IST the next day.
    expect(dayKey(new Date("2026-03-01T18:35:00Z"), IST)).toBe("2026-03-02");
    // 18:25 UTC = 23:55 IST the same day.
    expect(dayKey(new Date("2026-03-01T18:25:00Z"), IST)).toBe("2026-03-01");
  });
});

describe("previousDayKey", () => {
  it("returns the prior calendar day", () => {
    expect(previousDayKey(new Date("2026-03-02T12:00:00Z"), IST)).toBe("2026-03-01");
  });

  it("crosses a month boundary", () => {
    expect(previousDayKey(new Date("2026-03-01T12:00:00Z"), IST)).toBe("2026-02-28");
  });
});

describe("nextStreak", () => {
  const now = new Date("2026-03-02T12:00:00Z"); // 17:30 IST on the 2nd

  it("starts at 1 with no history", () => {
    expect(nextStreak(0, null, now, IST)).toBe(1);
    expect(nextStreak(0, undefined, now, IST)).toBe(1);
    expect(nextStreak(5, "not-a-date", now, IST)).toBe(1);
  });

  it("does not double-count a second session the same day", () => {
    const earlierToday = new Date("2026-03-02T04:00:00Z").toISOString();
    expect(nextStreak(4, earlierToday, now, IST)).toBe(4);
  });

  it("increments after activity yesterday", () => {
    const yesterday = new Date("2026-03-01T10:00:00Z").toISOString();
    expect(nextStreak(4, yesterday, now, IST)).toBe(5);
  });

  it("resets after a missed day", () => {
    const twoDaysAgo = new Date("2026-02-28T10:00:00Z").toISOString();
    expect(nextStreak(9, twoDaysAgo, now, IST)).toBe(1);
  });

  it("keeps a late-night IST session on the correct day", () => {
    // Practised 02:30 IST on the 2nd; practising again later on the 2nd must
    // NOT increment. Under the old UTC keying this counted as a new day.
    expect(nextStreak(3, LATE_NIGHT_IST.toISOString(), now, IST)).toBe(3);
  });

  it("counts a 23:00 IST then 07:00 IST pair as two consecutive days", () => {
    const lateOnTheFirst = new Date("2026-03-01T17:30:00Z"); // 23:00 IST 1st
    const earlyOnTheSecond = new Date("2026-03-02T01:30:00Z"); // 07:00 IST 2nd
    expect(nextStreak(1, lateOnTheFirst.toISOString(), earlyOnTheSecond, IST)).toBe(2);
  });

  it("never returns 0 for an active user", () => {
    const earlierToday = new Date("2026-03-02T04:00:00Z").toISOString();
    expect(nextStreak(0, earlierToday, now, IST)).toBe(1);
  });
});
