import { useReducer, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { initialPlayground, playgroundStep } from "../shared/playground.mjs";
import { Button, Icon } from "./components";
type PlaygroundState = {
  values: number[];
  slots: (number | null)[];
  head: number;
  size: number;
  bits: number;
  message: string;
};
type PlaygroundAction = {
  type: string;
  value?: number;
  mode?: string;
  index?: number;
};
export default function StructurePlayground({ pack }: { pack: string }) {
  const [s, dispatch] = useReducer(
      (current: PlaygroundState, action: PlaygroundAction) =>
        playgroundStep(current, action) as PlaygroundState,
      initialPlayground() as PlaygroundState,
    ),
    [value, setValue] = useState("10");
  const reduced = useReducedMotion();
  if (!["stack", "queue", "bit"].includes(pack)) return null;
  return (
    <section className="structure-playground">
      <span className="eyebrow">TỰ THAO TÁC · KHÔNG TÍNH ĐIỂM</span>
      <h2>
        {pack === "queue"
          ? "Hàng đợi vòng trong 4 ô"
          : pack === "stack"
            ? "Một chồng, hai thao tác"
            : "Bật tắt những công tắc"}
      </h2>
      {pack === "bit" ? (
        <div className="playground-bits">
          {Array.from({ length: 8 }, (_, i) => 7 - i).map((i) => (
            <button
              key={i}
              aria-label={"Đảo bit " + i}
              aria-pressed={!!(s.bits & (1 << i))}
              onClick={() => dispatch({ type: "bit", index: i })}
            >
              <b>{(s.bits >> i) & 1}</b>
              <small>2^{i}</small>
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="playground-slots">
            {s.slots.map((v: any, i: number) => (
              <motion.div
                layout={!reduced}
                className={v === null ? "empty" : "filled"}
                key={i}
              >
                <small>Ô {i}</small>
                <strong>{v ?? "∅"}</strong>
                <span>
                  {pack === "queue" && i === s.head ? "HEAD " : ""}
                  {pack === "queue" && i === (s.head + s.size) % 4
                    ? "TAIL"
                    : ""}
                  {pack === "stack" &&
                  s.size > 0 &&
                  i === (s.head + s.size - 1) % 4
                    ? "TOP"
                    : ""}
                </span>
              </motion.div>
            ))}
          </div>
          <div className="playground-state">
            <span>size={s.size}/4</span>
            <span>
              {pack === "queue" ? "Thứ tự ra" : "Đáy → đỉnh"}:{" "}
              {s.values.join(" → ") || "rỗng"}
            </span>
          </div>
          <div className="playground-actions">
            <label>
              Giá trị
              <input
                type="number"
                min={-1000}
                max={1000}
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </label>
            <Button
              variant="outline"
              onClick={() =>
                dispatch({
                  type: "push",
                  value: value === "" ? NaN : Number(value),
                })
              }
            >
              {pack === "stack" ? "PUSH" : "ENQUEUE"}
            </Button>
            <Button
              variant="outline"
              onClick={() => dispatch({ type: "pop", mode: pack })}
            >
              {pack === "stack" ? "POP" : "DEQUEUE"}
            </Button>
          </div>
          {pack === "queue" && (
            <p className="playground-formula">
              tail=(head+size)%4. Head và tail có thể bằng nhau khi rỗng hoặc
              đầy; size phân biệt hai trạng thái.
            </p>
          )}
        </>
      )}
      <p className="playground-message" role="status">
        {s.message}
      </p>
      <button className="text-link" onClick={() => dispatch({ type: "reset" })}>
        <Icon name="reset" size={15} /> Đặt lại
      </button>
    </section>
  );
}
