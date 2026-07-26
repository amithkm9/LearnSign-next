/**
 * Best-effort per-user rate limiter for the OpenAI-backed routes.
 *
 * NOTE: in-memory and per serverless instance, so it's a coarse guard rather
 * than a strict global limit — enough to stop one user from hammering the AI
 * (and your OpenAI bill). For hard cross-instance limits at scale, swap this for
 * Upstash Redis (`@upstash/ratelimit`).
 */
const buckets = new Map<string, number[]>(); // key -> request timestamps (ms)

// Without eviction this Map grows one entry per user forever. On a long-lived
// Node process that is a straight memory leak; sweeping keeps it proportional
// to *active* users instead of *all* users ever seen.
const MAX_KEYS = 10_000;
let lastSweep = 0;

function sweep(now: number, windowMs: number) {
  // Amortised: at most one pass per window unless the map is already large.
  if (now - lastSweep < windowMs && buckets.size < MAX_KEYS) return;
  lastSweep = now;

  for (const [key, hits] of buckets) {
    if (hits.length === 0 || now - hits[hits.length - 1] >= windowMs) {
      buckets.delete(key);
    }
  }

  // Pathological case (a burst of distinct keys inside one window): drop the
  // oldest-inserted entries. Map iteration follows insertion order.
  if (buckets.size > MAX_KEYS) {
    for (const key of buckets.keys()) {
      buckets.delete(key);
      if (buckets.size <= MAX_KEYS) break;
    }
  }
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs = 60_000,
): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  sweep(now, windowMs);

  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return { ok: false, retryAfter: Math.ceil((windowMs - (now - hits[0])) / 1000) };
  }
  hits.push(now);
  buckets.set(key, hits);
  return { ok: true, retryAfter: 0 };
}

/** Standard 429 response with a Retry-After header. */
export function tooMany(retryAfter: number) {
  return Response.json(
    { error: "Too many requests — please slow down." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}
