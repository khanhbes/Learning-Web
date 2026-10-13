// Isolated QA data. Never used by start.ps1 or the normal application.
import { createStore } from "../server/store.mjs";
import { createApp } from "../server/index.mjs";
const store = createStore(":memory:");
if (process.argv.includes("--unlocked")) {
  const s = store.getState();
  s.profile.name = "QA · BytePath";
  for (let id = 1; id <= 48; id++)
    s.progress[id] = { passed: true, bestKnowledge: 100, mistakes: 0 };
  s.xp = 2600;
  s.gems = 300;
  s.capstonePassed = true;
  s.capstoneScore = 100;
  store.putState(s);
}
const port = Number(
  process.argv.find((a) => a.startsWith("--port="))?.slice(7) ?? 5173,
);
const app = await createApp({
  store,
  log: false,
  config: { cloud: false, aiProvider: "off" },
  aiHealth: async () => ({ available: false, provider: "off" }),
  tutor: async () => ({
    available: false,
    text: "QA chỉ dùng gợi ý soạn sẵn.",
  }),
});
await app.listen({ host: "127.0.0.1", port });
console.log("Isolated browser QA: http://127.0.0.1:" + port);
