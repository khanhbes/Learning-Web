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
    { db: "../../personal.sqlite" },
  ])
    assert.throws(() => validateTunnelState({ ...valid, ...changes }));
  assert.doesNotThrow(() =>
    validateTunnelState({ ...valid, db: ".data/public/tunnel-qa.sqlite" }),
  );
  assert.doesNotThrow(() => validateTunnelState({...valid,db:'.data/public/online.sqlite'}));
});
