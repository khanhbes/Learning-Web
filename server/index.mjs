import Fastify from "fastify";
import { configuration } from "./config.mjs";
import { installAuth } from "./auth.mjs";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { createStore, DATA_VERSION } from "./store.mjs";
import { courseRegistry,getCourse,courseForProblem } from "../content/registry.mjs";
import { courseState,persistCourse,courseSummary,courseUnlocked,normalizeCourses } from "./course-state.mjs";
import { runML,mlRunnerHealth } from "./ml-runner.mjs";
import { runGit,gitRunnerHealth } from "./git-runner.mjs";
import { registerKnowledgeRoutes,validateSavedKnowledgeAttempt } from "./knowledge.mjs";
import { knowledgeById } from "../content/knowledge.mjs";
import { registerGamificationRoutes,purchaseExtended,awardCourseCosmetic,normalizeGamification } from "./gamification.mjs";
import { extendedShop } from "../shared/cosmetics.mjs";
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
for(const definition of Object.values(courseRegistry))validateContent({course:definition.course,lessons:definition.lessons,problems:definition.problems,sources:definition.sources});
const courseIdSchema=z.enum(Object.keys(courseRegistry));
const languageSchema=z.enum(["python","cpp","shell"]);
const profileSchema = z.object({
  name: z.string().trim().min(1).max(32),
  language: languageSchema,
  dailyGoal: z.number().int().min(20).max(200),
  skin: z.string().optional(),
  activeCourse: courseIdSchema.optional(),
  settings: z.object({sound:z.boolean().optional(),reducedMotion:z.boolean().optional()}).optional(),
  avatarFrame:z.string().max(100).nullable().optional(),
});
const answerSchema = z.record(z.string(), z.string().max(64));
const codeSchema = z.object({
  problemId: z.string(),
  language: languageSchema,
  code: z.string().min(1).max(50000),
  publicOnly: z.boolean().default(false),
});
const draftCodeSchema = z.record(
  z.string(),
  z.object({
    python: z.string().max(50000).optional(),
    cpp: z.string().max(50000).optional(),
    shell: z.string().max(50000).optional(),
  }),
);
const savedAttemptSchema = z
  .object({
    id: z.string().uuid(),
    lessonId: z.number().int().min(1).max(60),
    mode: z.enum(["practice", "review", "assessment", "capstone"]),
    status: z.enum(["active", "completed", "abandoned"]),
    seed: z.string().max(200),
    version: z.string().min(1).max(80),
    courseId: courseIdSchema.default("dsa"),
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
          problemId: z.string(),
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
    language: languageSchema,
    publicOnly: z.boolean(),
    createdAt: z.number(),
    version: z.string().min(1).max(80),
    courseId: courseIdSchema.default("dsa"),
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
  assetRoot=resolve("dist"),
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
        ? [config.origin, ...(config.additionalOrigins ?? [])].includes(origin)
        : /^http:\/\/(127\.0\.0\.1|localhost):(3001|5173)$/.test(origin))
    )
      throw fail("Origin không được phép.", 403);
    const host = (req.headers.host ?? "localhost").split(":")[0];
    if (!config.cloud && !["localhost", "127.0.0.1"].includes(host))
      throw fail("Chỉ phục vụ local.", 403);
    reply.header("X-Content-Type-Options", "nosniff");
  });
  installAuth(app, store, config, now);
  const capstoneAliases=[];
  app.addHook("onRoute",route=>{if(route.method!=="HEAD" && /^\/api\/capstones?(\/|$)/.test(route.url))capstoneAliases.push({method:route.method,url:"/api/courses/:courseId"+route.url.slice(4),handler:route.handler});});
  app.setErrorHandler((e, req, reply) =>
    reply.code(e instanceof z.ZodError ? 400 : (e.statusCode ?? 500)).send({
      error: e instanceof z.ZodError ? "Dữ liệu chưa hợp lệ." : e.message,
    }),
  );
  function state() {
    return store.transaction(() => {
      const s = refreshGame(store.getState(), now());
      awardChapters(s, units);
      for(const def of Object.values(courseRegistry)) {
        const c=courseSummary(s,def,now());
        if(c.capstonePassed && c.completed===def.course.mandatoryLessons)awardCourseCosmetic(s,def.course.id,{now:now()});
      }
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
      const def=getCourse(a.courseId);
      a.lab = (def.createLab??createLab)(def.lessons[a.lessonId - 1], a.seed);
      store.put("attempts", a);
    }
    return a;
  }
  function cap(id,courseId) {
    const a = store.get("capstones", id);
    if (!a) throw fail("Không tìm thấy bài cuối khóa.", 404);
    if(courseId && a.courseId!==courseId)throw fail("Bài cuối khóa thuộc khóa khác.",404);
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
    const summaries=Object.fromEntries(Object.entries(courseRegistry).map(([id,def])=>[id,courseSummary(s,def,now())]));
    const c=summaries[s.activeCourse];
    return {
      ...s,
      ...c,courses:summaries,
      profile:{...s.profile,language:c.language},
      quests: quests({...s,progress:c.progress,mandatoryLessons:c.mandatoryCount}, now()),
      leagueRows: leagueRows(s, now()),
      tierName: TIERS[s.league.tier],
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
      if(p.avatarFrame && !s.avatarFrames.includes(p.avatarFrame))throw fail("Bạn chưa sở hữu khung này.");
      if(p.activeCourse)s.activeCourse=p.activeCourse;
      const def=getCourse(s.activeCourse),c=courseState(s,s.activeCourse);
      if(!def.course.languages.includes(p.language))throw fail("Ngôn ngữ không thuộc khóa.");
      c.language=p.language;persistCourse(s,s.activeCourse,c);
      s.profile = { ...s.profile, ...p,settings:{...s.profile.settings,...p.settings} };
      s.profile.language=s.courses.dsa.language;
      store.putState(s);
      return view(s);
    });
  });
  const courseView=(s,id)=>{const def=getCourse(id),summary=courseSummary(s,def,now());return {...def.course,...summary,id,languages:def.course.languages,lessons:def.lessons.map(l=>({id:l.id,title:l.title,kind:l.kind,pack:l.pack,unitId:l.unitId,duration:l.duration,problemIds:l.problemIds,courseId:id,unlocked:courseUnlocked(s,def,l.id),progress:summary.progress[l.id]??null}))};};
  app.get("/api/courses",async()=>{const s=state();return {courses:Object.keys(courseRegistry).map(id=>courseView(s,id))};});
  app.get("/api/courses/:courseId",async req=>courseView(state(),req.params.courseId));
  app.get("/api/courses/:courseId/lessons/:id",async req=>{
    const def=getCourse(req.params.courseId),l=def.lessons.find(l=>l.id===Number(req.params.id));
    if(!l)throw fail("Không tìm thấy buổi học.",404);
    if(!courseUnlocked(state(),def,l.id))throw fail("Hoàn thành buổi trước để mở khóa.",403);
    return {...def.lessonMaterial(l),courseId:def.course.id,sources:def.sources.filter(s=>l.sourcePrefixes.includes(s.prefix)),problems:l.problemIds.map(id=>def.problemDetails(id)),helpers:def.helpers};
  });
  app.post("/api/courses/git/workbench",async req=>{
    const b=z.object({lessonId:z.number().int().positive(),script:z.string().max(50000)}).parse(req.body),def=getCourse("git");
    const lesson=def.lessons.find(l=>l.id===b.lessonId);
    if(!lesson || !courseUnlocked(state(),def,lesson.id))throw fail("Bài chưa mở khóa.",403);
    if(store.list("attempts").some(a=>a.courseId==="git"&&a.mode==="assessment"&&a.status==="active"))throw fail("Workbench ẩn trong lượt kiểm tra.",403);
    const material=def.lessonMaterial(lesson),visual=material.visualization;
    const input=def.generateInput(visual?.problemId??lesson.problemIds[0],`workbench:${lesson.id}`);
    return def.runGitScript(visual?.initial??input.initial,b.script);
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
  app.get("/api/sources", async req => {const def=getCourse(req.query.courseId??"dsa");return {sources:def.sources,corrections:def.corrections??[],courseId:def.course.id};});
  app.get("/sources/:file", async (req, reply) => {
    const entry = sources.find((s) => s.file === req.params.file);
    if (!entry) throw fail("Ảnh không tồn tại.", 404);
    return reply
      .type("image/jpeg")
      .send(readFileSync(resolve("study documents/DSA", entry.file)));
  });
  app.get("/sources/:courseId/:file",async(req,reply)=>{const def=getCourse(req.params.courseId),entry=def.sources.find(s=>s.file===req.params.file);if(!entry)throw fail("Ảnh không tồn tại.",404);return reply.type("image/jpeg").send(readFileSync(resolve("study documents",def.sourceDirectory??def.course.id.toUpperCase(),entry.file)));});
  app.get("/api/health", async () => ({
    mode: config.cloud ? "cloud" : "local",
    runner: await health(),
    mlRunner: await mlRunnerHealth(),
    gitRunner: gitRunnerHealth(),
    ai: await aiHealth(),
    version: VERSION,
  }));
  app.get("/api/traces/:pid", async (req) => {
    const pid = req.params.pid;
    const foundDefinition=courseForProblem(pid);
    if(foundDefinition.course.id!=="dsa") {
      const def=foundDefinition,l=def.lessons.find(l=>l.problemIds.includes(pid)&&courseUnlocked(state(),def,l.id)&&(req.query.lessonId===undefined||l.id===Number(req.query.lessonId)));
      if(!l)throw fail("Bài chưa mở khóa.",403);
      if(store.list("attempts").some(a=>a.courseId===def.course.id&&a.mode==="assessment"&&a.status==="active"))throw fail("Mô phỏng ẩn trong kiểm tra.",403);
      const input=req.query.seed?def.generateInput(pid,String(req.query.seed)):def.problems[pid].sampleInput;
      return {...def.traceFor(pid,input),edgeCount:0};
    }
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
  app.get("/api/attempts", async req =>
    store.list("attempts").filter(a=>a.courseId===(req.query.courseId??"dsa")).map((a) => ({
      id: a.id,
      courseId:a.courseId,
      lessonId: a.lessonId,
      mode: a.mode,
      status: a.status,
      updatedAt: a.updatedAt,
      result: a.result,
    })),
  );
  app.post("/api/attempts", async (req) => {
    const { lessonId, mode, retake,courseId } = z
      .object({
        lessonId: z.number().int().min(1).max(60),
        mode: z.enum(["practice", "assessment", "review"]),
        retake: z.boolean().default(false),
        courseId:courseIdSchema.default("dsa"),
      })
      .parse(req.body);
    return store.transaction(() => {
      const s = refreshGame(store.getState(), now());
      const def=getCourse(courseId),c=courseState(s,courseId);
      if (!courseUnlocked(s,def,lessonId)) throw fail("Buổi học chưa mở khóa.", 403);
      const old = store
        .list("attempts")
        .find(
          (a) =>
            a.courseId===courseId && a.lessonId === lessonId && a.mode === mode && a.status === "active",
        );
      if (old && !retake) return publicAttempt(getAttempt(old.id));
      if (old) {
        old.status = "abandoned";
        store.put("attempts", old);
      }
      const l = def.lessons[lessonId - 1];
      if (
        mode === "practice" &&
        l.kind !== "exam" &&
        !c.started.includes(lessonId)
      ) {
        if (s.energy < 5)
          throw fail(
            "Chưa đủ năng lượng. Ôn miễn phí hoặc đổi gem để hồi.",
            409,
          );
        s.energy -= 5;
        s.energyAt = now();
        c.started.push(lessonId);
      }
      const id = randomUUID(),
        a = newAttempt(l, mode, randomUUID(), id, now(),def);
      persistCourse(s,courseId,c);
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
      const correct = (getCourse(a.courseId).checkLab??checkLab)(q, value),
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
        labCursor: z.number().int().min(0).max(7).optional(),
        codeDrafts: z
          .record(
            z.string(),
            z.object({
              python: z.string().max(50000).optional(),
              cpp: z.string().max(50000).optional(),
              shell: z.string().max(50000).optional(),
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
          if (!getCourse(a.courseId).lessons[a.lessonId - 1].problemIds.includes(pid))
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
    const def=getCourse(a.courseId);
    if(!def.course.languages.includes(body.language))throw fail("Ngôn ngữ không thuộc khóa.");
    const allowed =
      table === "capstones"
        ? a.requiredProblems
        : def.lessons[a.lessonId - 1].problemIds;
    if (!allowed.includes(body.problemId)) throw fail("Bài không thuộc đề.");
    if (a.mode === "assessment" && body.publicOnly)
      throw fail("Kiểm tra tính điểm chỉ nhận lượt chấm đầy đủ.");
    const id = randomUUID(),
      job = {
        id,
        courseId:a.courseId,
        status: "queued",
        attemptId: a.id,
        problemId: body.problemId,
        language: body.language,
        publicOnly: body.publicOnly,
        createdAt: now(),
        version: a.version,
        fixtures: [...(table==="capstones"&&a.courseId!=="dsa"?[{input:a.tasks[body.problemId],expected:def.oracle(body.problemId,a.tasks[body.problemId]),group:"sample",name:"Dữ liệu cuối khóa của bạn"}]:[]),...def.testsFor(body.problemId, a.seed, {
          publicOnly: body.publicOnly,
          version: a.version,
        })],
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
        const runner = execute!==runCode ? execute : def.course.runtime==="pyodide" ? options=>runML(options,def) : def.course.runtime==="git-sim" ? options=>runGit(options,def) : execute;
        job.result = await runner({
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
      const def=getCourse(a.courseId),c=courseState(s,a.courseId);
      let reward = { xp: 0, gems: 0 };
      if (a.mode === "assessment") {
        const previous = c.progress[a.lessonId] ?? {
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
              def.lessons[a.lessonId - 1].kind === "exam"
                ? { xp: 100, gems: 30 }
                : { xp: 50, gems: 10 };
            if (
              store.reward(s, (a.courseId==="dsa"?"":a.courseId+":")+"lesson:" + a.lessonId, {
                ...reward,
                reason: "Hoàn thành buổi",
                now: now(),
                courseId:a.courseId,
              })
            ) {
              reward={...reward,...s.lastReward};
              recordXP(s, reward.xp, now());
              daily(s, now()).lessons++;
            } else reward = { xp: 0, gems: 0 };
            if (
              def.lessons[a.lessonId - 1].kind === "exam" &&
              !s.badges.includes((a.courseId==="dsa"?"":a.courseId+":")+"checkpoint-" + a.lessonId)
            )
              s.badges.push((a.courseId==="dsa"?"":a.courseId+":")+"checkpoint-" + a.lessonId);
          }
        }
        c.progress[a.lessonId] = previous;
        if(a.courseId==="dsa")awardChapters(s, units);
        else for(const unit of def.course.units.filter(u=>u.range[1]<=def.course.mandatoryLessons)) {
          const badge=a.courseId+":chapter-"+unit.id;
          if(def.lessons.filter(l=>l.unitId===unit.id).every(l=>c.progress[l.id]?.passed)&&!s.badges.includes(badge))s.badges.push(badge);
        }
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
            reward={...reward,...s.lastReward};
            recordXP(s, reward.xp, now());
          }
        }
        const progress = c.progress[a.lessonId];
        if (progress) {
          progress.reviewStage = Math.min(3, (progress.reviewStage ?? 0) + 1);
          progress.nextReview =
            now() + [1, 3, 7, 14][progress.reviewStage] * 86400000;
          progress.mistakes = a.questions.length - result.correct;
        }
      } else if (a.mode === "review" && c.progress[a.lessonId]) {
        c.progress[a.lessonId].nextReview = now() + 86400000;
        c.progress[a.lessonId].mistakes = a.questions.length - result.correct;
      }
      a.status = "completed";
      persistCourse(s,a.courseId,c);
      a.result = { ...result, reward, mode: a.mode };
      a.updatedAt = now();
      store.put("attempts", a);
      store.putState(s);
      return a.result;
    }),
  );
  app.get("/api/solutions/:pid", async (req) => {
    const pid = req.params.pid,def=courseForProblem(pid),
      l = def.lessons.find(
        (l) =>
          l.problemIds.includes(pid) &&
          courseUnlocked(state(),def,l.id) &&
          (req.query.lessonId === undefined ||
            l.id === Number(req.query.lessonId)),
      );
    if (!def.problems[pid] || !l) throw fail("Lời giải chưa mở.", 403);
    if (
      store
        .list("attempts")
        .some(
          (a) =>
            a.mode === "assessment" &&
            a.status === "active" &&
            getCourse(a.courseId).lessons[a.lessonId - 1].problemIds.includes(pid),
        )
    )
      throw fail("Lời giải ẩn trong kiểm tra đang làm.", 403);
    return {
      ...Object.fromEntries(def.course.languages.map(language=>[language,
        def.course.id==="dsa" && l.id===39 && pid==="union-find" ? componentsSolution(language) : def.solution(pid,language)])),
      helpers: def.helpers,
    };
  });
  app.get("/api/review", async req => {
    const s = state(),def=getCourse(req.query.courseId??"dsa"),c=courseState(s,def.course.id),
      list = reviewList({...s,...c}, def.lessons, now());
    return {
      items: list.length ? list : [{ ...def.lessons[0], due: now(), mistakes: 0 }],
      intervals: [1, 3, 7, 14],
    };
  });
  app.get("/api/shop", async () => ({ items: [...shop.filter(i=>i.type!=="skin"),...extendedShop], chestTable }));
  app.post("/api/shop/buy", async (req) => {
    const { itemId,requestId } = z.object({ itemId: z.string(),requestId:z.string().max(100).optional() }).parse(req.body),
      item = [...shop,...extendedShop].find((i) => i.id === itemId);
    if (!item) throw fail("Vật phẩm không tồn tại.");
    return store.transaction(() => {
      const s = refreshGame(store.getState(), now());
      if(["energy","freeze"].includes(item.type)){
        s.purchaseRequests??={};
        if(requestId && Object.hasOwn(s.purchaseRequests,requestId)){
          if(s.purchaseRequests[requestId].itemId!==itemId)throw fail("Mã mua đã dùng cho vật phẩm khác.");
          return view(s);
        }
        purchase(s, item);if(requestId)Object.defineProperty(s.purchaseRequests,requestId,{value:{itemId},enumerable:true,writable:true,configurable:true});
      }else purchaseExtended(s,itemId,{requestId,now:now()});
      store.putState(s);
      return view(s);
    });
  });
  app.post("/api/quests/claim", async () =>
    store.transaction(() => {
      const s = refreshGame(store.getState(), now()),
        c=courseSummary(s,getCourse(s.activeCourse),now()),q = quests({...s,...c,mandatoryLessons:c.mandatoryCount}, now());
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
        courseId:courseIdSchema.default("dsa"),
      })
      .parse(req.body);
    const def=getCourse(b.courseId);
    if (!courseUnlocked(state(),def,b.lessonId)) throw fail("Buổi chưa mở khóa.", 403);
    if (
      store
        .list("attempts")
        .some((a) => a.mode === "assessment" && a.status === "active")
    )
      throw fail("Trợ giảng ẩn trong lượt kiểm tra.", 403);
    reserveAI();
    return tutor({ ...b, lesson: def.lessonMaterial(def.lessons[b.lessonId - 1]) });
  });
  app.get("/api/capstone", async req => {
    const s = state(),def=getCourse(req.params.courseId??"dsa"),id=def.course.id,cs=id==="dsa"?{essayFields,capstoneProblems}:def;
    const caps=store.list("capstones").filter(a=>a.courseId===id);
    return {
      courseId:id,title:cs.capstoneTitle??def.course.capstone?.title??"Lập kế hoạch học thông minh",
      unlocked: courseSummary(s,def).capstoneUnlocked,
      fields: cs.essayFields,
      latest: caps[0]
        ? publicAttempt(caps[0])
        : null,
      versions: store
        .list("drafts")
        .filter(d=>d.courseId===id)
        .slice(0, 30)
        .map((d) => ({
          id: d.id,
          createdAt: d.createdAt,
          capstoneId: d.capstoneId,
        })),
      problems: cs.capstoneProblems.map(pid=>def.problemDetails(pid)),
    };
  });
  app.post("/api/capstone", async req => {
    const def=getCourse(req.params.courseId??"dsa");
    if (!courseSummary(state(),def).capstoneUnlocked)
      throw fail(`Hoàn thành đủ ${def.course.mandatoryLessons} buổi bắt buộc.`, 403);
    const old = store.list("capstones").find((a) => a.courseId===def.course.id && a.status === "active");
    if (old) return publicAttempt(old);
    const a = (def.course.id==="dsa"?createCapstone:def.createCapstone)(now());
    a.courseId=def.course.id;
    store.put("capstones", a);
    return publicAttempt(a);
  });
  app.post("/api/capstone/retake", async req => {
    const def=getCourse(req.params.courseId??"dsa");
    if (!courseSummary(state(),def).capstoneUnlocked)
      throw fail("Chưa mở bài cuối khóa.", 403);
    const old = store.list("capstones").find((a) => a.courseId===def.course.id && a.status === "active");
    if (old) {
      old.status = "abandoned";
      store.put("capstones", old);
    }
    const a = (def.course.id==="dsa"?createCapstone:def.createCapstone)(now());
    a.courseId=def.course.id;
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
              shell: z.string().max(50000).optional(),
            }),
          )
          .optional(),
        customTests: z
          .array(
            z.object({
              problemId: z.string(),
              input: z.unknown(),
              expected: z.unknown(),
            }),
          )
          .max(30)
          .optional(),
      })
      .parse(req.body);
    return store.transaction(() => {
      const a = cap(req.params.id,req.params.courseId??"dsa");
      const cs=a.courseId==="dsa"?{essayFields,capstoneProblems}:getCourse(a.courseId);
      if (a.status !== "active") throw fail("Bài đã nộp.");
      if (b.essay)
        for (const [key, value] of Object.entries(b.essay)) {
          if (!cs.essayFields.some((f) => f.id === key))
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
          if (!cs.capstoneProblems.includes(key))
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
          courseId:a.courseId,
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
    if(d.courseId!==(req.params.courseId??"dsa"))throw fail("Bản nháp thuộc khóa khác.",404);
    return d;
  });
  app.get("/api/capstone/:id", async (req) =>
    publicAttempt(cap(req.params.id,req.params.courseId??"dsa")),
  );
  app.get("/api/capstones/:id", async (req) =>
    publicAttempt(cap(req.params.id,req.params.courseId??"dsa")),
  );
  app.post("/api/capstones/:id/code", async (req) =>
    scheduleCode(cap(req.params.id,req.params.courseId??"dsa"), codeSchema.parse(req.body), "capstones"),
  );
  app.post("/api/capstone/:id/code", async (req) =>
    scheduleCode(cap(req.params.id,req.params.courseId??"dsa"), codeSchema.parse(req.body), "capstones"),
  );
  app.post("/api/capstone/:id/submit", async (req) =>
    store.transaction(() => {
      const a = cap(req.params.id,req.params.courseId??"dsa");
      const def=getCourse(a.courseId),cs=a.courseId==="dsa"?{capstoneProblems,gradeCapstone}:def;
      if (a.status === "completed") return a.result;
      if (a.status !== "active") throw fail("Bài đã bỏ.");
      if (
        a.jobIds.some((id) =>
          ["queued", "running"].includes(store.get("jobs", id)?.status),
        )
      )
        throw fail("Code đang được chấm.", 409);
      if (
        cs.capstoneProblems.some(
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
      const result = cs.gradeCapstone(a);
      if (!result.essayComplete) throw fail("Điền đủ năm phần bài luận.");
      a.result = result;
      a.status = "completed";
      store.put("capstones", a);
      const s = refreshGame(store.getState(), now());
      const c=courseState(s,a.courseId);
      c.capstoneScore = Math.max(c.capstoneScore, result.score);
      if (result.passed) {
        c.capstonePassed = true;
        const badge=a.courseId==="dsa"?"graduate":a.courseId+":graduate";
        if (!s.badges.includes(badge)) s.badges.push(badge);
        awardCourseCosmetic(s,a.courseId);
        if (
          store.reward(s, (a.courseId==="dsa"?"":a.courseId+":")+"capstone", {
            xp: 200,
            gems: 100,
            reason: "Hoàn thành khóa",
            now: now(),
            courseId:a.courseId,
          })
        )
          recordXP(s, s.lastReward.xp, now());
      }
      persistCourse(s,a.courseId,c);
      store.putState(s);
      return result;
    }),
  );
  app.post("/api/capstone/:id/feedback", async (req) => {
    const a = cap(req.params.id,req.params.courseId??"dsa");
    if (a.status !== "completed") throw fail("Nhận xét chỉ mở sau khi nộp.");
    reserveAI();
    const feedback = await tutor({ essay: a.essay });
    a.feedback = feedback;
    store.put("capstones", a);
    return feedback;
  });
  for(const route of capstoneAliases)app.route(route);
  registerGamificationRoutes(app,{store,now});
  registerKnowledgeRoutes(app,{store,now,reward:store.reward});
  app.post("/api/knowledge/feedback",async req=>{
    const b=z.object({courseId:courseIdSchema,topicId:z.string(),text:z.string().min(1).max(20000)}).parse(req.body);
    const topic=knowledgeById[b.topicId];if(!topic||topic.courseId!==b.courseId)throw fail("Chủ đề không thuộc khóa.");
    if(store.list("attempts").some(a=>a.mode==="assessment"&&a.status==="active"))throw fail("Trợ giảng ẩn trong lượt kiểm tra.",403);
    reserveAI();return tutor({essay:{topic:topic.title,rubric:JSON.stringify(topic.essay),answer:b.text}});
  });
  app.post("/api/courses/:courseId/chests/:unit/claim",async req=>store.transaction(()=>{
    const def=getCourse(req.params.courseId),s=refreshGame(store.getState(),now()),c=courseState(s,def.course.id),unit=def.course.units.find(u=>u.id===Number(req.params.unit));
    if(!unit)throw fail("Chặng không tồn tại.");
    if(!def.lessons.filter(l=>l.unitId===unit.id).every(l=>c.progress[l.id]?.passed))throw fail("Hoàn thành chặng để mở hộp quà.");
    const id=(def.course.id==="dsa"?"":def.course.id+":")+"chest:"+unit.id;if(s.claimed.includes(id))throw fail("Hộp quà đã mở.");
    const reward=chestReward(id);if(reward.type==="freeze"&&s.freeze<2)s.freeze++;else store.reward(s,id,{gems:reward.type==="gems"?reward.amount:10,reason:"Hộp quà",courseId:def.course.id,now:now()});
    s.claimed.push(id);store.putState(s);return {reward,state:view(s)};
  }));
  app.get("/api/data/export", async () => ({
    version: DATA_VERSION,
    exportedAt: now(),
    state: state(),
    attempts: store.list("attempts"),
    jobs: store.list("jobs"),
    ledger: store.db.prepare("SELECT * FROM ledger").all(),
    capstones: store.list("capstones"),
    drafts: store.list("drafts"),
    knowledgeAttempts:store.list("knowledge_attempts"),
  }));
  // Backup data can legitimately contain group labels named "constructor" or
  // "__proto__" in saved checker outputs. Parse this route into null-prototype
  // dictionaries; keep Fastify's stricter default parser on every other route.
  app.register(async importApp=>{
    importApp.removeContentTypeParser("application/json");
    importApp.addContentTypeParser("application/json",{parseAs:"string"},(_req,body,done)=>{
      try{done(null,JSON.parse(body,(_key,value)=>value&&typeof value==="object"&&!Array.isArray(value)?Object.assign(Object.create(null),value):value));}
      catch{done(fail("Bản sao không phải JSON hợp lệ."));}
    });
  importApp.post(
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
          version: z.union([z.literal(1),z.literal(DATA_VERSION)]),
          state: z
            .object({
              version: z.union([z.literal(1),z.literal(DATA_VERSION)]),
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
              activeCourse:courseIdSchema.optional(),
              courses:z.record(courseIdSchema,z.object({
                progress:z.record(z.string(),z.object({passed:z.boolean(),bestKnowledge:z.number().min(0).max(100)}).passthrough()),
                started:z.array(z.number().int().positive()),language:languageSchema,
                capstonePassed:z.boolean(),capstoneScore:z.number().min(0).max(100)
              })).optional(),
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
              course_id:z.string().nullable().optional(),
            }),
          ),
          capstones: z.array(
            savedAttemptSchema.extend({
              essay: z.record(z.string(), z.string()),
              customTests: z.array(z.unknown()),
              courseId:courseIdSchema.default("dsa"),
              tasks: z.record(z.string(), z.unknown()),
            }),
          ),
          knowledgeAttempts:z.array(z.unknown()).default([]),
          drafts: z.array(
            z.object({
              id: z.string().uuid(),
              capstoneId: z.string().uuid(),
              createdAt: z.number(),
              essay: z.record(z.string(), z.string()),
              codeDrafts: draftCodeSchema,
              customTests: z.array(z.unknown()),
              courseId:courseIdSchema.default("dsa"),
            }),
          ),
        })
        .parse(req.body);
      for (const a of [...b.attempts, ...b.capstones]) {
        const def=getCourse(a.courseId);
        if (
          a.questions.some(
            (q) => !q.options.some((o) => o.id === q.answerId),
          ) ||
          a.requiredProblems.some((id) => !Object.hasOwn(def.problems,id)) ||
          Object.keys(a.codeDrafts).some((id) => !Object.hasOwn(def.problems,id)) ||
          ![def.VERSION,...(a.courseId==="dsa"?[LEGACY_VERSION]:[])].includes(a.version)
        )
          throw fail("Bản sao chứa câu hỏi hoặc bài code không hợp lệ.");
      }
      if(b.knowledgeAttempts.some(a=>!validateSavedKnowledgeAttempt(a)))throw fail("Bản sao luyện thêm không khớp seed và phiên bản.");
      return store.transaction(() => {
        for (const t of ["attempts", "jobs", "ledger", "capstones", "drafts","knowledge_attempts"])
          store.db.exec(`DELETE FROM ${t}`);
        b.state.version=DATA_VERSION;
        store.putState(normalizeGamification(normalizeCourses(b.state),{retroactive:true,now:now()}));
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
        for(const a of b.knowledgeAttempts)store.put("knowledge_attempts",a);
        for (const r of b.ledger)
          store.db
            .prepare("INSERT INTO ledger(id,created_at,xp,gems,reason,course_id) VALUES (?,?,?,?,?,?)")
            .run(r.id, r.created_at, r.xp, r.gems, r.reason,r.course_id??"dsa");
        const restored = refreshGame(store.getState(), now());
        store.putState(restored);
        return view(restored);
      });
    },
  );
  });
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
    const path = resolve(assetRoot,"assets", tail);
    if (!existsSync(path)) throw fail("Asset không tồn tại.", 404);
    return reply
      .type(mime[extname(path)] ?? "application/octet-stream")
      .send(readFileSync(path));
  });
  app.setNotFoundHandler((req, reply) => {
    if (req.url.startsWith("/api/") || req.url.startsWith("/sources/"))
      return reply.code(404).send({ error: "Không tìm thấy." });
    if (existsSync(resolve(assetRoot,"index.html")))
      return reply.type("text/html").send(readFileSync(resolve(assetRoot,"index.html")));
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
