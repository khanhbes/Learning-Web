import { existsSync } from "node:fs";
// Local and cloud secrets stay in .env or environment, never in the client build.
if (existsSync(".env") && typeof process.loadEnvFile === "function")
  process.loadEnvFile(".env");
export function configuration(env = process.env) {
  const cloud = env.BYTEPATH_MODE === "cloud";
  const origin = env.BYTEPATH_PUBLIC_ORIGIN || "";
  if (
    cloud &&
    (!origin.startsWith("https://") || new URL(origin).origin !== origin)
  )
    throw new Error(
      "Cloud mode requires BYTEPATH_PUBLIC_ORIGIN=https://your-domain (no trailing slash).",
    );
  if (
    cloud &&
    ((env.BYTEPATH_PASSWORD?.length ?? 0) < 8 ||
      (env.BYTEPATH_PASSWORD?.length ?? 0) > 256 ||
      env.BYTEPATH_PASSWORD === "replace-with-your-own-long-password")
  )
    throw new Error(
      "Cloud mode requires BYTEPATH_PASSWORD with 8 to 256 characters.",
    );
  return {
    cloud,
    origin,
    password: cloud ? env.BYTEPATH_PASSWORD : "",
    host: cloud ? "0.0.0.0" : "127.0.0.1",
    port: Number(env.SERVER_PORT || env.PORT || 3001),
    aiProvider: env.BYTEPATH_AI || "off",
  };
}
