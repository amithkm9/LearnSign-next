// Seeds courses + packages into Postgres (ported from legacy seeds/seedData.js).
// Idempotent: clears both tables then inserts. Uses the postgres driver
// directly so it doesn't depend on importing the TS source.
//   node --env-file=.env scripts/seed.mjs
//   (or: it reads DATABASE_URL from .env automatically)
import { readFileSync } from "node:fs";
import postgres from "postgres";

const ANALYTICS = {
  enrollments: 0,
  completions: 0,
  views: 0,
  averageRating: 0,
  totalRatings: 0,
};

const courses = [
  { id: "001", title: "Introduction to Signs", description: "First introduction to the world of sign language", video: "/assets/videos/Introduction.mp4", ageGroup: "1-4", category: "basics", duration: "5 min", durationMinutes: 5, difficulty: "Beginner", price: "FREE", skills: ["Basic Gestures", "Visual Learning"], prerequisites: [], learningObjectives: ["Understand what sign language is", "Learn basic hand movements", "Recognize simple signs"], tags: ["introduction", "basics", "toddler", "visual"], instructor: { name: "Sarah Johnson", bio: "Certified ASL instructor with 10+ years of experience", credentials: ["ASL Certification", "Early Childhood Education"] } },
  { id: "002", title: "Simple Numbers", description: "Learning to sign numbers 1-10 with fun activities", video: "/assets/videos/Numbers1.mp4", ageGroup: "1-4", category: "numbers", duration: "8 min", durationMinutes: 8, difficulty: "Beginner", price: "FREE", skills: ["Number Recognition", "Counting"], prerequisites: ["001"], learningObjectives: ["Sign numbers 1-10", "Understand number concepts", "Practice counting with signs"], tags: ["numbers", "counting", "math", "toddler"], instructor: null },
  { id: "006", title: "Playground Signs", description: "Fun signs for playground activities and toys", video: "/assets/videos/placeholder.mp4", ageGroup: "1-4", category: "play", duration: "6 min", durationMinutes: 6, difficulty: "Beginner", price: "FREE", skills: ["Play Activities", "Social Interaction"], prerequisites: ["001"], learningObjectives: ["Learn playground vocabulary", "Sign common toys and games", "Interact with other children"], tags: ["playground", "toys", "games", "social"], instructor: null },
  { id: "003", title: "Basic Alphabets", description: "Learning the ASL alphabet through interactive methods", video: "/assets/videos/Alphabets.mp4", ageGroup: "5-10", category: "letters", duration: "12 min", durationMinutes: 12, difficulty: "Beginner", price: "FREE", skills: ["Letter Recognition", "Spelling"], prerequisites: ["001"], learningObjectives: ["Master the ASL alphabet", "Spell simple words", "Understand fingerspelling"], tags: ["alphabet", "letters", "spelling", "fingerspelling"], instructor: null },
  { id: "004", title: "Family Signs", description: "Important family member signs for daily communication", video: "/assets/videos/family.mp4", ageGroup: "5-10", category: "family", duration: "10 min", durationMinutes: 10, difficulty: "Intermediate", price: "FREE", skills: ["Family Terms", "Relationships"], prerequisites: ["001", "003"], learningObjectives: ["Sign family member names", "Understand family relationships", "Use family signs in conversation"], tags: ["family", "relationships", "parents", "siblings"], instructor: null },
  { id: "007", title: "School & Learning", description: "Essential signs for school environment and learning", video: "/assets/videos/placeholder.mp4", ageGroup: "5-10", category: "education", duration: "14 min", durationMinutes: 14, difficulty: "Intermediate", price: "FREE", skills: ["Educational Terms", "Classroom Communication"], prerequisites: ["003", "004"], learningObjectives: ["Learn school vocabulary", "Communicate in classroom settings", "Sign educational activities"], tags: ["school", "education", "classroom", "learning"], instructor: null },
  { id: "005", title: "Emotions & Expressions", description: "Express feelings and emotions through sign language", video: "/assets/videos/feelings.mp4", ageGroup: "15+", category: "emotions", duration: "15 min", durationMinutes: 15, difficulty: "Intermediate", price: "FREE", skills: ["Emotional Expression", "Advanced Communication"], prerequisites: ["001", "003", "004"], learningObjectives: ["Express complex emotions", "Understand emotional nuance", "Use facial expressions effectively"], tags: ["emotions", "feelings", "expressions", "advanced"], instructor: null },
  { id: "008", title: "Advanced Conversations", description: "Complex sentences and natural conversation flow", video: "/assets/videos/placeholder.mp4", ageGroup: "15+", category: "conversation", duration: "20 min", durationMinutes: 20, difficulty: "Advanced", price: "FREE", skills: ["Complex Grammar", "Fluent Communication"], prerequisites: ["003", "004", "005"], learningObjectives: ["Engage in complex conversations", "Use advanced grammar structures", "Develop fluency in ASL"], tags: ["conversation", "grammar", "fluency", "advanced"], instructor: null },
];

const packages = [
  { id: "family-starter", title: "Family Starter Pack", description: "Perfect for families with children and parents learning together", subtitle: null, price: "FREE", originalPrice: "$199", savings: "100%", icon: "👨‍👩‍👧‍👦", includes: ["Basic Signs", "Family Signs", "Emotions", "Numbers & Letters"], features: ["Parent Guide", "Progress Tracking", "Community Access", "Mobile App"], ageGroups: ["1-4", "5-10", "15+"], courseIds: ["001", "002", "003", "004", "005", "006"], tags: ["family", "comprehensive", "beginner-friendly", "popular"], popular: true, targetAudience: "families", benefits: [{ title: "Family Bonding", description: "Learn together as a family and strengthen your bonds with LearnSign", icon: "👨‍👩‍👧‍👦" }, { title: "Comprehensive Coverage", description: "Covers all essential sign language basics with our proven curriculum", icon: "📚" }], content: { duration: { estimated: "2-3 months", totalHours: 15 } } },
  { id: "parent-child-duo", title: "Parent-Child Duo", description: "Designed for one-on-one parent-child learning sessions", subtitle: null, price: "FREE", originalPrice: "$149", savings: "100%", icon: "👨‍👧", includes: ["Interactive Lessons", "Bonding Activities", "Progress Reports"], features: ["Duo Learning Mode", "Weekly Challenges", "Achievement Badges"], ageGroups: ["1-4", "5-10"], courseIds: ["001", "002", "003", "006", "007"], tags: ["parent-child", "bonding", "individual-learning"], popular: false, targetAudience: "parents", benefits: [{ title: "One-on-One Learning", description: "Perfect for individual parent-child bonding time", icon: "👨‍👧" }, { title: "Age-Appropriate Content", description: "Carefully selected content for young learners", icon: "🎯" }], content: { duration: { estimated: "6-8 weeks", totalHours: 10 } } },
  { id: "comprehensive-learning", title: "Comprehensive Learning Suite", description: "Complete sign language curriculum for all family members", subtitle: null, price: "FREE", originalPrice: "$299", savings: "100%", icon: "🎓", includes: ["All Courses", "Advanced Features", "Priority Support", "Offline Content"], features: ["Unlimited Access", "Expert Support", "Downloadable Content", "Certificate Program"], ageGroups: ["1-4", "5-10", "15+"], courseIds: ["001", "002", "003", "004", "005", "006", "007", "008"], tags: ["comprehensive", "complete", "advanced", "expert-support"], popular: false, targetAudience: "all", benefits: [{ title: "Complete Curriculum", description: "Everything you need to master sign language", icon: "🎓" }, { title: "Expert Support", description: "Get help from certified ASL instructors", icon: "👨‍🏫" }], content: { duration: { estimated: "4-6 months", totalHours: 25 } } },
];

const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
const line = env.split("\n").find((l) => l.startsWith("DATABASE_URL="));
const url = line.slice("DATABASE_URL=".length).trim().replace(/^["']|["']$/g, "");
const sql = postgres(url, { ssl: "require", prepare: false, max: 1 });

try {
  await sql.begin(async (tx) => {
    await tx`delete from public.courses`;
    await tx`delete from public.packages`;

    for (const c of courses) {
      await tx`
        insert into public.courses
          (id, title, description, video, thumbnail, age_group, category, difficulty,
           duration, duration_minutes, price, skills, prerequisites, learning_objectives,
           tags, instructor, analytics, is_published)
        values
          (${c.id}, ${c.title}, ${c.description}, ${c.video}, ${null}, ${c.ageGroup},
           ${c.category}, ${c.difficulty}, ${c.duration}, ${c.durationMinutes}, ${c.price},
           ${c.skills}, ${c.prerequisites}, ${c.learningObjectives}, ${c.tags},
           ${c.instructor ? sql.json(c.instructor) : null}, ${sql.json(ANALYTICS)}, ${true})`;
    }

    for (const p of packages) {
      await tx`
        insert into public.packages
          (id, title, description, subtitle, price, original_price, savings, icon,
           includes, features, age_groups, course_ids, tags, popular, target_audience,
           benefits, content, is_active)
        values
          (${p.id}, ${p.title}, ${p.description}, ${p.subtitle}, ${p.price}, ${p.originalPrice},
           ${p.savings}, ${p.icon}, ${p.includes}, ${p.features}, ${p.ageGroups}, ${p.courseIds},
           ${p.tags}, ${p.popular}, ${p.targetAudience}, ${sql.json(p.benefits)},
           ${sql.json(p.content)}, ${true})`;
    }
  });

  const [{ c }] = await sql`select count(*)::int as c from public.courses`;
  const [{ p }] = await sql`select count(*)::int as p from public.packages`;
  console.log(`Seeded ✓  courses=${c}  packages=${p}`);
} catch (e) {
  console.error("Seed failed:", e.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
