import { NextResponse } from "next/server";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:8100";

// Cap how long a gateway route will wait on the Python service so a hung
// upstream can't pin a Next request indefinitely. Whisper+TTS round-trips are
// the slowest path, hence 60s.
const UPSTREAM_TIMEOUT_MS = 60_000;

/**
 * Proxies a JSON body to the stateless Python AI service and normalizes the
 * error shape. Shared by the tutor/voice/recognition gateway routes so the
 * fetch + 502 handling lives in one place. Times out, and degrades non-JSON
 * upstream responses (e.g. an HTML 500 page) into a clean 502.
 */
export async function proxyToAiService(path: string, body: unknown) {
  try {
    const upstream = await fetch(`${AI_SERVICE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    const text = await upstream.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      // Upstream returned non-JSON (HTML error page, empty body, etc.).
      return NextResponse.json(
        { error: "AI service returned an invalid response" },
        { status: 502 },
      );
    }
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return NextResponse.json(
      {
        error: timedOut ? "AI service timed out" : "AI service unavailable",
        hint: `Is the AI service running at ${AI_SERVICE_URL}?`,
      },
      { status: timedOut ? 504 : 502 },
    );
  }
}

/** Reachability check for the AI service. */
export async function aiServiceReachable() {
  try {
    const res = await fetch(`${AI_SERVICE_URL}/health`);
    return { reachable: res.ok, target: AI_SERVICE_URL };
  } catch {
    return { reachable: false, target: AI_SERVICE_URL };
  }
}
