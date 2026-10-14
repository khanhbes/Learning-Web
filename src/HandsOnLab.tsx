import { useRef, useState } from "react";
import { motion } from "motion/react";
import { useMotionPreference as useReducedMotion } from "./motionPreference";
import { api } from "./api";
import { Button, Icon, Byte } from "./components";
import { useApp } from "./context";
import type { Attempt } from "./types";
import { currentLanguage } from './courseUI';
import { GitScenarioPreview } from './GitWorkbench';
export default function HandsOnLab({
  attempt,
  onChange,
  onQuiz,
}: {
  attempt: Attempt;
  onChange: (a: Attempt) => void;
  onQuiz: () => void;
}) {
  const [index, updateIndex] = useState(attempt.lab?.cursor ?? 0),
    [busy, setBusy] = useState(false);
  const dragged = useRef("");
  const reduced = useReducedMotion();
  const { state, course, refresh, notify } = useApp();
  const lab = attempt.lab,
    q = lab?.questions[index];
  if (!q) return null;
  function setIndex(next: number) {
    updateIndex(next);
    onChange({ ...attempt, lab: { ...lab, cursor: next } });
  }
  const value =
    lab.drafts?.[q.id] ??
    lab.responses?.[q.id]?.value ??
    (q.kind === "order"
      ? q.items.map((i: any) => i.id)
      : q.kind === "match"
        ? {}
        : "");
  const feedback = lab.responses?.[q.id];
  const currentFeedback =
    feedback && JSON.stringify(feedback.value) === JSON.stringify(value)
      ? feedback
      : null;
  function update(next: any) {
    onChange({
      ...attempt,
      lab: { ...lab, drafts: { ...lab.drafts, [q.id]: next } },
    });
  }
  function move(id: string, to: number) {
    const order = [...value] as string[];
    const from = order.indexOf(id);
    if (from < 0) return;
    order.splice(from, 1);
    order.splice(Math.max(0, Math.min(to, order.length)), 0, id);
    update(order);
  }
  async function check() {
    setBusy(true);
    try {
      const result = await api(`/attempts/${attempt.id}/lab`, "POST", {
        questionId: q.id,
        value,
      });
      onChange({
        ...attempt,
        lab: result.attempt.lab,
        updatedAt: result.attempt.updatedAt,
      });
      await refresh();
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="hands-on" aria-labelledby="lab-title">
      <div className="lab-intro">
        <div>
          <span className="eyebrow">HỌC BẰNG CÁCH LÀM</span>
          <h1>Thử bằng đôi tay của bạn</h1>
          <p>Sắp bước, ghép ý nghĩa, chạy tay và sửa lỗi. Thử lại thoải mái.</p>
        </div>
        <Byte
          size={105}
          mood={
            currentFeedback?.correct
              ? "celebrate"
              : currentFeedback
                ? "encouraging"
                : "thinking"
          }
        />
      </div>
      <div className="lab-tabs" role="tablist" aria-label="Hoạt động tương tác">
        {lab.questions.map((item: any, i: number) => (
          <button
            role="tab"
            aria-selected={index === i}
            tabIndex={index === i ? 0 : -1}
            onKeyDown={(e) => {
              const next =
                e.key === "ArrowRight"
                  ? (i + 1) % lab.questions.length
                  : e.key === "ArrowLeft"
                    ? (i + lab.questions.length - 1) % lab.questions.length
                    : e.key === "Home"
                      ? 0
                      : e.key === "End"
                        ? lab.questions.length - 1
                        : null;
              if (next !== null) {
                e.preventDefault();
                setIndex(next);
                e.currentTarget.parentElement
                  ?.querySelectorAll<HTMLButtonElement>("button")
                  [next]?.focus();
              }
            }}
            key={item.id}
            onClick={() => setIndex(i)}
          >
            <Icon
              name={
                lab.completed?.includes(item.id)
                  ? "check"
                  : ({order:'layers',match:'link',output:'code',choice:item.code?'puzzle':'brain'} as Record<string,string>)[item.kind]||'puzzle'
              }
              size={18}
            />
            <span>{({order:'Xếp bước',match:'Ghép cặp',output:'Chạy tay',choice:item.code?'Sửa lỗi':'Chọn ý'} as Record<string,string>)[item.kind]||'Hoạt động'}{i >= 4 || (item.kind==='choice'&&!item.code) ? " " + (i + 1) : ""}</span>
          </button>
        ))}
      </div>
      <div className="lab-workspace" role="tabpanel">
        <h2 id="lab-title">{q.title}</h2>
        <p>{q.prompt}</p>
        {q.kind === "order" && (
          <ol className="step-sorter">
            {(value as string[]).map((id, i) => {
              const item = q.items.find((x: any) => x.id === id);
              return (
                <motion.li
                  layout={!reduced}
                  key={id}
                  draggable
                  onDragStart={() => {
                    dragged.current = id;
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    move(dragged.current, i);
                  }}
                >
                  <span className="step-handle" aria-hidden="true">
                    ⠿
                  </span>
                  <b>{i + 1}</b>
                  <p>{item?.text}</p>
                  <div>
                    <button
                      aria-label={`Đưa bước ${i + 1} lên`}
                      disabled={i === 0}
                      onClick={() => move(id, i - 1)}
                    >
                      <Icon name="up" size={17} />
                    </button>
                    <button
                      aria-label={`Đưa bước ${i + 1} xuống`}
                      disabled={i === value.length - 1}
                      onClick={() => move(id, i + 1)}
                    >
                      <Icon name="down" size={17} />
                    </button>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        )}
        {q.kind === "match" && (
          <div className="match-pairs">
            {q.pairs.map((pair: any) => (
              <label key={pair.id}>
                <strong>{pair.left}</strong>
                <Icon name="right" size={18} />
                <select
                  aria-label={"Ý nghĩa của " + pair.left}
                  value={value[pair.id] ?? ""}
                  onChange={(e) =>
                    update({ ...value, [pair.id]: e.target.value })
                  }
                >
                  <option value="">Chọn ý nghĩa…</option>
                  {q.options.map((o: any) => (
                    <option key={o.id} value={o.id}>
                      {o.text}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        )}
        {q.kind === "output" && (
          <>
            {q.input?.initial?<GitScenarioPreview input={q.input}/>:<div className="input-workbench">
              <span>ĐẦU VÀO</span>
              <pre>{JSON.stringify(q.input, null, 2)}</pre>
            </div>
            }
            <label className="lab-output">
              Kết quả bạn dự đoán
              <textarea
                spellCheck={false}
                aria-label="Kết quả chạy tay dạng JSON"
                placeholder="Ví dụ: 8, true hoặc [0,1]"
                value={value}
                onChange={(e) => update(e.target.value)}
              />
            </label>
          </>
        )}
        {q.kind === "choice" && (
          <>
            {q.code&&<pre className="lesson-code-example">
              <code>{typeof q.code==='string'?q.code:q.code?.[currentLanguage(course,state.profile.language)]}</code>
            </pre>}
            <div className="lab-choices">
              {q.options.map((o: any) => (
                <button
                  key={o.id}
                  aria-pressed={value === o.id}
                  onClick={() => update(o.id)}
                >
                  {o.text}
                </button>
              ))}
            </div>
          </>
        )}
        {currentFeedback && (
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            role="status"
            className={`lab-feedback ${currentFeedback.correct ? "correct" : "retry"}`}
          >
            <Icon
              name={currentFeedback.correct ? "success" : "info"}
              size={25}
            />
            <div>
              <strong>
                {currentFeedback.correct
                  ? "Bạn đã hiểu bước này!"
                  : "Thử một cách khác nhé"}
              </strong>
              <p>{currentFeedback.explanation}</p>
            </div>
          </motion.div>
        )}
        <div className="lesson-footer">
          <Button variant="outline" onClick={onQuiz}>
            8 CÂU LUYỆN <Icon name="right" size={17} />
          </Button>
          <Button
            busy={busy}
            onClick={
              currentFeedback?.correct && index < lab.questions.length - 1
                ? () => setIndex(index + 1)
                : check
            }
          >
            {currentFeedback?.correct && index < lab.questions.length - 1
              ? "HOẠT ĐỘNG TIẾP"
              : "KIỂM TRA CÁCH LÀM"}{" "}
            <Icon name="check" size={18} />
          </Button>
        </div>
      </div>
    </section>
  );
}
