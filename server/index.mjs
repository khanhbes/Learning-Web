import Fastify from "fastify";
import { configuration } from "./config.mjs";
import { installAuth } from "./auth.mjs";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { createStore, DATA_VERSION } from "./store.mjs";
import {
  course,
  lessons,
  units,
  lessonMaterial,
  packs,
} from "../content/curriculum.mjs";
import {
  problems,
  interviewIds,
  VERSION,
  LEGACY_VERSION,
  testsFor,
  generateInput,
  oracle,
} from "../content/problems.mjs";
import {
  solution,
  starter,
  pythonHelpers,
  cppHelpers,
} from "../content/solutions.mjs";
import { corrections } from "../content/sources-map.mjs";
import {
  newAttempt,
  publicAttempt,
  scoreAttempt,
  unlocked,
} from "./assessment.mjs";
import {
  refreshGame,
  dayKey,
  daily,
  recordXP,
  quests,
  shop,
  purchase,
  chestReward,
  chestTable,
  leagueRows,
  reviewList,
  TIERS,
  awardChapters,
} from "./game.mjs";
import { runCode, runnerHealth } from "./runner.mjs";
import { tutorHealth, askTutor } from "./tutor.mjs";
import {
  createCapstone,
  gradeCapstone,
  essayFields,
  capstoneProblems,
} from "./capstone.mjs";
import { traceFor } from "../shared/traces.mjs";
import { checkLab, createLab } from "../content/labs.mjs";
import { edgeInputs } from "../content/fixtures.mjs";
import { validateContent } from "../content/schema.mjs";
import {
  componentsGuide,
  componentsSolution,
} from "../content/alternatives.mjs";
const sources = JSON.parse(
  readFileSync(new URL("../content/sources.json", import.meta.url), "utf8"),
);
validateContent({ course, lessons, problems, sources });
const profileSchema = z.object({
  name: z.string().trim().min(1).max(32),
  language: z.enum(["python", "cpp"]),
  dailyGoal: z.number().int().min(20).max(200),
  skin: z.string().optional(),
});
const answerSchema = z.record(z.string(), z.string().max(64));
const codeSchema = z.object({
  problemId: z.string(),
  language: z.enum(["python", "cpp"]),
  code: z.string().min(1).max(50000),
  publicOnly: z.boolean().default(false),
});
const draftCodeSchema = z.record(
  z.string(),
  z.object({
    python: z.string().max(50000).optional(),
    cpp: z.string().max(50000).optional(),
  }),
);
const savedAttemptSchema = z
  .object({
    id: z.string().uuid(),
    lessonId: z.number().int().min(1).max(60),
    mode: z.enum(["practice", "review", "assessment", "capstone"]),
    status: z.enum(["active", "completed", "abandoned"]),
    seed: z.string().max(200),
    version: z.enum([VERSION, LEGACY_VERSION]),
    createdAt: z.number(),
    updatedAt: z.number(),
    questions: z
      .array(
        z
          .object({
            id: z.string(),
            prompt: z.string(),
            options: z
              .array(z.object({ id: z.string(), text: z.string() }))
              .min(2)
              .max(8),
            answerId: z.string(),
            explanation: z.string(),
          })
          .passthrough(),
      )
      .min(1)
      .max(10),
    answers: answerSchema,
    codeDrafts: draftCodeSchema,
    codesPassed: z.array(z.string()),
    requiredProblems: z.array(z.string()),
    jobIds: z.array(z.string().uuid()),
    result: z.unknown(),
    essay: z.record(z.string(), z.string().max(20000)).optional(),
    customTests: z
      .array(
        z.object({
          problemId: z.enum(["topo", "priority", "prefix"]),
          input: z.unknown(),
          expected: z.unknown(),
        }),
      )
      .max(30)
      .optional(),
  })
  .passthrough();
const savedJobSchema = z
  .object({
    id: z.string().uuid(),
    attemptId: z.string().uuid(),
    problemId: z.string(),
    language: z.enum(["python", "cpp"]),
    publicOnly: z.boolean(),
    createdAt: z.number(),
    version: z.enum([VERSION, LEGACY_VERSION]),
    code: z.string().max(50000),
    status: z.enum(["queued", "running", "completed", "error"]),
    result: z.unknown(),
  })
  .passthrough();
const fail = (message, statusCode = 400) =>
  Object.assign(new Error(message), { statusCode });
export async function createApp({
  store = createStore(process.env.BYTEPATH_DB || ".data/bytepath.sqlite"),
  execute = runCode,
  now = () => Date.now(),
  log = false,
  health = runnerHealth,
  aiHealth = tutorHealth,
  tutor = askTutor,
  config = configuration(),
} = {}) {
  const app = Fastify({
    logger: log
      ? {
          level: "info",
          redact: [
            "req.headers.cookie",
            "req.headers.authorization",
            "req.body.password",
          ],
        }
      : false,
    bodyLimit: 2 * 1024 * 1024,
  });
  app.addHook("onRequest", async (req, reply) => {
    const origin = req.headers.origin;
    if (
      origin &&
      !(config.cloud
        ? origin === config.origin
        : /^http:\/\/(127\.0\.0\.1|localhost):(3001|5173)$/.test(origin))
    )
      throw fail("Origin không được phép.", 403);
    const host = (req.headers.host ?? "localhost").split(":")[0];
    if (!config.cloud && !["localhost", "127.0.0.1"].includes(host))
      throw fail("Chỉ phục vụ local.", 403);
    reply.header("X-Content-Type-Options", "nosniff");
  });
  installAuth(app, store, config, now);
  app.setErrorHandler((e, req, reply) =>
    reply.code(e instanceof z.ZodError ? 400 : (e.statusCode ?? 500)).send({
      error: e instanceof z.ZodError ? "Dữ liệu chưa hợp lệ." : e.message,
    }),
  );
  function state() {
    return store.transaction(() => {
      const s = refreshGame(store.getState(), now());
      awardChapters(s, units);
      store.putState(s);
      return s;
    });
  }
  function reserveAI() {
    if (config.aiProvider !== "gemini") return;
    store.transaction(() => {
      const s = refreshGame(store.getState(), now()),
        d = daily(s, now());
      const limit = Math.min(
        20,
        Math.max(1, Number(process.env.GEMINI_DAILY_LIMIT) || 20),
      );
      if ((d.aiRequests ?? 0) >= limit)
        throw fail(
          "Đã dùng hết lượt trợ giảng trong ngày. Gợi ý trong bài vẫn hoạt động.",
          429,
        );
      d.aiRequests = (d.aiRequests ?? 0) + 1;
      store.putState(s);
    });
  }
  function getAttempt(id) {
    const a = store.get("attempts", id);
    if (!a) throw fail("Không tìm thấy lượt làm.", 404);
    if (["practice", "review"].includes(a.mode) && !a.lab) {
      a.lab = createLab(lessons[a.lessonId - 1], a.seed);
      store.put("attempts", a);
    }
    return a;
  }
  function cap(id) {
    const a = store.get("capstones", id);
    if (!a) throw fail("Không tìm thấy bài cuối khóa.", 404);
    return a;
  }
  // A pass belongs to an immutable submitted source, not merely to a problem id.
  function syncCodePasses(a) {
    const latest = new Map();
    for (const id of a.jobIds) {
      const job = store.get("jobs", id);
      if (job && !job.publicOnly)
        latest.set(`${job.problemId}:${job.language}`, job);
    }
    a.codesPassed = [
      ...new Set(
        [...latest.values()]
          .filter(
            (job) =>
              job.result?.status === "accepted" &&
              job.code === a.codeDrafts[job.problemId]?.[job.language],
          )
          .map((job) => job.problemId),
      ),
    ];
  }
  function view(s) {
    const mandatory = Object.entries(s.progress).filter(
      ([id, p]) => Number(id) <= 48 && p.passed,
    );
    const learning = mandatory.filter(
      ([id]) => !lessons[Number(id) - 1]?.kind.includes("exam"),
    );
    const exams = mandatory.filter(
      ([id]) => lessons[Number(id) - 1]?.kind === "exam",
    );
    const avg = (rows) =>
      rows.length
        ? rows.reduce((v, [, p]) => v + p.bestKnowledge, 0) / rows.length
        : 0;
    return {
      ...s,
      quests: quests(s, now()),
      leagueRows: leagueRows(s, now()),
      tierName: TIERS[s.league.tier],
      courseScore: Math.round(
        0.3 * avg(learning) + 0.3 * avg(exams) + 0.4 * s.capstoneScore,
      ),
      completed: mandatory.length,
      capstoneUnlocked: mandatory.length === 48,
      reviewDue: reviewList(s, lessons, now()).filter((l) => l.due <= now())
        .length,
      today: dayKey(now()),
    };
  }
  app.get("/api/state", async () => view(state()));
  app.put("/api/profile", async (req) => {
    const p = profileSchema.parse(req.body);
    return store.transaction(() => {
      const s = refreshGame(store.getState(), now());
      if (p.skin && !s.inventory.includes(p.skin))
        throw fail("Bạn chưa sở hữu skin này.");
      s.profile = { ...s.profile, ...p };
      store.putState(s);
      return view(s);
    });
  });
  app.get("/api/course", async () => {
    const s = state();
    return {
      ...course,
      lessons: lessons.map((l) => ({
        id: l.id,
        title: l.title,
        kind: l.kind,
        pack: l.pack,
        unitId: l.unitId,
        duration: l.duration,
        problemIds: l.problemIds,
        unlocked: unlocked(s, l.id),
        progress: s.progress[l.id] ?? null,
      })),
    };
  });
  app.get("/api/lessons/:id", async (req) => {
    const id = Number(req.params.id),
      l = lessons.find((l) => l.id === id);
    if (!l) throw fail("Không tìm thấy buổi học.", 404);
    if (!unlocked(state(), id))
      throw fail("Hoàn thành buổi trước để mở khóa.", 403);
    return {
      ...lessonMaterial(l),
      sources: sources.filter((s) => l.sourcePrefixes.includes(s.prefix)),
      problems: l.problemIds.map((id) => ({
        ...problems[id],
        ...(l.id === 39 && id === "union-find"
          ? {
              hints: [
                componentsGuide.intuition,
                "Dùng danh sách kề, queue và visited.",
                componentsGuide.algorithm,
              ],
            }
          : {}),
        starters: { python: starter(id, "python"), cpp: starter(id, "cpp") },
      })),
      helpers: { python: pythonHelpers, cpp: cppHelpers },
    };
  });
  app.get("/api/sources", async () => ({ sources, corrections }));
  app.get("/sources/:file", async (req, reply) => {
    const entry = sources.find((s) => s.file === req.params.file);
    if (!entry) throw fail("Ảnh không tồn tại.", 404);
    return reply
      .type("image/jpeg")
      .send(readFileSync(resolve("DSA", entry.file)));
  });
  app.get("/api/health", async () => ({
    mode: config.cloud ? "cloud" : "local",
    runner: await health(),
    ai: await aiHealth(),
    version: VERSION,
  }));
  app.get("/api/traces/:pid", async (req) => {
    const pid = req.params.pid;
    if (!problems[pid]) throw fail("Bài không tồn tại.");
    if (
      !lessons.some(
        (l) =>
          l.problemIds.includes(pid) &&
          unlocked(state(), l.id) &&
          (req.query.lessonId === undefined ||
            l.id === Number(req.query.lessonId)),
      )
    )
      throw fail("Bài chưa mở khóa.", 403);
    if (
      store
        .list("attempts")
        .some(
          (a) =>
            a.mode === "assessment" &&
            a.status === "active" &&
            lessons[a.lessonId - 1].problemIds.includes(pid),
        )
    )
      throw fail("Mô phỏng ẩn trong kiểm tra.", 403);
    let input = req.query.seed
      ? generateInput(pid, String(req.query.seed))
      : problems[pid].sampleInput;
    const variant = z
      .enum([
        "insertion",
        "bubble",
        "selection",
        "merge",
        "quick",
        "counting",
        "radix",
        "heap",
        "tree-pre",
        "tree-in",
        "tree-post",
        "tree-bfs",
        "components-bfs",
      ])
      .default("insertion")
      .parse(req.query.variant);
    const edges = edgeInputs(pid);
    if (req.query.edge !== undefined) {
      const i = Number(req.query.edge);
      if (!Number.isInteger(i) || i < 0 || i >= edges.length)
        throw fail("Trường hợp biên không tồn tại.");
      input = edges[i];
    }
    return { ...traceFor(pid, input, { variant }), edgeCount: edges.length };
  });
  app.get("/api/attempts", async () =>
    store.list("attempts").map((a) => ({
      id: a.id,
      lessonId: a.lessonId,
      mode: a.mode,
      status: a.status,
      updatedAt: a.updatedAt,
      result: a.result,
    })),
  );
  app.post("/api/attempts", async (req) => {
    const { lessonId, mode, retake } = z
      .object({
        lessonId: z.number().int().min(1).max(60),
        mode: z.enum(["practice", "assessment", "review"]),
        retake: z.boolean().default(false),
      })
      .parse(req.body);
    return store.transaction(() => {
      const s = refreshGame(store.getState(), now());
      if (!unlocked(s, lessonId)) throw fail("Buổi học chưa mở khóa.", 403);
      const old = store
        .list("attempts")
        .find(
          (a) =>
            a.lessonId === lessonId && a.mode === mode && a.status === "active",
        );
      if (old && !retake) return publicAttempt(getAttempt(old.id));
      if (old) {
        old.status = "abandoned";
        store.put("attempts", old);
      }
      const l = lessons[lessonId - 1];
      if (
        mode === "practice" &&
        l.kind !== "exam" &&
        !s.started.includes(lessonId)
      ) {
        if (s.energy < 5)
          throw fail(
            "Chưa đủ năng lượng. Ôn miễn phí hoặc đổi gem để hồi.",
            409,
          );
        s.energy -= 5;
        s.energyAt = now();
        s.started.push(lessonId);
      }
      const id = randomUUID(),
        a = newAttempt(l, mode, randomUUID(), id, now());
      store.put("attempts", a);
      store.putState(s);
      return publicAttempt(a);
    });
  });
  app.get("/api/attempts/:id", async (req) =>
    publicAttempt(getAttempt(req.params.id)),
  );
  app.post("/api/attempts/:id/abandon", async (req) => {
    const a = getAttempt(req.params.id);
    if (a.status === "active") {
      a.status = "abandoned";
      store.put("attempts", a);
    }
    return { ok: true };
  });
  app.post("/api/attempts/:id/answer", async (req) => {
    const { questionId, optionId } = z
      .object({ questionId: z.string(), optionId: z.string() })
      .parse(req.body);
    return store.transaction(() => {
      const a = getAttempt(req.params.id);
      if (a.mode === "assessment" || a.status !== "active")
        throw fail("Không có gợi ý trong kiểm tra.", 403);
      const q = a.questions.find((q) => q.id === questionId);
      if (!q || !q.options.some((o) => o.id === optionId))
        throw fail("Đáp án không hợp lệ.");
      a.answers[questionId] = optionId;
      a.updatedAt = now();
      store.put("attempts", a);
      return { correct: q.answerId === optionId, explanation: q.explanation };
    });
  });
  app.post("/api/attempts/:id/lab", async (req) => {
    const { questionId, value } = z
      .object({
        questionId: z.string(),
        value: z.union([
          z.string().max(50000),
          z.array(z.string().max(64)).max(10),
          z.record(z.string().max(64), z.string().max(64)),
        ]),
      })
      .parse(req.body);
    return store.transaction(() => {
      const a = getAttempt(req.params.id);
      if (a.mode === "assessment" || a.status !== "active")
        throw fail("Thực hành tương tác chỉ mở ngoài lượt kiểm tra.", 403);
      const q = a.lab?.questions.find((q) => q.id === questionId);
      if (!q) throw fail("Hoạt động không thuộc lượt học.");
      const correct = checkLab(q, value),
        wasCorrect = a.lab.completed?.includes(q.id);
      if (correct && !wasCorrect) (a.lab.completed ??= []).push(q.id);
      a.lab.responses[q.id] = { value, correct, explanation: q.explanation };
      a.updatedAt = now();
      store.put("attempts", a);
      if (correct && !wasCorrect) {
        const s = refreshGame(store.getState(), now());
        daily(s, now()).labCompletions =
          (daily(s, now()).labCompletions ?? 0) + 1;
        store.putState(s);
      }
      return { correct, explanation: q.explanation, attempt: publicAttempt(a) };
    });
  });
  app.patch("/api/attempts/:id", async (req) => {
    const p = z
      .object({
        answers: answerSchema.optional(),
        learningCursor: z
          .object({
            phase: z.enum(["learn", "visual", "practice", "code"]),
            block: z.number().int().min(0).max(10),
          })
          .optional(),
        labDrafts: z
          .record(
            z.string().max(64),
            z.union([
              z.string().max(50000),
              z.array(z.string().max(64)).max(10),
              z.record(z.string().max(64), z.string().max(64)),
            ]),
          )
          .optional(),
        labCursor: z.number().int().min(0).max(3).optional(),
        codeDrafts: z
          .record(
            z.string(),
            z.object({
              python: z.string().max(50000).optional(),
              cpp: z.string().max(50000).optional(),
            }),
          )
          .optional(),
      })
      .parse(req.body);
    return store.transaction(() => {
      const a = getAttempt(req.params.id);
      if (a.status !== "active") throw fail("Lượt đã kết thúc.");
      if (p.answers) {
        for (const [qid, oid] of Object.entries(p.answers)) {
          const q = a.questions.find((q) => q.id === qid);
          if (!q || !q.options.some((o) => o.id === oid))
            throw fail("Đáp án không thuộc đề.");
        }
        a.answers = { ...a.answers, ...p.answers };
      }
      if (p.learningCursor && a.mode !== "assessment")
        a.learningCursor = p.learningCursor;
      if (p.labDrafts) {
        if (a.mode === "assessment" || !a.lab)
          throw fail("Hoạt động không mở trong kiểm tra.", 403);
        for (const id of Object.keys(p.labDrafts))
          if (!a.lab.questions.some((q) => q.id === id))
            throw fail("Hoạt động không thuộc lượt học.");
        a.lab.drafts = { ...a.lab.drafts, ...p.labDrafts };
      }
      if (p.labCursor !== undefined) {
        if (!a.lab || a.mode === "assessment")
          throw fail("Hoạt động không mở trong kiểm tra.", 403);
        a.lab.cursor = p.labCursor;
      }
      if (p.codeDrafts)
        for (const [pid, draft] of Object.entries(p.codeDrafts)) {
          if (!lessons[a.lessonId - 1].problemIds.includes(pid))
            throw fail("Bài code không thuộc buổi.");
          a.codeDrafts[pid] = { ...a.codeDrafts[pid], ...draft };
        }
      syncCodePasses(a);
      a.updatedAt = now();
      store.put("attempts", a);
      return publicAttempt(a);
    });
  });
  app.post("/api/attempts/:id/code", async (req) =>
    scheduleCode(
      getAttempt(req.params.id),
      codeSchema.parse(req.body),
      "attempts",
    ),
  );
  async function scheduleCode(a, body, table) {
    if (a.status !== "active") throw fail("Lượt đã kết thúc.");
    const allowed =
      table === "capstones"
        ? capstoneProblems
        : lessons[a.lessonId - 1].problemIds;
    if (!allowed.includes(body.problemId)) throw fail("Bài không thuộc đề.");
    if (a.mode === "assessment" && body.publicOnly)
      throw fail("Kiểm tra tính điểm chỉ nhận lượt chấm đầy đủ.");
    const id = randomUUID(),
      job = {
        id,
        status: "queued",
        attemptId: a.id,
        problemId: body.problemId,
        language: body.language,
        publicOnly: body.publicOnly,
        createdAt: now(),
        version: a.version,
        fixtures: testsFor(body.problemId, a.seed, {
          publicOnly: body.publicOnly,
          version: a.version,
        }),
        result: null,
        code: body.code,
      };
    store.transaction(() => {
      a = store.get(table, a.id);
      a.codeDrafts[body.problemId] = {
        ...a.codeDrafts[body.problemId],
        [body.language]: body.code,
      };
      a.jobIds.push(id);
      store.put("jobs", job);
      syncCodePasses(a);
      store.put(table, a);
      store.put("jobs", job);
    });
    // The persistent job owns the source snapshot; later editor changes cannot alter its result.
    Promise.resolve().then(async () => {
      job.status = "running";
      store.put("jobs", job);
      try {
        job.result = await execute({
          ...body,
          seed: a.seed,
          version: job.version,
          fixtures: job.fixtures,
        });
      } catch (e) {
        job.result = {
          status: "infrastructure_error",
          message: "Bộ chấm gặp lỗi; bài chưa có kết quả.",
        };
      }
      job.status =
        job.result.status === "infrastructure_error" ? "error" : "completed";
      store.transaction(() => {
        store.put("jobs", job);
        const current = store.get(table, a.id);
        if (current?.status === "active") {
          syncCodePasses(current);
          store.put(table, current);
        }
        if (
          current?.status === "active" &&
          job.result.status === "accepted" &&
          !body.publicOnly
        ) {
          const s = refreshGame(store.getState(), now());
          daily(s, now()).codes++;
          if (!s.badges.includes("first-code")) s.badges.push("first-code");
          if (
            job.version === VERSION &&
            job.result.checks?.some((c) => c.group === "edge") &&
            !s.badges.includes("edge-master")
          )
            s.badges.push("edge-master");
          if (
            store
              .list("jobs")
              .some(
                (j) =>
                  j.id !== job.id &&
                  j.problemId === job.problemId &&
                  j.code !== job.code &&
                  !j.publicOnly &&
                  ["rejected", "runtime_error", "compile_error"].includes(
                    j.result?.status,
                  ),
              ) &&
            !s.badges.includes("debugger")
          )
            s.badges.push("debugger");
          store.putState(s);
          store.put(table, current);
        }
      });
    });
    return { jobId: id };
  }
  app.get("/api/jobs/:id", async (req) => {
    const j = store.get("jobs", req.params.id);
    if (!j) throw fail("Không tìm thấy lượt chạy.", 404);
    const { code, fixtures, ...publicJ } = j;
    return publicJ;
  });
  app.post("/api/attempts/:id/submit", async (req) =>
    store.transaction(() => {
      const a = getAttempt(req.params.id);
      if (a.status === "completed") return a.result;
      if (a.status !== "active") throw fail("Lượt đã bỏ.");
      if (
        a.jobIds.some((id) =>
          ["queued", "running"].includes(store.get("jobs", id)?.status),
        )
      )
        throw fail("Bài code đang được chấm; chờ kết quả.", 409);
      if (a.questions.some((q) => !a.answers[q.id]))
        throw fail("Hãy trả lời đủ câu hỏi trước khi nộp.");
      const codeError = a.requiredProblems.some(
        (pid) =>
          !a.codesPassed.includes(pid) &&
          a.jobIds
            .map((id) => store.get("jobs", id))
            .filter((j) => j.problemId === pid && !j.publicOnly)
            .at(-1)?.result?.status === "infrastructure_error",
      );
      if (codeError)
        throw fail(
          "Chưa có kết quả code do lỗi bộ chấm. Hãy chấm lại; chưa đánh fail.",
          409,
        );
      const result = scoreAttempt(a),
        s = refreshGame(store.getState(), now());
      let reward = { xp: 0, gems: 0 };
      if (a.mode === "assessment") {
        const previous = s.progress[a.lessonId] ?? {
          passed: false,
          bestKnowledge: 0,
          mistakes: 0,
          reviewStage: 0,
        };
        previous.bestKnowledge = Math.max(
          previous.bestKnowledge,
          result.knowledge,
        );
        previous.mistakes = a.questions.length - result.correct;
        if (result.passed) {
          const first = !previous.passed;
          previous.passed = true;
          previous.nextReview = now() + 86400000;
          if (first) {
            reward =
              lessons[a.lessonId - 1].kind === "exam"
                ? { xp: 100, gems: 30 }
                : { xp: 50, gems: 10 };
            if (
              store.reward(s, "lesson:" + a.lessonId, {
                ...reward,
                reason: "Hoàn thành buổi",
                now: now(),
              })
            ) {
              recordXP(s, reward.xp, now());
              daily(s, now()).lessons++;
            } else reward = { xp: 0, gems: 0 };
            if (
              lessons[a.lessonId - 1].kind === "exam" &&
              !s.badges.includes("checkpoint-" + a.lessonId)
            )
              s.badges.push("checkpoint-" + a.lessonId);
          }
        }
        s.progress[a.lessonId] = previous;
        awardChapters(s, units);
      } else if (a.mode === "review" && result.passed) {
        s.energy = Math.min(30, s.energy + 5);
        daily(s, now()).reviews++;
        const d = daily(s, now());
        if (d.reviewRewards < 5) {
          reward = { xp: 10, gems: 0 };
          if (
            store.reward(s, "review:" + a.id, {
              ...reward,
              reason: "Ôn tập",
              now: now(),
            })
          ) {
            d.reviewRewards++;
            recordXP(s, 10, now());
          }
        }
        const progress = s.progress[a.lessonId];
        if (progress) {
          progress.reviewStage = Math.min(3, (progress.reviewStage ?? 0) + 1);
          progress.nextReview =
            now() + [1, 3, 7, 14][progress.reviewStage] * 86400000;
          progress.mistakes = a.questions.length - result.correct;
        }
      } else if (a.mode === "review" && s.progress[a.lessonId]) {
        s.progress[a.lessonId].nextReview = now() + 86400000;
        s.progress[a.lessonId].mistakes = a.questions.length - result.correct;
      }
      a.status = "completed";
      a.result = { ...result, reward, mode: a.mode };
      a.updatedAt = now();
      store.put("attempts", a);
      store.putState(s);
      return a.result;
    }),
  );
  app.get("/api/solutions/:pid", async (req) => {
    const pid = req.params.pid,
      l = lessons.find(
        (l) =>
          l.problemIds.includes(pid) &&
          unlocked(state(), l.id) &&
          (req.query.lessonId === undefined ||
            l.id === Number(req.query.lessonId)),
      );
    if (!problems[pid] || !l) throw fail("Lời giải chưa mở.", 403);
    if (
      store
        .list("attempts")
        .some(
          (a) =>
            a.mode === "assessment" &&
            a.status === "active" &&
            lessons[a.lessonId - 1].problemIds.includes(pid),
        )
    )
      throw fail("Lời giải ẩn trong kiểm tra đang làm.", 403);
    return {
      python:
        l.id === 39 && pid === "union-find"
          ? componentsSolution("python")
          : solution(pid, "python"),
      cpp:
        l.id === 39 && pid === "union-find"
          ? componentsSolution("cpp")
          : solution(pid, "cpp"),
      helpers: { python: pythonHelpers, cpp: cppHelpers },
    };
  });
  app.get("/api/review", async () => {
    const s = state(),
      list = reviewList(s, lessons, now());
    return {
      items: list.length ? list : [{ ...lessons[0], due: now(), mistakes: 0 }],
      intervals: [1, 3, 7, 14],
    };
  });
  app.get("/api/shop", async () => ({ items: shop, chestTable }));
  app.post("/api/shop/buy", async (req) => {
    const { itemId } = z.object({ itemId: z.string() }).parse(req.body),
      item = shop.find((i) => i.id === itemId);
    if (!item) throw fail("Vật phẩm không tồn tại.");
    return store.transaction(() => {
      const s = refreshGame(store.getState(), now());
      purchase(s, item);
      store.putState(s);
      return view(s);
    });
  });
  app.post("/api/quests/claim", async () =>
    store.transaction(() => {
      const s = refreshGame(store.getState(), now()),
        q = quests(s, now());
      if (!q.every((v) => v.current >= v.target))
        throw fail("Hoàn thành đủ nhiệm vụ trước khi nhận.");
      const id = "quest:" + dayKey(now());
      if (
        !store.reward(s, id, { gems: 15, reason: "Nhiệm vụ ngày", now: now() })
      )
        throw fail("Bạn đã nhận quà hôm nay.");
      s.claimed.push(id);
      store.putState(s);
      return view(s);
    }),
  );
  app.post("/api/chests/:unit/claim", async (req) =>
    store.transaction(() => {
      const unit = units.find((u) => u.id === Number(req.params.unit));
      if (!unit) throw fail("Chặng không tồn tại.");
      const s = refreshGame(store.getState(), now());
      if (
        !lessons
          .filter((l) => l.unitId === unit.id)
          .every((l) => s.progress[l.id]?.passed)
      )
        throw fail("Hoàn thành chặng để mở hộp quà.");
      const id = "chest:" + unit.id;
      if (s.claimed.includes(id)) throw fail("Hộp quà đã mở.");
      const reward = chestReward(id);
      if (reward.type === "freeze" && s.freeze < 2) s.freeze++;
      else
        store.reward(s, id, {
          gems: reward.type === "gems" ? reward.amount : 10,
          reason: "Hộp quà",
          now: now(),
        });
      s.claimed.push(id);
      store.putState(s);
      return { reward, state: view(s) };
    }),
  );
  app.post("/api/tutor", async (req) => {
    const b = z
      .object({
        question: z.string().min(1).max(2000),
        lessonId: z.number().int().min(1).max(60),
        diagnostic: z.string().max(3000).optional(),
        code: z.string().max(10000).optional(),
      })
      .parse(req.body);
    if (!unlocked(state(), b.lessonId)) throw fail("Buổi chưa mở khóa.", 403);
    if (
      store
        .list("attempts")
        .some((a) => a.mode === "assessment" && a.status === "active")
    )
      throw fail("Trợ giảng ẩn trong lượt kiểm tra.", 403);
    reserveAI();
    return tutor({ ...b, lesson: lessons[b.lessonId - 1] });
  });
  app.get("/api/capstone", async () => {
    const s = state();
    return {
      unlocked: view(s).capstoneUnlocked,
      fields: essayFields,
      latest: store.list("capstones")[0]
        ? publicAttempt(store.list("capstones")[0])
        : null,
      versions: store
        .list("drafts")
        .slice(0, 30)
        .map((d) => ({
          id: d.id,
          createdAt: d.createdAt,
          capstoneId: d.capstoneId,
        })),
      problems: capstoneProblems.map((id) => ({
        ...problems[id],
        starters: { python: starter(id, "python"), cpp: starter(id, "cpp") },
      })),
    };
  });
  app.post("/api/capstone", async () => {
    if (!view(state()).capstoneUnlocked)
      throw fail("Hoàn thành đủ 48 buổi bắt buộc.", 403);
    const old = store.list("capstones").find((a) => a.status === "active");
    if (old) return publicAttempt(old);
    const a = createCapstone(now());
    store.put("capstones", a);
    return publicAttempt(a);
  });
  app.post("/api/capstone/retake", async () => {
    if (!view(state()).capstoneUnlocked)
      throw fail("Chưa mở bài cuối khóa.", 403);
    const old = store.list("capstones").find((a) => a.status === "active");
    if (old) {
      old.status = "abandoned";
      store.put("capstones", old);
    }
    const a = createCapstone(now());
    store.put("capstones", a);
    return publicAttempt(a);
  });
  app.patch("/api/capstone/:id", async (req) => {
    const b = z
      .object({
        essay: z.record(z.string(), z.string().max(20000)).optional(),
        answers: answerSchema.optional(),
        codeDrafts: z
          .record(
            z.string(),
            z.object({
              python: z.string().max(50000).optional(),
              cpp: z.string().max(50000).optional(),
            }),
          )
          .optional(),
        customTests: z
          .array(
            z.object({
              problemId: z.enum(["topo", "priority", "prefix"]),
              input: z.unknown(),
              expected: z.unknown(),
            }),
          )
          .max(30)
          .optional(),
      })
      .parse(req.body);
    return store.transaction(() => {
      const a = cap(req.params.id);
      if (a.status !== "active") throw fail("Bài đã nộp.");
      if (b.essay)
        for (const [key, value] of Object.entries(b.essay)) {
          if (!essayFields.some((f) => f.id === key))
            throw fail("Mục luận không hợp lệ.");
          a.essay[key] = value;
        }
      if (b.answers)
        for (const [key, value] of Object.entries(b.answers)) {
          if (
            !a.questions
              .find((q) => q.id === key)
              ?.options.some((o) => o.id === value)
          )
            throw fail("Đáp án không hợp lệ.");
          a.answers[key] = value;
        }
      if (b.codeDrafts)
        for (const [key, value] of Object.entries(b.codeDrafts)) {
          if (!capstoneProblems.includes(key))
            throw fail("Bài code không hợp lệ.");
          a.codeDrafts[key] = { ...a.codeDrafts[key], ...value };
        }
      if (b.customTests) a.customTests = b.customTests;
      syncCodePasses(a);
      a.updatedAt = now();
      store.put("capstones", a);
      const previous = store.list("drafts").find((d) => d.capstoneId === a.id);
      if (!previous || now() - previous.createdAt >= 30000)
        store.put("drafts", {
          id: randomUUID(),
          capstoneId: a.id,
          createdAt: now(),
          essay: a.essay,
          codeDrafts: a.codeDrafts,
          customTests: a.customTests,
        });
      return publicAttempt(a);
    });
  });
  app.get("/api/capstone/versions/:id", async (req) => {
    const d = store.get("drafts", req.params.id);
    if (!d) throw fail("Không tìm thấy bản nháp.", 404);
    return d;
  });
  app.get("/api/capstone/:id", async (req) =>
    publicAttempt(cap(req.params.id)),
  );
  app.get("/api/capstones/:id", async (req) =>
    publicAttempt(cap(req.params.id)),
  );
  app.post("/api/capstones/:id/code", async (req) =>
    scheduleCode(cap(req.params.id), codeSchema.parse(req.body), "capstones"),
  );
  app.post("/api/capstone/:id/code", async (req) =>
    scheduleCode(cap(req.params.id), codeSchema.parse(req.body), "capstones"),
  );
  app.post("/api/capstone/:id/submit", async (req) =>
    store.transaction(() => {
      const a = cap(req.params.id);
      if (a.status === "completed") return a.result;
      if (a.status !== "active") throw fail("Bài đã bỏ.");
      if (
        a.jobIds.some((id) =>
          ["queued", "running"].includes(store.get("jobs", id)?.status),
        )
      )
        throw fail("Code đang được chấm.", 409);
      if (
        capstoneProblems.some(
          (pid) =>
            !a.codesPassed.includes(pid) &&
            a.jobIds
              .map((id) => store.get("jobs", id))
              .filter((j) => j.problemId === pid)
              .at(-1)?.result?.status === "infrastructure_error",
        )
      )
        throw fail("Bộ chấm chưa có kết quả. Chấm lại trước khi nộp.", 409);
      if (a.questions.some((q) => !a.answers[q.id]))
        throw fail("Trả lời đủ các câu kiểm chứng.");
      const result = gradeCapstone(a);
      if (!result.essayComplete) throw fail("Điền đủ năm phần bài luận.");
      a.result = result;
      a.status = "completed";
      store.put("capstones", a);
      const s = refreshGame(store.getState(), now());
      s.capstoneScore = Math.max(s.capstoneScore, result.score);
      if (result.passed) {
        s.capstonePassed = true;
        if (!s.badges.includes("graduate")) s.badges.push("graduate");
        if (
          store.reward(s, "capstone", {
            xp: 200,
            gems: 100,
            reason: "Hoàn thành khóa",
            now: now(),
          })
        )
          recordXP(s, 200, now());
      }
      store.putState(s);
      return result;
    }),
  );
  app.post("/api/capstone/:id/feedback", async (req) => {
    const a = cap(req.params.id);
    if (a.status !== "completed") throw fail("Nhận xét chỉ mở sau khi nộp.");
    reserveAI();
    const feedback = await tutor({ essay: a.essay });
    a.feedback = feedback;
    store.put("capstones", a);
    return feedback;
  });
  app.get("/api/data/export", async () => ({
    version: DATA_VERSION,
    exportedAt: now(),
    state: state(),
    attempts: store.list("attempts"),
    jobs: store.list("jobs"),
    ledger: store.db.prepare("SELECT * FROM ledger").all(),
    capstones: store.list("capstones"),
    drafts: store.list("drafts"),
  }));
  app.post(
    "/api/data/import",
    { bodyLimit: 128 * 1024 * 1024 },
    async (req) => {
      if (
        store.list("jobs").some((j) => ["running", "queued"].includes(j.status))
      )
        throw fail(
          "Chờ các lượt chấm hiện tại kết thúc trước khi khôi phục dữ liệu.",
          409,
        );
      const b = z
        .object({
          version: z.literal(DATA_VERSION),
          state: z
            .object({
              version: z.literal(DATA_VERSION),
              profile: profileSchema.extend({
                name: z.string().trim().max(32),
              }),
              xp: z.number().nonnegative(),
              gems: z.number().nonnegative(),
              energy: z.number().min(0).max(30),
              energyAt: z.number(),
              progress: z.record(
                z.string(),
                z
                  .object({
                    passed: z.boolean(),
                    bestKnowledge: z.number().min(0).max(100),
                  })
                  .passthrough(),
              ),
              daily: z.record(
                z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
                z
                  .object({
                    xp: z.number().nonnegative(),
                    lessons: z.number().int().nonnegative(),
                    reviews: z.number().int().nonnegative(),
                    codes: z.number().int().nonnegative(),
                    reviewRewards: z.number().int().min(0).max(5),
                  })
                  .passthrough(),
              ),
              inventory: z.array(z.string()),
              started: z.array(z.number()),
              claimed: z.array(z.string()),
              badges: z.array(z.string()),
              streak: z.number().nonnegative(),
              streakLast: z.string().nullable(),
              freeze: z.number().min(0).max(2),
              league: z.object({
                week: z.string().nullable(),
                tier: z.number().min(0).max(4),
                history: z.array(z.unknown()),
              }),
              capstonePassed: z.boolean(),
              capstoneScore: z.number().min(0).max(100),
            })
            .passthrough(),
          attempts: z.array(savedAttemptSchema),
          jobs: z.array(savedJobSchema).default([]),
          ledger: z.array(
            z.object({
              id: z.string(),
              created_at: z.number(),
              xp: z.number(),
              gems: z.number(),
              reason: z.string(),
            }),
          ),
          capstones: z.array(
            savedAttemptSchema.extend({
              essay: z.record(z.string(), z.string()),
              customTests: z.array(z.unknown()),
              tasks: z.record(z.string(), z.unknown()),
            }),
          ),
          drafts: z.array(
            z.object({
              id: z.string().uuid(),
              capstoneId: z.string().uuid(),
              createdAt: z.number(),
              essay: z.record(z.string(), z.string()),
              codeDrafts: draftCodeSchema,
              customTests: z.array(z.unknown()),
            }),
          ),
        })
        .parse(req.body);
      for (const a of [...b.attempts, ...b.capstones]) {
        if (
          a.questions.some(
            (q) => !q.options.some((o) => o.id === q.answerId),
          ) ||
          a.requiredProblems.some((id) => !problems[id]) ||
          Object.keys(a.codeDrafts).some((id) => !problems[id])
        )
          throw fail("Bản sao chứa câu hỏi hoặc bài code không hợp lệ.");
      }
      return store.transaction(() => {
        for (const t of ["attempts", "jobs", "ledger", "capstones", "drafts"])
          store.db.exec(`DELETE FROM ${t}`);
        store.putState(b.state);
        for (const j of b.jobs) {
          if (["running", "queued"].includes(j.status)) {
            j.status = "error";
            j.result = {
              status: "infrastructure_error",
              message: "Lượt chấm bị gián đoạn trong bản sao; hãy chấm lại.",
            };
          }
          store.put("jobs", j);
        }
        for (const a of b.attempts) {
          syncCodePasses(a);
          store.put("attempts", a);
        }
        for (const a of b.capstones) {
          syncCodePasses(a);
          store.put("capstones", a);
        }
        for (const a of b.drafts) store.put("drafts", a);
        for (const r of b.ledger)
          store.db
            .prepare("INSERT INTO ledger VALUES (?,?,?,?,?)")
            .run(r.id, r.created_at, r.xp, r.gems, r.reason);
        const restored = refreshGame(store.getState(), now());
        store.putState(restored);
        return view(restored);
      });
    },
  );
  // Serve only files in the build, never source, SQLite or user submissions.
  const mime = {
    ".js": "text/javascript",
    ".css": "text/css",
    ".woff2": "font/woff2",
    ".woff": "font/woff",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".json": "application/json",
  };
  app.get("/assets/*", async (req, reply) => {
    const tail = req.params["*"];
    if (!/^[a-zA-Z0-9_.-]+$/.test(tail) || tail.includes(".."))
      throw fail("Asset không tồn tại.", 404);
    const path = resolve("dist/assets", tail);
    if (!existsSync(path)) throw fail("Asset không tồn tại.", 404);
    return reply
      .type(mime[extname(path)] ?? "application/octet-stream")
      .send(readFileSync(path));
  });
  app.setNotFoundHandler((req, reply) => {
    if (req.url.startsWith("/api/") || req.url.startsWith("/sources/"))
      return reply.code(404).send({ error: "Không tìm thấy." });
    if (existsSync("dist/index.html"))
      return reply.type("text/html").send(readFileSync("dist/index.html"));
    return reply.code(503).send({
      error: "Chạy npm run build trước hoặc npm run dev để phát triển.",
    });
  });
  app.addHook("onClose", async () => store.close());
  return app;
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const config = configuration();
  const app = await createApp({ log: true, config });
  await app.listen({ host: config.host, port: config.port });
  console.log(
    "BytePath: " +
      (config.cloud ? config.origin : `http://127.0.0.1:${config.port}`),
  );
}
