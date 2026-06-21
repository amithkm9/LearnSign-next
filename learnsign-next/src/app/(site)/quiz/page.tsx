import { QuizPlayer } from "@/components/quiz/quiz-player";

export const metadata = {
  title: "Quiz",
  description: "Practice signs with real-time webcam recognition.",
};

export default function QuizPage() {
  return (
    <main className="container py-10">
      <div className="mx-auto max-w-6xl">
        <QuizPlayer />
      </div>
    </main>
  );
}
