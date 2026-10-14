import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../server/index.mjs";
import { createStore } from "../server/store.mjs";
import { configuration } from "../server/config.mjs";
import { askGemini } from "../server/gemini.mjs";
test("Gemini successful text/structured feedback and timeout remain independent of grades", async () => {
  const env = {
    GEMINI_API_KEY: "test-fixture",
    GEMINI_FREE_TIER_CONFIRMED: "1",
  };
  const lesson = {
    id: 1,
    blocks: [{ title: "Biến", text: "Tên gắn với một giá trị." }],
  };
  const response = await askGemini(
    { question: "Biến là gì?", lesson },
    {
      env,
      fetcher: async () => ({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: { parts: [{ text: "Hãy tưởng tượng một ô có nhãn." }] },
            },
          ],
        }),
      }),
    },
  );
  assert.equal(response.available, true);
  assert.equal(response.lessonId, 1);
  assert.ok(!("score" in response));
  const expected = {
    clarity: "Rõ yêu cầu.",
    consistency: "Thống nhất.",
    reasoning: "Cần giải thích tiên quyết.",
    improvements: ["Thêm test chu trình."],
  };
  const feedback = await askGemini(
    { essay: { problem: "Lập lịch học" } },
    {
      env,
      fetcher: async () => ({
        ok: true,
        json: async () => ({
          candidates: [
            { content: { parts: [{ text: JSON.stringify(expected) }] } },
          ],
        }),
      }),
    },
  );
  assert.deepEqual(feedback.feedback, expected);
  assert.ok(!("passed" in feedback));
  const timeout = await askGemini(
    { question: "Help" },
    {
      env,
      fetcher: async () => {
        throw new DOMException("Timeout", "TimeoutError");
      },
    },
  );
  assert.equal(timeout.available, false);
  assert.ok(!("score" in timeout));
});
test("Local mode binds only to loopback and supports Gemini without cloud credentials", () => {
  const config = configuration({
    BYTEPATH_MODE: "local",
    BYTEPATH_AI: "gemini",
    BYTEPATH_PASSWORD: "ignored-cloud-password",
  });
  assert.equal(config.cloud, false);
  assert.equal(config.host, "127.0.0.1");
  assert.equal(config.port, 3001);
  assert.equal(config.password, "");
  assert.equal(config.aiProvider, "gemini");
});
test("Gemini without a local API key never makes an API request", async () => {
  let calls = 0;
  const result = await askGemini(
    { question: "Giải thích biến là gì" },
    {
      env: { GEMINI_FREE_TIER_CONFIRMED: "1" },
      fetcher: () => {
        calls++;
        throw new Error("Must not call Google without a key");
      },
    },
  );
  assert.equal(result.available, false);
  assert.equal(calls, 0);
  assert.match(result.text, /Gợi ý/);
});
test("Cloud requires HTTPS/password and uses Botkeep SERVER_PORT", () => {
  assert.throws(() => configuration({ BYTEPATH_MODE: "cloud" }));
  const config = configuration({
    BYTEPATH_MODE: "cloud",
    BYTEPATH_PUBLIC_ORIGIN: "https://bytepath.example",
    BYTEPATH_PASSWORD: "long-test-password",
    SERVER_PORT: "8080",
  });
  assert.equal(config.host, "0.0.0.0");
  assert.equal(config.port, 8080);
  assert.equal(config.aiProvider, "off");
});
test("Cloud data requires secure login; sessions persist, expire and logout revokes", async () => {
  const store = createStore(":memory:");
  let now = Date.now();
  const config = {
    cloud: true,
    origin: "https://bytepath.example",
    password: "a-long-test-password",
    aiProvider: "off",
  };
  const app = await createApp({
    store,
    config,
    now: () => now,
    health: async () => ({ available: false }),
    aiHealth: async () => ({ available: false }),
  });
  const inject = (method, url, payload, cookie, origin = config.origin) =>
    app.inject({
      method,
      url,
      payload,
      headers: {
        host: "bytepath.example",
        origin,
        ...(cookie ? { cookie } : {}),
      },
    });
  assert.equal((await inject("GET", "/api/state")).statusCode, 401);
  assert.equal((await inject("POST", "/api/data/import", {})).statusCode, 401);
  assert.equal(
    (await inject("POST", "/api/auth/login", { password: "wrong" })).statusCode,
    401,
  );
  const login = await inject("POST", "/api/auth/login", {
    password: config.password,
  });
  assert.equal(login.statusCode, 200);
  assert.match(
    login.headers["set-cookie"],
    /HttpOnly; Secure; SameSite=Strict/,
  );
  const cookie = login.headers["set-cookie"].split(";")[0];
  assert.equal(
    (await inject("GET", "/api/state", undefined, cookie)).statusCode,
    200,
  );
  assert.equal(
    (
      await inject(
        "GET",
        "/api/state",
        undefined,
        cookie,
        "https://foreign.example",
      )
    ).statusCode,
    403,
  );
  assert.equal(
    (await inject("POST", "/api/auth/logout", {}, cookie)).statusCode,
    200,
  );
  assert.equal(
    (await inject("GET", "/api/state", undefined, cookie)).statusCode,
    401,
  );
  const next = (
    await inject("POST", "/api/auth/login", { password: config.password })
  ).headers["set-cookie"].split(";")[0];
  now += 8 * 86400000;
  assert.equal(
    (await inject("GET", "/api/state", undefined, next)).statusCode,
    401,
  );
  await app.close();
});
test("Gemini never falls back to a paid model; quota and malformed responses preserve grading independence", async () => {
  const env = {
    GEMINI_API_KEY: "fixture-key",
    GEMINI_FREE_TIER_CONFIRMED: "1",
    GEMINI_MODEL: "gemini-3.5-flash-lite",
  };
  let calls = 0;
  const fetcher = async (url, options) => {
    calls++;
    assert.ok(!url.includes("fixture-key"));
    assert.equal(options.headers["x-goog-api-key"], "fixture-key");
    return { ok: false, status: 429 };
  };
  const quota = await askGemini({ question: "Help" }, { env, fetcher });
  assert.ok(quota.quotaExceeded);
  assert.equal(calls, 1);
  assert.ok(!("score" in quota));
  const denied = await askGemini(
    { question: "Help" },
    { env: { ...env, GEMINI_MODEL: "gemini-pro-paid" }, fetcher },
  );
  assert.ok(!denied.available);
  assert.equal(calls, 1);
  const malformed = await askGemini(
    { essay: { problem: "Text" } },
    {
      env,
      fetcher: async () => ({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: '{"score":100}' }] } }],
        }),
      }),
    },
  );
  assert.ok(!malformed.available);
  assert.ok(!("score" in malformed));
});
test("Gemini application quota persists in SQLite and cannot alter academic progress", async () => {
  const store = createStore(":memory:");
  let calls = 0;
  const app = await createApp({
    store,
    config: { cloud: false, aiProvider: "gemini" },
    tutor: async () => {
      calls++;
      return { available: true, text: "Hint" };
    },
  });
  for (let i = 0; i < 20; i++)
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: "/api/tutor",
          payload: { lessonId: 1, question: "Help" },
        })
      ).statusCode,
      200,
    );
  assert.equal(
    (
      await app.inject({
        method: "POST",
        url: "/api/tutor",
        payload: { lessonId: 1, question: "Help" },
      })
    ).statusCode,
    429,
  );
  assert.equal(calls, 20);
  assert.deepEqual(store.getState().progress, {});
  assert.equal(store.getState().xp, 0);
  await app.close();
});
