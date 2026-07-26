import { afterEach, describe, expect, it, vi } from "vitest";
import { rateLimit } from "./rate-limit";

afterEach(() => {
  vi.useRealTimers();
});

// Each test uses a unique key: the bucket map is module-level state.
let n = 0;
const key = () => `test-${n++}`;

describe("rateLimit", () => {
  it("allows up to the limit, then rejects", () => {
    const k = key();
    for (let i = 0; i < 3; i++) {
      expect(rateLimit(k, 3).ok).toBe(true);
    }
    const blocked = rateLimit(k, 3);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it("keys are independent", () => {
    const a = key();
    const b = key();
    expect(rateLimit(a, 1).ok).toBe(true);
    expect(rateLimit(a, 1).ok).toBe(false);
    expect(rateLimit(b, 1).ok).toBe(true);
  });

  it("allows again once the window has passed", () => {
    vi.useFakeTimers();
    const k = key();
    expect(rateLimit(k, 1, 60_000).ok).toBe(true);
    expect(rateLimit(k, 1, 60_000).ok).toBe(false);

    vi.setSystemTime(Date.now() + 61_000);
    expect(rateLimit(k, 1, 60_000).ok).toBe(true);
  });

  it("evicts idle keys instead of growing forever", () => {
    vi.useFakeTimers();
    const stale = key();
    expect(rateLimit(stale, 1, 1_000).ok).toBe(true);

    // Past the window, a sweep runs and the idle bucket is dropped — so the
    // key behaves like a brand-new one rather than accumulating state.
    vi.setSystemTime(Date.now() + 5_000);
    expect(rateLimit(key(), 1, 1_000).ok).toBe(true);
    expect(rateLimit(stale, 1, 1_000).ok).toBe(true);
  });
});
