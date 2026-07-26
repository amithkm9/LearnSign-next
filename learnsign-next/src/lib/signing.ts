import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Minimal HMAC-signed, self-expiring tokens.
 *
 * Used wherever the server needs to hand the browser a fact it will later have
 * to trust again — a verified quiz answer, a proven password-recovery session —
 * without a database round-trip or server-side session state (which wouldn't
 * survive serverless anyway). The browser can hold the token but cannot mint or
 * alter one.
 */

/** Signed payloads always carry an issued-at so they can expire. */
export type SignedPayload = Record<string, unknown> & { t: number };

function secret(): string {
  // A dedicated secret is preferred; the service-role key is a documented,
  // always-present fallback so existing deploys keep working. Both are
  // server-only and never reach the browser.
  const value = process.env.TOKEN_SIGNING_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) {
    throw new Error(
      "TOKEN_SIGNING_SECRET (or SUPABASE_SERVICE_ROLE_KEY) must be set to sign tokens",
    );
  }
  return value;
}

function mac(purpose: string, body: string): string {
  // The purpose is bound into the signature so a token minted for one use
  // (a quiz proof) can never be replayed as another (a recovery grant).
  return createHmac("sha256", secret()).update(`${purpose}.${body}`).digest("base64url");
}

/** Sign `payload` for a single `purpose`. */
export function signToken(purpose: string, payload: Omit<SignedPayload, "t">, now = Date.now()) {
  const body = Buffer.from(JSON.stringify({ ...payload, t: now })).toString("base64url");
  return `${body}.${mac(purpose, body)}`;
}

/**
 * Verify a token's signature, purpose and age.
 * Returns the payload, or null for anything untrusted.
 */
export function verifyToken(
  purpose: string,
  token: unknown,
  maxAgeMs: number,
  now = Date.now(),
): SignedPayload | null {
  if (typeof token !== "string" || token.length > 1024) return null;

  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);

  const expected = Buffer.from(mac(purpose, body));
  const actual = Buffer.from(token.slice(dot + 1));
  // Length check first: timingSafeEqual throws on a length mismatch.
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }

  let payload: SignedPayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (typeof payload?.t !== "number" || !Number.isFinite(payload.t)) return null;
  // Reject expired tokens, and any clock-skewed future issuance.
  if (now - payload.t > maxAgeMs || payload.t > now + 60_000) return null;

  return payload;
}
