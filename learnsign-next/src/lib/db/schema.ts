/**
 * Drizzle schema — Postgres (Supabase).
 *
 * Phase 1 → profiles (1:1 with auth.users)
 * Phase 3 → courses, packages
 * Later: Phase 4 user_progress / learning_events / quiz_attempts.
 *
 * After editing: `npm run db:generate` then `npm run db:migrate`.
 * RLS policies + the auth.users trigger live in drizzle/manual/*.sql.
 */
import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  integer,
  boolean,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ============================ profiles ============================
export type Preferences = {
  language: string;
  notifications: { email: boolean; sms: boolean; push: boolean };
};

export type Subscription = {
  plan: "free" | "family-starter" | "parent-child-duo" | "comprehensive-learning";
  features: string[];
};

export type ProgressRollup = {
  totalCoursesStarted: number;
  totalCoursesCompleted: number;
  totalLearningTime: number; // minutes
  currentStreak: number;
  longestStreak: number;
  lastActivityDate?: string; // ISO; used for streak calculation
  achievements: { id: string; name: string; earnedAt: string }[];
};

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  userType: text("user_type").notNull().default("parent"),
  ageGroup: text("age_group"),
  preferences: jsonb("preferences")
    .$type<Preferences>()
    .notNull()
    .default({ language: "en", notifications: { email: true, sms: false, push: true } }),
  subscription: jsonb("subscription")
    .$type<Subscription>()
    .notNull()
    .default({ plan: "free", features: [] }),
  progress: jsonb("progress")
    .$type<ProgressRollup>()
    .notNull()
    .default({
      totalCoursesStarted: 0,
      totalCoursesCompleted: 0,
      totalLearningTime: 0,
      currentStreak: 0,
      longestStreak: 0,
      achievements: [],
    }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

// ============================ courses ============================
export type Instructor = { name: string; bio: string; credentials: string[] };
export type CourseAnalytics = {
  enrollments: number;
  completions: number;
  views: number;
  averageRating: number;
  totalRatings: number;
};

const COURSE_ANALYTICS_DEFAULT: CourseAnalytics = {
  enrollments: 0,
  completions: 0,
  views: 0,
  averageRating: 0,
  totalRatings: 0,
};

export const courses = pgTable("courses", {
  id: text("id").primaryKey(), // legacy 3-digit code, e.g. "001"
  title: text("title").notNull(),
  description: text("description").notNull(),
  video: text("video").notNull(),
  thumbnail: text("thumbnail"),
  ageGroup: text("age_group").notNull(), // 1-4 | 5-10 | 15+
  category: text("category").notNull(),
  difficulty: text("difficulty").notNull(), // Beginner | Intermediate | Advanced
  duration: text("duration").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(0),
  price: text("price").notNull().default("FREE"),
  skills: text("skills").array().notNull().default([]),
  prerequisites: text("prerequisites").array().notNull().default([]),
  learningObjectives: text("learning_objectives").array().notNull().default([]),
  tags: text("tags").array().notNull().default([]),
  instructor: jsonb("instructor").$type<Instructor | null>(),
  analytics: jsonb("analytics")
    .$type<CourseAnalytics>()
    .notNull()
    .default(COURSE_ANALYTICS_DEFAULT),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;

// ============================ packages ============================
export type Benefit = { title: string; description: string; icon: string };
export type PackageContent = {
  duration?: { estimated?: string; totalHours?: number };
  modules?: { name: string; description: string; courseIds: string[]; order: number }[];
};

export const packages = pgTable("packages", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  subtitle: text("subtitle"),
  price: text("price").notNull().default("FREE"),
  originalPrice: text("original_price"),
  savings: text("savings"),
  icon: text("icon").notNull().default("🎓"),
  includes: text("includes").array().notNull().default([]),
  features: text("features").array().notNull().default([]),
  ageGroups: text("age_groups").array().notNull().default([]),
  courseIds: text("course_ids").array().notNull().default([]),
  tags: text("tags").array().notNull().default([]),
  popular: boolean("popular").notNull().default(false),
  targetAudience: text("target_audience").notNull().default("families"),
  benefits: jsonb("benefits").$type<Benefit[]>().notNull().default([]),
  content: jsonb("content").$type<PackageContent>(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Package = typeof packages.$inferSelect;
export type NewPackage = typeof packages.$inferInsert;

// ============================ user_progress ============================
export const userProgress = pgTable(
  "user_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    courseId: text("course_id").notNull(),
    status: text("status").notNull().default("in_progress"), // not_started|in_progress|completed|paused
    progressPercentage: integer("progress_percentage").notNull().default(0),
    timeSpent: integer("time_spent").notNull().default(0), // minutes
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    lastAccessedAt: timestamp("last_accessed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("user_progress_user_course_idx").on(t.userId, t.courseId),
    index("user_progress_user_idx").on(t.userId),
  ],
);

export type UserProgress = typeof userProgress.$inferSelect;

// ============================ learning_events ============================
export const learningEvents = pgTable(
  "learning_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    courseId: text("course_id").notNull(),
    type: text("type").notNull(), // start|pause|resume|heartbeat|end
    sessionId: text("session_id"),
    activeMs: integer("active_ms").notNull().default(0),
    progressPercentage: integer("progress_percentage"),
    source: text("source").notNull().default("web"),
    ts: timestamp("ts", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("learning_events_user_ts_idx").on(t.userId, t.ts)],
);

export type LearningEvent = typeof learningEvents.$inferSelect;

// ============================ quiz_attempts ============================
export type QuizAnswer = {
  questionId: string;
  correct: boolean;
  choice?: string;
  timeMs?: number;
};

export const quizAttempts = pgTable(
  "quiz_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    courseId: text("course_id").notNull(),
    quizId: text("quiz_id").notNull(),
    attemptNo: integer("attempt_no").notNull().default(1),
    score: integer("score"),
    totalQuestions: integer("total_questions"),
    correct: integer("correct"),
    timeMs: integer("time_ms").notNull().default(0),
    passed: boolean("passed").notNull().default(false),
    answers: jsonb("answers").$type<QuizAnswer[]>().notNull().default([]),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("quiz_attempts_user_course_idx").on(t.userId, t.courseId)],
);

export type QuizAttempt = typeof quizAttempts.$inferSelect;
