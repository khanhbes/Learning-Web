import test from "node:test";
import assert from "node:assert/strict";
import { wasmHealth, runWasm, executeWasm } from "../server/wasm-runner.mjs";
import { solution } from "../content/solutions.mjs";
import { limitMemory } from "../server/wasm-limit.mjs";
test("WebAssembly memory is capped before instantiation", async () => {
  const bytes = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 5, 3, 1, 0, 1]);
  const capped = limitMemory(bytes, 2);
  assert.ok(WebAssembly.validate(capped));
  assert.deepEqual([...capped.slice(-4)], [1, 1, 1, 2]);
});
test("Real WebAssembly runner accepts Python and C++ reference submissions", async (t) => {
  if (!(await wasmHealth()).available) {
    t.skip("Run npm run runner:setup for runtime integration checks");
    return;
  }
  for (const language of ["python", "cpp"]) {
    const result = await runWasm({
      problemId: "two-sum",
      seed: "alternatives",
      language,
      code: solution("two-sum", language),
    });
    assert.equal(
      result.status,
      "accepted",
      result.diagnostic || result.message,
    );
    assert.ok(result.checks.every((c) => c.passed));
  }
});
test("Wrong output, syntax errors and CPU overruns do not pass", async (t) => {
  if (!(await wasmHealth()).available) {
    t.skip("Runtime unavailable");
    return;
  }
  assert.equal(
    (
      await runWasm({
        problemId: "add",
        seed: "fault",
        language: "python",
        code: "def solve(data): return 8",
      })
    ).status,
    "rejected",
  );
  assert.equal(
    (
      await runWasm({
        problemId: "add",
        seed: "fault",
        language: "python",
        code: "def solve(data) return 8",
      })
    ).status,
    "runtime_error",
  );
  const loop = await executeWasm({
    language: "python",
    source: "while True: pass",
    input: "",
    runtimeTimeout: 1000,
  });
  assert.equal(loop.status, "runtime_error");
});
test("Python guest cannot read host files, import JS or send network requests", async (t) => {
  if (!(await wasmHealth()).available) {
    t.skip("Runtime unavailable");
    return;
  }
  const source = `import json\nchecks=[]\nfor path in ['/.env','/server/index.mjs','/../../.data/bytepath.sqlite','/proc/self/environ']:\n    try:\n        open(path).read();checks.append(False)\n    except Exception:checks.append(True)\ntry:\n    import js\n    checks.append(False)\nexcept Exception:checks.append(True)\nprint(json.dumps(checks))`;
  const result = await executeWasm({ language: "python", source, input: "" });
  assert.equal(result.status, "ok", result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), [true, true, true, true, true]);
  const network = await executeWasm({
    language: "python",
    source: "import socket\nsocket.socket().connect(('example.com',80))",
    input: "",
  });
  assert.equal(network.status, "runtime_error");
  assert.equal(network.stdout, "");
});
