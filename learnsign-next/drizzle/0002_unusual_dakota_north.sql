CREATE TABLE "learning_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"course_id" text NOT NULL,
	"type" text NOT NULL,
	"session_id" text,
	"active_ms" integer DEFAULT 0 NOT NULL,
	"progress_percentage" integer,
	"source" text DEFAULT 'web' NOT NULL,
	"ts" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"course_id" text NOT NULL,
	"quiz_id" text NOT NULL,
	"attempt_no" integer DEFAULT 1 NOT NULL,
	"score" integer,
	"total_questions" integer,
	"correct" integer,
	"time_ms" integer DEFAULT 0 NOT NULL,
	"passed" boolean DEFAULT false NOT NULL,
	"answers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"course_id" text NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"progress_percentage" integer DEFAULT 0 NOT NULL,
	"time_spent" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"last_accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "learning_events_user_ts_idx" ON "learning_events" USING btree ("user_id","ts");--> statement-breakpoint
CREATE INDEX "quiz_attempts_user_course_idx" ON "quiz_attempts" USING btree ("user_id","course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_progress_user_course_idx" ON "user_progress" USING btree ("user_id","course_id");--> statement-breakpoint
CREATE INDEX "user_progress_user_idx" ON "user_progress" USING btree ("user_id");