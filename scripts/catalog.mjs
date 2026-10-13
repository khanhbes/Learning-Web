import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { sourceMap, corrections } from "../content/sources-map.mjs";
const files = readdirSync("DSA")
  .filter((f) => f.endsWith(".jpg"))
  .sort();
if (files.length !== 62 || sourceMap.length !== 62)
  throw new Error("Expected 62 sources");
const catalog = files.map((file, index) => {
  const entry = sourceMap.find((s) => file.startsWith(s[0] + "_"));
  if (!entry) throw new Error("Unmapped " + file);
  return {
    id: `DSA-${String(index + 1).padStart(3, "0")}`,
    file,
    prefix: entry[0],
    collection: entry[1],
    page: entry[2],
    topic: entry[3],
    sha256: createHash("sha256")
      .update(readFileSync("DSA/" + file))
      .digest("hex"),
    corrections: corrections
      .filter((c) => c.source === entry[0])
      .map((c) => c.id),
  };
});
mkdirSync("content", { recursive: true });
writeFileSync("content/sources.json", JSON.stringify(catalog, null, 2) + "\n");
console.log(`Catalogued ${catalog.length} original images with SHA-256.`);
