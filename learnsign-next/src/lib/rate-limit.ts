/**
 * Best-effort per-user rate limiter for the OpenAI-backed routes.
 *
 * NOTE: in-memory and per serverless instance, so it's a coarse guard rather
 * than a strict global limit — enough to stop one user from hammering the AI
 * (and your OpenAI bill). For hard cross-instance limits at scale, swap this for
 * Upstash Redis (`@upstash/ratelimit`).
 */
const buckets = new Map<string, number[]>(); // key -> request timestamps (ms)

export function rateLimit(
  key: string,
  limit: number,
  windowMs = 60_000,
): { ok: boolean; retryAfter: number } {
  const now = Date.now();
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
