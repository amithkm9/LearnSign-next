import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getUserTutorProfile } from "@/lib/data/tutor-profile";
import { proxyToAiService } from "@/lib/ai-proxy";

const MAX_MESSAGE_CHARS = 2000;
const MAX_HISTORY = 20;

/** Gateway → Python AI service: verifies auth, adds DB context, proxies. */
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { message?: string; conversationHistory?: unknown[]; language?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_CHARS) {
    return NextResponse.json({ error: "message is too long" }, { status: 413 });
  }

  // Only the most recent turns are useful (Python uses the last 6) — cap to
  // bound prompt size / token cost from an oversized client history.
  const history = Array.isArray(body.conversationHistory)
    ? body.conversationHistory.slice(-MAX_HISTORY)
    : [];

  const profile = await getUserTutorProfile(user.id);
  return proxyToAiService("/tutor/chat", {
    message,
    language: body.language ?? "en",
    conversation_history: history,
    profile,
  });
}
