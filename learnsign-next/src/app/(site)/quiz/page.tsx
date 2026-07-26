import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { QuizPlayer } from "@/components/quiz/quiz-player";

export const metadata = {
  title: "Quiz",
  description: "Practice signs with real-time webcam recognition.",
};

export default async function QuizPage() {
  // Middleware already gates this route; checking here too means a middleware
  // bypass can't render the authenticated view.
  if (!(await getUser())) redirect("/login?redirectTo=/quiz");

  return (
    <main className="container py-10">
      <div className="mx-auto max-w-6xl">
        <QuizPlayer />
      </div>
    </main>
  );
}
