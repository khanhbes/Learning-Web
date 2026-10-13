// Full real runner journey in an isolated SQLite database. Never alters user progress.
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { createApp } from "../server/index.mjs";
import { createStore } from "../server/store.mjs";
import { solution } from "../content/solutions.mjs";
import { componentsSolution } from "../content/alternatives.mjs";
import { lessons } from "../content/curriculum.mjs";
const store = createStore(":memory:"),
  app = await createApp({ store, config: { cloud: false, aiProvider: "off" } });
const report = {
  createdAt: new Date().toISOString(),
  engine: "WebAssembly",
  lessons: [],
  submissions: [],
  capstone: null,
  checks: [],
};
async function call(method, url, payload) {
  const r = await app.inject({ method, url: "/api" + url, payload });
  assert.equal(r.statusCode, 200, r.body);
  return JSON.parse(r.body);
}
async function answerAll(a, table = "attempts") {
  const original = store.get(table, a.id);
  await call(
    "PATCH",
    `/${table === "capstones" ? "capstone" : "attempts"}/${a.id}`,
    {
      answers: Object.fromEntries(
        original.questions.map((q) => [q.id, q.answerId]),
      ),
    },
  );
}
async function code(a, pid, language, table = "attempts") {
  const base = table === "capstones" ? "capstone" : "attempts";
  const { jobId } = await call("POST", `/${base}/${a.id}/code`, {
    problemId: pid,
    language,
    code:
      a.lessonId === 39 && pid === "union-find"
        ? componentsSolution(language)
        : solution(pid, language),
  });
  let job;
  do {
    await new Promise((r) => setTimeout(r, 100));
    job = await call("GET", "/jobs/" + jobId);
  } while (["queued", "running"].includes(job.status));
  assert.equal(job.result.status, "accepted", JSON.stringify(job.result));
  report.submissions.push({
    problemId: pid,
    language,
    tests: job.result.checks.length,
  });
}
try {
  for (const l of lessons.slice(0, 48)) {
    assert.ok(
      (await call("GET", "/course")).lessons.find((x) => x.id === l.id)
        .unlocked,
    );
    const a = await call("POST", "/attempts", {
      lessonId: l.id,
      mode: "assessment",
    });
    await answerAll(a);
    for (const [i, pid] of a.requiredProblems.entries())
      await code(a, pid, l.kind === "exam" && i === 1 ? "cpp" : "python");
    const r = await call("POST", `/attempts/${a.id}/submit`, {});
    assert.ok(r.passed);
    report.lessons.push({ id: l.id, passed: r.passed, knowledge: r.knowledge });
    const xp = store.getState().xp;
    await call("POST", `/attempts/${a.id}/submit`, {});
    assert.equal(store.getState().xp, xp);
    console.log(`Buổi ${l.id}/48 đạt · ${l.title}`);
  }
  assert.equal(store.getState().xp, 2600);
  assert.ok((await call("GET", "/capstone")).unlocked);
  const a = await call("POST", "/capstone", {});
  await answerAll(a, "capstones");
  for (const pid of a.requiredProblems)
    await code(a, pid, pid === "priority" ? "cpp" : "python", "capstones");
  await call("PATCH", "/capstone/" + a.id, {
    essay: Object.fromEntries(
      Object.keys(a.essay).map((k) => [
        k,
        "Mô tả, phân tích và kiểm thử của bản nghiệm thu tự động.",
      ]),
    ),
    customTests: [
      { problemId: "topo", input: { n: 2, edges: [[1, 0]] }, expected: [1, 0] },
      {
        problemId: "priority",
        input: {
          tasks: [
            { id: 0, priority: 2, order: 0 },
            { id: 1, priority: 1, order: 1 },
            { id: 2, priority: 1, order: 2 },
          ],
        },
        expected: [1, 2, 0],
      },
      {
        problemId: "prefix",
        input: { nums: [2, 3], queries: [[0, 1]] },
        expected: [5],
      },
    ],
  });
  report.capstone = await call("POST", "/capstone/" + a.id + "/submit", {});
  assert.ok(report.capstone.passed);
  assert.equal(report.capstone.score, 100);
  assert.ok(
    (await call("GET", "/course")).lessons.slice(48).every((l) => l.unlocked),
  );
  assert.equal((await call("GET", "/state")).courseScore, 100);
  report.checks.push("48 buổi → bài cuối khóa 100/100 → 12 buổi nâng cao");
  const backup = await call("GET", "/data/export");
  await call("POST", "/data/import", backup);
  assert.equal((await call("GET", "/state")).courseScore, 100);
  report.checks.push("Backup/restore giữ kết quả và các bản code đã được chấm");
  const xp = store.getState().xp;
  await call("POST", "/capstone/" + a.id + "/submit", {});
  assert.equal(store.getState().xp, xp);
  report.checks.push("Nộp hai lần không thưởng hai lần");
  report.passed = true;
} finally {
  mkdirSync("output", { recursive: true });
  writeFileSync(
    "output/course-e2e-report.json",
    JSON.stringify(report, null, 2),
  );
  await app.close();
}
console.log(
  "Full course E2E passed, real runner submissions: " +
    report.submissions.length,
);
