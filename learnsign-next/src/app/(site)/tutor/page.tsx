import { TutorChat } from "@/components/tutor/tutor-chat";

export const metadata = {
  title: "AI Tutor",
  description: "Chat with SignMentor — your AI sign-language tutor with video demonstrations and voice.",
};

export default function TutorPage() {
  return (
    <main className="container py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">AI Tutor — SignMentor</h1>
          <p className="text-sm text-muted-foreground">
            Ask how to sign any word and watch the demonstration. Supports
            English, Hindi, Kannada &amp; Telugu, with voice input/output.
          </p>
        </div>
        <TutorChat />
      </div>
    </main>
  );
}
