import { randomUUID } from "node:crypto";
import {
  newAttempt,
  scoreAttempt,
  publicAttempt,
  capstoneQuestions,
} from "./assessment.mjs";
import {
  generateInput,
  problems,
  oracle,
  checkOutput,
} from "../content/problems.mjs";
export const capstoneProblems = ["topo", "priority", "prefix"];
export const essayFields = [
  {
    id: "problem",
    title: "1. Bài toán và dữ liệu",
    placeholder:
      "Ai dùng lịch học? Một cạnh tiên quyết có ý nghĩa gì? Mô tả đầu vào, đầu ra và giới hạn.",
  },
  {
    id: "approach",
    title: "2. Cấu trúc và thuật toán",
    placeholder:
      "Giải thích đồ thị/Kahn, priority queue và prefix sum. Vì sao phù hợp? Có lựa chọn khác không?",
  },
  {
    id: "edges",
    title: "3. Trường hợp biên và đánh đổi",
    placeholder:
      "Xét chu trình, node độc lập, ưu tiên bằng nhau, khoảng l=0 và bộ nhớ.",
  },
  {
    id: "validation",
    title: "4. Kiểm thử và kết quả",
    placeholder:
      "Liên hệ với các test bạn tự tạo; một lỗi đã phát hiện và cách sửa.",
  },
  {
    id: "reflection",
    title: "5. Tự đánh giá",
    placeholder: "Điều bạn hiểu rõ, giới hạn còn lại và hướng mở rộng.",
  },
];
export function createCapstone(now = Date.now()) {
  const id = randomUUID(),
    seed = randomUUID(),
    lesson = {
      kind: "exam",
      id: 48,
      pack: "topo",
      problemIds: capstoneProblems,
    };
  const a = newAttempt(lesson, "assessment", seed, id, now);
  a.mode = "capstone";
  a.questions = capstoneQuestions(seed);
  a.requiredProblems = capstoneProblems;
  a.tasks = Object.fromEntries(
    capstoneProblems.map((p) => [p, generateInput(p, seed + ":capstone")]),
  );
  a.essay = Object.fromEntries(essayFields.map((f) => [f.id, ""]));
  a.customTests = [];
  a.feedback = null;
  return a;
}
export function validCustomInput(id, d) {
  if (!d || typeof d !== "object") return false;
  const integer = (x) => Number.isInteger(x) && Math.abs(x) <= 1000000;
  if (id === "topo")
    return (
      Number.isInteger(d.n) &&
      d.n >= 0 &&
      d.n <= 40 &&
      Array.isArray(d.edges) &&
      d.edges.length <= 1600 &&
      d.edges.every(
        (e) =>
          Array.isArray(e) &&
          e.length === 2 &&
          e.every((x) => Number.isInteger(x) && x >= 0 && x < d.n),
      )
    );
  if (id === "priority")
    return (
      Array.isArray(d.tasks) &&
      d.tasks.length <= 100 &&
      d.tasks.every(
        (t) => integer(t.id) && integer(t.priority) && integer(t.order),
      ) &&
      new Set(d.tasks.map((t) => t.id)).size === d.tasks.length
    );
  if (id === "prefix")
    return (
      Array.isArray(d.nums) &&
      d.nums.length >= 1 &&
      d.nums.length <= 100 &&
      d.nums.every(integer) &&
      Array.isArray(d.queries) &&
      d.queries.length <= 100 &&
      d.queries.every(
        (q) =>
          Array.isArray(q) &&
          q.length === 2 &&
          Number.isInteger(q[0]) &&
          Number.isInteger(q[1]) &&
          q[0] >= 0 &&
          q[0] <= q[1] &&
          q[1] < d.nums.length,
      )
    );
  return false;
}
export function customTestScore(tests) {
  let killed = new Set(),
    valid = 0,
    errors = [];
  tests.slice(0, 30).forEach((t, i) => {
    if (
      !capstoneProblems.includes(t.problemId) ||
      !validCustomInput(t.problemId, t.input)
    ) {
      errors.push(`Test ${i + 1}: đầu vào chưa hợp lệ.`);
      return;
    }
    if (!checkOutput(t.problemId, t.input, t.expected)) {
      errors.push(`Test ${i + 1}: kết quả dự đoán chưa đúng.`);
      return;
    }
    valid++;
    if (t.problemId === "topo") {
      const wrong = Array.from({ length: t.input.n }, (_, i) => i);
      if (!checkOutput("topo", t.input, wrong))
        killed.add("ignore-dependencies");
    }
    if (t.problemId === "priority") {
      const wrong = [...t.input.tasks]
        .sort((a, b) => a.order - b.order || a.id - b.id)
        .map((t) => t.id);
      if (!checkOutput("priority", t.input, wrong))
        killed.add("ignore-priority");
      const tie = [...t.input.tasks]
        .sort(
          (a, b) => a.priority - b.priority || b.order - a.order || a.id - b.id,
        )
        .map((t) => t.id);
      if (!checkOutput("priority", t.input, tie)) killed.add("wrong-tie");
    }
    if (t.problemId === "prefix") {
      const wrong = t.input.queries.map(([l, r]) =>
        t.input.nums.slice(l, r).reduce((s, x) => s + x, 0),
      );
      if (!checkOutput("prefix", t.input, wrong)) killed.add("off-by-one");
    }
  });
  return {
    score: Math.min(10, killed.size * 2.5),
    valid,
    killed: [...killed],
    errors,
  };
}
export function gradeCapstone(a) {
  const knowledge = scoreAttempt(a),
    code =
      capstoneProblems.filter((p) => a.codesPassed.includes(p)).length * 20,
    traceCorrect = a.questions
      .slice(2)
      .filter((q) => a.answers[q.id] === q.answerId).length,
    conceptCorrect = a.questions
      .slice(0, 2)
      .filter((q) => a.answers[q.id] === q.answerId).length,
    tests = customTestScore(a.customTests);
  const score = code + traceCorrect * 5 + conceptCorrect * 5 + tests.score,
    essayComplete = essayFields.every((f) => a.essay[f.id]?.trim().length > 0);
  return {
    score,
    code,
    trace: traceCorrect * 5,
    concept: conceptCorrect * 5,
    tests,
    essayComplete,
    passed: score >= 80 && code === 60 && essayComplete,
    details: knowledge.details,
  };
}
