import test from "node:test";
import assert from "node:assert/strict";
import { validateTunnelState } from "../scripts/tunnel-server.mjs";
test("Public setup requires an exact HTTPS tunnel origin, a private password and a known local database", () => {
  const valid = {
    origin: "https://bytepath-demo.trycloudflare.com",
    password: "test-password-long-enough",
    db: ".data/bytepath.sqlite",
  };
  assert.equal(validateTunnelState(valid), valid);
  for (const changes of [
    { origin: "http://bytepath-demo.trycloudflare.com" },
    { origin: "https://bytepath-demo.trycloudflare.com.attacker.example" },
    { origin: "https://bytepath-demo.trycloudflare.com/path" },
    { password: "" },
    { password: "short" },
    { db: "../../personal.sqlite" },
    { publicOrigin: "https://bytepath.example.workers.dev.attacker.example" },
    { publicOrigin: "https://bytepath.example.workers.dev/path" },
  ])
    assert.throws(() => validateTunnelState({ ...valid, ...changes }));
  assert.doesNotThrow(() =>
    validateTunnelState({ ...valid, db: ".data/public/tunnel-qa.sqlite" }),
  );
  assert.doesNotThrow(() =>
    validateTunnelState({ ...valid, db: ".data/public/online.sqlite" }),
  );
  assert.doesNotThrow(() =>
    validateTunnelState({ ...valid, password: "example09" }),
  );
  assert.doesNotThrow(() =>
    validateTunnelState({
      ...valid,
      publicOrigin: "https://bytepath.example.workers.dev",
    }),
  );
});
