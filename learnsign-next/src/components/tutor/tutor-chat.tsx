"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Mic, Square, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SignSequencePlayer, type SignStep } from "./sign-sequence-player";

type TutorResponse = {
  type: string;
  response?: string;
  warning?: string;
  videoSequence?: SignStep[];
  responseSigns?: SignStep[];
  suggestions?: string[];
  keyPoints?: string[];
  stepByStep?: string[];
  teachingTips?: string[];
};

type Message = { role: "user" | "assistant"; text: string; data?: TutorResponse };

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
  { code: "kn", label: "ಕನ್ನಡ" },
  { code: "te", label: "తెలుగు" },
];

const GREETING: Message = {
  role: "assistant",
  text: "Hi! I'm SignMentor 🤟 Ask me how to sign any word — like \"hello\", \"thank you\", or \"family\" — or ask a question about learning sign language.",
};

export function TutorChat() {
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(false);
  const [voiceOut, setVoiceOut] = useState(false);
  const [recording, setRecording] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  function playAudio(base64: string) {
    const audio = new Audio(`data:audio/mp3;base64,${base64}`);
    audio.play().catch(() => {});
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");
    const history = messages
      .filter((m) => m.text)
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.text }));
    setMessages((m) => [...m, { role: "user", text: trimmed }]);
    setLoading(true);
    try {
      const res = await fetch("/api/tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, language, conversationHistory: history }),
      });
      const data = await res.json();
      const resp: TutorResponse = data.response ?? {};
      setMessages((m) => [...m, { role: "assistant", text: resp.response ?? "", data: resp }]);
      if (voiceOut && resp.response) speak(resp.response);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function speak(text: string) {
    try {
      const res = await fetch("/api/voice/text-to-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.audio) playAudio(data.audio);
      }
    } catch {
      /* ignore */
    }
  }

  async function toggleRecording() {
    if (recording) {
      mediaRecorder.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunks.current = [];
      recorder.ondataavailable = (e) => audioChunks.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        const blob = new Blob(audioChunks.current, { type: "audio/webm" });
        await sendVoice(blob);
      };
      recorder.start();
      mediaRecorder.current = recorder;
      setRecording(true);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "I couldn't access your microphone." },
      ]);
    }
  }

  async function sendVoice(blob: Blob) {
    setLoading(true);
    try {
      const base64 = await blobToBase64(blob);
      const history = messages
        .filter((m) => m.text)
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.text }));
      const res = await fetch("/api/voice/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audio: base64,
          language,
          conversationHistory: history,
          voiceEnabled: voiceOut,
        }),
      });
      if (res.status === 503) {
        setMessages((m) => [
          ...m,
          { role: "assistant", text: "Voice features need an OpenAI API key configured." },
        ]);
        return;
      }
      const data = await res.json();
      if (data.transcription) {
        setMessages((m) => [...m, { role: "user", text: data.transcription }]);
      }
      const resp: TutorResponse = data.response ?? {};
      setMessages((m) => [...m, { role: "assistant", text: resp.response ?? "", data: resp }]);
      if (data.audio) playAudio(data.audio);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Voice request failed." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] min-h-[32rem] flex-col rounded-2xl border border-border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 font-semibold">
          <span className="text-xl">🤟</span> SignMentor
        </div>
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1 text-sm"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => setVoiceOut((v) => !v)}
            title="Voice replies"
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-md",
              voiceOut ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-accent",
            )}
          >
            {voiceOut ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground",
              )}
            >
              {m.role === "assistant" && m.data ? (
                <AssistantBubble data={m.data} onSuggest={sendMessage} />
              ) : (
                <p className="whitespace-pre-wrap">{m.text}</p>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-secondary px-4 py-2.5 text-sm text-muted-foreground">
              <span className="inline-flex gap-1">
                <Dot /> <Dot delay="150ms" /> <Dot delay="300ms" />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <button
          type="button"
          onClick={toggleRecording}
          title="Voice input"
          className={cn(
            "inline-flex size-10 shrink-0 items-center justify-center rounded-full",
            recording
              ? "animate-pulse bg-destructive text-destructive-foreground"
              : "bg-secondary hover:bg-accent",
          )}
        >
          {recording ? <Square className="size-4" /> : <Mic className="size-4" />}
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask how to sign a word…"
          className="h-10 flex-1 rounded-full border border-input bg-background px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button type="submit" size="icon" className="size-10 shrink-0 rounded-full" disabled={loading}>
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}

function AssistantBubble({
  data,
  onSuggest,
}: {
  data: TutorResponse;
  onSuggest: (w: string) => void;
}) {
  const sequence = data.type === "sign_sequence" ? data.videoSequence : data.responseSigns;
  return (
    <div className="space-y-3">
      {data.response && <p className="whitespace-pre-wrap">{data.response}</p>}
      {data.warning && <p className="text-xs text-muted-foreground">{data.warning}</p>}

      {data.stepByStep && data.stepByStep.length > 0 && (
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          {data.stepByStep.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      )}
      {data.keyPoints && data.keyPoints.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {data.keyPoints.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      )}

      {sequence && sequence.length > 0 && (
        <div className="w-96 max-w-full">
          <SignSequencePlayer items={sequence} />
        </div>
      )}

      {data.teachingTips && data.teachingTips.length > 0 && (
        <div className="rounded-lg border border-border bg-background/60 p-2.5">
          <p className="mb-1 text-xs font-semibold">👩‍🏫 Teaching tips</p>
          <ul className="list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
            {data.teachingTips.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      )}

      {data.suggestions && data.suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {data.suggestions.map((s) => (
            <button
              key={s}
              onClick={() => onSuggest(s)}
              className="rounded-full bg-background px-2.5 py-1 text-xs font-medium text-primary hover:bg-accent"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Dot({ delay = "0ms" }: { delay?: string }) {
  return (
    <span
      className="inline-block size-1.5 animate-bounce rounded-full bg-current"
      style={{ animationDelay: delay }}
    />
  );
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
