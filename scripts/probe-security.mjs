import { executeWasm } from "../server/wasm-runner.mjs";
const paths = [
  "/.env",
  "/server/index.mjs",
  "/../../.data/bytepath.sqlite",
  "/proc/self/environ",
];
for (const path of paths) {
  const source = `import json\ntry:\n    result=open(${JSON.stringify(path)}).read()\n    print(json.dumps({'read':True,'content':result}))\nexcept Exception:\n    print(json.dumps({'read':False}))`;
  const result = await executeWasm({ language: "python", source, input: "" });
  console.log(path, JSON.stringify(result));
}
for (const module of ["js", "socket"]) {
  const source =
    module === "js"
      ? "import js"
      : "import socket\nsocket.socket().connect(('example.com',80))";
  const result = await executeWasm({ language: "python", source, input: "" });
  console.log(module, JSON.stringify(result));
}
