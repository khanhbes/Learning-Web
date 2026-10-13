import { spawn } from "node:child_process";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { wrapCode } from "../content/solutions.mjs";
import { testsFor, checkOutput } from "../content/problems.mjs";
import { runWasm, wasmHealth } from "./wasm-runner.mjs";
const IMAGE = "bytepath-runner:1";
function capture(
  command,
  args,
  { input = "", timeout = 10000, maxOutput = 2 * 1024 * 1024 } = {},
) {
  return new Promise((resolve) => {
    const p = spawn(command, args, {
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "",
      stderr = "",
      bytes = 0,
      ended = false;
    const timer = setTimeout(() => {
      p.kill();
      finish({ code: null, timeout: true });
    }, timeout);
    const finish = (x) => {
      if (ended) return;
      ended = true;
      clearTimeout(timer);
      resolve({ ...x, stdout, stderr });
    };
    p.on("error", (e) => finish({ code: null, error: e.message }));
    p.stdout.on("data", (b) => {
      bytes += b.length;
      stdout += b.toString();
      if (bytes > maxOutput) {
        p.kill();
        finish({ code: null, outputLimit: true });
      }
    });
    p.stderr.on("data", (b) => {
      bytes += b.length;
      stderr += b.toString();
      if (bytes > maxOutput) {
        p.kill();
        finish({ code: null, outputLimit: true });
      }
    });
    p.on("close", (code) => finish({ code }));
    p.stdin.on("error", () => {});
    p.stdin.end(input);
  });
}
export async function runnerHealth() {
  if (process.env.BYTEPATH_RUNNER !== "docker") return wasmHealth();
  const r = await capture(
    "docker",
    ["image", "inspect", IMAGE, "--format", "{{.Id}}"],
    { timeout: 5000 },
  );
  return {
    available: r.code === 0,
    image: IMAGE,
    message:
      r.code === 0
        ? "Python 3.12 và C++17 sẵn sàng."
        : "Docker hoặc image chấm bài chưa sẵn sàng. Chạy npm run runner:build.",
  };
}
let queue = Promise.resolve();
export function runCode(options) {
  if (process.env.BYTEPATH_RUNNER !== "docker") return runWasm(options);
  const pending = queue.then(() => execute(options));
  queue = pending.catch(() => {});
  return pending;
}
async function execute({
  problemId,
  seed,
  language,
  code,
  publicOnly = false,
  version,
  fixtures,
}) {
  const health = await runnerHealth();
  if (!health.available)
    return { status: "infrastructure_error", message: health.message };
  const cases = fixtures ?? testsFor(problemId, seed, { publicOnly, version }),
    id = randomUUID(),
    name = "bytepath-" + id,
    dir = resolve(".data/runs", id);
  await mkdir(dir, { recursive: true });
  try {
    const filename = language === "python" ? "main.py" : "main.cpp";
    await writeFile(
      resolve(dir, filename),
      wrapCode(code, language, { multi: true }),
      "utf8",
    );
    const shell =
      language === "python"
        ? "printf '__BYTEPATH_READY__\\n'; ulimit -t 10; python3 /submission/main.py"
        : "g++ -std=c++17 -O2 /submission/main.cpp -o /work/solution || exit 42; printf '__BYTEPATH_READY__\\n'; ulimit -t 10; /work/solution";
    const args = [
      "run",
      "--rm",
      "-i",
      "--name",
      name,
      "--network",
      "none",
      "--read-only",
      "--cap-drop",
      "ALL",
      "--security-opt",
      "no-new-privileges",
      "--memory",
      "768m",
      "--memory-swap",
      "768m",
      "--cpus",
      "1",
      "--pids-limit",
      "32",
      "--tmpfs",
      "/work:rw,exec,mode=1777,size=128m",
      "--mount",
      `type=bind,source=${dir},target=/submission,readonly`,
      IMAGE,
      "sh",
      "-c",
      shell,
    ];
    const start = Date.now();
    const r = await capture("docker", args, {
      input: cases.map((t) => JSON.stringify(t.input)).join("\n") + "\n",
      timeout: 60000,
    });
    if (r.timeout || r.outputLimit) {
      await capture("docker", ["rm", "-f", name], { timeout: 5000 });
      return {
        status: r.stdout.includes("__BYTEPATH_READY__")
          ? "rejected"
          : "infrastructure_error",
        message: r.outputLimit
          ? "Đầu ra vượt 2 MB."
          : "Quá thời gian chạy; nếu lỗi trước khi chương trình chạy, hãy chấm lại.",
        checks: [],
        duration: Date.now() - start,
      };
    }
    if (
      r.code === 125 ||
      r.error ||
      (!r.stdout.includes("__BYTEPATH_READY__") && r.code !== 42)
    )
      return {
        status: "infrastructure_error",
        message: "Không khởi chạy được bộ chấm. Bài được giữ, chưa có kết quả.",
        diagnostic: r.stderr.slice(0, 2500),
      };
    if (r.code === 42)
      return {
        status: "compile_error",
        message: "C++ chưa biên dịch được.",
        diagnostic: r.stderr.slice(0, 5000),
        checks: [],
      };
    if (r.code !== 0)
      return {
        status: "runtime_error",
        message: "Chương trình gặp lỗi hoặc vượt giới hạn CPU/bộ nhớ.",
        diagnostic: r.stderr.slice(0, 5000),
        checks: [],
      };
    const lines = r.stdout
      .slice(
        r.stdout.indexOf("__BYTEPATH_READY__") + "__BYTEPATH_READY__".length,
      )
      .trim()
      .split(/\r?\n/);
    if (lines.length !== cases.length)
      return {
        status: "rejected",
        message:
          "Mỗi lần gọi solve phải return đúng một kết quả. Không print/cout thêm vào đầu ra.",
        diagnostic: r.stdout.slice(0, 2000),
        checks: [],
      };
    let checks = cases.map((t, i) => {
      let got;
      try {
        got = JSON.parse(lines[i]);
      } catch {
        return {
          id: t.id,
          group: t.group,
          passed: false,
          message: "Đầu ra không phải JSON hợp lệ.",
        };
      }
      return {
        id: t.id,
        group: t.group,
        passed: checkOutput(problemId, t.input, got),
        ...(publicOnly || t.group === "sample"
          ? { input: t.input, expected: t.expected, actual: got }
          : {}),
      };
    });
    return {
      status: checks.every((c) => c.passed) ? "accepted" : "rejected",
      message: checks.every((c) => c.passed)
        ? "Qua toàn bộ bộ kiểm thử của đề."
        : "Có trường hợp chưa đúng. Xem nhóm lỗi rồi thử lại.",
      checks,
      duration: Date.now() - start,
    };
  } catch (e) {
    return {
      status: "infrastructure_error",
      message: "Bộ chấm gặp lỗi; hãy chấm lại.",
      diagnostic: e.message,
    };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
