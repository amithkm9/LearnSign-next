/** Age-group category metadata (ported from api.js `courseCategories`). */
export const AGE_GROUPS = ["1-4", "5-10", "15+"] as const;
export type AgeGroup = (typeof AGE_GROUPS)[number];

export const CATEGORY_META: Record<
  AgeGroup,
  { title: string; description: string; emoji: string; difficulty: string }
> = {
  "1-4": {
    title: "Early Learners (Ages 1–4)",
    description: "Foundational sign language through play and basic gestures.",
    emoji: "👶",
    difficulty: "⭐",
  },
  "5-10": {
    title: "Young Explorers (Ages 5–10)",
    description: "Building vocabulary and simple conversations.",
    emoji: "🧒",
    difficulty: "⭐⭐",
  },
  "15+": {
    title: "Advanced Learners (Ages 15+)",
    description: "Complex communication and everyday conversations.",
    emoji: "🎓",
    difficulty: "⭐⭐⭐",
  },
};

export function isAgeGroup(value: string): value is AgeGroup {
  return (AGE_GROUPS as readonly string[]).includes(value);
}
