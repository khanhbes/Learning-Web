import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../server/index.mjs";
import { createStore } from "../server/store.mjs";
import { dayTime } from "../server/game.mjs";
async function setup(
  execute = async () => ({
    status: "accepted",
    checks: [],
    message: "fixture",
  }),
) {
  const store = createStore(":memory:");
  const app = await createApp({
    store,
    execute,
    now: () => dayTime("2026-10-12") + 12 * 3600000,
    health: async () => ({ available: false }),
    aiHealth: async () => ({ available: false }),
    tutor: async () => ({ available: false, text: "fixture" }),
  });
  return {
    app,
    store,
    call: async (method, url, payload) => {
      const r = await app.inject({ method, url, payload });
      return { status: r.statusCode, body: JSON.parse(r.body) };
    },
  };
}
test("Lesson gate, frozen attempts, resume and assessment hint restrictions", async () => {
  const { app, store, call } = await setup();
  assert.equal((await call("GET", "/api/lessons/2")).status, 403);
  const a = (
    await call("POST", "/api/attempts", { lessonId: 1, mode: "practice" })
  ).body;
  const b = (
    await call("POST", "/api/attempts", { lessonId: 1, mode: "practice" })
  ).body;
  assert.equal(a.id, b.id);
  assert.equal(store.getState().energy, 25);
  assert.ok(a.questions.every((q) => !q.answerId));
  const exam = (
    await call("POST", "/api/attempts", { lessonId: 1, mode: "assessment" })
  ).body;
  assert.equal(
    (await call("POST", "/api/tutor", { question: "Help", lessonId: 1 }))
      .status,
    403,
  );
  assert.equal((await call("GET", "/api/solutions/add")).status, 403);
  assert.equal(
    (
      await call("POST", `/api/attempts/${exam.id}/answer`, {
        questionId: exam.questions[0].id,
        optionId: exam.questions[0].options[0].id,
      })
    ).status,
    403,
  );
  await app.close();
});
test("Real API stores drafts, unlocks only with knowledge plus code and awards once", async () => {
  const { app, store, call } = await setup();
  const a = (
    await call("POST", "/api/attempts", { lessonId: 1, mode: "assessment" })
  ).body;
  const privateA = store.get("attempts", a.id),
    answers = Object.fromEntries(
      privateA.questions.map((q) => [q.id, q.answerId]),
    );
  await call("PATCH", `/api/attempts/${a.id}`, {
    answers,
    codeDrafts: {
      add: { python: 'def solve(data): return data["a"]+data["b"]' },
    },
  });
  assert.equal(
    store.get("attempts", a.id).codeDrafts.add.python,
    'def solve(data): return data["a"]+data["b"]',
  );
  const j = (
    await call("POST", `/api/attempts/${a.id}/code`, {
      problemId: "add",
      language: "python",
      code: "fixture",
    })
  ).body;
  for (let i = 0; i < 20; i++) {
    const job = store.get("jobs", j.jobId);
    if (job.status === "completed") break;
    await new Promise((r) => setTimeout(r, 5));
  }
  const result = (await call("POST", `/api/attempts/${a.id}/submit`, {})).body;
  assert.ok(result.passed);
  assert.equal(store.getState().xp, 50);
  await call("POST", `/api/attempts/${a.id}/submit`, {});
  assert.equal(store.getState().xp, 50);
  assert.equal((await call("GET", "/api/lessons/2")).status, 200);
  const retry = (
    await call("POST", "/api/attempts", {
      lessonId: 1,
      mode: "assessment",
      retake: true,
    })
  ).body;
  assert.notEqual(retry.id, a.id);
  assert.equal(
    (
      await call("POST", `/api/attempts/${retry.id}/code`, {
        problemId: "knapsack",
        language: "python",
        code: "x",
      })
    ).status,
    400,
  );
  await app.close();
});
test("Infrastructure failures cannot produce an official fail", async () => {
  const { app, store, call } = await setup(async () => ({
    status: "infrastructure_error",
    message: "Docker missing",
  }));
  const a = (
    await call("POST", "/api/attempts", { lessonId: 1, mode: "assessment" })
  ).body;
  const privateA = store.get("attempts", a.id);
  await call("PATCH", `/api/attempts/${a.id}`, {
    answers: Object.fromEntries(
      privateA.questions.map((q) => [q.id, q.answerId]),
    ),
  });
  const job = (
    await call("POST", `/api/attempts/${a.id}/code`, {
      problemId: "add",
      language: "python",
      code: "fixture",
    })
  ).body;
  for (let i = 0; i < 20; i++) {
    if (store.get("jobs", job.jobId).status === "error") break;
    await new Promise((r) => setTimeout(r, 5));
  }
  assert.equal(
    (await call("POST", `/api/attempts/${a.id}/submit`, {})).status,
    409,
  );
  assert.equal(store.get("attempts", a.id).status, "active");
  assert.equal(store.getState().xp, 0);
  await app.close();
});
test("A code pass belongs to the submitted source; edits and backup restore preserve the correct association", async () => {
  const { app, store, call } = await setup();
  const a = (
    await call("POST", "/api/attempts", { lessonId: 1, mode: "assessment" })
  ).body;
  const submit = async (language, code) => {
    const j = (
      await call("POST", `/api/attempts/${a.id}/code`, {
        problemId: "add",
        language,
        code,
      })
    ).body;
    for (let i = 0; i < 20; i++) {
      if (store.get("jobs", j.jobId).status === "completed") break;
      await new Promise((r) => setTimeout(r, 5));
    }
  };
  await submit("python", "accepted-source");
  assert.deepEqual(store.get("attempts", a.id).codesPassed, ["add"]);
  const backup = (await call("GET", "/api/data/export")).body;
  assert.equal((await call("POST", "/api/data/import", backup)).status, 200);
  assert.deepEqual(store.get("attempts", a.id).codesPassed, ["add"]);
  await call("PATCH", `/api/attempts/${a.id}`, {
    codeDrafts: { add: { python: "edited-source" } },
  });
  assert.deepEqual(store.get("attempts", a.id).codesPassed, []);
  await submit("cpp", "accepted-cpp");
  await call("PATCH", `/api/attempts/${a.id}`, {
    codeDrafts: { add: { python: "another-python" } },
  });
  assert.deepEqual(store.get("attempts", a.id).codesPassed, ["add"]);
  await app.close();
});
test("Review restores energy, enforces daily reward cap and does not unlock lessons", async () => {
  const { app, store, call } = await setup();
  for (let i = 0; i < 7; i++) {
    const a = (
      await call("POST", "/api/attempts", {
        lessonId: 1,
        mode: "review",
        retake: true,
      })
    ).body;
    const p = store.get("attempts", a.id);
    await call("PATCH", `/api/attempts/${a.id}`, {
      answers: Object.fromEntries(p.questions.map((q) => [q.id, q.answerId])),
    });
    assert.ok(
      (await call("POST", `/api/attempts/${a.id}/submit`, {})).body.passed,
    );
  }
  assert.equal(store.getState().xp, 50);
  assert.equal(store.getState().energy, 30);
  assert.equal((await call("GET", "/api/lessons/2")).status, 403);
  await app.close();
});
test("Export/import retains reward idempotency; malformed import rolls back", async () => {
  const { app, store, call } = await setup();
  let s = store.getState();
  s.profile.name = "QA";
  s.gems = 123;
  store.putState(s);
  const backup = (await call("GET", "/api/data/export")).body;
  s.gems = 0;
  store.putState(s);
  assert.equal((await call("POST", "/api/data/import", backup)).status, 200);
  assert.equal(store.getState().gems, 123);
  assert.equal(
    (await call("POST", "/api/data/import", { version: 999 })).status,
    400,
  );
  assert.equal(store.getState().gems, 123);
  await app.close();
});
test("Foreign browser origins and unknown image paths cannot access local data", async () => {
  const { app, call } = await setup();
  const r = await app.inject({
    url: "/api/state",
    headers: { origin: "https://example.com" },
  });
  assert.equal(r.statusCode, 403);
  assert.equal((await call("GET", "/sources/not-real.jpg")).status, 404);
  assert.equal((await call("GET", "/api/not-real")).status, 404);
  await app.close();
});
