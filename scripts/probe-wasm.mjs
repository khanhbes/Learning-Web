import { readFileSync } from "node:fs";
import {
  WASI,
  File,
  OpenFile,
  ConsoleStdout,
  PreopenDirectory,
  Directory,
} from "@bjorn3/browser_wasi_shim";
const root = ".data/wasm-probe",
  encoder = new TextEncoder();
let output = "";
const write = (b) => {
  output += new TextDecoder().decode(b);
  if (output.length > 10000) throw Error("Output limit");
};
const stdlib = new Directory([
  [
    "python312.zip",
    new File(readFileSync(root + "/usr/local/lib/python312.zip"), {
      readonly: true,
    }),
  ],
  [
    "python3.12",
    new Directory([
      [
        "os.py",
        new File(readFileSync(root + "/usr/local/lib/python3.12/os.py"), {
          readonly: true,
        }),
      ],
      ["lib-dynload", new Directory([])],
    ]),
  ],
]);
const files = new Map([
  ["usr", new Directory([["local", new Directory([["lib", stdlib]])]])],
  [
    "main.py",
    new File(
      encoder.encode(
        'import json,sys,heapq,bisect\nfrom collections import deque,Counter\nprint(json.dumps({"ok":list(deque([1,2])),"python":sys.version}))',
      ),
      { readonly: true },
    ),
  ],
]);
const wasi = new WASI(
  ["python", "-B", "/main.py"],
  ["PYTHONHOME=/usr/local", "PYTHONDONTWRITEBYTECODE=1", "PYTHONHASHSEED=0"],
  [
    new OpenFile(new File([])),
    new ConsoleStdout(write),
    new ConsoleStdout(write),
    new PreopenDirectory("/", files),
  ],
);
const module = await WebAssembly.compile(
  readFileSync(root + "/bin/python-3.12.0.wasm"),
);
const instance = await WebAssembly.instantiate(module, {
  wasi_snapshot_preview1: wasi.wasiImport,
});
console.log("exit", wasi.start(instance));
console.log(output);
