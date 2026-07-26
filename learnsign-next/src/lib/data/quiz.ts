/**
 * The practice quiz's question set — the single source of truth, shared by the
 * client player and the server routes.
 *
 * `target` lives here (not in the browser) so the server, not the client,
 * decides what a correct answer is. See `@/lib/quiz-proof`.
 */
export type QuizQuestion = {
  id: string;
  /** The label the recognition model returns for a correct sign. */
  target: string;
  display: string;
  video: string;
  /** Landmark still — shown if the clip can't play (e.g. 1–2 frame clips). */
  poster: string;
  color: string;
};

export const QUIZ_ID = "sign-practice";

// The recognition model knows letters a/b/c and numbers one/two/three.
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  { id: "a", target: "A", display: "A", video: "/assets/videos/signs/A.webm", poster: "/assets/imgs/signs/A.jpg", color: "from-brand-blue to-primary" },
  { id: "b", target: "B", display: "B", video: "/assets/videos/signs/B.webm", poster: "/assets/imgs/signs/B.jpg", color: "from-brand-pink to-brand-orange" },
  { id: "c", target: "C", display: "C", video: "/assets/videos/signs/C.webm", poster: "/assets/imgs/signs/C.jpg", color: "from-brand-green to-brand-blue" },
  { id: "one", target: "ONE", display: "1", video: "/assets/videos/signs/1.webm", poster: "/assets/imgs/signs/1.jpg", color: "from-brand-orange to-brand-pink" },
  { id: "two", target: "TWO", display: "2", video: "/assets/videos/signs/2.webm", poster: "/assets/imgs/signs/2.jpg", color: "from-primary to-brand-pink" },
  { id: "three", target: "THREE", display: "3", video: "/assets/videos/signs/3.webm", poster: "/assets/imgs/signs/3.jpg", color: "from-brand-green to-brand-yellow" },
];

const BY_ID = new Map(QUIZ_QUESTIONS.map((q) => [q.id, q]));

export function getQuizQuestion(id: unknown): QuizQuestion | null {
  return typeof id === "string" ? (BY_ID.get(id) ?? null) : null;
}
