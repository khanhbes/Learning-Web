// Learner source runs as WebAssembly with an in-memory filesystem only.
// This worker never evaluates learner JavaScript, imports a host WASI or exposes fetch/fs.
import { parentPort, workerData } from "node:worker_threads";
import { readFileSync } from "node:fs";
import {
  WASI,
  File,
  OpenFile,
  ConsoleStdout,
  PreopenDirectory,
  Directory,
} from "@bjorn3/browser_wasi_shim";
import { limitMemory } from "./wasm-limit.mjs";
const root = ".runtime",
  encoder = new TextEncoder(),
  decoder = new TextDecoder();
let phase = "initializing",
  written = 0;
const write = (fd, bytes) => {
  written += bytes.length;
  if (written > 2 * 1024 * 1024) throw Error("OUTPUT_LIMIT");
  parentPort.postMessage({ type: "output", fd, text: decoder.decode(bytes) });
};
const mark = (value) => {
  phase = value;
  parentPort.postMessage({ type: "phase", phase });
};
function virtualPython() {
  const file = (name) =>
    new File(readFileSync(root + "/" + name), { readonly: true });
  const stdlib = new Directory([
    ["python312.zip", file("python312.zip")],
    [
      "python3.12",
      new Directory([
        ["os.py", file("os.py")],
        ["lib-dynload", new Directory([])],
      ]),
    ],
  ]);
  return new Map([
    ["usr", new Directory([["local", new Directory([["lib", stdlib]])]])],
    [
      "main.py",
      new File(encoder.encode(workerData.source), { readonly: true }),
    ],
  ]);
}
async function python() {
  const module = await WebAssembly.compile(
    limitMemory(readFileSync(root + "/python.wasm")),
  );
  const wasi = new WASI(
    ["python", "-B", "/main.py"],
    ["PYTHONHOME=/usr/local", "PYTHONDONTWRITEBYTECODE=1", "PYTHONHASHSEED=0"],
    [
      new OpenFile(
        new File(encoder.encode(workerData.input), { readonly: true }),
      ),
      new ConsoleStdout((b) => write(1, b)),
      new ConsoleStdout((b) => write(2, b)),
      new PreopenDirectory("/", virtualPython()),
    ],
    { debug: false },
  );
  for (const name of [
    "fd_allocate",
    "fd_filestat_set_size",
    "fd_filestat_set_times",
    "fd_pwrite",
    "path_create_directory",
    "path_filestat_set_times",
    "path_link",
    "path_remove_directory",
    "path_rename",
    "path_symlink",
    "path_unlink_file",
  ])
    wasi.wasiImport[name] = () => 76;
  const fdWrite = wasi.wasiImport.fd_write;
  wasi.wasiImport.fd_write = (fd, ...args) =>
    fd === 1 || fd === 2 ? fdWrite(fd, ...args) : 76;
  const instance = await WebAssembly.instantiate(module, {
    wasi_snapshot_preview1: wasi.wasiImport,
  });
  mark("running");
  const exit = wasi.start(instance);
  if (exit !== 0) throw Error("Python kết thúc với mã " + exit);
}
async function cpp() {
  const dir = "node_modules/@chriskoch/cpp-wasm/",
    lib = readFileSync(dir + "shared.js", "utf8");
  // Adapt the trusted packaged compiler library; learner source is passed only to clang's virtual file.
  const source = lib.slice(0, lib.lastIndexOf("const apiOptions =")),
    window = { CPP_OUTPUT: "" };
  const { API, App, MemFS } = new Function(
    "window",
    "console",
    source + "\nreturn {API,App,MemFS};",
  )(window, { log: () => {} });
  MemFS.prototype.host_write = function (fd, iovs, length, nwritten) {
    this.hostMem_.check();
    let total = 0;
    if (fd !== 1 && fd !== 2) return 76;
    for (let i = 0; i < length; i++) {
      const offset = this.hostMem_.read32(iovs + i * 8),
        size = this.hostMem_.read32(iovs + i * 8 + 4);
      write(fd, new Uint8Array(this.hostMem_.buffer, offset, size));
      total += size;
    }
    this.hostMem_.write32(nwritten, total);
    return 0;
  };
  const api = new API({
    clang: "clang",
    lld: "lld",
    memfs: "memfs",
    sysroot: "sysroot.tar",
    readBuffer: async (name) => readFileSync(dir + name),
    compileStreaming: async (name) =>
      WebAssembly.compile(limitMemory(readFileSync(dir + name))),
  });
  await window.CPP_READY;
  // Bound all compiler/program output and preserve stdout versus stderr.
  api.memfs.hostWrite = (text) => write(2, encoder.encode(text));
  api.memfs.host_write = function (fd, iovs, length, nwritten) {
    this.hostMem_.check();
    let total = 0;
    if (fd !== 1 && fd !== 2) return 76;
    for (let i = 0; i < length; i++) {
      const offset = this.hostMem_.read32(iovs + i * 8),
        size = this.hostMem_.read32(iovs + i * 8 + 4);
      write(fd, new Uint8Array(this.hostMem_.buffer, offset, size));
      total += size;
    }
    this.hostMem_.write32(nwritten, total);
    return 0;
  };
  api.memfs.addDirectory("include/nlohmann");
  api.memfs.addFile(
    "include/nlohmann/json.hpp",
    readFileSync(root + "/json.hpp"),
  );
  api.memfs.addDirectory("include/bits");
  api.memfs.addFile(
    "include/bits/stdc++.h",
    encoder.encode(
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
        "tuple",
        "bitset",
        "cassert",
        "cstdint",
        "cstdlib",
        "cstring",
        "iterator",
        "list",
        "memory",
        "iomanip",
        "fstream",
      ]
        .map((h) => `#include <${h}>`)
        .join("\n"),
    ),
  );
  const configPath = "include/c++/v1/__config",
    config = decoder.decode(api.memfs.getFileContents(configPath));
  api.memfs.addFile(
    configPath,
    encoder.encode(
      config.replaceAll(
        /#define\s+_LIBCPP_HAS_THREAD_API_EXTERNAL[^\n]*/g,
        "#define _LIBCPP_HAS_NO_THREADS",
      ),
    ),
  );
  api.clangCommonArgs.push(
    "-std=c++17",
    "-DJSON_NOEXCEPTION=1",
    "-D_LIBCPP_HAS_NO_THREADS=1",
    "-D_LIBCPP_HAS_NO_ATOMIC_HEADER=1",
    "-O0",
  );
  mark("compiling");
  await api.compile({
    input: "solution.cpp",
    contents: workerData.source,
    obj: "solution.o",
  });
  const lld = await api.lld;
  await api.run(
    lld,
    "wasm-ld",
    "--no-threads",
    "--export-dynamic",
    "-z",
    "stack-size=1048576",
    "-Llib/wasm32-wasi",
    "lib/wasm32-wasi/crt1.o",
    "solution.o",
    "-lc",
    "-lc++",
    "-lc++abi",
    "lib/clang/8.0.1/lib/wasi/libclang_rt.builtins-wasm32.a",
    "-o",
    "solution.wasm",
  );
  const bytes = limitMemory(
    new Uint8Array(api.memfs.getFileContents("solution.wasm")),
  );
  const module = await WebAssembly.compile(bytes);
  // Compiler headers/libraries are excluded from the learner's runtime filesystem.
  const runtime = new API({
    clang: "clang",
    lld: "lld",
    memfs: "memfs",
    sysroot: "sysroot.tar",
    readBuffer: async () => new Uint8Array(0),
    compileStreaming: async (name) =>
      name === "memfs"
        ? api.compileStreaming("memfs")
        : new WebAssembly.Module(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0])),
  });
  await runtime.memfs.ready;
  runtime.memfs.hostWrite = (text) => write(2, encoder.encode(text));
  runtime.memfs.host_write = api.memfs.host_write;
  runtime.memfs.setStdinStr(workerData.input);
  const app = new App(module, runtime.memfs, "solution");
  await app.ready;
  mark("running");
  await app.run();
}
try {
  if (workerData.language === "python") await python();
  else await cpp();
  parentPort.postMessage({ type: "done", status: "ok" });
} catch (error) {
  const message = error?.message || String(error),
    compilerCrash =
      phase === "compiling" &&
      (error?.code === 70 || message.includes("memory access out of bounds"));
  parentPort.postMessage({
    type: "done",
    status:
      phase === "initializing" || compilerCrash
        ? "infrastructure_error"
        : phase === "compiling"
          ? "compile_error"
          : "runtime_error",
    message,
  });
}
