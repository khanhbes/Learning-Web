import { useEffect, useRef, useState } from "react";
import { api } from "./api";
import { useApp } from "./context";
import { Button, Icon, ProgressBar } from "./components";
import type { Attempt } from "./types";
import { SuccessFeedback } from "./Delight";
import { GitScenarioPreview } from './GitWorkbench';
import { useMascot } from './bitty/MascotProvider';
import Mascot from './bitty/Mascot';
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
  const mascot = useMascot();
  const alive = useRef(true), inFlight = useRef(false), wrongChain = useRef(0), animatedFeedback = useRef(new Set<string>());
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const q = attempt.questions[index],
    graded = attempt.mode === "assessment" || attempt.mode === "capstone",
    selected = attempt.answers[q.id];
  const visibleFeedback = !busy && feedback[q.id]?.optionId === selected ? feedback[q.id] : null;
  async function choose(id: string) {
    if (inFlight.current || attempt.status !== 'active') return;
    onChange({ ...attempt, answers: { ...attempt.answers, [q.id]: id } });
    if (!graded) {
      inFlight.current = true;
      setBusy(true);
      try {
        const result = await api(`/attempts/${attempt.id}/answer`, "POST", {
          questionId: q.id,
          optionId: id,
        });
        if (!alive.current) return;
        setFeedback((prev) => ({ ...prev, [q.id]: { ...result, optionId: id } }));
        const eventId = `quiz:${attempt.id}:${q.id}:${id}`;
        if (typeof result.correct === 'boolean' && !animatedFeedback.current.has(eventId)) {
          animatedFeedback.current.add(eventId);
          mascot.say(result.correct ? 'correct' : 'wrong', { id: eventId });
          wrongChain.current = result.correct ? 0 : wrongChain.current + 1;
          if (wrongChain.current >= 3) mascot.say('cheer', { id: `${eventId}:encourage` });
        }
      } catch (e) {
        notify((e as Error).message);
      } finally {
        inFlight.current = false;
        if (alive.current) setBusy(false);
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
      {!graded && <div style={{ display: 'flex', justifyContent: 'flex-end', height: 64, marginTop: 6, pointerEvents: 'none' }}><Mascot size={86} /></div>}
      <h2>{q.prompt}</h2>
      {q.input !== undefined && (
        q.input&&typeof q.input==='object'&&'initial' in q.input?<GitScenarioPreview input={q.input}/>:<pre className="quiz-input">{JSON.stringify(q.input, null, 2)}</pre>
      )}
      <div className="answer-options">
        {q.options.map((o, i) => (
          <button
            className={`answer-option ${selected === o.id ? "selected" : ""} ${visibleFeedback && selected === o.id ? (visibleFeedback.correct ? "correct" : "incorrect") : ""}`}
            key={o.id}
            disabled={busy || attempt.status !== "active"}
            onClick={() => choose(o.id)}
          >
            <span>{String.fromCharCode(65 + i)}</span>
            <strong>{o.text}</strong>
            {selected === o.id && (
              <Icon
                name={
                  visibleFeedback
                    ? visibleFeedback.correct
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
      {visibleFeedback && (
        <SuccessFeedback
          key={q.id + selected}
          correct={visibleFeedback.correct}
          label={visibleFeedback.correct ? "Đúng rồi, bạn đã hiểu ý này!" : "Cùng nhìn lại một chút nhé."}
        >
          <p>{visibleFeedback.explanation}</p>
        </SuccessFeedback>
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
