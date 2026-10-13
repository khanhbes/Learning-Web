import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { normalizeCourses } from "./course-state.mjs";
import { normalizeGamification, applyXPBoost, syncLevelRewards } from "./gamification.mjs";
export const DATA_VERSION = 2;
export function initialState(now = Date.now()) {
  return normalizeGamification(normalizeCourses({
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
  }));
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
CREATE TABLE IF NOT EXISTS knowledge_attempts(id TEXT PRIMARY KEY,status TEXT NOT NULL,data TEXT NOT NULL);`);
  if (!db.prepare("SELECT value FROM meta WHERE key=?").get("state"))
    db.prepare("INSERT INTO meta VALUES (?,?)").run(
      "state",
      JSON.stringify(initialState()),
    );
  const getState = () => normalizeGamification(normalizeCourses(
    JSON.parse(
      db.prepare("SELECT value FROM meta WHERE key=?").get("state").value,
    )));
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
    if(!["attempts","jobs","drafts","capstones","knowledge_attempts"].includes(table)) throw Error("Unknown table");
    const row = db.prepare(`SELECT data FROM ${table} WHERE id=?`).get(id);
    return row ? {courseId:"dsa",...JSON.parse(row.data)} : null;
  }
  function put(table, obj) {
    if (table === "attempts")
      db.prepare(
        "INSERT INTO attempts(id,lesson_id,mode,status,data,course_id) VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET status=excluded.status,data=excluded.data,course_id=excluded.course_id",
      ).run(obj.id, obj.lessonId, obj.mode, obj.status, JSON.stringify(obj),obj.courseId??"dsa");
    else if (table === "drafts")
      db.prepare("INSERT INTO drafts(id,created_at,data,course_id) VALUES (?,?,?,?)").run(
        obj.id,
        obj.createdAt,
        JSON.stringify(obj),
        obj.courseId??"dsa",
      );
    else
      db.prepare(
        `INSERT INTO ${table}(id,status,data,course_id) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET status=excluded.status,data=excluded.data,course_id=excluded.course_id`,
      ).run(obj.id, obj.status, JSON.stringify(obj),obj.courseId??"dsa");
  }
  const list = (table) =>
    db
      .prepare(`SELECT data FROM ${table} ORDER BY rowid DESC`)
      .all()
      .map((r) => ({courseId:"dsa",...JSON.parse(r.data)}));
  function reward(
    state,
    id,
    { xp = 0, gems = 0, reason = "", now = Date.now(),courseId=null },
  ) {
    if (db.prepare("SELECT id FROM ledger WHERE id=?").get(id)) return false;
    const before=state.xp;
    const grant=applyXPBoost(state,xp);
    db.prepare("INSERT INTO ledger(id,created_at,xp,gems,reason,course_id) VALUES (?,?,?,?,?,?)").run(
      id,
      now,
      grant.xp,
      gems,
      reason,
      courseId,
    );
    state.xp += grant.xp;
    state.gems += gems;
    state.lastReward={...grant,gems,id,courseId};
    syncLevelRewards(state,{now,fromXp:before});
    return true;
  }
  // Schema and old profile migrate together. Numeric lesson ids remain scoped
  // by course, and historical rewards are preserved rather than reissued.
  transaction(()=>{
    for(const table of ["attempts","jobs","drafts","capstones","knowledge_attempts","ledger"]){
      if(!db.prepare(`PRAGMA table_info(${table})`).all().some(c=>c.name==="course_id"))
        db.exec(`ALTER TABLE ${table} ADD COLUMN course_id TEXT DEFAULT 'dsa'`);
    }
    const raw=JSON.parse(db.prepare("SELECT value FROM meta WHERE key='state'").get().value);
    const migrated=normalizeGamification(normalizeCourses(raw),{retroactive:true});
    migrated.version=DATA_VERSION;
    putState(migrated);
    db.exec("PRAGMA user_version=2");
  });
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
