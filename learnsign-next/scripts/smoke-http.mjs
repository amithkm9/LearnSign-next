// Hits the running dev server and reports status + a content marker per route.
const base = process.env.BASE ?? "http://localhost:3100";

const checks = [
  { path: "/", marker: "made joyful" },
  { path: "/about", marker: "Amith Reddy" },
  { path: "/community", marker: "Sudeep Shukla" },
  { path: "/login", marker: "Welcome back" },
  { path: "/register", marker: "Create your account" },
  { path: "/tutor", marker: null, expectRedirect: "/login" },
  { path: "/dashboard", marker: null, expectRedirect: "/login" },
  // Phase 3
  { path: "/courses", marker: "Catalog" },
  { path: "/courses/5-10", marker: "Basic Alphabets" },
  { path: "/courses/1-4", marker: "Introduction to Signs" },
  { path: "/learn/003", marker: "Basic Alphabets" },
  { path: "/packages", marker: "Personal Tutor" },
  { path: "/courses/nonsense", marker: null, expectStatus: 404 },
  // Phase 4 — learning events require auth
  {
    path: "/api/learning/events",
    method: "POST",
    body: { courseId: "001", type: "heartbeat", activeMs: 1000 },
    expectStatus: 401,
  },
  // Phase 5 — tutor gating
  {
    path: "/api/tutor/chat",
    method: "POST",
    body: { message: "hello" },
    expectStatus: 401,
  },
  // Phase 6 — report + quiz gating
  { path: "/report", marker: null, expectRedirect: "/login" },
  { path: "/quiz", marker: null, expectRedirect: "/login" },
  { path: "/api/report", expectStatus: 401 },
  { path: "/api/quiz/submit", method: "POST", body: { score: 80 }, expectStatus: 401 },
];

let ok = true;
for (const c of checks) {
  try {
    const res = await fetch(base + c.path, {
      method: c.method ?? "GET",
      redirect: "manual",
      ...(c.body
        ? {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(c.body),
          }
        : {}),
    });
    const status = res.status;
    let detail = "";
    if (c.expectStatus) {
      const good = status === c.expectStatus;
      ok = ok && good;
      detail = `${status} ${good ? "✓" : "✗ expected " + c.expectStatus}`;
    } else if (c.expectRedirect) {
      const loc = res.headers.get("location") ?? "";
      const good = (status === 307 || status === 302) && loc.includes(c.expectRedirect);
      ok = ok && good;
      detail = `${status} → ${loc || "(no redirect)"} ${good ? "✓" : "✗ expected " + c.expectRedirect}`;
    } else {
      const body = await res.text();
      const found = c.marker ? body.includes(c.marker) : true;
      ok = ok && status === 200 && found;
      detail = `${status} ${found ? `· "${c.marker}" ✓` : `· "${c.marker}" MISSING ✗`}`;
    }
    console.log(`  ${c.path.padEnd(12)} ${detail}`);
  } catch (e) {
    ok = false;
    console.log(`  ${c.path.padEnd(12)} ERROR ${e.message}`);
  }
}
console.log(ok ? "\nALL CHECKS PASSED ✓" : "\nSOME CHECKS FAILED ✗");
process.exit(ok ? 0 : 1);
