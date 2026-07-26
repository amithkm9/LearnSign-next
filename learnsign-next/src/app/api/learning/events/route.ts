import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { learningEvents, userProgress, profiles } from "@/lib/db/schema";
import type { ProgressRollup } from "@/lib/db/schema";
import { courseExists } from "@/lib/data/courses";
import { nextStreak } from "@/lib/time";

const EVENT_TYPES = new Set(["start", "pause", "resume", "heartbeat", "end"]);

// One event can't legitimately carry more than a few minutes of active time —
// the player heartbeats every 15s. Caps a tampered client's inflation.
const MAX_ACTIVE_MS = 10 * 60 * 1000;

/**
 * Records a learning event (heartbeat) for the *authenticated* user — the
 * userId comes from the session, never the client (fixes the legacy
 * "trust the client userId" hole). Rolls the event up into user_progress
 * and updates the streak. Accepts navigator.sendBeacon posts.
 */
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: {
    courseId?: string;
    type?: string;
    sessionId?: string;
    activeMs?: number;
    progressPercentage?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { courseId, type } = body;
  if (!courseId || !type || !EVENT_TYPES.has(type)) {
    return NextResponse.json(
      { error: "courseId and a valid type are required" },
      { status: 400 },
    );
  }
  // Without this, any string writes progress rows for a course that doesn't
  // exist, which later surfaces as a null-titled card on the dashboard.
  if (!(await courseExists(courseId))) {
    return NextResponse.json({ error: "Unknown courseId" }, { status: 400 });
  }

  const activeMs = Math.min(
    MAX_ACTIVE_MS,
    Math.max(0, Math.round(Number(body.activeMs) || 0)),
  );
  const pct =
    typeof body.progressPercentage === "number" &&
    Number.isFinite(body.progressPercentage)
      ? Math.min(100, Math.max(0, Math.round(body.progressPercentage)))
      : null;

  try {
    // All three writes run in one transaction so a partial failure can't leave
    // the event recorded but the rollup/streak inconsistent.
    await db.transaction(async (tx) => {
      // 1. Append the raw event.
      await tx.insert(learningEvents).values({
        userId: user.id,
        courseId,
        type,
        sessionId: body.sessionId,
        activeMs,
        progressPercentage: pct ?? undefined,
      });

      // 2. Roll up into user_progress (only when there's something to record).
      if (activeMs > 0 || pct !== null) {
        const pctForGreatest = pct ?? 0;
        const now = new Date();

        await tx
          .insert(userProgress)
          .values({
            userId: user.id,
            courseId,
            status: pctForGreatest >= 100 ? "completed" : "in_progress",
            progressPercentage: pctForGreatest,
            // Time accumulates in MILLISECONDS; minutes are derived from it.
            // Accumulating minutes directly rounded every 15s heartbeat to 0.
            timeSpentMs: activeMs,
            timeSpent: Math.floor(activeMs / 60_000),
            startedAt: now,
            lastAccessedAt: now,
            completedAt: pctForGreatest >= 100 ? now : null,
          })
          .onConflictDoUpdate({
            target: [userProgress.userId, userProgress.courseId],
            set: {
              timeSpentMs: sql`${userProgress.timeSpentMs} + ${activeMs}`,
              timeSpent: sql`((${userProgress.timeSpentMs} + ${activeMs}) / 60000)::int`,
              progressPercentage: sql`greatest(${userProgress.progressPercentage}, ${pctForGreatest})`,
              status: sql`case when greatest(${userProgress.progressPercentage}, ${pctForGreatest}) >= 100 then 'completed' else 'in_progress' end`,
              completedAt: sql`case when greatest(${userProgress.progressPercentage}, ${pctForGreatest}) >= 100 and ${userProgress.completedAt} is null then now() else ${userProgress.completedAt} end`,
              lastAccessedAt: sql`now()`,
            },
          });

        // 3. Update streak + total learning time on the profile.
        await updateStreak(tx, user.id, activeMs);
      }
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("learning event error:", error);
    return NextResponse.json({ error: "Failed to record event" }, { status: 500 });
  }
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function updateStreak(tx: Tx, userId: string, deltaMs: number) {
  // `for update` locks the profile row for the duration of the transaction, so
  // concurrent beacons serialize instead of clobbering each other's read-modify
  // -write of the whole `progress` jsonb.
  const [row] = await tx
    .select({ progress: profiles.progress })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .for("update")
    .limit(1);
  if (!row) return;

  const progress = row.progress as ProgressRollup;
  const now = new Date();

  // Day boundaries follow the app's timezone, not UTC — see @/lib/time.
  const currentStreak = nextStreak(
    progress.currentStreak,
    progress.lastActivityDate,
    now,
  );
  const longestStreak = Math.max(progress.longestStreak, currentStreak);

  // Milliseconds are authoritative; older rows only have the minute field, so
  // fall back to it once when seeding the ms total.
  const totalMs =
    (progress.totalLearningTimeMs ?? progress.totalLearningTime * 60_000) + deltaMs;

  const next: ProgressRollup = {
    ...progress,
    currentStreak,
    longestStreak,
    lastActivityDate: now.toISOString(),
    totalLearningTimeMs: totalMs,
    totalLearningTime: Math.floor(totalMs / 60_000),
  };

  await tx.update(profiles).set({ progress: next }).where(eq(profiles.id, userId));
}
