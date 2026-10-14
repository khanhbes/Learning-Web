import { useEffect, useRef, useState } from "react";
import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor/editor/editor.api.js";
import "monaco-editor/languages/definitions/python/register.js";
import "monaco-editor/languages/definitions/cpp/register.js";
import EditorWorker from "monaco-editor/editor/editor.worker.js?worker";
import { api } from "./api";
import { useApp } from "./context";
import { Button, Icon, Modal, Byte } from "./components";
import type { Attempt, Problem, Language } from "./types";
import { LoadingScene, CelebrationScene, SuccessFeedback } from "./Delight";
import { courseLanguages, currentLanguage, editorLanguageName, gitCourse, pythonDataCourse, languageName } from './courseUI';
import { GitFrameView, GitScenarioPreview } from './GitWorkbench';
import { useMascot } from './bitty/MascotProvider';
(globalThis as any).MonacoEnvironment = { getWorker: () => new EditorWorker() };
loader.config({ monaco });
export default function CodePanel({
  attempt,
  problems,
  onChange,
  base = "attempts",
  graded = false,
}: {
  attempt: Attempt;
  problems: Problem[];
  onChange: (a: Attempt) => void;
  base?: string;
  graded?: boolean;
}) {
  const { state, course, notify, refresh } = useApp(),
    [language, setLanguage] = useState<Language>(currentLanguage(course,state.profile.language)),
    [pid, setPid] = useState(problems[0]?.id),
    [busy, setBusy] = useState(false),
    [runStage, setRunStage] = useState("submitting"),
    [sampleRun, setSampleRun] = useState(false),
    [result, setResult] = useState<any>(null),
    [hint, setHint] = useState(0),
    [reference, setReference] = useState<any>(null),
    [mobileTab, setMobileTab] = useState("problem");
  const alive = useRef(true),
    current = useRef(attempt), inFlight = useRef(false);
  const mascot = useMascot();
  const protectedAttempt = graded || attempt.mode === 'assessment' || attempt.mode === 'capstone';
  current.current = attempt;
  useEffect(
    () => () => {
      alive.current = false;
    },
    [],
  );
  useEffect(() => {
    alive.current = true;
    setResult(null);
    setHint(0);
  }, [pid]);
  useEffect(() => {
    if (protectedAttempt) return;
    mascot.setBoolean('isCoding', true);
    return () => mascot.setBoolean('isCoding', false);
  }, [protectedAttempt, mascot.setBoolean]);
  const p = problems.find((p) => p.id === pid) || problems[0];
  if (!p) return null;
  const code = attempt.codeDrafts[p.id]?.[language] ?? p.starters[language] ?? '';
  const shell=gitCourse(course),languages=courseLanguages(course).filter(l=>p.starters[l]!==undefined);
  function updateCode(value:string) {
    onChange({...current.current,codeDrafts:{...current.current.codeDrafts,[p.id]:{...current.current.codeDrafts[p.id],[language]:value}}});
  }
  async function run(publicOnly: boolean) {
    if (inFlight.current || attempt.status !== 'active') return;
    inFlight.current = true;
    let loadingId: string | undefined;
    setBusy(true);
    setResult(null);
    setRunStage("submitting");
    setSampleRun(publicOnly);
    setMobileTab("result");
    try {
      const { jobId } = await api(`/${base}/${attempt.id}/code`, "POST", {
        problemId: p.id,
        language,
        code,
        publicOnly,
      });
      if (!alive.current) return;
      loadingId = mascot.say('loading', { id: `code:${jobId}:loading` });
      setRunStage("queued");
      let job: any;
      do {
        await new Promise((r) => setTimeout(r, 900));
        job = await api("/jobs/" + jobId);
        if (!alive.current) return;
        setRunStage(job.status);
      } while (job.status === "queued" || job.status === "running");
      setResult(job.result);
      mascot.stop(loadingId);
      loadingId = undefined;
      // Infrastructure failures are never presented as learner mistakes.
      // Assessment feedback stays neutral until the complete attempt is graded.
      if (!protectedAttempt && job.result?.status === 'accepted')
        mascot.say(publicOnly ? 'almost' : 'correct', { id: `code:${jobId}:accepted` });
      else if (!protectedAttempt && job.result?.status && job.result.status !== 'infrastructure_error')
        mascot.say('cheer', { id: `code:${jobId}:retry` });
      const updated = await api<Attempt>(
        `/${base.endsWith("capstones") ? base.replace(/capstones$/, "capstone") : base}/${attempt.id}`,
      );
      if (!alive.current) return;
      onChange({
        ...current.current,
        codesPassed: updated.codesPassed,
        jobIds: updated.jobIds,
      } as Attempt);
      await refresh();
    } catch (e) {
      notify((e as Error).message);
    } finally {
      inFlight.current = false;
      if (loadingId) mascot.stop(loadingId);
      if (alive.current) setBusy(false);
    }
  }
  return (
    <div className="code-workspace">
      <div className="code-problem-selector">
        {problems.map((problem) => (
          <button
            key={problem.id}
            disabled={busy}
            className={p.id === problem.id ? "active" : ""}
            onClick={() => {
              setPid(problem.id);
              setMobileTab("problem");
            }}
          >
            {attempt.codesPassed.includes(problem.id) ? (
              <Icon name="success" size={18} />
            ) : (
              <Icon name="code" size={18} />
            )}{" "}
            {problem.title}
          </button>
        ))}
      </div>
      <div className="mobile-code-tabs">
        {[
          ["problem", "Đề bài"],
          ["code", "Code"],
          ["result", "Kết quả"],
        ].map(([key, text]) => (
          <button
            key={key}
            className={mobileTab === key ? "active" : ""}
            onClick={() => setMobileTab(key)}
          >
            {text}
          </button>
        ))}
      </div>
      <div className="code-columns">
        <div
          className={`problem-pane mobile-${mobileTab === "problem" ? "show" : "hide"}`}
        >
          <span className="eyebrow">
            {protectedAttempt ? "BÀI CODE BẮT BUỘC" : "PHÒNG THỰC HÀNH"}
          </span>
          <h2>{p.title}</h2>
          <p>{p.statement}</p>
          {shell?<GitScenarioPreview input={p.sampleInput} output={p.sampleOutput}/>:<><h4>Ví dụ</h4>
          <div className="example-box">
            <small>ĐẦU VÀO</small>
            <pre>{JSON.stringify(p.sampleInput, null, 2)}</pre>
            <small>KẾT QUẢ</small>
            <pre>{JSON.stringify(p.sampleOutput)}</pre>
          </div>
          </>}
          <h4>Điều kiện bài toán</h4>
          <p className="constraint">{p.constraints}</p>
          <details>
            <summary>{shell?'Viết chuỗi lệnh mô phỏng như thế nào?':'Viết hàm solve như thế nào?'}</summary>
            {shell?<p>Mỗi dòng là một lệnh Git trong danh sách cho phép. <code>edit path "nội dung"</code> và <code>delete path</code> là thao tác editor mô phỏng. Bộ chấm kiểm tra trạng thái kho và lịch sử theo đề, không chạy shell hoặc Git thật trên máy.</p>:<>
            <p>
              <code>solve(data)</code> nhận dữ liệu trên và <code>return</code>{" "}
              kết quả. Python có sẵn deque, Counter, heapq, bisect. C++ có sẵn
              std và kiểu json. Không cần viết main hoặc đọc stdin.
            </p>
            {!pythonDataCourse(course)&&<p>
              Hàm hỗ trợ: make_list, list_values, make_tree, tree_values và
              is_bad / isBad. Các helper được giải thích trong bài liên quan.
            </p>}
            {pythonDataCourse(course)&&<p>NumPy, pandas và các thư viện cần thiết được tải trong môi trường dữ liệu cách ly; dùng SQLite qua sqlite3 khi đề yêu cầu. Trả JSON theo đúng đặc tả; hình minh họa không quyết định điểm.</p>}
            </>}
          </details>
          {!protectedAttempt && (
            <div className="hint-area">
              <Button
                variant="soft"
                disabled={hint >= 3}
                onClick={() => {
                  setHint(Math.min(3, hint + 1));
                  mascot.say('hint', { id: `hint:${attempt.id}:${p.id}:${hint + 1}` });
                }}
              >
                <Icon name="brain" size={19} /> GỢI Ý {Math.min(3, hint + 1)}/3
              </Button>
              {p.hints.slice(0, hint).map((h, i) => (
                <p key={i}>
                  <b>{i + 1}.</b> {h}
                </p>
              ))}
              <button
                className="text-link"
                onClick={async () => {
                  try {
                    setReference(
                      await api(
                        "/solutions/" + p.id + "?lessonId=" + attempt.lessonId + "&courseId=" + (attempt.courseId || course.id),
                      ),
                    );
                  } catch (e) {
                    notify((e as Error).message);
                  }
                }}
              >
                ĐỐI CHIẾU LỜI GIẢI <Icon name="next" size={16} />
              </button>
            </div>
          )}
        </div>
        <div
          className={`editor-pane mobile-${mobileTab === "code" ? "show" : "hide"}`}
        >
          <div className="editor-toolbar">
            <span>
              <Icon name="file" size={16} />
              {language === 'shell'?'scenario.git':language === "python" ? "solution.py" : "solution.cpp"}
            </span>
            <select
              aria-label="Ngôn ngữ code"
              disabled={busy}
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
            >
              {languages.map(l=><option key={l} value={l}>{editorLanguageName(course,l)}</option>)}
            </select>
            <button
              className="icon-button"
              aria-label="Khôi phục code ban đầu"
              onClick={() => {
                if (
                  window.confirm(
                    "Khôi phục sẽ thay code hiện tại bằng hàm ban đầu.",
                  )
                )
                  onChange({
                    ...attempt,
                    codeDrafts: {
                      ...attempt.codeDrafts,
                      [p.id]: {
                        ...attempt.codeDrafts[p.id],
                        [language]: p.starters[language],
                      },
                    },
                  });
              }}
            >
              <Icon name="reset" size={17} />
            </button>
          </div>
          <div className="monaco-host">
            {shell?<textarea className="git-code-editor" spellCheck={false} aria-label="Editor chuỗi lệnh Git" value={code} disabled={attempt.status!=='active'} onChange={e=>updateCode(e.target.value)}/>:<>
            <Editor
              height="360px"
              language={language === "cpp" ? "cpp" : "python"}
              value={code}
              theme="vs"
              loading={
                <LoadingScene compact title="Đang mở editor…" detail="Chuẩn bị không gian để bạn viết ý tưởng." />
              }
              onChange={(value) => updateCode(value??'')}
              options={{
                fontFamily: "JetBrains Mono",
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                tabSize: 4,
                automaticLayout: true,
                wordWrap: "on",
                padding: { top: 18 },
                renderLineHighlight: "none",
                quickSuggestions: false,
                stickyScroll: { enabled: false },
                ariaLabel: "Editor lời giải",
              }}
            />
            </>}
          </div>
          <div className="editor-actions">
            <span className="editor-save">
              <Icon name="shield" size={15} /> {shell?'Kho Git mô phỏng':'Chạy trong môi trường riêng'}
            </span>
            <div>
              {!protectedAttempt && (
                <Button variant="outline" busy={busy} onClick={() => run(true)}>
                  <Icon name="play" size={17} /> CHẠY MẪU
                </Button>
              )}
              <Button
                busy={busy}
                disabled={attempt.status !== "active"}
                onClick={() => run(false)}
              >
                CHẤM BÀI <Icon name="right" size={18} />
              </Button>
            </div>
          </div>
          <div
            className={`code-result mobile-${mobileTab === "result" ? "show" : "hide"}`}
            aria-live="polite"
          >
            {busy ? (
              <LoadingScene
                compact
                title={runStage === "submitting" ? "Đang gửi lời giải…" : runStage === "queued" ? "Byte đang chờ đến lượt…" : runStage === "running" ? "Đang kiểm tra lời giải…" : "Đang nhận kết quả…"}
                detail={runStage === "submitting" ? "Đang lưu code và tạo lượt chấm." : runStage === "queued" ? "Bài đã vào hàng đợi. Code và bản nháp vẫn được giữ." : runStage === "running" ? "Bộ chạy đang thực hiện test. Kết quả sẽ xuất hiện khi chấm xong." : "Đang đồng bộ báo cáo và lượt làm của bạn."}
              />
            ) : result ? (
              <>
                {result.status === "accepted" && (
                  <CelebrationScene compact variant="practice"
                    title={sampleRun ? "Các test mẫu đã chạy đúng!" : "Lời giải đạt yêu cầu!"}
                    subtitle={sampleRun ? "Nộp chấm toàn bộ để kiểm tra thêm trường hợp biên." : "Bộ kiểm thử của lượt nộp này đã xác nhận kết quả."}
                  />
                )}
                {result.status === "infrastructure_error" ? (
                  <div className="result-status pending">
                    <Icon name="clock" />
                    <div><strong>Chưa có kết quả</strong><p>{result.message}</p></div>
                  </div>
                ) : result.status !== "accepted" ? (
                  <SuccessFeedback correct={false} label="Cùng sửa thêm một chút nhé">
                    <p>{result.message}</p>
                  </SuccessFeedback>
                ) : null}
                {result.checks?.length > 0 && (
                  <div className="test-chips">
                    {result.checks.map((t: any) => (
                      <span className={t.passed ? "pass" : "fail"} key={t.id}>
                        <Icon name={t.passed ? "check" : "close"} size={13} />
                        {t.group === "sample"
                          ? "Mẫu"
                          : t.group === "edge"
                            ? "Biên"
                            : t.group === "performance"
                              ? "Hiệu năng"
                              : "Ẩn"}{" "}
                        {t.id}
                      </span>
                    ))}
                  </div>
                )}
                {result.checks
                  ?.filter((t: any) => !t.passed && t.input)
                  .map((t: any) => (
                    <pre key={t.id}>
                      Đầu vào: {JSON.stringify(t.input)}
                      {"\n"}Cần trả: {JSON.stringify(t.expected)}
                      {"\n"}Đã trả: {JSON.stringify(t.actual)}
                    </pre>
                  ))}
                {result.diagnostic && (
                  <pre className="diagnostic">{result.diagnostic}</pre>
                )}
                {shell&&(result.frame||result.frames?.length>0)&&<section><p className="git-code-note">Trạng thái của test mẫu. Kết quả toàn bộ test được liệt kê phía trên.</p><GitFrameView frame={result.frame||result.frames.at(-1)}/></section>}
              </>
            ) : (
              <div className="result-placeholder">
                <Icon name="code" />
                <span>Viết ý tưởng của bạn, rồi chạy thử.</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <Modal
        open={!!reference}
        onClose={() => setReference(null)}
        title="Lời giải tham chiếu"
      >
        <h2>{p.title}</h2>
        <p>
          Lời giải đã kiểm chứng với 200 seed và test phù hợp. Thử chạy tay
          trước khi đối chiếu.
        </p>
        <select
          aria-label="Ngôn ngữ lời giải"
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
        >
          {languages.map(l=><option key={l} value={l}>{languageName[l]}</option>)}
        </select>
        <pre className="reference-code">{reference?.[language]}</pre>
        <details>
          <summary>Các hàm hỗ trợ</summary>
          <pre>{reference?.helpers?.[language]}</pre>
        </details>
      </Modal>
    </div>
  );
}
