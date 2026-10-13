import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api, download } from "./api";
import { useApp } from "./context";
import { PageHeading } from "./pages";
import { Byte, Button, Icon, Modal, ProgressBar, Empty } from "./components";
import type { Attempt } from "./types";
import CodePanel from "./CodePanelLazy";
import QuizPane from "./QuizPane";
export default function CapstonePage() {
  const { state, refresh, notify } = useApp(),
    [data, setData] = useState<any>(null),
    [attempt, setAttempt] = useState<Attempt | null>(null),
    [tab, setTab] = useState("essay"),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState("Đã lưu"),
    [tests, setTests] = useState("[]"),
    [feedback, setFeedback] = useState<any>(null),
    [result, setResult] = useState<any>(null),
    [versions, setVersions] = useState(false);
  const current = useRef(attempt);
  current.current = attempt;
  useEffect(() => {
    api("/capstone")
      .then((d) => {
        setData(d);
        if (d.latest) {
          let latest = d.latest;
          let testsText = JSON.stringify(latest.customTests, null, 2);
          const raw = localStorage.getItem("bytepath-capstone-" + latest.id);
          if (raw && latest.status === "active") {
            try {
              const local = JSON.parse(raw);
              if (local.savedAt > latest.updatedAt) {
                latest = { ...latest, ...local };
                testsText =
                  local.testsText ?? JSON.stringify(local.customTests, null, 2);
              }
            } catch {
              /* A corrupt browser backup must not hide the server draft. */
            }
          }
          setAttempt(latest);
          setTests(testsText);
          setResult(d.latest.result);
          setFeedback(d.latest.feedback);
        }
      })
      .catch((e) => notify(e.message));
  }, []);
  async function start(retake = false) {
    setBusy(true);
    try {
      const a = await api<Attempt>(
        "/capstone" + (retake ? "/retake" : ""),
        "POST",
        {},
      );
      setAttempt(a);
      setTests("[]");
      setResult(null);
      setFeedback(null);
      setTab("essay");
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (!attempt || attempt.status !== "active") return;
    const body = {
      essay: attempt.essay,
      answers: attempt.answers,
      codeDrafts: attempt.codeDrafts,
      customTests: attempt.customTests,
    };
    localStorage.setItem(
      "bytepath-capstone-" + attempt.id,
      JSON.stringify({ ...body, testsText: tests, savedAt: Date.now() }),
    );
    setSaved("Đang lưu…");
    let active = true,
      timer: ReturnType<typeof setTimeout>;
    const persist = async () => {
      try {
        const updated = await api<Attempt>(
          "/capstone/" + attempt.id,
          "PATCH",
          body,
        );
        if (active) {
          setSaved("Đã lưu");
          setAttempt((prev) =>
            prev && prev.id === updated.id
              ? { ...prev, codesPassed: updated.codesPassed }
              : prev,
          );
        }
      } catch {
        if (active) {
          setSaved("Giữ trên trình duyệt · sẽ thử đồng bộ lại");
          timer = setTimeout(persist, 5000);
        }
      }
    };
    timer = setTimeout(persist, 600);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [
    attempt?.essay,
    attempt?.answers,
    attempt?.codeDrafts,
    attempt?.customTests,
    tests,
  ]);
  useEffect(() => {
    const flush = () => {
      const a = current.current;
      if (a?.status === "active")
        fetch("/api/capstone/" + a.id, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            essay: a.essay,
            answers: a.answers,
            codeDrafts: a.codeDrafts,
            customTests: a.customTests,
          }),
          keepalive: true,
        }).catch(() => {});
    };
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, []);
  if (!data)
    return (
      <div className="boot">
        <Byte mood="thinking" />
        <p>Đang chuẩn bị bài cuối khóa…</p>
      </div>
    );
  if (!data.unlocked)
    return (
      <div className="wide-page">
        <PageHeading
          eyebrow="ĐÍCH ĐẾN TIẾP THEO"
          title="Xây một điều có ích"
          description="Dùng những gì bạn đã học để làm hệ thống lập kế hoạch học thông minh."
          icon="graduate"
        />
        <div className="capstone-locked">
          <Byte size={210} mood="thinking" skin={state.profile.skin} />
          <h2>Mỗi chặng đều đưa bạn đến đây</h2>
          <p>
            Hoàn thành 48 buổi nền tảng để mở bài luận kèm lập trình. Bạn đã đi
            được {state.completed} buổi.
          </p>
          <ProgressBar value={state.completed} max={48} />
          <Link to="/" className="btn primary">
            TIẾP TỤC HÀNH TRÌNH <Icon name="right" size={19} />
          </Link>
        </div>
        <div className="capstone-preview">
          <h3>Ba ý tưởng, một hệ thống</h3>
          <p>
            <Icon name="network" /> Sắp lịch theo tiên quyết bằng đồ thị
          </p>
          <p>
            <Icon name="crown" /> Chọn công việc tiếp theo bằng priority queue
          </p>
          <p>
            <Icon name="layers" /> Thống kê thời gian bằng prefix sum
          </p>
        </div>
      </div>
    );
  const essayDone = attempt
    ? data.fields.filter((f: any) => attempt.essay?.[f.id]?.trim()).length
    : 0;
  async function submit() {
    if (!attempt) return;
    setBusy(true);
    try {
      let customTests;
      try {
        customTests = JSON.parse(tests);
      } catch {
        throw new Error("Bộ test cần là JSON hợp lệ.");
      }
      await api("/capstone/" + attempt.id, "PATCH", {
        essay: attempt.essay,
        answers: attempt.answers,
        codeDrafts: attempt.codeDrafts,
        customTests,
      });
      const r = await api("/capstone/" + attempt.id + "/submit", "POST", {});
      setResult(r);
      setAttempt({ ...attempt, status: "completed", result: r });
      localStorage.removeItem("bytepath-capstone-" + attempt.id);
      await refresh();
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="capstone-page">
      <PageHeading
        eyebrow="BÀI CUỐI KHÓA"
        title="Lập kế hoạch học thông minh"
        description="Giải thích ý tưởng, viết code, kiểm chứng và nhìn lại cách mình đã giải bài."
        icon="graduate"
      />
      {!attempt ? (
        <div className="capstone-brief">
          <Byte mood="celebrate" size={160} />
          <h2>Bạn đã sẵn sàng!</h2>
          <p>
            Bài gồm 5 phần luận, 3 hàm code, 6 câu kiểm chứng và bộ test tự tạo.
            Không giới hạn thời gian; bản nháp luôn có thể tiếp tục.
          </p>
          <Button onClick={() => start()} busy={busy}>
            TẠO ĐỀ CỦA TÔI <Icon name="right" size={18} />
          </Button>
        </div>
      ) : (
        <>
          <div className="capstone-toolbar">
            <span className="save-state">
              <Icon name="shield" size={17} />
              {saved}
            </span>
            <span>
              {essayDone}/5 phần · {attempt.codesPassed.length}/3 hàm đạt
            </span>
            <button
              className="text-link"
              onClick={async () => {
                try {
                  setData(await api("/capstone"));
                  setVersions(true);
                } catch (e) {
                  notify((e as Error).message);
                }
              }}
            >
              LỊCH SỬ NHÁP
            </button>
            <button
              className="text-link"
              onClick={() =>
                download(
                  "bytepath-capstone.json",
                  JSON.stringify(attempt, null, 2),
                )
              }
            >
              <Icon name="download" size={15} /> JSON
            </button>
            <button
              className="text-link"
              onClick={() =>
                download(
                  "bytepath-capstone.md",
                  "# Lập kế hoạch học thông minh\n\n" +
                    data.fields
                      .map(
                        (f: any) =>
                          "## " +
                          f.title +
                          "\n\n" +
                          (attempt.essay?.[f.id] ?? ""),
                      )
                      .join("\n\n") +
                    "\n\n## Code\n\n" +
                    Object.entries(attempt.codeDrafts)
                      .map(([id, d]) =>
                        Object.entries(d)
                          .map(
                            ([lang, code]) =>
                              "### " +
                              id +
                              " (" +
                              lang +
                              ")\n\n```" +
                              lang +
                              "\n" +
                              code +
                              "\n```",
                          )
                          .join("\n"),
                      )
                      .join("\n"),
                  "text/markdown",
                )
              }
            >
              MARKDOWN
            </button>
          </div>
          <div className="tabs capstone-tabs">
            {[
              ["essay", "Bài luận"],
              ["code", "Lập trình"],
              ["verify", "Kiểm chứng"],
              ["tests", "Test của tôi"],
              ["result", "Kết quả"],
            ].map(([key, text]) => (
              <button
                key={key}
                className={tab === key ? "active" : ""}
                onClick={() => setTab(key)}
              >
                {text}
              </button>
            ))}
          </div>
          {tab === "essay" ? (
            <div className="essay-editor">
              <div className="essay-note">
                <Icon name="file" />
                <p>
                  Viết bằng lời của bạn. Code và câu trả lời kiểm chứng quyết
                  định điểm; Byte nhận xét phần lập luận sau khi nộp.
                </p>
              </div>
              <details className="capstone-data">
                <summary>Dữ liệu tình huống của đề này</summary>
                <pre>{JSON.stringify(attempt.tasks, null, 2)}</pre>
              </details>
              {data.fields.map((f: any) => (
                <label className="essay-field" key={f.id}>
                  <span>{f.title}</span>
                  <textarea
                    rows={6}
                    placeholder={f.placeholder}
                    value={attempt.essay?.[f.id] ?? ""}
                    disabled={attempt.status !== "active"}
                    onChange={(e) =>
                      setAttempt({
                        ...attempt,
                        essay: { ...attempt.essay, [f.id]: e.target.value },
                      })
                    }
                  />
                </label>
              ))}
            </div>
          ) : tab === "code" ? (
            <CodePanel
              attempt={attempt}
              problems={data.problems}
              onChange={setAttempt}
              base="capstones"
              graded
            />
          ) : tab === "verify" ? (
            <QuizPane
              attempt={attempt}
              onChange={setAttempt}
              onDone={() => setTab("tests")}
            />
          ) : tab === "tests" ? (
            <div className="custom-test-editor">
              <h2>Test tốt phát hiện được lỗi</h2>
              <p>
                Tạo tối đa 30 test. Mỗi test có problemId, input và expected.
                Điểm kiểm thử dựa trên việc phát hiện 4 lỗi mẫu: bỏ tiên quyết,
                bỏ ưu tiên, tie-break sai và lệch biên tổng đoạn.
              </p>
              <details>
                <summary>Xem cách viết một test</summary>
                <pre>
                  {JSON.stringify(
                    [
                      {
                        problemId: "prefix",
                        input: { nums: [3, 1, 4], queries: [[0, 2]] },
                        expected: [8],
                      },
                    ],
                    null,
                    2,
                  )}
                </pre>
              </details>
              <textarea
                aria-label="Bộ test JSON"
                className="test-json"
                rows={18}
                value={tests}
                disabled={attempt.status !== "active"}
                onChange={(e) => {
                  setTests(e.target.value);
                  try {
                    const value = JSON.parse(e.target.value);
                    if (Array.isArray(value))
                      setAttempt({ ...attempt, customTests: value });
                  } catch {
                    /* Preserve incomplete JSON locally until corrected. */
                  }
                }}
              />
              <Button
                variant="outline"
                onClick={() => {
                  try {
                    const parsed = JSON.parse(tests);
                    if (!Array.isArray(parsed)) throw new Error();
                    setAttempt({ ...attempt, customTests: parsed });
                    notify(
                      "JSON hợp lệ. Bộ chấm sẽ kiểm tra nội dung khi nộp.",
                    );
                  } catch {
                    notify("JSON chưa hợp lệ hoặc không phải một mảng.");
                  }
                }}
              >
                KIỂM TRA JSON
              </Button>
            </div>
          ) : (
            <div className="capstone-results">
              {!result ? (
                <Empty icon="graduate" title="Báo cáo sẽ xuất hiện sau khi nộp">
                  Code 60 điểm · Truy vết 20 · Kiến thức 10 · Test 10.
                </Empty>
              ) : (
                <>
                  <div
                    className={`capstone-score ${result.passed ? "passed" : ""}`}
                  >
                    <Byte
                      size={150}
                      mood={result.passed ? "celebrate" : "thinking"}
                    />
                    <div>
                      <span className="eyebrow">
                        {result.passed ? "ĐÃ ĐẠT" : "CHƯA ĐẠT"}
                      </span>
                      <h2>{result.score}/100</h2>
                      <p>
                        {result.passed
                          ? "Bạn đã hoàn thành khóa DSA nền tảng!"
                          : "Dùng báo cáo để tìm phần cần cải thiện rồi thử đề mới."}
                      </p>
                    </div>
                  </div>
                  <div className="rubric-table">
                    {[
                      ["Code", result.code, 60],
                      ["Truy vết", result.trace, 20],
                      ["Kiến thức", result.concept, 10],
                      ["Test tự tạo", result.tests.score, 10],
                    ].map(([name, value, max]) => (
                      <div key={name}>
                        <strong>{name}</strong>
                        <span>
                          {value}/{max}
                        </span>
                      </div>
                    ))}
                  </div>
                  <h3>Test của bạn đã phát hiện</h3>
                  <p>
                    {result.tests.killed.join(", ") ||
                      "Chưa phát hiện lỗi mẫu."}
                  </p>
                  {result.tests.errors.map((e: string) => (
                    <p className="error-text" key={e}>
                      {e}
                    </p>
                  ))}
                  <details>
                    <summary>Giải thích câu kiểm chứng</summary>
                    {result.details.map((d: any, i: number) => (
                      <p key={d.id}>
                        {i + 1}. {d.explanation}
                      </p>
                    ))}
                  </details>
                  <Button
                    variant="outline"
                    busy={busy}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        setFeedback(
                          await api(
                            "/capstone/" + attempt.id + "/feedback",
                            "POST",
                            {},
                          ),
                        );
                      } catch (e) {
                        notify((e as Error).message);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    <Icon name="chat" size={19} /> BYTE NHẬN XÉT BÀI LUẬN
                  </Button>
                  {feedback && (
                    <div className="tutor-reply">
                      {feedback.feedback ? (
                        <>
                          <h4>Tính rõ ràng</h4>
                          <p>{feedback.feedback.clarity}</p>
                          <h4>Tính nhất quán</h4>
                          <p>{feedback.feedback.consistency}</p>
                          <h4>Lập luận</h4>
                          <p>{feedback.feedback.reasoning}</p>
                          <h4>Cải thiện</h4>
                          {feedback.feedback.improvements.map((v: string) => (
                            <p key={v}>• {v}</p>
                          ))}
                        </>
                      ) : (
                        <p>{feedback.text}</p>
                      )}
                    </div>
                  )}
                  <Button onClick={() => start(true)}>
                    LÀM LẠI VỚI ĐỀ MỚI <Icon name="refresh" size={18} />
                  </Button>
                </>
              )}
            </div>
          )}
          {attempt.status === "active" && (
            <div className="capstone-footer">
              <span>
                <Icon name="clock" size={18} /> Không giới hạn thời gian
              </span>
              <Button busy={busy} onClick={submit}>
                NỘP BÀI CUỐI KHÓA <Icon name="check" size={19} />
              </Button>
            </div>
          )}
          <Modal
            open={versions}
            onClose={() => setVersions(false)}
            title="Lịch sử bản nháp"
          >
            <h2>Lịch sử bản nháp</h2>
            <p>Một phiên bản được giữ sau mỗi khoảng 30 giây có chỉnh sửa.</p>
            {data.versions.length === 0 ? (
              <p>Chưa có phiên bản trước. Bản hiện tại vẫn được tự lưu.</p>
            ) : (
              data.versions.map((v: any) => (
                <button
                  key={v.id}
                  className="version-row"
                  onClick={async () => {
                    try {
                      const d = await api("/capstone/versions/" + v.id);
                      if (attempt.status !== "active") {
                        download(
                          "bytepath-draft-" + v.id + ".json",
                          JSON.stringify(d, null, 2),
                        );
                        return;
                      }
                      if (
                        !window.confirm(
                          "Khôi phục nội dung bản nháp này vào đề hiện tại?",
                        )
                      )
                        return;
                      setAttempt({
                        ...attempt,
                        essay: d.essay,
                        codeDrafts: d.codeDrafts,
                        customTests: d.customTests,
                      });
                      setTests(JSON.stringify(d.customTests, null, 2));
                      setVersions(false);
                    } catch (e) {
                      notify((e as Error).message);
                    }
                  }}
                >
                  <Icon name="file" size={20} />
                  {new Date(v.createdAt).toLocaleString("vi-VN", {
                    timeZone: "Asia/Saigon",
                  })}
                  <Icon name="reset" size={17} />
                </button>
              ))
            )}
          </Modal>
        </>
      )}
    </div>
  );
}
