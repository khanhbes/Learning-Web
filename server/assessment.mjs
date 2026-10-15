import { random, shuffle, int, hash } from "../shared/random.mjs";
import { lessons, topicQuestions } from "../content/curriculum.mjs";
import { createLab, publicLab } from "../content/labs.mjs";
import {courseRegistry} from '../content/registry.mjs';
import {initialLearningProgress,publicTeachingLab,ASSESSMENT_VERSION} from '../content/pedagogy/engine.mjs';
import {
  problems,
  generateInput,
  oracle,
  VERSION,
  checkOutput,
} from "../content/problems.mjs";
function different(value, n) {
  if (typeof value === "number") return value + n + 1;
  if (typeof value === "boolean") return !value;
  if (Array.isArray(value)) {
    if (!value.length) return [n + 1];
    const out = structuredClone(value);
    if (typeof out[0] === "number") out[0] += n + 1;
    else if (Array.isArray(out[0])) out[0] = [n + 999];
    else out.push(n + 1);
    return out;
  }
  if (value && typeof value === "object") {
    let out = structuredClone(value);
    out.encoded = (out.encoded ?? "") + "#";
    return out;
  }
  return String(value) + n;
}
function question(id, prompt, correct, wrong, explanation, rng) {
  const texts = [correct, ...wrong].filter((x, i, a) => a.indexOf(x) === i);
  let n = 1;
  while (texts.length < 3) {
    const candidate = "Không có đủ thông tin · lựa chọn " + n++;
    if (!texts.includes(candidate)) texts.push(candidate);
  }
  const options = shuffle(texts, rng).map((text, i) => ({
    id: `o-${hash(id + ":" + text + ":" + rng()).toString(16)}`,
    text,
  }));
  return {
    id,
    prompt,
    options,
    answerId: options.find((o) => o.text === correct).id,
    explanation,
  };
}
export function generateQuestions(lesson, mode, seed, definition = null) {
  const teaching=definition??courseRegistry[lesson.courseId??'dsa'];
  if(teaching?.generateUnderstandingQuestions)return teaching.generateUnderstandingQuestions(lesson,mode,seed);
  const lessonList=definition?.lessons??lessons,topics=definition?.topicQuestions??topicQuestions;
  const inputFor=definition?.generateInput??generateInput,answerFor=definition?.oracle??oracle;
  const check=definition?.checkOutput??checkOutput,problemList=definition?.problems??problems;
  const rng = random(seed),
    rows = [];
  const pool =
    lesson.kind === "exam"
      ? lessonList
          .filter(
            (l) =>
              l.id < lesson.id &&
              l.id > Math.max(0,...lessonList.filter(x=>x.kind==="exam" && x.id<lesson.id).map(x=>x.id)),
          )
          .flatMap((l) =>
            topics[l.pack].map((row) => ({ row, pack: l.pack })),
          )
      : topics[lesson.pack].map((row) => ({ row, pack: lesson.pack }));
  const n =
    mode === "practice" || mode === "review"
      ? 8
      : lesson.kind === "exam"
        ? 10
        : 5;
  const conceptual = n === 10 ? 6 : n === 8 ? 5 : 3;
  const chosen = shuffle(pool, rng).slice(0, conceptual);
  for (let i = 0; i < chosen.length; i++) {
    const { row } = chosen[i];
    rows.push(
      question(
        `q-${i}`,
        row[0],
        row[1],
        row.slice(2),
        row[1] + ". Xem lại phần khái niệm và ví dụ trong bài.",
        rng,
      ),
    );
  }
  for (let i = rows.length; i < n; i++) {
    const taskIds =
      lesson.kind === "exam" ? lesson.problemIds : [lesson.problemIds[0]];
    const pid = taskIds[i % taskIds.length];
    if(definition?.traceQuestion) {
      const trace=definition.traceQuestion(pid,`${seed}:trace:${i}`);
      rows.push(question(`q-${i}`,trace.prompt,JSON.stringify(trace.answer),trace.wrongAnswers.map(v=>JSON.stringify(v)),trace.explanation,rng));
      rows.at(-1).input=trace.input;rows.at(-1).problemId=pid;
      continue;
    }
    const
      input = inputFor(pid, `${seed}:trace:${i}`),
      correct = JSON.stringify(answerFor(pid, input)),
      wrong = [1, 2, 3, 4]
        .map((j) => different(answerFor(pid, input), j))
        .filter((candidate) => !check(pid, input, candidate))
        .map((candidate) => JSON.stringify(candidate));
    rows.push(
      question(
        `q-${i}`,
        `Chạy tay ${problemList[pid].title}. Kết quả trả về với dữ liệu sau là gì?`,
        correct,
        wrong.slice(0, 2),
        `Kết quả đúng là ${correct}. Đối chiếu các bước mô phỏng ${problemList[pid].skill}.`,
        rng,
      ),
    );
    rows.at(-1).input = input;
    rows.at(-1).problemId = pid;
  }
  return rows;
}
export function newAttempt(lesson, mode, seed, id, now, definition = null) {
  definition??=courseRegistry[lesson.courseId??'dsa'];
  const flow=definition.teachingFlow?.(lesson);
  return {
    id,
    courseId: definition?.course.id??"dsa",
    lessonId: lesson.id,
    mode,
    seed,
    version: definition?.VERSION??VERSION,
    assessmentVersion:ASSESSMENT_VERSION,
    ...(flow?{teachingVersion:flow.version}:{}),
    ...(flow&&mode!=='assessment'?{learningProgress:initialLearningProgress(flow)}:{}),
    createdAt: now,
    updatedAt: now,
    status: "active",
    questions: generateQuestions(lesson, mode, seed,definition),
    answers: {},
    codeDrafts: {},
    codesPassed: [],
    requiredProblems:
      mode === "assessment"
        ? lesson.kind === "exam"
          ? lesson.problemIds
          : [lesson.problemIds[0]]
        : [],
    jobIds: [],
    result: null,
    lab: ["practice", "review"].includes(mode) ? (definition?.createLab??createLab)(lesson, seed) : null,
    learningCursor: {
      phase: mode === "review" ? "practice" : "learn",
      block: 0,
    },
  };
}
export function publicAttempt(a) {
  const flow=courseRegistry[a.courseId??'dsa']?.teachingFlow?.(a.lessonId);
  return {
    ...a,
    ...(flow&&a.mode!=='assessment'&&a.mode!=='capstone'?{learningProgress:a.learningProgress??initialLearningProgress(flow,a.learningCursor)}:{}),
    lab: publicTeachingLab(a.lab),
    questions: a.questions.map((q) => {
      const { answerId, explanation,traceAnswer,feedbackByOption, ...publicQ } = q;
      return a.status === "completed" ? q : publicQ;
    }),
  };
}
export function capstoneQuestions(seed) {
  const rng = random(seed);
  const rows = [
    question(
      "q-0",
      topicQuestions.topo[0][0],
      topicQuestions.topo[0][1],
      topicQuestions.topo[0].slice(2),
      "Topo chỉ có trên DAG.",
      rng,
    ),
    question(
      "q-1",
      topicQuestions.prefix[1][0],
      topicQuestions.prefix[1][1],
      topicQuestions.prefix[1].slice(2),
      "Dùng prefix n+1 ô để xử lý l=0.",
      rng,
    ),
  ];
  for (const [i, pid] of ["topo", "priority", "prefix", "priority"].entries()) {
    const input = generateInput(pid, seed + ":final:" + i),
      expected = oracle(pid, input),
      correct = JSON.stringify(expected);
    const q = question(
      "q-" + (i + 2),
      "Chạy tay " + problems[pid].title + ". Kết quả là gì?",
      correct,
      [1, 2, 3]
        .map((n) => different(expected, n))
        .filter((candidate) => !checkOutput(pid, input, candidate))
        .map((candidate) => JSON.stringify(candidate))
        .slice(0, 2),
      "Đầu ra hợp lệ theo đề: " + correct,
      rng,
    );
    q.input = input;
    q.problemId = pid;
    rows.push(q);
  }
  return rows;
}
export function scoreAttempt(a) {
  let correct = 0;
  const details = a.questions.map((q) => {
    let ok = a.answers[q.id] === q.answerId;
    if (ok) correct++;
    return {
      id: q.id,
      correct: ok,
      selected: a.answers[q.id] ?? null,
      answerId: q.answerId,
      explanation: q.feedbackByOption?.[a.answers[q.id]]??q.explanation,
    };
  });
  const knowledge = Math.round((correct / a.questions.length) * 100),
    codePassed = a.requiredProblems.every((id) => a.codesPassed.includes(id));
  return {
    knowledge,
    correct,
    total: a.questions.length,
    codePassed,
    passed: knowledge >= 80 && codePassed,
    details,
  };
}
export function unlocked(s, id) {
  if (id === 1) return true;
  if (id <= 48) return !!s.progress[id - 1]?.passed;
  return s.capstonePassed;
}
