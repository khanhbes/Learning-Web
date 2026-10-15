import { useEffect, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { api } from "./api";
import { useApp } from "./context";
import type { Lesson, Attempt } from "./types";
import { Button, Byte, Icon, ProgressBar, Modal, Empty } from "./components";
import CodePanel from "./CodePanelLazy";
import Visualizer from "./Visualizer";
import QuizPane from "./QuizPane";
import ConceptScene from "./ConceptScene";
import HandsOnLab from "./HandsOnLab";
import StructurePlayground from "./StructurePlayground";
import MLVisualizer from "./MLVisualizer";
import MLConceptScene from "./MLConceptScene";
import { LoadingScene, CelebrationScene, SuccessFeedback } from "./Delight";
import DAVisualizer from './DAVisualizer';
import AgentVisualizer from './AgentVisualizer';
import LinearVisualizer from './LinearVisualizer';
import GitWorkbench from './GitWorkbench';
import { currentLanguage, gitCourse } from './courseUI';
import { useMascot } from './bitty/MascotProvider';
import { LessonCompleteModal } from './bitty/RewardOverlays';
import GuidedLesson from './GuidedLesson';
import {useMotionPreference} from './motionPreference';
const phases = [
  ["learn", "Hiểu"],
  ["visual", "Khám phá"],
  ["practice", "Luyện"],
  ["code", "Code"],
  ["assessment", "Kiểm tra"],
];
export default function LessonPage() {
  const mascot = useMascot();
  const reduced = useMotionPreference();
  const { id } = useParams(),
    [params] = useSearchParams(),
    navigate = useNavigate(),
    { state, course, refresh, notify, health } = useApp();
  const [lesson, setLesson] = useState<Lesson | null>(null),
    [attempt, setAttempt] = useState<Attempt | null>(null),
    [phase, setPhase] = useState(
      params.get("mode") === "review"
        ? "practice"
        : params.get("phase") || "learn",
    ),
    [block, setBlock] = useState(0),
    [result, setResult] = useState<any>(null),
    [busy, setBusy] = useState(false),
    [save, setSave] = useState("Đã lưu"),
    [examCode, setExamCode] = useState(false),
    [error, setError] = useState(""),
    [tutorOpen, setTutorOpen] = useState(false),
    [question, setQuestion] = useState(""),
    [tutorReply, setTutorReply] = useState(""),
    [asking, setAsking] = useState(false);
  const [practiceView, setPracticeView] = useState("lab"),
    [recallAnswer, setRecallAnswer] = useState("");
  const [visualProblemId, setVisualProblemId] = useState("");
  const current = useRef(attempt);
  const upgrading = useRef(false);
  current.current = attempt;
  const isReview = params.get("mode") === "review";
  useEffect(() => {
    if (!result && attempt?.status === 'active' && ['assessment', 'capstone'].includes(attempt.mode))
      mascot.cancelAll('cancelled');
  }, [attempt?.id, attempt?.mode, attempt?.status, !!result, mascot.cancelAll]);
  useEffect(() => {
    if (!lesson || !attempt || attempt.mode === 'assessment' || attempt.mode === 'capstone') return;
    mascot.say('wave', { id: `lesson:${course.id}:${lesson.id}:hello` });
  }, [lesson?.id, attempt?.id, attempt?.mode, course.id, mascot.say]);
  useEffect(() => {
    if (attempt?.mode === 'assessment' || attempt?.mode === 'capstone') return;
    mascot.setBoolean('isThinking', asking);
    return () => mascot.setBoolean('isThinking', false);
  }, [asking, attempt?.mode, mascot.setBoolean]);
  async function start(mode: string, retake = false) {
    setBusy(true);
    try {
      const a = await api<Attempt>("/attempts", "POST", {
        lessonId: Number(id),
        courseId: course.id,
        mode,
        retake,
      });
      const local = localStorage.getItem("bytepath-attempt-" + a.id);
      if (local && a.status === "active") {
        const draft = JSON.parse(local);
        if (draft.savedAt > a.updatedAt) {
          a.answers = draft.answers;
          a.codeDrafts = draft.codeDrafts;
          if (a.lab && draft.labDrafts) a.lab.drafts = draft.labDrafts;
          if (a.lab && draft.labCursor !== undefined)
            a.lab.cursor = draft.labCursor;
          if (draft.learningProgress) a.learningProgress = draft.learningProgress;
          await api("/attempts/" + a.id, "PATCH", {
            answers: a.answers,
            codeDrafts: a.codeDrafts,
            ...(a.lab ? { labDrafts: a.lab.drafts } : {}),
            ...(a.lab ? { labCursor: a.lab.cursor } : {}),
            ...(a.learningProgress ? { learningProgress: a.learningProgress } : {}),
          });
        }
      }
      setAttempt(a);
      setResult(null);
      setExamCode(false);
      await refresh();
      return a;
    } catch (e) {
      if (!current.current) setError((e as Error).message);
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function openGuided(source: Attempt) {
    if (upgrading.current) return;
    upgrading.current=true;setBusy(true);
    try {
      const stored=await api<Attempt>(`/attempts/${source.id}`);
      if(stored.status==='active')await api(`/attempts/${source.id}`,'PATCH',{
        answers:source.answers,codeDrafts:source.codeDrafts,
        ...(source.lab?{labDrafts:source.lab.drafts,labCursor:source.lab.cursor}:{}),
        ...(source.learningProgress?{learningProgress:source.learningProgress}:{})
      });
      const next=await api<Attempt>(`/attempts/${source.id}/guided`,'POST',{codeDrafts:source.codeDrafts});
      setAttempt(next);setPhase('learn');setBlock(0);setResult(null);setExamCode(false);setSave('Đã lưu');
      await refresh();return next;
    }catch(error){notify((error as Error).message);}
    finally{upgrading.current=false;setBusy(false);}
  }
  useEffect(() => {
    let active = true;
    setLesson(null);
    setAttempt(null);
    setBlock(0);
    setError("");
    setRecallAnswer("");
    setPracticeView("lab");
    setVisualProblemId("");
    api<Lesson>("/courses/" + course.id + "/lessons/" + id)
      .then(async (l) => {
        if (!active) return;
        setLesson(l);
        const mode = isReview
          ? "review"
          : l.kind === "exam"
            ? "assessment"
            : "practice";
        if (l.kind === "exam") setPhase("assessment");
        let opened = await start(mode);
        if(active && opened && mode==='practice' && params.get('guided')==='1' && l.teachingFlow && opened.teachingVersion!==l.teachingFlow.version)
          opened=await openGuided(opened)??opened;
        if (
          active &&
          opened?.learningCursor &&
          !params.get("phase") &&
          !isReview &&
          l.kind !== "exam"
        ) {
          setPhase(opened.learningCursor.phase);
          setBlock(Math.min(opened.learningCursor.block, l.blocks.length - 1));
        }
      })
      .catch((e) => setError(e.message));
    return () => {
      active = false;
    };
  }, [id, course.id]);
  useEffect(() => {
    if (!attempt || attempt.status !== "active" || busy) return;
    localStorage.setItem(
      "bytepath-attempt-" + attempt.id,
      JSON.stringify({
        answers: attempt.answers,
        codeDrafts: attempt.codeDrafts,
        labDrafts: attempt.lab?.drafts,
        labCursor: attempt.lab?.cursor,
        learningProgress: attempt.learningProgress,
        savedAt: Date.now(),
      }),
    );
    setSave("Đang lưu…");
    let active = true,
      timer: ReturnType<typeof setTimeout>;
    const persist = async () => {
      try {
        const updated = await api<Attempt>("/attempts/" + attempt.id, "PATCH", {
          answers: attempt.answers,
          codeDrafts: attempt.codeDrafts,
          ...(attempt.lab ? { labDrafts: attempt.lab.drafts } : {}),
          ...(attempt.lab ? { labCursor: attempt.lab.cursor } : {}),
          ...(attempt.learningProgress ? { learningProgress: attempt.learningProgress } : {}),
        });
        if (active) {
          setSave("Đã lưu");
          setAttempt((prev) =>
            prev && prev.id === updated.id
              ? { ...prev, codesPassed: updated.codesPassed }
              : prev,
          );
        }
      } catch {
        if (active) {
          setSave("Đã giữ trên trình duyệt · sẽ thử đồng bộ lại");
          timer = setTimeout(persist, 5000);
        }
      }
    };
    timer = setTimeout(persist, 450);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [
    attempt?.id,
    attempt?.status,
    busy,
    attempt?.answers,
    attempt?.codeDrafts,
    attempt?.lab?.drafts,
    attempt?.lab?.cursor,
    attempt?.learningProgress,
  ]);
  useEffect(() => {
    if (
      attempt?.status === "active" &&
      attempt.mode !== "assessment" &&
      ["learn", "visual", "practice", "code"].includes(phase)
    ) {
      const t = setTimeout(
        () =>
          api("/attempts/" + attempt.id, "PATCH", {
            learningCursor: { phase, block },
          }).catch(() => {}),
        300,
      );
      return () => clearTimeout(t);
    }
  }, [phase, block, attempt?.id]);
  useEffect(() => {
    const flush = () => {
      const a = current.current;
      if (a?.status === "active")
        fetch("/api/attempts/" + a.id, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answers: a.answers,
            codeDrafts: a.codeDrafts,
            ...(a.lab ? { labDrafts: a.lab.drafts } : {}),
            ...(a.lab ? { labCursor: a.lab.cursor } : {}),
            ...(a.learningProgress ? { learningProgress: a.learningProgress } : {}),
          }),
          keepalive: true,
        }).catch(() => {});
    };
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, []);
  async function switchPhase(p: string) {
    if (!lesson) return;
    if (p === "assessment" && attempt?.mode !== "assessment") {
      const a = await start("assessment");
      if (a && attempt?.codeDrafts) {
        a.codeDrafts = attempt.codeDrafts;
        setAttempt({ ...a });
      }
      setExamCode(false);
    } else if (p !== "assessment" && attempt?.mode === "assessment") {
      if (
        !window.confirm(
          "Rời kiểm tra để học lại? Lượt này sẽ được bỏ; kết quả đã đạt trước đó được giữ.",
        )
      )
        return;
      await api("/attempts/" + attempt.id + "/abandon", "POST", {});
      await start("practice");
    } else if (p === "code" && attempt?.status === "completed")
      await start("practice", true);
    setPhase(p);
    setBlock(0);
    if (p === 'visual')
      mascot.say('teach_point', { id: `lesson:${course.id}:${lesson.id}:visual` });
  }
  async function submit() {
    if (!attempt) return;
    setBusy(true);
    try {
      await api("/attempts/" + attempt.id, "PATCH", {
        answers: attempt.answers,
        codeDrafts: attempt.codeDrafts,
      });
      const r = await api("/attempts/" + attempt.id + "/submit", "POST", {});
      setAttempt({ ...attempt, status: "completed", result: r });
      setResult(r);
      localStorage.removeItem("bytepath-attempt-" + attempt.id);
      await refresh();
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (error)
    return (
      <div className="lesson-error">
        <Empty icon="info" title={error}>
          <div className="actions">
            <Link to="/">Về hành trình học</Link>
            <Link to="/review">Ôn để hồi năng lượng</Link>
            <Link to="/shop">Đến cửa hàng</Link>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Thử lại
            </Button>
          </div>
        </Empty>
      </div>
    );
  if (!lesson || !attempt)
    return (
      <div className="boot">
        <LoadingScene
          title={busy ? "Đang mở buổi học…" : "Chuẩn bị bài học…"}
          detail="Byte đang lấy bài giảng và tìm lượt học bạn đã lưu."
        />
        <Link to="/">Về hành trình</Link>
      </div>
    );
  const graded = attempt.mode === "assessment",
    currentPhase = phases.findIndex((p) => p[0] === phase),
    main = lesson.problems[0];
  const guided = !!lesson.teachingFlow && attempt.teachingVersion===lesson.teachingFlow.version && !isReview && lesson.kind !== 'exam';
  const visiblePhases = guided ? [['learn', 'Bài giảng'], ['code', 'Thực hành code'], ['assessment', 'Kiểm tra']] : phases;
  const activePhase = guided && ['learn', 'visual', 'practice'].includes(phase) ? 'learn' : phase;
  return (
    <div className="lesson-shell">
      <header className="lesson-header">
        <Link to="/" className="icon-button" aria-label="Lưu và về hành trình">
          <Icon name="close" size={26} />
        </Link>
        <div>
          <span className="eyebrow">
            {isReview
              ? "ÔN TẬP"
              : lesson.kind === "exam"
                ? "TRẠM KIỂM TRA"
                : "BUỔI " + String(lesson.id).padStart(2, "0")}
          </span>
          <h3>{lesson.title}</h3>
        </div>
        <span className="save-state">
          <Icon name="shield" size={15} />
          {save}
        </span>
        <span className="lesson-energy">
          <Icon name="zap" size={22} />
          {state.energy}
        </span>
      </header>
      {!isReview && lesson.kind !== "exam" && (
        <nav className="lesson-phases" aria-label="Các hoạt động">
          {visiblePhases.map(([p, title], i) => (
            <button
              className={
                activePhase === p ? "active" : i < visiblePhases.findIndex(item => item[0] === activePhase) ? "visited" : ""
              }
              key={p}
              aria-label={title}
              onClick={() => switchPhase(p)}
            >
              <span>
                {i < visiblePhases.findIndex(item => item[0] === activePhase) ? <Icon name="check" size={14} /> : i + 1}
              </span>
              {title}
            </button>
          ))}
        </nav>
      )}
      <div
        className={`lesson-body ${phase === "code" || examCode ? "expanded" : ""}`}
      >
        {lesson.teachingFlow && !guided && !isReview && lesson.kind!=='exam' && attempt.mode==='practice' && attempt.status==='active' && (
          <aside className="legacy-teaching-notice"><div><span className="eyebrow">BẠN ĐANG MỞ BẢN NHÁP CŨ</span><strong>Bài này đã có hình và cách học từng bước mới</strong><p>Chuyển sang bản mới để xem ví dụ trực quan và tám hoạt động. Code sẽ được mang theo; lượt cũ vẫn nằm trong lịch sử.</p></div><Button busy={busy} onClick={()=>openGuided(attempt)}>MỞ CÁCH HỌC MỚI</Button></aside>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={phase + String(examCode)}
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? {opacity:1} : { opacity: 0, y: -8 }}
            transition={{ duration: reduced ? 0 : 0.16 }}
          >
            {guided && ['learn', 'visual', 'practice'].includes(phase) ? (
              <GuidedLesson key={attempt.id} lesson={lesson} attempt={attempt} onChange={setAttempt} onCode={() => switchPhase('code')} onAssessment={() => switchPhase('assessment')}/>
            ) : phase === "learn" ? (
              <div className="teaching-pane">
                <div className="teaching-top">
                  <span className="pill">
                    <Icon name="book" size={15} />
                    {lesson.blocks[block].label}
                  </span>
                  <span>
                    {block + 1}/{lesson.blocks.length}
                  </span>
                </div>
                <div className="teaching-intro">
                  <Byte
                    size={130}
                    mood={
                      block === 3
                        ? "thinking"
                        : block === 0
                          ? "wave"
                          : "explaining"
                    }
                    skin={state.profile.skin}
                  />
                  <h1>{lesson.blocks[block].title}</h1>
                </div>
                {course.id === "dsa" && block !== 2 &&
                  block !== 5 &&
                  !lesson.blocks[block].problemId && (
                    <ConceptScene
                      key={lesson.id + "-" + block}
                      lesson={lesson}
                      complexity={block === 4}
                    />
                  )}
                {course.id === "dsa" && block === 2 && (
                  <Visualizer
                    problemId={main.id}
                    defaultVariant={
                      lesson.id === 39 ? "components-bfs" : "insertion"
                    }
                  />
                )}
                {course.id === "dsa" && lesson.blocks[block].problemId && (
                  <Visualizer
                    key={lesson.blocks[block].problemId}
                    problemId={lesson.blocks[block].problemId!}
                  />
                )}
                {course.id === "ml" && <MLConceptScene lesson={lesson} />}
                {course.id === "da" && [0,2,4].includes(block) && <DAVisualizer lesson={lesson} compact />}
                {course.id === "agent" && [0,2,4].includes(block) && <AgentVisualizer lesson={lesson} compact />}
                {course.id === "linear" && [0,2,4].includes(block) && <LinearVisualizer lesson={lesson} compact />}
                {gitCourse(course) && [0,2].includes(block) && <GitWorkbench lesson={lesson} compact />}
                <p className="teaching-text">{lesson.blocks[block].text}</p>
                {block === 0 && (
                  <details className="recall-panel">
                    <summary>Trước khi bắt đầu · nhớ lại một ý</summary>
                    <h3>{lesson.recall?.prompt}</h3>
                    <div className="recall-options">
                      {lesson.recall?.options.map((o) => (
                        <button
                          key={o}
                          aria-pressed={recallAnswer === o}
                          onClick={() => setRecallAnswer(o)}
                        >
                          {o}
                        </button>
                      ))}
                    </div>
                    {recallAnswer && (
                      <p role="status">
                        {recallAnswer === lesson.recall?.answer
                          ? "Đúng rồi!"
                          : "Đọc lại một chút nhé: " + lesson.recall?.answer}
                      </p>
                    )}
                    <div className="lesson-itinerary">
                      {lesson.itinerary?.map((s) => (
                        <span key={s.title}>
                          <b>{s.minutes}′</b>
                          {s.title}
                        </span>
                      ))}
                    </div>
                    <small>
                      Nhịp học gợi ý 55 phút; bạn có thể dừng bất kỳ lúc nào.
                    </small>
                  </details>
                )}
                {lesson.blocks[block].code && (
                  <pre className="lesson-code-example">
                    <code>
                      {lesson.blocks[block].code?.[currentLanguage(course,state.profile.language)]}
                    </code>
                  </pre>
                )}
                {lesson.blocks[block].commandSnippet&&<pre className="lesson-code-example"><code>{lesson.blocks[block].commandSnippet}</code></pre>}
                {block === 0 && (
                  <div className="learning-objectives">
                    <h4>Sau buổi này, bạn sẽ…</h4>
                    {lesson.objectives.map((o) => (
                      <p key={o}>
                        <Icon name="check" size={17} />
                        {o}
                      </p>
                    ))}
                  </div>
                )}
                {block === 2 && (
                  <div className="example-box">
                    <small>THỬ CHẠY TAY {main.title}</small>
                    <pre>{JSON.stringify(main.sampleInput, null, 2)}</pre>
                    <span className="example-output">
                      Kết quả: <code>{JSON.stringify(main.sampleOutput)}</code>
                    </span>
                  </div>
                )}
                <div className="teaching-pagination">
                  {lesson.blocks.map((_, i) => (
                    <button
                      key={i}
                      className={block === i ? "active" : ""}
                      onClick={() => setBlock(i)}
                      aria-label={"Phần " + (i + 1)}
                    />
                  ))}
                </div>
                <div className="lesson-footer">
                  <Button
                    variant="outline"
                    disabled={block === 0}
                    onClick={() => setBlock(block - 1)}
                  >
                    <Icon name="left" size={17} /> QUAY LẠI
                  </Button>
                  <Button
                    onClick={() =>
                      block < lesson.blocks.length - 1
                        ? setBlock(block + 1)
                        : switchPhase("visual")
                    }
                  >
                    {block === lesson.blocks.length - 1
                      ? "KHÁM PHÁ TỪNG BƯỚC"
                      : "TIẾP TỤC"}{" "}
                    <Icon name="right" size={18} />
                  </Button>
                </div>
              </div>
            ) : phase === "visual" ? (
              <div>
                <div className="activity-heading">
                  <span className="eyebrow">NHÌN ĐỂ HIỂU</span>
                  <h1>Chuyện gì xảy ra ở mỗi bước?</h1>
                  <p>
                    {main.title} · Chạy chậm, dừng và tự dự đoán bước tiếp theo.
                  </p>
                </div>
                {lesson.problems.length > 1 && (
                  <label className="simulation-algorithm">
                    Bài minh họa{" "}
                    <select
                      aria-label="Bài minh họa"
                      value={visualProblemId || main.id}
                      onChange={(e) => setVisualProblemId(e.target.value)}
                    >
                      {lesson.problems.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {gitCourse(course)?<GitWorkbench lesson={lesson}/>:course.id==='da'?<DAVisualizer lesson={lesson}/>:course.id==='agent'?<AgentVisualizer lesson={lesson}/>:course.id==='linear'?<LinearVisualizer lesson={lesson}/>:course.id === "ml" ? <MLVisualizer lesson={lesson} /> : <Visualizer
                  key={visualProblemId || main.id}
                  problemId={visualProblemId || main.id}
                  defaultVariant={
                    lesson.id === 39 &&
                    (visualProblemId || main.id) === "union-find"
                      ? "components-bfs"
                      : lesson.id === 49
                        ? "counting"
                        : "insertion"
                  }
                />}
                {course.id === "dsa" && lesson.id === 23 && (
                  <details>
                    <summary>So sánh Merge Sort và Quick Sort</summary>
                    <Visualizer problemId="sort" defaultVariant="merge" />
                  </details>
                )}
                {course.id === "dsa" && <StructurePlayground pack={lesson.pack} />}
                <div className="algorithm-steps">
                  <h3>Cách tiếp cận</h3>
                  {lesson.steps.map((s, i) => (
                    <p key={s}>
                      <span>{i + 1}</span>
                      {s}
                    </p>
                  ))}
                </div>
                <div className="lesson-footer">
                  <Button
                    variant="outline"
                    onClick={() => switchPhase("learn")}
                  >
                    XEM LẠI BÀI GIẢNG
                  </Button>
                  <Button onClick={() => switchPhase("practice")}>
                    TỰ MÌNH THỬ <Icon name="right" size={18} />
                  </Button>
                </div>
              </div>
            ) : phase === "practice" ? (
              <>
                {attempt.lab && practiceView === "lab" ? (
                  <HandsOnLab
                    key={attempt.id}
                    attempt={attempt}
                    onChange={setAttempt}
                    onQuiz={() => setPracticeView("quiz")}
                  />
                ) : (
                  <>
                    {attempt.lab && (
                      <button
                        className="text-link"
                        onClick={() => setPracticeView("lab")}
                      >
                        ← Về phòng thao tác
                      </button>
                    )}
                    <QuizPane
                      key={attempt.id}
                      attempt={attempt}
                      onChange={setAttempt}
                      onDone={submit}
                    />
                  </>
                )}
              </>
            ) : phase === "code" ? (
              <>
                <div className="activity-heading">
                  <span className="eyebrow">TỪ Ý TƯỞNG ĐẾN CODE</span>
                  <h1>Đến lượt bạn xây dựng</h1>
                  <p>
                    Chạy mẫu để thử ý tưởng. Chấm bài để kiểm tra cả trường hợp
                    biên.
                  </p>
                </div>
                <CodePanel
                  attempt={attempt}
                  problems={lesson.problems}
                  onChange={setAttempt}
                />
                <div className="lesson-footer">
                  <Link to="/" className="text-link">
                    LƯU & TIẾP TỤC SAU
                  </Link>
                  <Button onClick={() => switchPhase("assessment")}>
                    ĐẾN PHẦN KIỂM TRA <Icon name="right" size={18} />
                  </Button>
                </div>
              </>
            ) : (
              <div>
                {!examCode ? (
                  <>
                    <div className="assessment-note">
                      <Icon name="shield" size={21} /> Không giới hạn thời gian
                      · Không có gợi ý · Cần ≥80% và qua code
                    </div>
                    <QuizPane
                      key={attempt.id}
                      attempt={attempt}
                      onChange={setAttempt}
                      onDone={() => setExamCode(true)}
                    />
                  </>
                ) : (
                  <>
                    <div className="activity-heading">
                      <span className="eyebrow">KIỂM CHỨNG LỜI GIẢI</span>
                      <h1>
                        {lesson.kind === "exam"
                          ? "Hai bài code cuối chặng"
                          : "Bài code bắt buộc"}
                      </h1>
                      <p>
                        Điểm kiến thức và kết quả code là hai điều kiện riêng.
                      </p>
                    </div>
                    <CodePanel
                      attempt={attempt}
                      problems={lesson.problems.filter((p) =>
                        attempt.requiredProblems.includes(p.id),
                      )}
                      onChange={setAttempt}
                      graded
                    />
                    <div className="lesson-footer">
                      <Button
                        variant="outline"
                        onClick={() => setExamCode(false)}
                      >
                        XEM LẠI CÂU HỎI
                      </Button>
                      <Button busy={busy} onClick={submit}>
                        NỘP KIỂM TRA <Icon name="check" size={20} />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        {!graded && (
          <div className="lesson-resources">
            {lesson.sources.length > 0 && (
              <details>
                <summary>
                  <Icon name="bookmark" size={17} /> Xem tài liệu nguồn (
                  {lesson.sources.length})
                </summary>
                <div>
                  {lesson.sources.map((s) => (
                    <a
                      key={s.id}
                      href={s.url || "/sources/" + s.file}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {s.id} · {s.topic}
                    </a>
                  ))}
                </div>
              </details>
            )}
            {lesson.corrections.length > 0 && (
              <details>
                <summary>
                  <Icon name="shield" size={17} /> Nội dung đã hiệu đính
                </summary>
                {lesson.corrections.map((c) => (
                  <p key={c.id}>
                    <b>{c.title}:</b> {c.after}
                  </p>
                ))}
              </details>
            )}
            <Button variant="soft" onClick={() => setTutorOpen(true)}>
              <Icon name="chat" size={19} /> HỎI BYTE
            </Button>
          </div>
        )}
      </div>
      <LessonCompleteModal
        open={!!result}
        title="Kết quả bài làm"
        result={result ?? { passed: false, knowledge: 0 }}
        eventId={attempt.id}
        onClose={() => setResult(null)}
      >
        <div className="result-modal">
          {result?.passed ? (
            <CelebrationScene
              variant={result.mode === "assessment" ? "lesson" : "practice"}
              title={result.mode === "assessment" ? "Bạn đã vượt qua buổi này!" : "Thêm một ý tưởng vững vàng!"}
              subtitle={result.mode === "assessment" ? "Kiến thức và code bắt buộc đều đạt." : "Cùng giữ những điều vừa học thật lâu nhé."}
              xp={result.reward?.xp}
              bonusXp={result.reward?.bonusXp}
              gems={result.reward?.gems}
              onSkip={() => mascot.stop(`lesson:${attempt.id}:${result.knowledge === 100 ? 'perfect' : 'complete'}`)}
            />
          ) : (
            <>
              <Byte size={130} mood="encouraging" skin={state.profile.skin} />
              <SuccessFeedback correct={false} label="Cùng củng cố thêm một chút">
                <p>Nhìn lại phần cần ôn, rồi thử theo một cách khác.</p>
              </SuccessFeedback>
            </>
          )}
          <div className="score-ring">
            <strong>
              {result?.knowledge}
              <small>%</small>
            </strong>
            <span>KIẾN THỨC</span>
          </div>
          <p>
            {result?.mode === "assessment"
              ? result.codePassed
                ? "Code bắt buộc: đã đạt"
                : "Code bắt buộc: chưa đạt"
              : "Kết quả luyện giúp bạn chuẩn bị trước khi kiểm tra."}
          </p>
          {!result?.passed && result?.reward?.xp > 0 && (
            <div className="reward-strip">
              <span>
                <Icon name="star" />+{result.reward.xp} XP
              </span>
              <span>
                <Icon name="gem" />+{result.reward.gems} gem
              </span>
            </div>
          )}
          {result?.reward?.bonusXp > 0 && <p className="boost-result">X2: {result.reward.baseXp} XP gốc + {result.reward.bonusXp} XP thêm · còn {result.reward.boostRemaining} lượt</p>}
          <details className="answer-review">
            <summary>Xem giải thích từng câu</summary>
            {result?.details.map((d: any, i: number) => (
              <p key={d.id}>
                <Icon name={d.correct ? "success" : "brain"} size={17} />
                <b>Câu {i + 1}:</b> {d.explanation}
              </p>
            ))}
          </details>
          <div className="result-actions">
            {result?.passed && result?.mode === "assessment" ? (
              <Button onClick={() => navigate("/")}>
                VỀ HÀNH TRÌNH <Icon name="right" size={17} />
              </Button>
            ) : result?.mode === "practice" ? (
              <Button
                onClick={async () => {
                  setResult(null);
                  await start("practice", true);
                  setPhase("code");
                }}
              >
                VIẾT CODE <Icon name="code" size={17} />
              </Button>
            ) : (
              <Button
                onClick={async () => {
                  setResult(null);
                  await start(isReview ? "review" : "assessment", true);
                  setExamCode(false);
                }}
              >
                THỬ VỚI ĐỀ MỚI <Icon name="refresh" size={18} />
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate("/")}>
              TIẾP TỤC SAU
            </Button>
          </div>
        </div>
      </LessonCompleteModal>
      <Modal
        open={tutorOpen}
        onClose={() => setTutorOpen(false)}
        title="Hỏi Byte"
      >
        <div className="tutor-header">
          <Byte size={95} mood={asking ? "thinking" : "explaining"} />
          <div>
            <h2>Byte đang lắng nghe</h2>
            <p>
              {health?.ai?.provider === "gemini"
                ? "Trợ giảng Gemini"
                : "Trợ giảng Byte"}{" "}
              · Nhận xét không thay đổi điểm
            </p>
          </div>
        </div>
        <label>
          Điều gì bạn chưa rõ?
          <textarea
            value={question}
            maxLength={2000}
            rows={4}
            placeholder="Ví dụ: vì sao phải lưu next trước khi đảo liên kết?"
            onChange={(e) => setQuestion(e.target.value)}
          />
        </label>
        <Button
          busy={asking}
          disabled={!question.trim()}
          onClick={async () => {
            setAsking(true);
            try {
              const r = await api("/tutor", "POST", {
                question,
                lessonId: lesson.id,
                courseId: course.id,
                code: attempt.codeDrafts[main.id]?.[
                  state.profile.language
                ]?.slice(0, 10000),
              });
              setTutorReply(r.text);
            } catch (e) {
              notify((e as Error).message);
            } finally {
              setAsking(false);
            }
          }}
        >
          HỎI BYTE <Icon name="chat" size={19} />
        </Button>
        {health?.ai?.provider === "gemini" && (
          <p className="soft-note">
            Câu hỏi và code đang luyện sẽ gửi tới Gemini. Không nhập thông tin
            riêng tư.
          </p>
        )}
        {asking && <LoadingScene compact title="Byte đang tìm cách giải thích…" detail="Câu trả lời đang được chuẩn bị theo nội dung buổi học." />}
        {tutorReply && (
          <div className="tutor-reply">
            <p>{tutorReply}</p>
            <Link
              to={`/courses/${course.id}/lesson/` + lesson.id + "?phase=learn"}
              onClick={() => {
                setTutorOpen(false);
                setBlock(1);
                void switchPhase("learn");
              }}
            >
              Đọc lại khái niệm trong buổi {lesson.id}
            </Link>
          </div>
        )}
      </Modal>
    </div>
  );
}
