import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api, download } from "./api";
import { useApp } from "./context";
import { PageHeading } from "./pages";
import { Byte, Button, Icon, Modal, ProgressBar, Empty } from "./components";
import type { Attempt } from "./types";
import CodePanel from "./CodePanelLazy";
import QuizPane from "./QuizPane";
import { LoadingScene, CelebrationScene, SuccessFeedback } from "./Delight";
import { courseInfo, mandatoryLessons, gitCourse, dockerCourse } from './courseUI';
import LearningDataView from './LearningDataView';
import CourseProjectPreview from './CourseProjectPreview';
function ChurnChart({input}:{input:{p:number[];y:number[];threshold:number}}) {
  return <section className="ml-visualizer"><h3>Đọc kết quả trên khách hàng giả lập</h3><p>Mỗi cột là xác suất rời dịch vụ. Màu cam: nhãn thật 1; màu xanh: nhãn thật 0. Hãy giải thích các cảnh báo nhầm và trường hợp bỏ sót.</p><svg viewBox="0 0 560 260" role="img" aria-label="Biểu đồ xác suất churn trên tập test; đường ngang là ngưỡng dự đoán dương">
    <path d="M48 20v200h490" fill="none" stroke="#829880" strokeWidth="2"/>
    {[0,.5,1].map(p=><g key={p}><path d={`M48 ${220-p*180}h490`} stroke="#dce7d8" strokeDasharray="4 4"/><text x="38" y={225-p*180} textAnchor="end" fontSize="13">{p}</text></g>)}
    <path d={`M48 ${220-input.threshold*180}h490`} stroke="#9273ce" strokeWidth="2" strokeDasharray="5 4"/>
    {input.p.map((p,i)=><g key={i}><rect x={63+i*460/input.p.length} y={220-p*180} width={Math.min(35,400/input.p.length)} height={p*180} rx="4" fill={input.y[i]===1?"#efaa43":"#58b92b"}><title>{`Khách ${i+1}: p=${p.toFixed(3)}, nhãn thật=${input.y[i]}`}</title></rect><text x={78+i*460/input.p.length} y="239" textAnchor="middle" fontSize="12">{i+1}</text></g>)}
    <text x="270" y="258" textAnchor="middle" fontSize="12">Chỉ số khách trong tập test (bắt đầu 1 trên hình)</text><text transform="translate(14,142) rotate(-90)" textAnchor="middle" fontSize="12">Xác suất dự đoán [0,1]</text>
  </svg><small>Ngưỡng {input.threshold}; p bằng ngưỡng được dự đoán là 1. Đây là hình phân tích, điểm do checker xác định.</small></section>;
}
function DataProjectTable({input}:{input:{rows:any[];unit?:string}}) {
  return <section className="da-capstone-preview"><h3>Dữ liệu cửa hàng của lượt làm</h3><p>Quan sát giá trị thiếu và ID trùng. Viết các chức năng theo đúng hợp đồng đề bài trước khi nộp.</p><div className="workshop-table-wrap"><table className="workshop-table"><caption>Bảng đầu vào · chưa làm sạch · giá theo {input.unit||'nghìn đồng'}</caption><thead><tr>{['ID','Khu vực','Tháng','Số lượng','Giá'].map(h=><th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{input.rows.map((row,i)=><tr key={i}><th scope="row">{row.id}</th><td>{row.region}</td><td>{row.month}</td><td>{row.quantity==null?<span className="data-missing">Thiếu</span>:row.quantity}</td><td>{row.price==null?<span className="data-missing">Thiếu</span>:row.price}</td></tr>)}</tbody></table></div><small>Hình giúp đọc đầu vào. Điểm và điều kiện đạt do checker backend xác nhận.</small></section>;
}
export default function CapstonePage() {
  const { state, course, refresh, notify } = useApp(),
    [data, setData] = useState<any>(null),
    [attempt, setAttempt] = useState<Attempt | null>(null),
    [tab, setTab] = useState("essay"),
    [busy, setBusy] = useState(false),
    [working, setWorking] = useState(""),
    [saved, setSaved] = useState("Đã lưu"),
    [tests, setTests] = useState("[]"),
    [feedback, setFeedback] = useState<any>(null),
    [result, setResult] = useState<any>(null),
    [versions, setVersions] = useState(false);
  const prefix = "/courses/" + course.id + "/capstone";
  const info=courseInfo(course);
  const current = useRef(attempt);
  current.current = attempt;
  useEffect(() => {
    api(prefix)
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
  }, [course.id]);
  async function start(retake = false) {
    setBusy(true);
    setWorking("start");
    try {
      const a = await api<Attempt>(
        prefix + (retake ? "/retake" : ""),
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
      setWorking("");
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
          prefix + "/" + attempt.id,
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
        fetch("/api" + prefix + "/" + a.id, {
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
  }, [course.id]);
  if (!data)
    return (
      <div className="boot">
        <LoadingScene title="Đang mở bài cuối khóa…" detail="Byte đang lấy đề và bản nháp gần nhất của bạn." />
      </div>
    );
  if (!data.unlocked)
    return (
      <div className="wide-page">
        <PageHeading
          eyebrow="ĐÍCH ĐẾN TIẾP THEO"
          title="Xây một điều có ích"
          description={course.capstoneTitle||info.capstone}
          icon="graduate"
        />
        <div className="capstone-locked">
          <Byte size={210} mood="thinking" skin={state.profile.skin} />
          <h2>Mỗi chặng đều đưa bạn đến đây</h2>
          <p>
            Hoàn thành {mandatoryLessons(course)} buổi nền tảng để mở bài luận kèm lập trình. Bạn đã đi
            được {state.completed} buổi.
          </p>
          <ProgressBar value={state.completed} max={mandatoryLessons(course)} />
          <Link to="/" className="btn primary">
            TIẾP TỤC HÀNH TRÌNH <Icon name="right" size={19} />
          </Link>
        </div>
        <div className="capstone-preview">
          <h3>Ba kỹ năng, một dự án</h3>
          {info.tasks.map((task,i)=><p key={task}><Icon name={['network','crown','layers'][i]}/>{task}</p>)}
        </div>
      </div>
    );
  const essayDone = attempt
    ? data.fields.filter((f: any) => attempt.essay?.[f.id]?.trim()).length
    : 0;
  async function submit() {
    if (!attempt) return;
    setBusy(true);
    setWorking("submit");
    try {
      let customTests;
      try {
        customTests = JSON.parse(tests);
      } catch {
        throw new Error("Bộ test cần là JSON hợp lệ.");
      }
      await api(prefix + "/" + attempt.id, "PATCH", {
        essay: attempt.essay,
        answers: attempt.answers,
        codeDrafts: attempt.codeDrafts,
        customTests,
      });
      const r = await api(prefix + "/" + attempt.id + "/submit", "POST", {});
      setResult(r);
      setTab("result");
      setAttempt({ ...attempt, status: "completed", result: r });
      localStorage.removeItem("bytepath-capstone-" + attempt.id);
      await refresh();
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
      setWorking("");
    }
  }
  return (
    <div className="capstone-page">
      <PageHeading
        eyebrow="BÀI CUỐI KHÓA"
        title={data.title||course.capstoneTitle||info.capstone}
        description={dockerCourse(course)?'Giải thích cấu hình, viết lệnh mô phỏng và kiểm chứng trạng thái của dịch vụ.':gitCourse(course)?'Giải thích thao tác, viết chuỗi lệnh mô phỏng và kiểm chứng lịch sử Git.':'Giải thích ý tưởng, viết code, kiểm chứng và nhìn lại cách mình đã giải bài.'}
        icon="graduate"
      />
      {busy && working === "start" && <LoadingScene compact title="Chuẩn bị tình huống của bạn…" detail="Đề và dữ liệu sẽ được cố định khi lượt làm bắt đầu." />}
      {busy && working === "start" ? null : !attempt ? (
        <div className="capstone-brief">
          <Byte mood="celebrate" size={160} />
          <h2>Bạn đã sẵn sàng!</h2>
          <p>
            Bài gồm 5 phần luận, 3 bài thực hành, 6 câu kiểm chứng và bộ test tự tạo.
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
              {essayDone}/5 phần · {attempt.codesPassed.length}/3 bài thực hành đạt
            </span>
            <button
              className="text-link"
              onClick={async () => {
                try {
                  setData(await api(prefix));
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
                  "# " + (data.title||course.capstoneTitle||info.capstone) + "\n\n" +
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
          {course.id === "ml" && (attempt as any).tasks?.["ml-confusion"] && <ChurnChart input={(attempt as any).tasks["ml-confusion"]} />}
          {course.id==='da'&&(attempt as any).tasks?.['da-clean-orders']?.rows&&<DataProjectTable input={(attempt as any).tasks['da-clean-orders']}/>}
          {['agent','linear'].includes(course.id)&&attempt.tasks&&<CourseProjectPreview key={course.id+attempt.id} courseId={course.id} tasks={attempt.tasks}/>}
          {['docker','genai','rag'].includes(course.id)&&attempt.tasks&&<section className="guided-project-data"><h3>Dữ liệu của dự án này</h3><p>Quan sát đầu vào của từng chức năng trước khi viết phương án và kiểm thử.</p>{Object.entries(attempt.tasks).map(([id,input])=><details key={id}><summary>{data.problems.find((p:{id:string;title:string})=>p.id===id)?.title??id}</summary><LearningDataView value={input}/></details>)}</section>}
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
          {busy && working === "submit" ? (
            <LoadingScene title="Đang xác nhận bài cuối khóa…" detail="Backend đang đối chiếu kiến thức, kết quả code và bộ test của bạn." />
          ) : tab === "essay" ? (
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
              base={`courses/${course.id}/capstones`}
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
                {data.testDescription||'Điểm kiểm thử dựa trên việc phát hiện các lỗi mẫu theo đặc tả dự án. Đáp án và trạng thái do checker backend xác minh.'}
              </p>
              <details>
                <summary>Xem cách viết một test</summary>
                <pre>
                  {JSON.stringify(
                    data.testExample || [{ problemId: data.problems[0]?.id, input: data.problems[0]?.sampleInput, expected: data.problems[0]?.sampleOutput }],
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
                  {result.passed ? (
                    <CelebrationScene variant="capstone"
                      title={`Bạn đã hoàn thành khóa ${course.id.toUpperCase()}!`}
                      subtitle="Các kỹ năng bắt buộc đã được kiểm chứng."
                      xp={result.reward?.xp}
                      bonusXp={result.reward?.bonusXp}
                      gems={result.reward?.gems}
                    >
                      <h2>{result.score}/100</h2>
                    </CelebrationScene>
                  ) : (
                    <div className="capstone-score">
                      <Byte size={130} mood="encouraging" />
                      <SuccessFeedback correct={false} label="Cùng hoàn thiện thêm một chút">
                        <h2>{result.score}/100</h2>
                        <p>Dùng báo cáo để tìm phần cần cải thiện rồi thử đề mới.</p>
                      </SuccessFeedback>
                    </div>
                  )}
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
                      setWorking("feedback");
                      try {
                        setFeedback(
                          await api(
                            prefix + "/" + attempt.id + "/feedback",
                            "POST",
                            {},
                          ),
                        );
                      } catch (e) {
                        notify((e as Error).message);
                      } finally {
                        setBusy(false);
                        setWorking("");
                      }
                    }}
                  >
                    <Icon name="chat" size={19} /> BYTE NHẬN XÉT BÀI LUẬN
                  </Button>
                  {busy && working === "feedback" && <LoadingScene compact title="Byte đang đọc bài luận…" detail="Nhận xét giúp bạn cải thiện lập luận, không thay đổi điểm chính thức." />}
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
                      const d = await api(prefix+"/versions/" + v.id);
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
