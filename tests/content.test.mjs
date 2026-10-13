import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { lessons, packs, topicQuestions } from "../content/curriculum.mjs";
import {
  problems,
  interviewIds,
  oracle,
  checkOutput,
  generateInput,
} from "../content/problems.mjs";
import { solution } from "../content/solutions.mjs";
import { traceFor } from "../shared/traces.mjs";
import {
  generateQuestions,
  scoreAttempt,
  publicAttempt,
} from "../server/assessment.mjs";
test("62 source images are mapped and their checksums are correct", () => {
  const sources = JSON.parse(readFileSync("content/sources.json"));
  assert.equal(sources.length, 62);
  assert.equal(new Set(sources.map((s) => s.file)).size, 62);
  for (const s of sources)
    assert.equal(
      s.sha256,
      createHash("sha256")
        .update(readFileSync("DSA/" + s.file))
        .digest("hex"),
    );
});
test("Curriculum includes 44 lessons, 4 exams, 12 optional lessons and all 30 interview tasks", () => {
  assert.equal(lessons.length, 60);
  assert.equal(
    lessons.slice(0, 48).filter((l) => l.kind === "lesson").length,
    44,
  );
  assert.deepEqual(
    lessons.filter((l) => l.kind === "exam").map((l) => l.id),
    [13, 26, 38, 48],
  );
  assert.equal(interviewIds.length, 30);
  for (const id of interviewIds)
    assert.ok(
      lessons.some((l) => l.problemIds.includes(id)),
      id,
    );
  for (const l of lessons) {
    assert.ok(l.blocks.every((b) => b.text));
    assert.equal(topicQuestions[l.pack].length, 5);
    for (const pid of l.problemIds) assert.ok(problems[pid]);
  }
});
test("Every authored sample matches its oracle and both references exist", () => {
  for (const p of Object.values(problems)) {
    assert.ok(checkOutput(p.id, p.sampleInput, p.sampleOutput), p.id);
    assert.ok(solution(p.id, "python"));
    assert.ok(solution(p.id, "cpp"));
  }
});
test("200 seeds per template produce checkable deterministic answers", () => {
  for (const p of Object.values(problems))
    for (let seed = 0; seed < 200; seed++) {
      const d = generateInput(p.id, seed);
      assert.deepEqual(d, generateInput(p.id, seed));
      assert.ok(checkOutput(p.id, d, oracle(p.id, d)), p.id + " " + seed);
    }
});
test("Source correction regressions", () => {
  assert.equal(
    oracle("islands", {
      grid: [
        [1, 1, 0, 0, 0],
        [1, 0, 0, 0, 1],
        [0, 0, 1, 1, 0],
        [0, 0, 0, 0, 1],
      ],
    }),
    4,
  );
  assert.equal(oracle("diameter", { tree: [1, 2, 3, 4, 5, null, 6, 7] }), 5);
  assert.deepEqual(
    oracle("shortest", {
      n: 5,
      edges: [
        [0, 1, 4],
        [0, 2, 1],
        [1, 2, 2],
        [1, 3, 2],
        [2, 3, 5],
        [2, 4, 4],
      ],
      start: 0,
    }),
    [0, 4, 1, 6, 5],
  );
});
test("Checkers accept valid alternatives and reject illegal outputs", () => {
  const d = { nums: [1, 2, 3, 4], target: 5 };
  assert.ok(checkOutput("two-sum", d, [3, 0]));
  assert.ok(checkOutput("two-sum", d, [1, 2]));
  assert.ok(!checkOutput("two-sum", d, [1, 1]));
  const t = {
    n: 4,
    edges: [
      [0, 1],
      [0, 2],
      [2, 3],
    ],
  };
  assert.ok(checkOutput("topo", t, [0, 2, 3, 1]));
  assert.ok(!checkOutput("topo", t, [3, 2, 1, 0]));
  assert.ok(!checkOutput("topo", t, [0, 1, 2, 2]));
  assert.ok(checkOutput("binary", { nums: [1, 2, 2, 3], target: 2 }, 2));
  assert.ok(
    checkOutput("three-sum", { nums: [-1, 0, 1, 2, -1, -4] }, [
      [1, 0, -1],
      [2, -1, -1],
    ]),
  );
  assert.ok(
    !checkOutput("three-sum", { nums: [-1, 0, 1] }, [
      [-1, 0, 1],
      [-1, 0, 1],
    ]),
  );
});
test("Small domains are checked against independent brute force", () => {
  const arrays = [[]];
  for (let n = 1; n <= 5; n++)
    for (let mask = 0; mask < 3 ** n; mask++) {
      let x = mask,
        a = [];
      for (let i = 0; i < n; i++) {
        a.push((x % 3) - 1);
        x = Math.floor(x / 3);
      }
      arrays.push(a);
    }
  for (const nums of arrays) {
    assert.equal(
      oracle("sum", { nums }),
      nums.reduce((s, x) => s + x, 0),
    );
    for (let target = -2; target <= 2; target++) {
      let possible = false;
      for (let i = 0; i < nums.length; i++)
        for (let j = i + 1; j < nums.length; j++)
          if (nums[i] + nums[j] === target) possible = true;
      assert.equal(oracle("two-sum", { nums, target }).length > 0, possible);
    }
    if (nums.length) {
      let best = -Infinity;
      for (let i = 0; i < nums.length; i++)
        for (let j = i; j < nums.length; j++)
          best = Math.max(
            best,
            nums.slice(i, j + 1).reduce((s, x) => s + x, 0),
          );
      assert.equal(oracle("kadane", { nums }), best);
    }
    assert.deepEqual(
      oracle("product", { nums }),
      nums.map((_, i) => nums.reduce((p, v, j) => (j === i ? p : p * v), 1)),
    );
  }
});
test("Knapsack and shortest-path oracles agree with independent exhaustive/Floyd checks", () => {
  for (let i = 0; i < 200; i++) {
    let d = generateInput("knapsack", i),
      best = 0;
    for (let mask = 0; mask < 2 ** d.weights.length; mask++) {
      let w = 0,
        v = 0;
      for (let j = 0; j < d.weights.length; j++)
        if (mask & (1 << j)) {
          w += d.weights[j];
          v += d.values[j];
        }
      if (w <= d.capacity) best = Math.max(best, v);
    }
    assert.equal(oracle("knapsack", d), best);
    const g = generateInput("shortest", i),
      dist = Array.from({ length: g.n }, (_, x) =>
        Array.from({ length: g.n }, (_, y) => (x === y ? 0 : Infinity)),
      );
    for (let [u, v, w] of g.edges) dist[u][v] = w;
    for (let k = 0; k < g.n; k++)
      for (let u = 0; u < g.n; u++)
        for (let v = 0; v < g.n; v++)
          dist[u][v] = Math.min(dist[u][v], dist[u][k] + dist[k][v]);
    assert.deepEqual(
      oracle("shortest", g),
      dist[g.start].map((x) => (Number.isFinite(x) ? x : -1)),
    );
  }
});
test("Question seeds freeze shuffled answers and do not reveal answers before submit", () => {
  for (const lesson of lessons) {
    const q = generateQuestions(lesson, "assessment", "x");
    assert.deepEqual(q, generateQuestions(lesson, "assessment", "x"));
    assert.notDeepEqual(q, generateQuestions(lesson, "assessment", "y"));
    assert.equal(q.length, lesson.kind === "exam" ? 10 : 5);
    for (const row of q) {
      assert.equal(new Set(row.options.map((o) => o.text)).size, 3);
      assert.ok(row.options.some((o) => o.id === row.answerId));
    }
    const a = { status: "active", questions: q };
    assert.ok(publicAttempt(a).questions.every((q) => !("answerId" in q)));
  }
});
test("80% plus code is required; scores cannot compensate for failed code", () => {
  const q = generateQuestions(lessons[0], "assessment", "boundary");
  const a = {
    questions: q,
    answers: Object.fromEntries(q.slice(0, 4).map((q) => [q.id, q.answerId])),
    requiredProblems: ["add"],
    codesPassed: ["add"],
  };
  assert.equal(scoreAttempt(a).knowledge, 80);
  assert.ok(scoreAttempt(a).passed);
  a.codesPassed = [];
  assert.ok(!scoreAttempt(a).passed);
  a.codesPassed = ["add"];
  delete a.answers[q[3].id];
  assert.equal(scoreAttempt(a).knowledge, 60);
  assert.ok(!scoreAttempt(a).passed);
});
test("Trace distractors cannot themselves be valid alternative answers", () => {
  for (const lesson of lessons)
    for (let seed = 0; seed < 200; seed++)
      for (const q of generateQuestions(
        lesson,
        "assessment",
        "unique-" + seed,
      )) {
        if (!q.problemId) continue;
        for (const option of q.options) {
          let value;
          try {
            value = JSON.parse(option.text);
          } catch {
            continue;
          }
          assert.equal(
            checkOutput(q.problemId, q.input, value),
            option.id === q.answerId,
            lesson.id + ":" + q.problemId + ":" + option.text,
          );
        }
      }
});
test("Every teaching trace ends with the verified result; stock and heap intermediate states are correct", () => {
  for (const p of Object.values(problems))
    for (let seed = 0; seed < 20; seed++) {
      const input = generateInput(p.id, seed),
        trace = traceFor(p.id, input);
      assert.ok(checkOutput(p.id, input, trace.frames.at(-1).result), p.id);
    }
  const stock = traceFor("stock", { prices: [7, 1, 5, 3, 6, 4] });
  assert.equal(
    stock.frames.filter((f) => f.variables.best !== undefined).at(-1).variables
      .best,
    5,
  );
  for (const frame of traceFor("top-k", { nums: [3, 2, 1, 5, 6, 4], k: 2 })
    .frames) {
    const heap = frame.secondary;
    if (
      !heap ||
      frame.caption.startsWith("Thêm") ||
      frame.caption.startsWith("Đưa")
    )
      continue;
    // Sift operations are observable transitions; only the final result claims a complete heap.
    if (frame.caption.startsWith("Bỏ giá trị"))
      for (let i = 1; i < heap.length; i++)
        assert.ok(heap[(i - 1) >> 1] <= heap[i]);
  }
});
test("Window maximum agrees with independent exhaustive slices", () => {
  for (let seed = 0; seed < 200; seed++) {
    const d = generateInput("window-max", seed);
    const expected = Array.from({ length: d.nums.length - d.k + 1 }, (_, i) =>
      Math.max(...d.nums.slice(i, i + d.k)),
    );
    assert.deepEqual(oracle("window-max", d), expected);
  }
});
