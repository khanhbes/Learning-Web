import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { configuration } from "../server/config.mjs";
import { createApp } from "../server/index.mjs";
import { wasmHealth } from "../server/wasm-runner.mjs";

export function validateTunnelState(state) {
  if (!/^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/.test(state.origin ?? ""))
    throw new Error("Invalid Quick Tunnel origin.");
  if (
    typeof state.password !== "string" ||
    state.password.length < 12 ||
    state.password.length > 256
  )
    throw new Error(
      "A private login password is required before exposing BytePath.",
    );
  if (
    ![".data/bytepath.sqlite", ".data/public/tunnel-qa.sqlite", ".data/public/online.sqlite"].includes(
      state.db,
    )
  )
    throw new Error("Unexpected database path.");
  return state;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const state = validateTunnelState(
    JSON.parse(readFileSync(".data/public/state.json", "utf8").replace(/^\uFEFF/, "")),
  );
  Object.assign(process.env, {
    BYTEPATH_MODE: "cloud",
    BYTEPATH_PUBLIC_ORIGIN: state.origin,
    BYTEPATH_PASSWORD: state.password,
    BYTEPATH_DB: state.db,
    BYTEPATH_RUNNER: "wasm",
    SERVER_PORT: "3002",
    PORT: "3002",
  });
  if (!(await wasmHealth()).available)
    throw new Error(
      "Prepare the runner with npm run runner:setup before opening the tunnel.",
    );
  const app = await createApp({ config: configuration(), log: true });
  await app.listen({ host: "127.0.0.1", port: 3002 });
  console.log("BytePath public ready: " + state.origin);
  for (const signal of ["SIGINT", "SIGTERM"])
    process.once(signal, async () => {
      await app.close();
      process.exit(0);
    });
}
