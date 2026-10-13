import test from "node:test";
import assert from "node:assert/strict";
import { startCloud } from "../scripts/cloud-start.mjs";
const config = {
  cloud: true,
  origin: "https://bytepath.example",
  host: "0.0.0.0",
  port: 8080,
};
test("Cloud startup refuses local configuration and missing frontend before opening a server", async () => {
  let touched = false;
  const appFactory = async () => {
    touched = true;
    throw Error("Should not open");
  };
  await assert.rejects(
    startCloud({ config: { cloud: false }, appFactory }),
    /BYTEPATH_MODE/,
  );
  await assert.rejects(
    startCloud({ config, buildReady: () => false, appFactory }),
    /botkeep-deploy/,
  );
  assert.equal(touched, false);
});
test("First cloud start prepares runtime once; subsequent start keeps the existing verified runtime", async () => {
  let ready = false,
    prepared = 0;
  const app = {
    listen: async (options) =>
      assert.deepEqual(options, { host: "0.0.0.0", port: 8080 }),
  };
  const options = {
    config,
    buildReady: () => true,
    health: async () => ({ available: ready }),
    prepare: async () => {
      prepared++;
      ready = true;
    },
    appFactory: async () => app,
  };
  assert.equal(await startCloud(options), app);
  assert.equal(await startCloud(options), app);
  assert.equal(prepared, 1);
});
test("Missing compiler or failed runtime download prevents readiness and cannot open the grading server", async () => {
  let opened = false;
  const options = {
    config,
    buildReady: () => true,
    health: async () => ({ available: false }),
    appFactory: async () => {
      opened = true;
    },
  };
  await assert.rejects(
    startCloud({
      ...options,
      prepare: async () => {
        throw Error("Download unavailable");
      },
    }),
    /Download unavailable/,
  );
  await assert.rejects(
    startCloud({ ...options, prepare: async () => {} }),
    /Runner is unavailable/,
  );
  assert.equal(opened, false);
});
