import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
export const DATA_VERSION = 1;
export function initialState(now = Date.now()) {
  return {
    version: DATA_VERSION,
    profile: { name: "", language: "python", dailyGoal: 50, skin: "original" },
    xp: 0,
    gems: 0,
    energy: 30,
    energyAt: now,
    started: [],
    progress: {},
    daily: {},
    streak: 0,
    streakLast: null,
    freeze: 0,
    inventory: ["original"],
    claimed: [],
    badges: [],
    league: { week: null, tier: 0, history: [] },
    capstonePassed: false,
    capstoneScore: 0,
  };
}
export function createStore(path = ".data/bytepath.sqlite") {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(
    "PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;",
  );
  db.exec(`CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY,value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS attempts(id TEXT PRIMARY KEY,lesson_id INTEGER NOT NULL,mode TEXT NOT NULL,status TEXT NOT NULL,data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS jobs(id TEXT PRIMARY KEY,status TEXT NOT NULL,data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS ledger(id TEXT PRIMARY KEY,created_at INTEGER NOT NULL,xp INTEGER NOT NULL,gems INTEGER NOT NULL,reason TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS drafts(id TEXT PRIMARY KEY,created_at INTEGER NOT NULL,data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS capstones(id TEXT PRIMARY KEY,status TEXT NOT NULL,data TEXT NOT NULL);
PRAGMA user_version=1;`);
  if (!db.prepare("SELECT value FROM meta WHERE key=?").get("state"))
    db.prepare("INSERT INTO meta VALUES (?,?)").run(
      "state",
      JSON.stringify(initialState()),
    );
  const getState = () =>
    JSON.parse(
      db.prepare("SELECT value FROM meta WHERE key=?").get("state").value,
    );
  const putState = (s) =>
    db
      .prepare("UPDATE meta SET value=? WHERE key=?")
      .run(JSON.stringify(s), "state");
  function transaction(fn) {
    db.exec("BEGIN IMMEDIATE");
    try {
      const value = fn();
      db.exec("COMMIT");
      return value;
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  }
  function get(table, id) {
    const row = db.prepare(`SELECT data FROM ${table} WHERE id=?`).get(id);
    return row ? JSON.parse(row.data) : null;
  }
  function put(table, obj) {
    if (table === "attempts")
      db.prepare(
        "INSERT INTO attempts VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET status=excluded.status,data=excluded.data",
      ).run(obj.id, obj.lessonId, obj.mode, obj.status, JSON.stringify(obj));
    else if (table === "drafts")
      db.prepare("INSERT INTO drafts VALUES (?,?,?)").run(
        obj.id,
        obj.createdAt,
        JSON.stringify(obj),
      );
    else
      db.prepare(
        `INSERT INTO ${table} VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET status=excluded.status,data=excluded.data`,
      ).run(obj.id, obj.status, JSON.stringify(obj));
  }
  const list = (table) =>
    db
      .prepare(`SELECT data FROM ${table} ORDER BY rowid DESC`)
      .all()
      .map((r) => JSON.parse(r.data));
  function reward(
    state,
    id,
    { xp = 0, gems = 0, reason = "", now = Date.now() },
  ) {
    if (db.prepare("SELECT id FROM ledger WHERE id=?").get(id)) return false;
    db.prepare("INSERT INTO ledger VALUES (?,?,?,?,?)").run(
      id,
      now,
      xp,
      gems,
      reason,
    );
    state.xp += xp;
    state.gems += gems;
    return true;
  }
  // Interrupted jobs are infrastructure errors, never student failures.
  for (const job of list("jobs"))
    if (job.status === "queued" || job.status === "running") {
      job.status = "error";
      job.result = {
        status: "infrastructure_error",
        message: "Ứng dụng đã dừng khi đang chạy. Bài được giữ; hãy chấm lại.",
      };
      put("jobs", job);
    }
  return {
    db,
    getState,
    putState,
    transaction,
    get,
    put,
    list,
    reward,
    close: () => db.close(),
  };
}
