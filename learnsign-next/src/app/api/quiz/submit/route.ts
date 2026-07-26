import { NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { quizAttempts } from "@/lib/db/schema";
import { QUIZ_ID, QUIZ_QUESTIONS, getQuizQuestion } from "@/lib/data/quiz";
import { verifyQuizProof } from "@/lib/quiz-proof";
import { rateLimit, tooMany } from "@/lib/rate-limit";

const MAX_PROOFS = 50;
const COURSE_ID = "practice";

/**
 * Records a quiz attempt for the signed-in user. Auto-increments attemptNo.
 *
 * The score is NOT taken from the request body: it is recomputed from the
 * signed proofs that /api/ml/recognize issued when it verified each sign
 * server-side. A client can therefore only ever under-report, never inflate.
 *
 * Body: { proofs?: string[], timeMs?: number }
 */
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const rl = rateLimit(`quiz:${user.id}`, 20);
  if (!rl.ok) return tooMany(rl.retryAfter);

  let body: { proofs?: unknown; timeMs?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Each distinct question with a valid, unexpired, user-bound proof counts once.
  const proofs = Array.isArray(body.proofs) ? body.proofs.slice(0, MAX_PROOFS) : [];
  const verified = new Set<string>();
  for (const proof of proofs) {
    const payload = verifyQuizProof(proof, user.id);
    if (payload && getQuizQuestion(payload.q)) verified.add(payload.q);
  }

  const totalQuestions = QUIZ_QUESTIONS.length;
  const correct = Math.min(verified.size, totalQuestions);
  const score = Math.round((correct / totalQuestions) * 100);
  const timeMs =
    typeof body.timeMs === "number" && Number.isFinite(body.timeMs)
      ? Math.min(24 * 60 * 60 * 1000, Math.max(0, Math.round(body.timeMs)))
      : 0;
  const answers = QUIZ_QUESTIONS.map((q) => ({
    questionId: q.id,
    correct: verified.has(q.id),
  }));

  try {
    // A transaction-scoped advisory lock keyed by (user, course, quiz) serializes
    // the read-max + insert so concurrent submissions can't get the same attemptNo.
    const row = await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`${user.id}:${COURSE_ID}:${QUIZ_ID}`})::int8)`,
      );

      const [last] = await tx
        .select({ n: quizAttempts.attemptNo })
        .from(quizAttempts)
        .where(
          and(
            eq(quizAttempts.userId, user.id),
            eq(quizAttempts.courseId, COURSE_ID),
            eq(quizAttempts.quizId, QUIZ_ID),
          ),
        )
        .orderBy(desc(quizAttempts.attemptNo))
        .limit(1);

      const [inserted] = await tx
        .insert(quizAttempts)
        .values({
          userId: user.id,
          courseId: COURSE_ID,
          quizId: QUIZ_ID,
          attemptNo: (last?.n ?? 0) + 1,
          score,
          totalQuestions,
          correct,
          timeMs,
          passed: score >= 70,
          answers,
        })
        .returning({ id: quizAttempts.id });

      return inserted;
    });

    return NextResponse.json({
      ok: true,
      attemptId: row.id,
      score,
      correct,
      totalQuestions,
    });
  } catch (error) {
    console.error("quiz submit error:", error);
    return NextResponse.json({ error: "Failed to record attempt" }, { status: 500 });
  }
}
