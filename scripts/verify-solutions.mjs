import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import {
  problems,
  generateInput,
  oracle,
  checkOutput,
  testsFor,
} from "../content/problems.mjs";
import { solution, pythonHelpers, cppHelpers } from "../content/solutions.mjs";
import { executeWasm } from "../server/wasm-runner.mjs";
import { componentsSolution } from "../content/alternatives.mjs";
const useWasm = process.argv.includes("--wasm");
const root = resolve(".data/verification");
mkdirSync(root, { recursive: true });
const ids = [...Object.keys(problems), "components-bfs"],
  cases = [];
const problemFor = (id) => (id === "components-bfs" ? "union-find" : id);
const reference = (id, language) =>
  id === "components-bfs"
    ? componentsSolution(language)
    : solution(id, language);
for (const id of ids) {
  const pid = problemFor(id);
  cases.push({ id, input: problems[pid].sampleInput });
  for (let i = 0; i < 200; i++)
    cases.push({ id, input: generateInput(pid, "verification-" + i) });
  for (const t of testsFor(pid, "performance"))
    if (t.group === "performance" || t.group === "edge")
      cases.push({ id, input: t.input });
}
const py =
  pythonHelpers +
  "\n" +
  ids
    .map((id) =>
      reference(id, "python").replace(
        "def solve(",
        `def solve_${id.replaceAll("-", "_")}(`,
      ),
    )
    .join("\n") +
  `\n__functions = {${ids.map((id) => JSON.stringify(id) + ":solve_" + id.replaceAll("-", "_")).join(",")}}\nfor line in sys.stdin:\n    payload=json.loads(line); __fixture=payload['input']\n    print(json.dumps(__functions[payload['id']](__fixture),allow_nan=False))\n`;
const cpp =
  cppHelpers +
  "\n" +
  ids
    .map((id) =>
      reference(id, "cpp").replace(
        "json solve(",
        `json solve_${id.replaceAll("-", "_")}(`,
      ),
    )
    .join("\n") +
  '\nint main(){string line;while(getline(cin,line)){auto payload=json::parse(line);__fixture=payload["input"];string id=payload["id"];json result;' +
  ids
    .map(
      (id, i) =>
        (i ? "else " : "") +
        `if(id==${JSON.stringify(id)})result=solve_${id.replaceAll("-", "_")}(__fixture);`,
    )
    .join("") +
  "cout<<result.dump()<<endl;}}\n";
writeFileSync(resolve(root, "verify.py"), py);
writeFileSync(resolve(root, "verify.cpp"), cpp);
const stdin = cases.map((c) => JSON.stringify(c)).join("\n") + "\n";
const report = {
  createdAt: new Date().toISOString(),
  problems: Object.keys(problems).length,
  implementations: ids.length,
  seedsPerProblem: 200,
  cases: cases.length,
  languages: {},
  engine: useWasm
    ? "WebAssembly · Python 3.12.0 / Clang 8.0.1 C++17"
    : "Docker · Python 3.12 / g++ C++17",
};
for (const language of ["python", "cpp"]) {
  console.log(
    "Verifying " + language + " against " + cases.length + " fixtures...",
  );
  const command =
    language === "python"
      ? "python3 /submission/verify.py"
      : "g++ -std=c++17 -O1 /submission/verify.cpp -o /work/verify && /work/verify";
  let r;
  if (useWasm) {
    const result = await executeWasm({
      language,
      source: language === "python" ? py : cpp,
      input: stdin,
      runtimeTimeout: 300000,
      compileTimeout: 300000,
    });
    r = {
      status: result.status === "ok" ? 0 : 1,
      stdout: result.stdout,
      stderr: result.stderr,
      error: result.status === "ok" ? undefined : result.message,
    };
  } else
    r = spawnSync(
      "docker",
      [
        "run",
        "--rm",
        "-i",
        "--network",
        "none",
        "--read-only",
        "--cap-drop",
        "ALL",
        "--security-opt",
        "no-new-privileges",
        "--memory",
        "1536m",
        "--cpus",
        "2",
        "--pids-limit",
        "32",
        "--tmpfs",
        "/work:rw,exec,mode=1777,size=128m",
        "--mount",
        `type=bind,source=${root},target=/submission,readonly`,
        "bytepath-runner:1",
        "sh",
        "-c",
        command,
      ],
      {
        input: stdin,
        encoding: "utf8",
        timeout: 300000,
        maxBuffer: 64 * 1024 * 1024,
        windowsHide: true,
      },
    );
  if (r.status !== 0) {
    console.error(r.error ?? "Verification failed");
    console.error(r.stderr.slice(0, 6000));
    process.exitCode = 1;
    break;
  }
  const lines = r.stdout.trim().split(/\r?\n/);
  if (lines.length !== cases.length)
    throw new Error("Wrong output count " + lines.length);
  let failures = [];
  lines.forEach((line, i) => {
    const c = cases[i],
      out = JSON.parse(line);
    if (!checkOutput(problemFor(c.id), c.input, out))
      failures.push({
        problem: c.id,
        input: c.input,
        expected: oracle(problemFor(c.id), c.input),
        actual: out,
      });
  });
  report.languages[language] = {
    passed: cases.length - failures.length,
    failed: failures.length,
    failures: failures.slice(0, 10),
  };
  console.log(
    language +
      ": " +
      (cases.length - failures.length) +
      "/" +
      cases.length +
      " passed",
  );
  if (failures.length) {
    console.error(JSON.stringify(failures.slice(0, 3)));
    process.exitCode = 1;
  }
}
mkdirSync("output", { recursive: true });
writeFileSync(
  useWasm
    ? "output/wasm-solution-verification.json"
    : "output/solution-verification.json",
  JSON.stringify(report, null, 2) + "\n",
);
