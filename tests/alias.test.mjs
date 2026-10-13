import test from "node:test";
import assert from "node:assert/strict";
import worker, { proxy } from "../cloudflare/alias-worker.mjs";
import { createApp } from "../server/index.mjs";
import { createStore } from "../server/store.mjs";
const env = {
  UPSTREAM: "https://demo.trycloudflare.com",
  PUBLIC_ORIGIN: "https://bytepath.example.workers.dev",
};
test("Worker entry point accepts the Cloudflare execution context", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response("BytePath"));
  const response = await worker.fetch(new Request(env.PUBLIC_ORIGIN), env, {
    waitUntil() {},
  });
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "BytePath");
});
test("Alias preserves POST body and session cookie, blocks foreign origins and disables private caching", async () => {
  let captured;
  const result = await proxy(
    new Request(env.PUBLIC_ORIGIN + "/api/auth/login?x=1", {
      method: "POST",
      headers: {
        Origin: env.PUBLIC_ORIGIN,
        Cookie: "test-session=fixture",
        "Content-Type": "application/json",
      },
      body: '{"password":"example09"}',
    }),
    env,
    async (request) => {
      captured = {
        url: request.url,
        body: await request.text(),
        cookie: request.headers.get("Cookie"),
        origin: request.headers.get("Origin"),
      };
      return new Response('{"ok":true}', {
        headers: {
          "Set-Cookie":
            "__Host-bytepath=fixture; Path=/; HttpOnly; Secure; SameSite=Strict",
        },
      });
    },
  );
  assert.deepEqual(captured, {
    url: env.UPSTREAM + "/api/auth/login?x=1",
    body: '{"password":"example09"}',
    cookie: "test-session=fixture",
    origin: env.PUBLIC_ORIGIN,
  });
  assert.ok(result.headers.get("Set-Cookie").includes("HttpOnly"));
  assert.equal(result.headers.get("Cache-Control"), "private, no-store");
  const blocked = await proxy(
    new Request(env.PUBLIC_ORIGIN + "/api/auth/login", {
      headers: { Origin: "https://untrusted.example" },
    }),
    env,
    () => {
      throw Error("Must not call upstream");
    },
  );
  assert.equal(blocked.status, 403);
  assert.equal(
    (
      await proxy(
        new Request(env.PUBLIC_ORIGIN),
        { ...env, UPSTREAM: "http://127.0.0.1:3001" },
        () => {},
      )
    ).status,
    503,
  );
  const offline = await proxy(new Request(env.PUBLIC_ORIGIN), env, () => {
    throw Error("Offline");
  });
  assert.equal(offline.status, 503);
});
test("Worker origin remains password protected and all other origins are denied", async () => {
  const store = createStore(":memory:");
  const app = await createApp({
    store,
    config: {
      cloud: true,
      origin: env.UPSTREAM,
      additionalOrigins: [env.PUBLIC_ORIGIN],
      password: "example09",
      aiProvider: "off",
    },
    health: async () => ({ available: false }),
    aiHealth: async () => ({ available: false }),
  });
  assert.equal(
    (
      await app.inject({
        url: "/api/state",
        headers: { Origin: env.PUBLIC_ORIGIN },
      })
    ).statusCode,
    401,
  );
  const signed = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    headers: { Origin: env.PUBLIC_ORIGIN },
    payload: { password: "example09" },
  });
  assert.equal(signed.statusCode, 200);
  const cookie = signed.headers["set-cookie"].split(";")[0];
  assert.equal(
    (
      await app.inject({
        url: "/api/state",
        headers: { Origin: env.PUBLIC_ORIGIN, Cookie: cookie },
      })
    ).statusCode,
    200,
  );
  assert.equal(
    (
      await app.inject({
        url: "/api/state",
        headers: { Origin: "https://untrusted.example", Cookie: cookie },
      })
    ).statusCode,
    403,
  );
  await app.close();
});
