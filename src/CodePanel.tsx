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
    [language, setLanguage] = useState<Language>(attempt.courseId === "ml" ? "python" : state.profile.language),
    [pid, setPid] = useState(problems[0]?.id),
    [busy, setBusy] = useState(false),
    [runStage, setRunStage] = useState("submitting"),
    [sampleRun, setSampleRun] = useState(false),
    [result, setResult] = useState<any>(null),
    [hint, setHint] = useState(0),
    [reference, setReference] = useState<any>(null),
    [mobileTab, setMobileTab] = useState("problem");
  const alive = useRef(true),
    current = useRef(attempt);
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
  const p = problems.find((p) => p.id === pid) || problems[0];
  if (!p) return null;
  const code = attempt.codeDrafts[p.id]?.[language] ?? p.starters[language];
  async function run(publicOnly: boolean) {
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
      setRunStage("queued");
      let job: any;
      do {
        await new Promise((r) => setTimeout(r, 900));
        job = await api("/jobs/" + jobId);
        if (!alive.current) return;
        setRunStage(job.status);
      } while (job.status === "queued" || job.status === "running");
      setResult(job.result);
      const updated = await api<Attempt>(
        `/${base.endsWith("capstones") ? base.replace(/capstones$/, "capstone") : base}/${attempt.id}`,
      );
      onChange({
        ...current.current,
        codesPassed: updated.codesPassed,
        jobIds: updated.jobIds,
      } as Attempt);
      await refresh();
    } catch (e) {
      notify((e as Error).message);
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  return (
    <div className="code-workspace">
      <div className="code-problem-selector">
        {problems.map((problem) => (
          <button
            key={problem.id}
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
            {graded ? "BÀI CODE BẮT BUỘC" : "PHÒNG THỰC HÀNH"}
          </span>
          <h2>{p.title}</h2>
          <p>{p.statement}</p>
          <h4>Ví dụ</h4>
          <div className="example-box">
            <small>ĐẦU VÀO</small>
            <pre>{JSON.stringify(p.sampleInput, null, 2)}</pre>
            <small>KẾT QUẢ</small>
            <pre>{JSON.stringify(p.sampleOutput)}</pre>
          </div>
          <h4>Điều kiện bài toán</h4>
          <p className="constraint">{p.constraints}</p>
          <details>
            <summary>Viết hàm solve như thế nào?</summary>
            <p>
              <code>solve(data)</code> nhận dữ liệu trên và <code>return</code>{" "}
              kết quả. Python có sẵn deque, Counter, heapq, bisect. C++ có sẵn
              std và kiểu json. Không cần viết main hoặc đọc stdin.
            </p>
            <p>
              Hàm hỗ trợ: make_list, list_values, make_tree, tree_values và
              is_bad / isBad. Các helper được giải thích trong bài liên quan.
            </p>
          </details>
          {!graded && (
            <div className="hint-area">
              <Button
                variant="soft"
                disabled={hint >= 3}
                onClick={() => setHint(Math.min(3, hint + 1))}
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
              {language === "python" ? "solution.py" : "solution.cpp"}
            </span>
            <select
              aria-label="Ngôn ngữ code"
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
            >
              <option value="python">{attempt.courseId === "ml" ? "Python 3.14 · ML" : "Python 3.12"}</option>
              {attempt.courseId !== "ml" && <option value="cpp">C++17</option>}
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
            <Editor
              height="360px"
              language={language === "cpp" ? "cpp" : "python"}
              value={code}
              theme="vs"
              loading={
                <LoadingScene compact title="Đang mở editor…" detail="Chuẩn bị không gian để bạn viết ý tưởng." />
              }
              onChange={(value) =>
                onChange({
                  ...current.current,
                  codeDrafts: {
                    ...current.current.codeDrafts,
                    [p.id]: {
                      ...current.current.codeDrafts[p.id],
                      [language]: value ?? "",
                    },
                  },
                })
              }
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
          </div>
          <div className="editor-actions">
            <span className="editor-save">
              <Icon name="shield" size={15} /> Chạy trong môi trường riêng
            </span>
            <div>
              {!graded && (
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
          <option value="python">Python</option>
          <option value="cpp">C++</option>
        </select>
        <pre className="reference-code">{reference?.[language]}</pre>
        <details>
          <summary>Các hàm hỗ trợ</summary>
          <pre>{reference?.helpers[language]}</pre>
        </details>
      </Modal>
    </div>
  );
}
