import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
const root = process.cwd().replaceAll("\\", "/");
const result = spawnSync(
  "git",
  [
    "-c",
    "safe.directory=" + root,
    "ls-files",
    "--cached",
    "--others",
    "--exclude-standard",
    "-z",
  ],
  { encoding: "utf8", windowsHide: true },
);
if (result.status !== 0) throw new Error("Cannot read repository file list.");
if (existsSync(".env")) process.loadEnvFile(".env");
const key = process.env.GEMINI_API_KEY;
const files = [...new Set(result.stdout.split("\0").filter(Boolean))];
for (const file of files) {
  if (
    /^(node_modules|\.data|\.runtime|output|\.playwright-cli)\//.test(file) ||
    (/^\.env($|\.)/.test(file) &&
      ![".env.example", ".env.botkeep.example"].includes(file))
  )
    throw new Error("Private or generated file would be published: " + file);
  if (key?.length >= 16 && readFileSync(file).includes(Buffer.from(key)))
    throw new Error(
      "Live Gemini credential found in a publishable file: " + file,
    );
}
console.log(
  JSON.stringify({
    checkedFiles: files.length,
    liveGeminiKeyIncluded: false,
    privateDataIncluded: false,
  }),
);
