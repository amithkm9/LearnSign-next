import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { proxyToAiService, aiServiceReachable } from "@/lib/ai-proxy";
import { getQuizQuestion } from "@/lib/data/quiz";
import { signQuizProof } from "@/lib/quiz-proof";
import { rateLimit, tooMany } from "@/lib/rate-limit";

// Bound the webcam payload: the quiz captures ~20 downscaled JPEG frames.
const MAX_FRAMES = 40;
const MAX_FRAME_CHARS = 200_000; // ~150 KB per base64 frame

/**
 * Quiz webcam recognition → unified Python AI service `/recognize`.
 * Requires an authenticated session (the quiz page is itself login-gated) and
 * caps the frame payload so the ML service can't be hammered with huge bodies.
 *
 * When the client names the question it is answering, this route — not the
 * browser — decides whether the sign was correct, and returns a signed proof
 * that /api/quiz/submit accepts as evidence.
 *
 * Request:  { frames: string[], questionId?: string }
 * Response: { detected_sign, confidence, ..., correct?, proof? }
 */
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const rl = rateLimit(`recognize:${user.id}`, 60);
  if (!rl.ok) return tooMany(rl.retryAfter);

  let body: { frames?: unknown; questionId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const frames = body.frames;
  if (!Array.isArray(frames) || frames.length === 0) {
    return NextResponse.json({ error: "frames must be a non-empty array" }, { status: 400 });
  }
  if (frames.length > MAX_FRAMES) {
    return NextResponse.json({ error: `too many frames (max ${MAX_FRAMES})` }, { status: 413 });
  }
  if (frames.some((f) => typeof f !== "string" || f.length > MAX_FRAME_CHARS)) {
    return NextResponse.json({ error: "invalid or oversized frame" }, { status: 413 });
  }

  const upstream = await proxyToAiService("/recognize", { frames });

  // The question is looked up server-side, so the client can only say which
  // question it is attempting — never what counts as a correct answer.
  const question = getQuizQuestion(body.questionId);
  if (!upstream.ok || !question) return upstream;

  const result = (await upstream.json()) as { detected_sign?: unknown };
  const detected =
    typeof result.detected_sign === "string" ? result.detected_sign.toUpperCase() : "";
  const correct = detected === question.target;

  return NextResponse.json({
    ...result,
    correct,
    ...(correct ? { proof: signQuizProof(user.id, question.id) } : {}),
  });
}

/** Reachability check for the AI service. Authenticated — it probes internal infra. */
export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const status = await aiServiceReachable();
  return NextResponse.json(status, { status: status.reachable ? 200 : 502 });
}
