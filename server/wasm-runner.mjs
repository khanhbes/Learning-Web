import { Worker } from "node:worker_threads";
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { wrapCode } from "../content/solutions.mjs";
import { testsFor, checkOutput } from "../content/problems.mjs";
let verified = false;
export async function wasmHealth() {
  try {
    if (!verified) {
      const manifest = JSON.parse(readFileSync(".runtime/manifest.json"));
      for (const [file, hash] of Object.entries(manifest.files))
        if (
          createHash("sha256")
            .update(readFileSync(".runtime/" + file))
            .digest("hex") !== hash
        )
          throw Error("Checksum mismatch");
      if (!existsSync("node_modules/@chriskoch/cpp-wasm/clang"))
        throw Error("Compiler missing");
      verified = true;
    }
    return {
      available: true,
      engine: "wasm",
      image: "WebAssembly",
      message: "Python 3.12 / C++17 · chạy cách ly, không cần Docker.",
    };
  } catch {
    return {
      available: false,
      engine: "wasm",
      message: "Chạy npm run runner:setup để tải runtime WebAssembly (~26 MB).",
    };
  }
}
export function executeWasm({
  language,
  source,
  input,
  runtimeTimeout = 12000,
  compileTimeout = 120000,
}) {
  return new Promise((resolve) => {
    const worker = new Worker(new URL("./wasm-worker.mjs", import.meta.url), {
      workerData: { language, source, input },
      resourceLimits: { maxOldGenerationSizeMb: 192, stackSizeMb: 8 },
      execArgv: [],
    });
    let stdout = "",
      stderr = "",
      phase = "initializing",
      finished = false;
    let timer = setTimeout(
      () =>
        finish({
          status: "infrastructure_error",
          message: "Quá thời gian khởi tạo môi trường.",
        }),
      compileTimeout,
    );
    const finish = (result) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      worker.terminate();
      resolve({ ...result, stdout, stderr });
    };
    worker.on("message", (message) => {
      if (message.type === "output") {
        if (message.fd === 1) stdout += message.text;
        else stderr += message.text;
      } else if (message.type === "phase") {
        phase = message.phase;
        clearTimeout(timer);
        timer = setTimeout(
          () =>
            finish({
              status:
                phase === "running" ? "runtime_error" : "infrastructure_error",
              message:
                "Quá thời gian " +
                (phase === "running"
                  ? "chạy chương trình."
                  : "biên dịch; hãy chấm lại."),
            }),
          phase === "running" ? runtimeTimeout : compileTimeout,
        );
      } else if (message.type === "done") finish(message);
    });
    worker.on("error", (e) =>
      finish({
        status: "infrastructure_error",
        message: "Worker gặp lỗi; bài chưa có kết quả.",
        diagnostic: e.message,
      }),
    );
    worker.on("exit", (code) => {
      if (!finished)
        finish({
          status: "infrastructure_error",
          message: "Môi trường chạy bị gián đoạn.",
          diagnostic: String(code),
        });
    });
  });
}
let queue = Promise.resolve();
export function runWasm(options) {
  const pending = queue.then(() => grade(options));
  queue = pending.catch(() => {});
  return pending;
}
async function grade({
  problemId,
  language,
  code,
  seed,
  publicOnly = false,
  version,
  fixtures,
}) {
  const health = await wasmHealth();
  if (!health.available)
    return { status: "infrastructure_error", message: health.message };
  const tests = fixtures ?? testsFor(problemId, seed, { publicOnly, version }),
    begin = Date.now();
  const result = await executeWasm({
    language,
    source: wrapCode(code, language, { multi: true }),
    input: tests.map((t) => JSON.stringify(t.input)).join("\n") + "\n",
  });
  if (result.status !== "ok")
    return {
      status: result.status,
      message: result.message || "Chương trình chưa chạy được.",
      diagnostic: result.stderr.slice(0, 5000),
      checks: [],
      duration: Date.now() - begin,
    };
  const lines = result.stdout.trim().split(/\r?\n/);
  if (lines.length !== tests.length)
    return {
      status: "rejected",
      message:
        "Mỗi lần gọi solve cần return đúng một kết quả; không in thêm stdout.",
      checks: [],
    };
  const checks = tests.map((t, i) => {
    try {
      const actual = JSON.parse(lines[i]);
      return {
        id: t.id,
        group: t.group,
        passed: checkOutput(problemId, t.input, actual),
        ...(publicOnly || t.group === "sample"
          ? { input: t.input, expected: t.expected, actual }
          : {}),
      };
    } catch {
      return {
        id: t.id,
        group: t.group,
        passed: false,
        message: "Đầu ra không là JSON hợp lệ.",
      };
    }
  });
  return {
    status: checks.every((c) => c.passed) ? "accepted" : "rejected",
    message: checks.every((c) => c.passed)
      ? "Qua toàn bộ bộ kiểm thử của đề."
      : "Có trường hợp chưa đúng. Xem nhóm lỗi rồi thử lại.",
    checks,
    duration: Date.now() - begin,
  };
}
