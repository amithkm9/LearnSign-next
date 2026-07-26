import { beforeAll, describe, expect, it, vi } from "vitest";
import { PROOF_TTL_MS, signQuizProof, verifyQuizProof } from "./quiz-proof";
import { signToken } from "./signing";

const USER = "11111111-1111-1111-1111-111111111111";
const OTHER = "22222222-2222-2222-2222-222222222222";

beforeAll(() => {
  process.env.TOKEN_SIGNING_SECRET = "test-secret-not-used-in-production";
});

describe("quiz proofs", () => {
  it("round-trips a proof it issued", () => {
    const proof = signQuizProof(USER, "a");
    expect(verifyQuizProof(proof, USER)).toMatchObject({ u: USER, q: "a" });
  });

  it("rejects a proof issued to a different user", () => {
    // The core of the fix: proofs are useless to anyone but their owner.
    const proof = signQuizProof(OTHER, "a");
    expect(verifyQuizProof(proof, USER)).toBeNull();
  });

  it("rejects a tampered payload", () => {
    const proof = signQuizProof(USER, "a");
    const [body, sig] = proof.split(".");
    const forged = Buffer.from(
      JSON.stringify({ u: USER, q: "three", t: Date.now() }),
    ).toString("base64url");
    expect(forged).not.toBe(body);
    expect(verifyQuizProof(`${forged}.${sig}`, USER)).toBeNull();
  });

  it("rejects a tampered signature", () => {
    const proof = signQuizProof(USER, "a");
    const [body] = proof.split(".");
    expect(verifyQuizProof(`${body}.${"x".repeat(43)}`, USER)).toBeNull();
  });

  it("rejects junk", () => {
    for (const bad of [null, undefined, 42, "", ".", "no-dot", "a.b", {}]) {
      expect(verifyQuizProof(bad, USER)).toBeNull();
    }
  });

  it("rejects an oversized token without parsing it", () => {
    expect(verifyQuizProof("x".repeat(2000), USER)).toBeNull();
  });

  it("expires after the TTL", () => {
    const proof = signQuizProof(USER, "a");
    expect(verifyQuizProof(proof, USER)).not.toBeNull();

    vi.useFakeTimers();
    try {
      vi.setSystemTime(Date.now() + PROOF_TTL_MS + 1000);
      expect(verifyQuizProof(proof, USER)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("rejects a token minted for a different purpose", () => {
    // A recovery grant must not be replayable as a quiz proof.
    const crossPurpose = signToken("password-recovery", { u: USER, q: "a" });
    expect(verifyQuizProof(crossPurpose, USER)).toBeNull();
  });
});
