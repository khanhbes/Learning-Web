import { randomUUID } from "node:crypto";
import { random, shuffle } from "../shared/random.mjs";
import { dayKey, recordXP } from "./game.mjs";
import { KNOWLEDGE_VERSION, knowledgeItems, knowledgeById, generateKnowledgeQuestion, checkKnowledgeAnswer, publicKnowledgeQuestion, publicKnowledgeItem } from "../content/knowledge.mjs";
const DAY = 86400000, REVIEW_DAYS = [1, 3, 7, 14];

export function normalizeKnowledge(s) {
  s.knowledge ??= {};
  s.knowledge.bookmarks ??= [];
  s.knowledge.progress ??= {};
  s.knowledge.daily ??= {};
  return s.knowledge;
}
export function knowledgeStats(s, courseId, now = Date.now()) {
  const k = normalizeKnowledge(s), d = k.daily[dayKey(now)] ?? {};
  const prefix = `${courseId}-`;
  const progress = Object.entries(k.progress).filter(([id]) => id.startsWith(prefix));
  return { gemsToday: d.gemsAwarded ?? 0, gemLimit: 30, xpSessionsToday: d.xpSessions ?? 0, xpSessionLimit: 3, mastered: progress.filter(([,p]) => p.firstCorrectAt !== undefined).length, due: progress.filter(([,p]) => p.firstCorrectAt !== undefined && p.dueAt <= now).length };
}
export function knowledgeCatalog(s, { courseId = "dsa", topic, difficulty, now = Date.now() } = {}) {
  const k = normalizeKnowledge(s);
  const filtered = knowledgeItems.filter((item) => item.courseId === courseId && (!topic || item.topic === topic) && (!difficulty || item.difficulty === difficulty));
  const annotate = (item) => ({ ...publicKnowledgeItem(item), bookmarked: k.bookmarks.includes(item.id), progress: item.templates.map((t) => k.progress[`${item.id}:${t.id}`] ?? null) });
  return { tips: filtered.filter((i) => i.type === "tip").map(annotate), topics: filtered.filter((i) => i.type === "interview").map(annotate), bookmarks: k.bookmarks.filter((id) => knowledgeById[id]?.courseId === courseId), stats: knowledgeStats(s, courseId, now) };
}
export function createKnowledgeAttempt(s, { courseId = "dsa", topicId, itemIds, now = Date.now(), id = randomUUID(), seed = randomUUID() } = {}) {
  if (!["dsa", "ml"].includes(courseId)) throw new Error("Khóa học không hợp lệ.");
  const candidates = knowledgeItems.filter((item) => item.courseId === courseId), k = normalizeKnowledge(s), rng = random(seed);
  const requested = itemIds ?? (topicId ? [topicId] : []);
  if (!Array.isArray(requested) || requested.length > 5 || requested.some((itemId) => knowledgeById[itemId]?.courseId !== courseId)) throw new Error("Chủ đề không thuộc khóa học đang chọn.");
  const preferred = [...new Set(requested)].map((itemId) => knowledgeById[itemId]);
  const rank = (item) => Math.min(...item.templates.map((t) => k.progress[`${item.id}:${t.id}`]?.dueAt ?? 0));
  const remaining = shuffle(candidates.filter((item) => !requested.includes(item.id)), rng).sort((a,b) => rank(a) - rank(b));
  const selected = [...preferred.flatMap((item) => [item, item]), ...remaining].slice(0, 5);
  const used = new Set();
  const questions = selected.map((item, index) => {
    const first = Math.floor(rng() * 2), templateIndex = used.has(`${item.id}:${first}`) ? 1-first : first;
    used.add(`${item.id}:${templateIndex}`);
    return generateKnowledgeQuestion(item.id, templateIndex, `${seed}:${index}`);
  });
  return { id, courseId, version: KNOWLEDGE_VERSION, mode: "knowledge", status: "active", seed, questions, answers: {}, essays: {}, createdAt: now, updatedAt: now, report: null };
}
export function publicKnowledgeAttempt(attempt) {
  return { ...attempt, questions: attempt.questions.map((q) => publicKnowledgeQuestion(q, attempt.status === "completed")) };
}
export function gradeKnowledgeAttempt(s, attempt, { now = Date.now(), reward } = {}) {
  if (attempt.status === "completed") return { report: attempt.report, duplicate: true };
  if (attempt.status !== "active" || attempt.version !== KNOWLEDGE_VERSION) throw new Error("Lượt này chưa thể nộp; bản nháp được giữ.");
  if (typeof reward !== "function") throw new Error("Chưa có hệ thống ghi nhận thưởng.");
  const k = normalizeKnowledge(s), day = dayKey(now);
  k.daily[day] ??= { gemsAwarded: 0, xpSessions: 0 };
  const daily = k.daily[day], results = [];
  let requestedGems = 0, eligibleXP = false;
  for (const question of attempt.questions) {
    const key = `${question.itemId}:${question.templateId}`, p = k.progress[key] ?? { mistakes: 0, reviewCount: 0 };
    const first = p.firstCorrectAt === undefined, due = !first && p.dueAt <= now;
    if (first || due) eligibleXP = true;
    const correct = checkKnowledgeAnswer(question, attempt.answers[question.id]);
    results.push({ questionId: question.id, itemId: question.itemId, correct, expected: question.expected, explanation: question.explanation });
    if (correct) {
      if (first || due) {
        requestedGems += first ? 3 : 1;
        if (first) { p.firstCorrectAt = now; p.reviewCount = 0; }
        else p.reviewCount++;
        p.dueAt = now + REVIEW_DAYS[Math.min(p.reviewCount, 3)] * DAY;
      }
      p.lastCorrectAt = now;
    } else p.mistakes++;
    p.lastAnsweredAt = now; p.lastAttemptId = attempt.id; k.progress[key] = p;
  }
  const correct = results.filter((r) => r.correct).length, score = correct / attempt.questions.length * 100, passed = correct >= 4;
  const gems = Math.min(requestedGems, Math.max(0, 30 - daily.gemsAwarded));
  const baseXp = passed && eligibleXP && daily.xpSessions < 3 ? 20 : 0;
  const oldXp = s.xp, oldGems = s.gems;
  if (gems && reward(s, `knowledge:${attempt.id}:gems`, { xp: 0, gems, reason: "Luyện thêm: đáp án đã kiểm chứng", courseId: attempt.courseId, now })) daily.gemsAwarded += gems;
  if (baseXp && reward(s, `knowledge:${attempt.id}:xp`, { xp: baseXp, gems: 0, reason: "Phiên luyện thêm đạt 4/5", courseId: attempt.courseId, now })) {
    daily.xpSessions++;
    recordXP(s, s.xp - oldXp, now);
  }
  const xp = s.xp - oldXp;
  // Level gift gems are excluded from this practice cap and reward display.
  const report = { score, correct, total: attempt.questions.length, passed, results, rewards: { xp, gems: gems ? Math.min(gems, s.gems - oldGems) : 0, baseXp: xp ? baseXp : 0, bonusXp: xp ? xp - baseXp : 0, boostRemaining: s.activeBoost?.charges ?? 0 }, stats: knowledgeStats(s, attempt.courseId, now), officialEssayScore: false };
  attempt.status = "completed"; attempt.completedAt = now; attempt.updatedAt = now; attempt.report = report;
  return { report, duplicate: false };
}
function validAnswer(value) {
  if (typeof value === "string") return value.length <= 500;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.length <= 12 && value.every((x) => typeof x === "string" && x.length <= 100);
  return value && typeof value === "object" && Object.keys(value).length <= 12 && Object.entries(value).every(([key,v]) => key.length <= 100 && typeof v === "string" && v.length <= 100);
}
export function saveKnowledgeAnswers(attempt, answers, now = Date.now()) {
  if (attempt.status !== "active") throw new Error("Lượt này đã nộp.");
  if (!answers || typeof answers !== "object" || Array.isArray(answers) || Object.keys(answers).length > 5) throw new Error("Câu trả lời không hợp lệ.");
  const ids = new Set(attempt.questions.map((q) => q.id));
  for (const [id,value] of Object.entries(answers)) {
    if (!ids.has(id) || !validAnswer(value)) throw new Error("Câu trả lời không thuộc lượt hoặc vượt giới hạn.");
    attempt.answers[id] = value;
  }
  attempt.updatedAt = now;
  return attempt;
}
export function validateSavedKnowledgeAttempt(value) {
  if (!value || typeof value.id !== "string" || !/^[\w-]{1,100}$/.test(value.id) || !["dsa","ml"].includes(value.courseId) || value.version !== KNOWLEDGE_VERSION || !["active","completed","abandoned"].includes(value.status) || !Array.isArray(value.questions) || value.questions.length !== 5) return false;
  // Regenerate all signed content rather than trusting imported expected answers.
  return value.questions.every((q, index) => {
    const item = knowledgeById[q.itemId], ti = item?.templates.findIndex((t) => t.id === q.templateId);
    if (!item || item.courseId !== value.courseId || ti < 0) return false;
    const actual = generateKnowledgeQuestion(q.itemId, ti, `${value.seed}:${index}`);
    return JSON.stringify(actual) === JSON.stringify(q);
  });
}
export function registerKnowledgeRoutes(app, { store, now = Date.now, reward = store.reward }) {
  app.get("/api/knowledge", async (request) => knowledgeCatalog(store.getState(), { ...request.query, now: now() }));
  app.get("/api/knowledge/attempts", async (request) => store.list("knowledge_attempts").filter((a) => !request.query.courseId || a.courseId === request.query.courseId).map(publicKnowledgeAttempt));
  app.post("/api/knowledge/attempts", async (request, reply) => {
    try { return store.transaction(() => {
      const options = request.body ?? {}, s = store.getState();
      if (!options.retake) {
        const active = store.list("knowledge_attempts").find((a) => a.status === "active" && a.courseId === (options.courseId ?? "dsa") && (!options.topicId || a.questions.some((q) => q.itemId === options.topicId)));
        if (active) return publicKnowledgeAttempt(active);
      }
      const attempt = createKnowledgeAttempt(s, { ...options, now: now(), id: randomUUID(), seed: randomUUID() });
      store.put("knowledge_attempts", attempt); store.putState(s); return publicKnowledgeAttempt(attempt);
    }); } catch (error) { return reply.code(400).send({ message: error.message }); }
  });
  app.get("/api/knowledge/attempts/:id", async (request, reply) => {
    const a = store.get("knowledge_attempts", request.params.id); return a ? publicKnowledgeAttempt(a) : reply.code(404).send({ message: "Không tìm thấy lượt luyện." });
  });
  const save = async (request, reply) => {
    try { return store.transaction(() => {
      const a = store.get("knowledge_attempts", request.params.id);
      if (!a) return reply.code(404).send({ message: "Không tìm thấy lượt luyện." });
      saveKnowledgeAnswers(a, request.body?.answers ?? {}, now());
      store.put("knowledge_attempts", a); return publicKnowledgeAttempt(a);
    }); } catch (error) { return reply.code(400).send({ message: error.message }); }
  };
  app.patch("/api/knowledge/attempts/:id/answers", save);
  app.patch("/api/knowledge/attempts/:id", save);
  app.post("/api/knowledge/attempts/:id/submit", async (request, reply) => {
    try { return store.transaction(() => {
      const a = store.get("knowledge_attempts", request.params.id);
      if (!a) return reply.code(404).send({ message: "Không tìm thấy lượt luyện." });
      if (request.body?.answers && a.status === "active") saveKnowledgeAnswers(a, request.body.answers, now());
      const s = store.getState(), result = gradeKnowledgeAttempt(s, a, { now: now(), reward });
      store.put("knowledge_attempts", a); store.putState(s); return { ...result, attempt: publicKnowledgeAttempt(a), state: s };
    }); } catch (error) { return reply.code(400).send({ message: error.message }); }
  });
  app.post("/api/knowledge/bookmarks", async (request, reply) => {
    const { id, bookmarked } = request.body ?? {};
    if (typeof id !== "string" || !Object.hasOwn(knowledgeById, id) || typeof bookmarked !== "boolean") return reply.code(400).send({ message: "Mục lưu không hợp lệ." });
    return store.transaction(() => {
      const s = store.getState(), k = normalizeKnowledge(s);
      if (bookmarked && !k.bookmarks.includes(id)) k.bookmarks.push(id);
      if (!bookmarked) k.bookmarks = k.bookmarks.filter((value) => value !== id);
      store.putState(s); return { bookmarks: k.bookmarks };
    });
  });
}
