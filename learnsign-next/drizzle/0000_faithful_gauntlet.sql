CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"user_type" text DEFAULT 'parent' NOT NULL,
	"age_group" text,
	"preferences" jsonb DEFAULT '{"language":"en","notifications":{"email":true,"sms":false,"push":true}}'::jsonb NOT NULL,
	"subscription" jsonb DEFAULT '{"plan":"free","features":[]}'::jsonb NOT NULL,
	"progress" jsonb DEFAULT '{"totalCoursesStarted":0,"totalCoursesCompleted":0,"totalLearningTime":0,"currentStreak":0,"longestStreak":0,"achievements":[]}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
