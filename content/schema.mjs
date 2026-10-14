import { z } from "zod";
const text = z.string().min(1);
const block = z.object({
  title: text,
  text,
  label: text,
  code: z.object({ python: text.optional(), cpp: text.optional(), shell: text.optional() }).refine(v=>Object.values(v).some(Boolean),"Code cần ít nhất một ngôn ngữ.").optional(),
  problemId: text.optional(),
});
export const lessonSchema = z.object({
  id: z.number().int().positive(),
  title: text,
  kind: z.enum(["lesson", "exam", "advanced"]),
  pack: text,
  unitId: z.number().int().positive(),
  duration: text,
  objectives: z.array(text).min(1),
  prerequisites: z.array(z.number().int().positive()),
  sourcePrefixes: z.array(text),
  blocks: z.array(block).min(5),
  steps: z.array(text).min(1),
  problemIds: z.array(text).min(1),
});
export const problemSchema = z.object({
  id: text,
  title: text,
  statement: text,
  constraints: text,
  skill: text,
  sampleInput: z.unknown(),
  sampleOutput: z.unknown(),
  hints: z.array(text).length(3),
  version: text,
});
export function validateContent({ course, lessons, problems, sources }) {
  z.object({
    id: text,
    title: text,
    version: text,
    mandatoryLessons: z.number().int().positive(),
    advancedLessons: z.number().int().nonnegative(),
    units: z.array(
      z.object({
        id: z.number().int().positive(),
        title: text,
        range: z.tuple([
          z.number().int().positive(),
          z.number().int().positive(),
        ]),
        icon: text,
      }),
    ),
  }).parse(course);
  z.array(lessonSchema).parse(lessons);
  for (const p of Object.values(problems)) problemSchema.parse(p);
  z.array(
    z.object({
      file: text,
      prefix: text,
      sha256: z.string().regex(/^[a-f0-9]{64}$/),
    }),
  ).parse(sources);
  const fail = (message) => {
    throw new Error("Học liệu chưa hợp lệ: " + message);
  };
  if (new Set(lessons.map((l) => l.id)).size !== lessons.length)
    fail("Trùng mã buổi.");
  if (lessons.length !== course.mandatoryLessons + course.advancedLessons)
    fail("Số buổi không khớp lộ trình.");
  if (new Set(sources.map((s) => s.file)).size !== sources.length)
    fail("Trùng ảnh nguồn.");
  const references = new Set(sources.map((s) => s.prefix)),
    ids = new Set(lessons.map((l) => l.id));
  for (const l of lessons) {
    const requiredLanguages=course.languages??["python","cpp"];
    if(l.blocks.some(b=>b.code && requiredLanguages.some(lang=>!b.code[lang])))fail("Code thiếu ngôn ngữ của khóa: "+l.id);
    const unit = course.units.find((u) => u.id === l.unitId);
    if (!unit || l.id < unit.range[0] || l.id > unit.range[1])
      fail("Chặng của buổi " + l.id);
    if (l.prerequisites.some((id) => !ids.has(id) || id >= l.id))
      fail("Tiên quyết của buổi " + l.id);
    if (
      l.problemIds.some((id) => !problems[id]) ||
      l.blocks.some((b) => b.problemId && !l.problemIds.includes(b.problemId))
    )
      fail("Bài code của buổi " + l.id);
    if (l.sourcePrefixes.some((ref) => !references.has(ref)))
      fail("Tham chiếu nguồn của buổi " + l.id);
    if (
      !l.sourcePrefixes.length &&
      !l.blocks.some((b) => b.label.includes("Bổ sung"))
    )
      fail("Buổi thiếu nguồn hoặc nhãn bổ sung: " + l.id);
  }
  return {
    lessons: lessons.length,
    problems: Object.keys(problems).length,
    sources: sources.length,
  };
}
