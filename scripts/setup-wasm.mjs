import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
const root = ".runtime";
mkdirSync(root, { recursive: true });
const url =
  "https://github.com/vmware-labs/webassembly-language-runtimes/releases/download/python%2F3.12.0%2B20231211-040d5a6/python-3.12.0-wasi-sdk-20.0.tar.gz";
const expected =
  "6c1cddbb69ae09e87eee2906bdc70539bff5f2969818a6f8457d4e6a6eb67d4d";
const local = process.argv.includes("--from-probe");
const bytes = local
  ? readFileSync(".data/wasm-probe/python.tar.gz")
  : new Uint8Array(await (await fetch(url)).arrayBuffer());
if (createHash("sha256").update(bytes).digest("hex") !== expected)
  throw Error("Python runtime checksum mismatch");
const tar = gunzipSync(bytes),
  wanted = {
    "bin/python-3.12.0.wasm": "python.wasm",
    "usr/local/lib/python312.zip": "python312.zip",
    "usr/local/lib/python3.12/os.py": "os.py",
  };
for (let offset = 0; offset + 512 <= tar.length;) {
  const name = tar
      .subarray(offset, offset + 100)
      .toString()
      .split("\0")[0],
    size =
      parseInt(
        tar
          .subarray(offset + 124, offset + 136)
          .toString()
          .replace(/\0/g, ""),
        8,
      ) || 0;
  if (wanted[name])
    writeFileSync(
      root + "/" + wanted[name],
      tar.subarray(offset + 512, offset + 512 + size),
    );
  offset += 512 + Math.ceil(size / 512) * 512;
}
for (const file of Object.values(wanted))
  if (!existsSync(root + "/" + file))
    throw Error("Missing runtime file " + file);
const jsonUrl =
  "https://raw.githubusercontent.com/nlohmann/json/v3.7.3/single_include/nlohmann/json.hpp";
const jsonBytes = local
  ? readFileSync(".data/wasm-probe/json-3.7.3.hpp")
  : new Uint8Array(await (await fetch(jsonUrl)).arrayBuffer());
if (
  createHash("sha256").update(jsonBytes).digest("hex") !==
  "3b5d2b8f8282b80557091514d8ab97e27f9574336c804ee666fda673a9b59926"
)
  throw Error("JSON header checksum mismatch");
writeFileSync(root + "/json.hpp", jsonBytes);
writeFileSync(
  root + "/manifest.json",
  JSON.stringify(
    {
      python: "3.12.0",
      cpp: "Clang 8.0.1 · C++17 · WASI",
      archiveSHA256: expected,
      files: Object.fromEntries(
        ["python.wasm", "python312.zip", "os.py", "json.hpp"].map((f) => [
          f,
          createHash("sha256")
            .update(readFileSync(root + "/" + f))
            .digest("hex"),
        ]),
      ),
    },
    null,
    2,
  ),
);
console.log(
  "WebAssembly runtime ready in .runtime (~26 MB). No Docker/model needed.",
);
