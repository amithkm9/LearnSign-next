import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getUserTutorProfile } from "@/lib/data/tutor-profile";
import { proxyToAiService } from "@/lib/ai-proxy";

// ~10 MB of base64 (≈7.5 MB of audio) is plenty for a short spoken turn.
const MAX_AUDIO_CHARS = 10_000_000;
const MAX_HISTORY = 20;

/** Gateway → Python /voice/chat (Whisper → tutor → TTS). */
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: {
    audio?: string;
    language?: string;
    conversationHistory?: unknown[];
    voiceEnabled?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.audio || typeof body.audio !== "string") {
    return NextResponse.json({ error: "audio is required" }, { status: 400 });
  }
  if (body.audio.length > MAX_AUDIO_CHARS) {
    return NextResponse.json({ error: "audio is too large" }, { status: 413 });
  }

  const history = Array.isArray(body.conversationHistory)
    ? body.conversationHistory.slice(-MAX_HISTORY)
    : [];

  const profile = await getUserTutorProfile(user.id);
  return proxyToAiService("/voice/chat", {
    audio: body.audio,
    language: body.language ?? "en",
    conversation_history: history,
    voice_enabled: body.voiceEnabled ?? true,
    profile,
  });
}
