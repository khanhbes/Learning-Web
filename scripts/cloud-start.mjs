import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { configuration } from "../server/config.mjs";
import { createApp } from "../server/index.mjs";
import { wasmHealth } from "../server/wasm-runner.mjs";

function prepareRuntime() {
  return new Promise((done, reject) => {
    const child = spawn(process.execPath, ["scripts/setup-wasm.mjs"], {
      stdio: "inherit",
      windowsHide: true,
    });
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0
        ? done()
        : reject(
            new Error(
              "Runtime download failed. Restart to retry; no submissions were graded.",
            ),
          ),
    );
  });
}

export async function startCloud({
  config = configuration(),
  buildReady = () => existsSync("dist/index.html"),
  health = wasmHealth,
  prepare = prepareRuntime,
  appFactory = createApp,
} = {}) {
  if (!config.cloud)
    throw new Error(
      "Set BYTEPATH_MODE=cloud, BYTEPATH_PUBLIC_ORIGIN and BYTEPATH_PASSWORD in the hosting Environment. Use Start BytePath.cmd for local mode.",
    );
  if (!buildReady())
    throw new Error(
      "Frontend build missing. Clone the botkeep-deploy branch, or run npm ci && npm run build before starting.",
    );
  if (!(await health()).available) {
    console.log(
      "Preparing verified Python/C++ WebAssembly runtime for the first start...",
    );
    await prepare();
    if (!(await health()).available)
      throw new Error(
        "Runner is unavailable. Install dependencies with npm ci --omit=dev and check the Console before restarting.",
      );
  }
  const app = await appFactory({ config, log: true });
  await app.listen({ host: config.host, port: config.port });
  return app;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const app = await startCloud();
  console.log("BytePath cloud ready: " + configuration().origin);
  for (const signal of ["SIGINT", "SIGTERM"])
    process.once(signal, async () => {
      await app.close();
      process.exit(0);
    });
}
