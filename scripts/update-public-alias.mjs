import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { validateTunnelState } from "./tunnel-server.mjs";

const readJson = (path) =>
  JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
const state = validateTunnelState(readJson(".data/public/state.json"));
const workerPath = ".data/public/worker.json";
const worker = readJson(workerPath);
if (
  !/^[a-f0-9]{32}$/.test(worker.accountId ?? "") ||
  !/^[a-z0-9-]+$/.test(worker.name ?? "") ||
  !state.publicOrigin ||
  new URL(state.publicOrigin).hostname.split(".")[0] !== worker.name
)
  throw Error(
    "A valid private Worker configuration and public address are required.",
  );

if (worker.deployedUpstream === state.origin) {
  console.log("Short address is already configured: " + state.publicOrigin);
  process.exit(0);
}
const configPath = resolve(".data/public/worker.wrangler.json");
writeFileSync(
  configPath,
  JSON.stringify(
    {
      name: worker.name,
      account_id: worker.accountId,
      main: resolve("cloudflare/alias-worker.mjs"),
      compatibility_date: "2026-10-13",
      workers_dev: true,
      preview_urls: false,
      vars: { UPSTREAM: state.origin, PUBLIC_ORIGIN: state.publicOrigin },
    },
    null,
    2,
  ),
);

function wrangler(args, verifyAuth = false) {
  const command = "& npx.cmd --offline --yes wrangler " + args;
  const result = spawnSync(
    "powershell.exe",
    ["-NoProfile", "-Command", command],
    {
      stdio: verifyAuth ? ["ignore", "pipe", "pipe"] : "inherit",
      windowsHide: true,
      timeout: 180000,
    },
  );
  if (result.error || result.status !== 0) process.exit(1);
  if (verifyAuth) {
    const output = String(result.stdout) + String(result.stderr);
    if (!output.includes("You are logged in")) {
      console.error(
        "Sign in with npx wrangler login before updating the short address.",
      );
      process.exit(1);
    }
  }
}
wrangler("whoami", true);
wrangler("deploy --config '" + configPath.replaceAll("'", "''") + "'");
const response = await fetch(state.publicOrigin + "/api/health", {
  signal: AbortSignal.timeout(30000),
});
if (!response.ok || (await response.json()).mode !== "cloud")
  throw Error(
    "The short address has not passed the live health check. Use the tunnel fallback URL.",
  );
writeFileSync(
  workerPath,
  JSON.stringify({ ...worker, deployedUpstream: state.origin }, null, 2),
);
console.log("Short address verified: " + state.publicOrigin);
