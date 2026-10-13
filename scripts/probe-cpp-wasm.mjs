import { readFileSync } from "node:fs";
import { solution, wrapCode } from "../content/solutions.mjs";
const dir = "node_modules/@chriskoch/cpp-wasm/";
const lib = readFileSync(dir + "shared.js", "utf8"),
  source = lib.slice(0, lib.lastIndexOf("const apiOptions ="));
let output = "";
const window = {};
Object.defineProperty(window, "CPP_OUTPUT", {
  get: () => output,
  set: (v) => {
    output = v;
    if (output.length > 50000) throw Error("Output limit");
  },
});
const { API } = new Function(
  "window",
  "console",
  source + "\nreturn {API,App};",
)(window, { log: () => {} });
const api = new API({
  clang: "clang",
  lld: "lld",
  memfs: "memfs",
  sysroot: "sysroot.tar",
  readBuffer: async (n) => readFileSync(dir + n),
  compileStreaming: async (n) => WebAssembly.compile(readFileSync(dir + n)),
});
await window.CPP_READY;
const configPath = "include/c++/v1/__config";
const configText = new TextDecoder().decode(
  api.memfs.getFileContents(configPath),
);
api.memfs.addFile(
  configPath,
  new TextEncoder().encode(
    configText.replaceAll(
      /#define\s+_LIBCPP_HAS_THREAD_API_EXTERNAL[^\n]*/g,
      "#define _LIBCPP_HAS_NO_THREADS",
    ),
  ),
);
api.memfs.addDirectory("include/nlohmann");
api.memfs.addFile(
  "include/nlohmann/json.hpp",
  readFileSync(
    process.argv.includes("--old-json")
      ? ".data/wasm-probe/json-3.7.3.hpp"
      : ".data/verification/vendor/nlohmann/json.hpp",
  ),
);
api.memfs.addDirectory("include/bits");
api.memfs.addFile(
  "include/bits/stdc++.h",
  new TextEncoder().encode(
    [
      "iostream",
      "sstream",
      "vector",
      "array",
      "deque",
      "queue",
      "stack",
      "set",
      "map",
      "unordered_map",
      "unordered_set",
      "algorithm",
      "numeric",
      "functional",
      "utility",
      "string",
      "climits",
      "limits",
      "cmath",
    ]
      .map((h) => `#include <${h}>`)
      .join("\n"),
  ),
);
api.clangCommonArgs.push(
  "-std=c++17",
  "-DJSON_NOEXCEPTION=1",
  "-D_LIBCPP_HAS_NO_THREADS=1",
  "-D_LIBCPP_HAS_NO_ATOMIC_HEADER=1",
  "-O0",
  "-fconstexpr-depth",
  "128",
  "-ftemplate-depth",
  "256",
);
api.memfs.setStdinStr('{"a":3,"b":5}\n');
const begin = Date.now();
try {
  await api.compileLinkRun(
    process.argv.includes("--tiny")
      ? "#include <iostream>\nint main(){std::cout<<8<<std::endl;}"
      : wrapCode(solution("add", "cpp"), "cpp", { multi: true }),
  );
} catch (e) {
  console.log("error", e.message);
}
console.log("milliseconds", Date.now() - begin);
console.log(output);
