import { useEffect, useState } from "react";
import type { KeyboardEvent } from "react";
import { Icon } from "./components";
import { useMotionPreference } from "./motionPreference";

/** Shared controls keep exploration keyboard-operable and respect both motion preferences. */
export function useVisualPlayback(length: number, identity: string) {
  const reduced = useMotionPreference();
  const [step, setStep] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(1);
  const last = Math.max(0, length - 1);
  useEffect(() => {
    setStep(0);
    setPlaying(false);
  }, [identity]);
  useEffect(() => {
    if (reduced) setPlaying(false);
  }, [reduced]);
  useEffect(() => {
    if (!playing || reduced || length < 2) return;
    const timer = setInterval(
      () =>
        setStep((s) => {
          if (s >= last) {
            setPlaying(false);
            return s;
          }
          return s + 1;
        }),
      1050 / speed,
    );
    return () => clearInterval(timer);
  }, [playing, reduced, speed, length, last]);
  function go(value: number) {
    setPlaying(false);
    setStep(Math.max(0, Math.min(last, value)));
  }
  function toggle() {
    if (reduced) return;
    if (step >= last) setStep(0);
    setPlaying((p) => !p);
  }
  function reset() {
    go(0);
  }
  function onKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (e.target !== e.currentTarget) return;
    if (
      e.key === "ArrowLeft" ||
      e.key === "ArrowRight" ||
      e.key === "Home" ||
      e.key === "End"
    ) {
      e.preventDefault();
      go(
        e.key === "Home"
          ? 0
          : e.key === "End"
            ? last
            : step + (e.key === "ArrowRight" ? 1 : -1),
      );
    } else if (e.key === " ") {
      e.preventDefault();
      toggle();
    }
  }
  return {
    step: Math.min(step, last),
    playing,
    speed,
    setSpeed,
    go,
    toggle,
    reset,
    reduced,
    onKeyDown,
    length,
  };
}
export type Playback = ReturnType<typeof useVisualPlayback>;
export function VisualPlayback({
  playback,
  onChangeData,
  busy = false,
  allowChangeData = true,
}: {
  playback: Playback;
  onChangeData: () => void;
  busy?: boolean;
  allowChangeData?: boolean;
}) {
  const p = playback;
  return (
    <div className="workshop-controls visual-playback">
      <button
        className="icon-button"
        aria-label={p.playing ? "Dừng mô phỏng" : "Chạy mô phỏng"}
        disabled={busy || p.reduced || p.length < 2}
        onClick={p.toggle}
      >
        <Icon name={p.playing ? "pause" : "play"} />
      </button>
      <button
        className="icon-button"
        aria-label="Bước trước"
        disabled={busy || p.step === 0}
        onClick={() => p.go(p.step - 1)}
      >
        <Icon name="previous" />
      </button>
      <button
        className="icon-button"
        aria-label="Bước sau"
        disabled={busy || p.step >= p.length - 1}
        onClick={() => p.go(p.step + 1)}
      >
        <Icon name="forward" />
      </button>
      <select
        aria-label="Tốc độ mô phỏng"
        value={p.speed}
        onChange={(e) => p.setSpeed(Number(e.target.value))}
        disabled={busy}
      >
        <option value="0.5">0.5×</option>
        <option value="1">1×</option>
        <option value="2">2×</option>
      </select>
      <button
        className="icon-button"
        aria-label="Reset mô phỏng"
        onClick={p.reset}
        disabled={busy}
      >
        <Icon name="reset" />
      </button>
      {allowChangeData && <button className="text-link" onClick={onChangeData} disabled={busy}>
        <Icon name="refresh" size={15} />
        ĐỔI DỮ LIỆU
      </button>}
      <span className="workshop-step">
        Bước {p.length ? p.step + 1 : 0}/{p.length}
      </span>
      {p.reduced && (
        <small className="visual-reduced-note">
          Giảm chuyển động · dùng các nút bước để khám phá.
        </small>
      )}
    </div>
  );
}
