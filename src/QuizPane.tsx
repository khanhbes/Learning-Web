import { useState } from "react";
import { api } from "./api";
import { useApp } from "./context";
import { Button, Icon, ProgressBar } from "./components";
import type { Attempt } from "./types";
export default function QuizPane({
  attempt,
  onChange,
  onDone,
}: {
  attempt: Attempt;
  onChange: (a: Attempt) => void;
  onDone: () => void;
}) {
  const [index, setIndex] = useState(() =>
      Math.max(
        0,
        attempt.questions.findIndex((q) => !attempt.answers[q.id]),
      ),
    ),
    [feedback, setFeedback] = useState<Record<string, any>>({}),
    [busy, setBusy] = useState(false);
  const { notify } = useApp();
  const q = attempt.questions[index],
    graded = attempt.mode === "assessment" || attempt.mode === "capstone",
    selected = attempt.answers[q.id];
  async function choose(id: string) {
    onChange({ ...attempt, answers: { ...attempt.answers, [q.id]: id } });
    if (!graded) {
      setBusy(true);
      try {
        const result = await api(`/attempts/${attempt.id}/answer`, "POST", {
          questionId: q.id,
          optionId: id,
        });
        setFeedback((prev) => ({ ...prev, [q.id]: result }));
      } catch (e) {
        notify((e as Error).message);
      } finally {
        setBusy(false);
      }
    }
  }
  return (
    <div className="quiz-pane">
      <div className="quiz-progress">
        <span>{graded ? "KIỂM TRA KIẾN THỨC" : "TỰ MÌNH THỬ NHÉ"}</span>
        <span>
          Câu {index + 1}/{attempt.questions.length}
        </span>
      </div>
      <ProgressBar value={index + 1} max={attempt.questions.length} />
      <h2>{q.prompt}</h2>
      {q.input !== undefined && (
        <pre className="quiz-input">{JSON.stringify(q.input, null, 2)}</pre>
      )}
      <div className="answer-options">
        {q.options.map((o, i) => (
          <button
            className={`answer-option ${selected === o.id ? "selected" : ""} ${feedback[q.id] && selected === o.id ? (feedback[q.id].correct ? "correct" : "incorrect") : ""}`}
            key={o.id}
            disabled={busy || attempt.status !== "active"}
            onClick={() => choose(o.id)}
          >
            <span>{String.fromCharCode(65 + i)}</span>
            <strong>{o.text}</strong>
            {selected === o.id && (
              <Icon
                name={
                  feedback[q.id]
                    ? feedback[q.id].correct
                      ? "success"
                      : "error"
                    : "check"
                }
                size={23}
              />
            )}
          </button>
        ))}
      </div>
      {feedback[q.id] && (
        <div
          className={`answer-feedback ${feedback[q.id].correct ? "correct" : "incorrect"}`}
          aria-live="polite"
        >
          <Icon name={feedback[q.id].correct ? "success" : "brain"} size={24} />
          <div>
            <strong>
              {feedback[q.id].correct
                ? "Đúng rồi!"
                : "Cùng nhìn lại ý này nhé."}
            </strong>
            <p>{feedback[q.id].explanation}</p>
          </div>
        </div>
      )}
      <div className="quiz-actions">
        <Button
          variant="outline"
          disabled={index === 0}
          onClick={() => setIndex(index - 1)}
        >
          <Icon name="left" size={17} /> CÂU TRƯỚC
        </Button>
        <Button
          disabled={!selected || busy}
          onClick={() =>
            index < attempt.questions.length - 1
              ? setIndex(index + 1)
              : onDone()
          }
        >
          {index < attempt.questions.length - 1
            ? "TIẾP TỤC"
            : graded
              ? attempt.mode === "capstone"
                ? "ĐẾN BỘ TEST"
                : "ĐẾN PHẦN CODE"
              : "XEM KẾT QUẢ"}{" "}
          <Icon name="right" size={18} />
        </Button>
      </div>
      <div className="question-dots" aria-label="Đi đến câu hỏi">
        {attempt.questions.map((q, i) => (
          <button
            key={q.id}
            aria-label={`Câu ${i + 1}${attempt.answers[q.id] ? ", đã trả lời" : ""}`}
            className={`${i === index ? "current" : ""} ${attempt.answers[q.id] ? "answered" : ""}`}
            onClick={() => setIndex(i)}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
