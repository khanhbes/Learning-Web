import test from "node:test";
import assert from "node:assert/strict";
import {
  problems,
  testsFor,
  checkOutput,
  generateInput,
  LEGACY_VERSION,
  VERSION,
} from "../content/problems.mjs";
import { edgeInputs, stressInput } from "../content/fixtures.mjs";
import { lessons, lessonMaterial, units } from "../content/curriculum.mjs";
import { readableGuides } from "../content/guides-v2.mjs";
import { traceFor } from "../shared/traces.mjs";
import { createLab, checkLab, publicLab } from "../content/labs.mjs";
import { createStore } from "../server/store.mjs";
import { createApp } from "../server/index.mjs";
import { initialPlayground, playgroundStep } from "../shared/playground.mjs";
import { awardChapters, quests } from "../server/game.mjs";
import { readFileSync } from "node:fs";
import { course } from "../content/curriculum.mjs";
import { validateContent } from "../content/schema.mjs";

test("Content schemas reject broken sources, prerequisites, code references and duplicate lessons", () => {
  const data = {
    course,
    lessons,
    problems,
    sources: JSON.parse(
      readFileSync(new URL("../content/sources.json", import.meta.url), "utf8"),
    ),
  };
  assert.deepEqual(validateContent(data), {
    lessons: 60,
    problems: 61,
    sources: 62,
  });
  for (const mutate of [
    (d) => {
      d.lessons[0].sourcePrefixes = ["missing-source"];
    },
    (d) => {
      d.lessons[0].prerequisites = [60];
    },
    (d) => {
      d.lessons[0].problemIds = ["missing-problem"];
    },
    (d) => {
      d.lessons[1].id = d.lessons[0].id;
    },
    (d) => {
      d.lessons[0].blocks[0].code = { python: "return 1" };
    },
  ]) {
    const invalid = structuredClone(data);
    mutate(invalid);
    assert.throws(() => validateContent(invalid));
  }
});

test("Every template has authored boundaries and a bounded resource fixture; legacy seeds remain reproducible", () => {
  for (const p of Object.values(problems)) {
    assert.ok(edgeInputs(p.id).length >= 2, p.id);
    assert.ok(stressInput(p.id));
    const fresh = testsFor(p.id, "fixed");
    assert.ok(
      fresh.some((t) => t.group === "performance"),
      p.id,
    );
    assert.deepEqual(
      fresh.filter((t) => t.group === "edge").map((t) => t.input),
      edgeInputs(p.id),
    );
    for (const t of fresh)
      assert.ok(checkOutput(p.id, t.input, t.expected), p.id);
    const old = testsFor(p.id, "fixed", { version: LEGACY_VERSION });
    assert.deepEqual(
      old.slice(1, 13).map((t) => t.input),
      Array.from({ length: 12 }, (_, i) => generateInput(p.id, "fixed:" + i)),
    );
  }
});
test("All lessons have verified recall, a 55-minute itinerary and readable problem-specific guidance", () => {
  assert.deepEqual(
    Object.keys(readableGuides).sort(),
    Object.keys(problems).sort(),
  );
  for (const l of lessons) {
    const m = lessonMaterial(l);
    assert.ok(m.recall.options.includes(m.recall.answer));
    assert.equal(
      m.itinerary.reduce((n, s) => n + s.minutes, 0),
      55,
    );
  }
});
test("Eight sort traces preserve every value, including negatives and duplicates, across 200 seeds", () => {
  for (const variant of [
    "insertion",
    "bubble",
    "selection",
    "merge",
    "quick",
    "counting",
    "radix",
    "heap",
  ])
    for (let seed = 0; seed < 200; seed++) {
      const d = generateInput("sort", seed),
        t = traceFor("sort", d, { variant });
      assert.deepEqual(
        t.frames.at(-1).result,
        [...d.nums].sort((a, b) => a - b),
        variant + ":" + seed,
      );
    }
});
test("Four tree traversals have distinct correct orders while preserving depth; large trees have separated nodes", () => {
  const d = { tree: [1, 2, 3, 4, 5] },
    orders = {
      "tree-pre": [1, 2, 4, 5, 3],
      "tree-in": [4, 2, 5, 1, 3],
      "tree-post": [4, 5, 2, 3, 1],
      "tree-bfs": [1, 2, 3, 4, 5],
    };
  for (const [variant, order] of Object.entries(orders)) {
    const t = traceFor("depth", d, { variant });
    assert.equal(t.frames.at(-1).result, 3);
    assert.deepEqual(
      t.frames.findLast((f) => f.variables.order)?.variables.order,
      order,
    );
  }
  const t = traceFor("depth", {
    tree: Array.from({ length: 127 }, (_, i) => i + 1),
  });
  const x = t.frames[0].nodes.map((n) => n.x).sort((a, b) => a - b);
  for (let i = 1; i < x.length; i++) assert.ok(x[i] - x[i - 1] >= 65);
  assert.equal(t.frames.at(-1).result, 7);
});
test("Detailed tree/DP/DSU traces match oracles and N-Queens never places attacking queens", () => {
  for (const id of [
    "depth",
    "diameter",
    "invert",
    "lca",
    "same-tree",
    "codec",
    "tree-dp",
    "coin",
    "lis",
    "trie",
    "nqueens",
    "interval-dp",
    "union-find",
    "mst",
    "graph-cycle",
    "knapsack",
    "xor",
    "product",
    "difference",
    "house",
  ])
    for (let seed = 0; seed < 200; seed++) {
      const d = generateInput(id, seed),
        t = traceFor(id, d);
      assert.ok(checkOutput(id, d, t.frames.at(-1).result), id + ":" + seed);
      if (id === "nqueens")
        for (const f of t.frames) {
          const cells =
            f.grid?.flatMap((row, r) =>
              row.flatMap((v, c) => (v === "♛" ? [[r, c]] : [])),
            ) ?? [];
          for (let i = 0; i < cells.length; i++)
            for (let j = 0; j < i; j++) {
              assert.notEqual(cells[i][1], cells[j][1]);
              assert.notEqual(
                Math.abs(cells[i][0] - cells[j][0]),
                Math.abs(cells[i][1] - cells[j][1]),
              );
            }
        }
    }
});
test("Hands-on exercises are frozen, hide answers and accept valid outputs for 200 seeds per teaching lesson", () => {
  for (const lesson of lessons.filter((l) => l.kind !== "exam"))
    for (let seed = 0; seed < 200; seed++) {
      const lab = createLab(lesson, String(seed));
      assert.deepEqual(lab, createLab(lesson, String(seed)));
      assert.equal(lab.questions.length, 4);
      assert.ok(
        publicLab(lab).questions.every(
          (q) => !("answer" in q) && !("explanation" in q),
        ),
      );
      for (const q of lab.questions) {
        assert.ok(
          checkLab(
            q,
            q.kind === "output" ? JSON.stringify(q.answer) : q.answer,
          ),
          lesson.id + ":" + q.id,
        );
        assert.ok(
          !checkLab(
            q,
            q.kind === "match" ? {} : q.kind === "order" ? [] : "not-valid",
          ),
        );
      }
    }
});
test("Circular queue wraparound, full/empty distinction, stack and XOR transitions are correct", () => {
  let s = initialPlayground();
  for (const value of [1, 2, 3, 4])
    s = playgroundStep(s, { type: "push", value });
  assert.equal(s.size, 4);
  assert.equal(playgroundStep(s, { type: "push", value: 9 }).size, 4);
  for (let i = 0; i < 2; i++)
    s = playgroundStep(s, { type: "pop", mode: "queue" });
  for (const value of [5, 6]) s = playgroundStep(s, { type: "push", value });
  assert.deepEqual(s.values, [3, 4, 5, 6]);
  assert.deepEqual(s.slots, [5, 6, 3, 4]);
  let stack = initialPlayground();
  for (const value of [1, 2, 3])
    stack = playgroundStep(stack, { type: "push", value });
  stack = playgroundStep(stack, { type: "pop", mode: "stack" });
  assert.deepEqual(stack.values, [1, 2]);
  const bits = playgroundStep(
    playgroundStep(initialPlayground(), { type: "bit", index: 2 }),
    { type: "bit", index: 2 },
  );
  assert.equal(bits.bits, 13);
});
test("Labs autosave and resume, award daily credit once, never unlock or add academic points; jobs keep private fixtures", async () => {
  const store = createStore(":memory:");
  const app = await createApp({
    store,
    execute: async () => ({
      status: "accepted",
      checks: [{ group: "edge", passed: true }],
    }),
    config: { cloud: false, aiProvider: "off" },
  });
  const call = async (method, url, payload) => {
    const r = await app.inject({ method, url, payload });
    assert.equal(r.statusCode, 200, r.body);
    return r.json();
  };
  const a = await call("POST", "/api/attempts", {
    lessonId: 1,
    mode: "practice",
  });
  const raw = store.get("attempts", a.id);
  const q = raw.lab.questions[0];
  await call("PATCH", "/api/attempts/" + a.id, {
    labDrafts: { order: q.answer },
    labCursor: 2,
    learningCursor: { phase: "practice", block: 2 },
  });
  const resumed = await call("POST", "/api/attempts", {
    lessonId: 1,
    mode: "practice",
  });
  assert.deepEqual(resumed.lab.drafts.order, q.answer);
  assert.equal(resumed.learningCursor.phase, "practice");
  assert.equal(resumed.lab.cursor, 2);
  for (const value of [q.answer, [], q.answer])
    await call("POST", `/api/attempts/${a.id}/lab`, {
      questionId: q.id,
      value,
    });
  assert.equal(Object.values(store.getState().daily)[0].labCompletions, 1);
  assert.equal(store.getState().xp, 0);
  assert.deepEqual(store.getState().progress, {});
  assert.match(quests(store.getState()).at(-1).title, /tương tác/);
  const job = await call("POST", `/api/attempts/${a.id}/code`, {
    problemId: "add",
    language: "python",
    code: "def solve(data): return 1",
  });
  for (
    let i = 0;
    i < 10 && store.get("jobs", job.jobId).status !== "completed";
    i++
  )
    await new Promise((r) => setTimeout(r, 5));
  assert.ok(
    store.get("jobs", job.jobId).fixtures.some((t) => t.group === "edge"),
  );
  const publicJob = await call("GET", "/api/jobs/" + job.jobId);
  assert.ok(!("fixtures" in publicJob));
  assert.equal(publicJob.version, VERSION);
  const assessment = await call("POST", "/api/attempts", {
    lessonId: 1,
    mode: "assessment",
  });
  assert.equal(assessment.lab, null);
  assert.equal(
    (
      await app.inject({
        method: "POST",
        url: `/api/attempts/${assessment.id}/lab`,
        payload: { questionId: "order", value: [] },
      })
    ).statusCode,
    403,
  );
  await app.close();
});
test("Chapter, debugging and boundary badges require real milestones and do not duplicate", async () => {
  const store = createStore(":memory:");
  let executions = 0;
  const app = await createApp({
    store,
    config: { cloud: false, aiProvider: "off" },
    execute: async () =>
      ++executions === 1
        ? { status: "rejected", checks: [{ group: "edge", passed: false }] }
        : { status: "accepted", checks: [{ group: "edge", passed: true }] },
  });
  const a = (
    await app.inject({
      method: "POST",
      url: "/api/attempts",
      payload: { lessonId: 1, mode: "practice" },
    })
  ).json();
  for (const code of ["wrong", "fixed"]) {
    const { jobId } = (
      await app.inject({
        method: "POST",
        url: `/api/attempts/${a.id}/code`,
        payload: { problemId: "add", language: "python", code },
      })
    ).json();
    for (
      let i = 0;
      i < 30 && store.get("jobs", jobId).status !== "completed";
      i++
    )
      await new Promise((r) => setTimeout(r, 5));
  }
  const s = store.getState();
  assert.ok(s.badges.includes("debugger"));
  assert.ok(s.badges.includes("edge-master"));
  assert.ok(!s.badges.includes("chapter-1"));
  for (let i = 1; i <= 5; i++) s.progress[i] = { passed: true };
  awardChapters(s, units);
  awardChapters(s, units);
  assert.equal(s.badges.filter((id) => id === "chapter-1").length, 1);
  await app.close();
});
