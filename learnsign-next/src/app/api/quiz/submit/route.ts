import { NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { quizAttempts } from "@/lib/db/schema";

/**
 * Records a quiz attempt for the signed-in user. Auto-increments attemptNo.
 * Body: { courseId?, quizId?, score, totalQuestions, correct, timeMs, answers? }
 */
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: {
    courseId?: string;
    quizId?: string;
    score?: number;
    totalQuestions?: number;
    correct?: number;
    timeMs?: number;
    answers?: { questionId: string; correct: boolean; choice?: string }[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const courseId = body.courseId ?? "practice";
  const quizId = body.quizId ?? "sign-practice";
  const score = Math.min(100, Math.max(0, Math.round(body.score ?? 0)));
  const totalQuestions = Math.max(0, Math.round(body.totalQuestions ?? 0));
  // Keep `correct` internally consistent with the question count.
  const correct = Math.min(totalQuestions, Math.max(0, Math.round(body.correct ?? 0)));
  const timeMs = Math.max(0, Math.round(body.timeMs ?? 0));
  const answers = Array.isArray(body.answers) ? body.answers.slice(0, 200) : [];

  // A transaction-scoped advisory lock keyed by (user, course, quiz) serializes
  // the read-max + insert so concurrent submissions can't get the same attemptNo.
  const row = await db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${`${user.id}:${courseId}:${quizId}`})::int8)`,
    );

    const [last] = await tx
      .select({ n: quizAttempts.attemptNo })
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.userId, user.id),
          eq(quizAttempts.courseId, courseId),
          eq(quizAttempts.quizId, quizId),
        ),
      )
      .orderBy(desc(quizAttempts.attemptNo))
      .limit(1);

    const [inserted] = await tx
      .insert(quizAttempts)
      .values({
        userId: user.id,
        courseId,
        quizId,
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

  return NextResponse.json({ ok: true, attemptId: row.id });
}
