import { signToken, verifyToken } from "@/lib/signing";

/**
 * Proof that the current session came from a valid password-recovery link.
 *
 * `updatePassword` normally demands the current password, so a stolen session
 * can't be turned into permanent account ownership. A user who followed a
 * recovery email has instead proved control of the mailbox and cannot supply
 * the old password — this grant is how the callback route tells the server
 * action that happened.
 *
 * It is a signed token in an httpOnly cookie rather than a plain flag: a plain
 * cookie or hidden form field could simply be set by the client, which would
 * hand back exactly the bypass the re-auth check exists to prevent.
 */

const PURPOSE = "password-recovery";

export const RECOVERY_COOKIE = "ls_pw_recovery";

/** Long enough to choose a password, short enough to not linger. */
export const RECOVERY_TTL_MS = 15 * 60 * 1000;

export function signRecoveryGrant(userId: string): string {
  return signToken(PURPOSE, { u: userId });
}

/** True only for a server-issued, unexpired grant belonging to `userId`. */
export function verifyRecoveryGrant(token: unknown, userId: string): boolean {
  const payload = verifyToken(PURPOSE, token, RECOVERY_TTL_MS);
  return payload?.u === userId;
}
