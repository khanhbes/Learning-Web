import test from "node:test";
import assert from "node:assert/strict";
import { initialState, createStore } from "../server/store.mjs";
import {
  dayKey,
  weekKey,
  dayTime,
  refreshGame,
  recordXP,
  purchase,
  shop,
  leagueRows,
  botPoints,
  chestReward,
  quests,
} from "../server/game.mjs";
import {
  createCapstone,
  gradeCapstone,
  customTestScore,
} from "../server/capstone.mjs";
test("Vietnamese calendar boundaries do not depend on host timezone", () => {
  assert.equal(dayKey(Date.parse("2026-10-12T16:59:59Z")), "2026-10-12");
  assert.equal(dayKey(Date.parse("2026-10-12T17:00:00Z")), "2026-10-13");
  assert.equal(weekKey(Date.parse("2026-10-11T17:00:00Z")), "2026-10-12");
});
test("Energy regeneration, gems and item limits are enforced", () => {
  const now = dayTime("2026-10-12"),
    s = initialState(now);
  s.energy = 5;
  refreshGame(s, now + 1800000);
  assert.equal(s.energy, 8);
  refreshGame(s, now + 1800000);
  assert.equal(s.energy, 8);
  s.gems = 100;
  purchase(s, shop[0]);
  assert.equal(s.energy, 23);
  assert.equal(s.gems, 80);
  purchase(s, shop[0]);
  assert.equal(s.energy, 30);
  assert.throws(() => purchase(s, shop[0]));
  s.gems = 100;
  purchase(s, shop[1]);
  purchase(s, shop[1]);
  s.gems = 100;
  assert.throws(() => purchase(s, shop[1]));
});
test("Streak freezes preserve missed days but never award XP", () => {
  const s = initialState(dayTime("2026-10-12"));
  recordXP(s, 20, dayTime("2026-10-12") + 1000);
  assert.equal(s.streak, 1);
  recordXP(s, 50, dayTime("2026-10-12") + 2000);
  assert.equal(s.streak, 1);
  s.freeze = 1;
  refreshGame(s, dayTime("2026-10-14"));
  assert.equal(s.freeze, 0);
  assert.equal(s.streak, 1);
  recordXP(s, 20, dayTime("2026-10-14"));
  assert.equal(s.streak, 2);
  refreshGame(s, dayTime("2026-10-17"));
  assert.equal(s.streak, 0);
});
test("19 bots and one learner have deterministic, monotonic weekly scores", () => {
  const week = "2026-10-12",
    s = initialState(dayTime(week));
  s.profile.name = "QA";
  for (let hour = 1; hour <= 168; hour += 7) {
    const a = leagueRows(s, dayTime(week) + hour * 3600000, week);
    assert.equal(a.length, 20);
    assert.equal(a.filter((r) => r.isBot).length, 19);
    assert.deepEqual(a, leagueRows(s, dayTime(week) + hour * 3600000, week));
    for (let i = 0; i < 19; i++)
      assert.ok(
        botPoints(week, dayTime(week) + hour * 3600000, i) >=
          botPoints(week, dayTime(week) + (hour - 1) * 3600000, i),
      );
  }
});
test("Weekly promotion and demotion are settled once", () => {
  const s = initialState(dayTime("2026-10-12"));
  refreshGame(s, dayTime("2026-10-12"));
  s.daily["2026-10-12"].xp = 99999;
  refreshGame(s, dayTime("2026-10-19"));
  assert.equal(s.league.tier, 1);
  refreshGame(s, dayTime("2026-10-19"));
  assert.equal(s.league.tier, 1);
  refreshGame(s, dayTime("2026-10-26"));
  assert.equal(s.league.tier, 0);
  assert.equal(s.league.history.length, 2);
});
test("Reward ledger prevents duplicate rewards and rolls back failures", () => {
  const store = createStore(":memory:");
  const s = store.getState();
  store.transaction(() => {
    assert.ok(store.reward(s, "test", { xp: 50, gems: 10 }));
    assert.ok(!store.reward(s, "test", { xp: 50, gems: 10 }));
    store.putState(s);
  });
  assert.equal(store.getState().xp, 50);
  assert.throws(() =>
    store.transaction(() => {
      store.reward(s, "bad", { xp: 50 });
      throw new Error("rollback");
    }),
  );
  assert.equal(store.db.prepare("SELECT COUNT(*) AS n FROM ledger").get().n, 1);
  store.close();
});
test("Capstone score uses real traces, concepts, code gates and mutation tests", () => {
  const a = createCapstone();
  assert.equal(a.questions.length, 6);
  assert.ok(a.questions.slice(2).every((q) => q.input !== undefined));
  a.answers = Object.fromEntries(a.questions.map((q) => [q.id, q.answerId]));
  a.essay = Object.fromEntries(
    Object.keys(a.essay).map((k) => [k, "Phân tích của người học."]),
  );
  a.codesPassed = ["topo", "priority", "prefix"];
  a.customTests = [
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
  ];
  assert.equal(customTestScore(a.customTests).score, 10);
  assert.equal(gradeCapstone(a).score, 100);
  assert.ok(gradeCapstone(a).passed);
  a.codesPassed.pop();
  assert.ok(!gradeCapstone(a).passed);
  a.codesPassed.push("prefix");
  a.essay.problem = "";
  assert.ok(!gradeCapstone(a).passed);
});
