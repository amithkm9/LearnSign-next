import { signToken, verifyToken } from "@/lib/signing";

/**
 * Signed proof-of-correct-answer for the webcam quiz.
 *
 * The quiz score used to be whatever the client posted, so anyone could
 * `curl /api/quiz/submit -d '{"score":100}'` and forge the parent report.
 * Now the only component that can decide an answer is correct is the route
 * that actually ran recognition: it mints a short-lived signed token, and
 * /api/quiz/submit recomputes the score purely from tokens it can verify.
 */

const PURPOSE = "quiz-proof";

/** Proofs are useless after this; bounds replay to a single sitting. */
export const PROOF_TTL_MS = 30 * 60 * 1000;

export type QuizProofPayload = {
  /** User the proof was issued to. */
  u: string;
  /** Question answered correctly. */
  q: string;
};

/** Mint a proof that `userId` answered `questionId` correctly, just now. */
export function signQuizProof(userId: string, questionId: string): string {
  return signToken(PURPOSE, { u: userId, q: questionId });
}

/**
 * Verify a proof belongs to `userId`, is intact, and hasn't expired.
 * Returns the payload, or null for anything untrusted.
 */
export function verifyQuizProof(token: unknown, userId: string): QuizProofPayload | null {
  const payload = verifyToken(PURPOSE, token, PROOF_TTL_MS);
  if (!payload) return null;
  if (typeof payload.u !== "string" || typeof payload.q !== "string") return null;
  // Bind the proof to the caller: one user's proof can't score another's quiz.
  if (payload.u !== userId) return null;
  return { u: payload.u, q: payload.q };
}
