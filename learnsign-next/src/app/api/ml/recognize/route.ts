import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { proxyToAiService, aiServiceReachable } from "@/lib/ai-proxy";

// Bound the webcam payload: the quiz captures ~20 downscaled JPEG frames.
const MAX_FRAMES = 40;
const MAX_FRAME_CHARS = 200_000; // ~150 KB per base64 frame

/**
 * Quiz webcam recognition → unified Python AI service `/recognize`.
 * Requires an authenticated session (the quiz page is itself login-gated) and
 * caps the frame payload so the ML service can't be hammered with huge bodies.
 * Request/response: { frames: string[] } → { detected_sign, confidence, ... }
 */
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { frames?: unknown };
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

  return proxyToAiService("/recognize", { frames });
}

/** Reachability check for the recognition endpoint. */
export async function GET() {
  const status = await aiServiceReachable();
  return NextResponse.json(status, { status: status.reachable ? 200 : 502 });
}
