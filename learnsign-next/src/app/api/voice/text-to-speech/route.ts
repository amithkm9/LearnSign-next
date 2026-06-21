import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { proxyToAiService } from "@/lib/ai-proxy";
import { rateLimit, tooMany } from "@/lib/rate-limit";

// Python truncates to 4000 chars; reject anything clearly oversized up front.
const MAX_TTS_CHARS = 5000;
export const maxDuration = 30;

/** Gateway → Python /voice/tts. */
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const rl = rateLimit(`tts:${user.id}`, 20);
  if (!rl.ok) return tooMany(rl.retryAfter);

  let body: { text?: string; voice?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.text || typeof body.text !== "string") {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }
  if (body.text.length > MAX_TTS_CHARS) {
    return NextResponse.json({ error: "text is too long" }, { status: 413 });
  }

  return proxyToAiService("/voice/tts", { text: body.text, voice: body.voice ?? "nova" });
}
