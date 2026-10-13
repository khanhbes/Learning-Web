import { useEffect, useState, useId, useRef } from "react";
import { motion } from "motion/react";
import { useMotionPreference as useReducedMotion } from "./motionPreference";
import { api } from "./api";
import { Button, Icon } from "./components";
export default function Visualizer({
  problemId,
  defaultVariant = "insertion",
}: {
  problemId: string;
  defaultVariant?: string;
}) {
  const reduced = useReducedMotion(),
    marker = "trace-" + useId().replaceAll(":", ""),
    request = useRef(0),
    canvas = useRef<HTMLDivElement>(null);
  const [variant, setVariant] = useState(defaultVariant),
    [dataChoice, setDataChoice] = useState("sample"),
    [seed, setSeed] = useState("");
  const [trace, setTrace] = useState<any>(null),
    [step, setStep] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(1),
    [error, setError] = useState("");
  async function load(seed?: string) {
    const requestId = ++request.current;
    setPlaying(false);
    setStep(0);
    try {
      const data = await api(
        "/traces/" +
          problemId +
          "?" +
          new URLSearchParams({
            variant,
            ...(dataChoice === "random" && seed ? { seed } : {}),
            ...(dataChoice.startsWith("edge-")
              ? { edge: dataChoice.slice(5) }
              : {}),
          }),
      );
      if (requestId !== request.current) return;
      setTrace(data);
      setError("");
    } catch (e) {
      if (requestId === request.current) setError((e as Error).message);
    }
  }
  useEffect(() => {
    load(seed);
    return () => {
      request.current++;
    };
  }, [problemId, variant, dataChoice, seed]);
  useEffect(() => {
    if (!playing || !trace) return;
    const t = setInterval(
      () =>
        setStep((i) => {
          if (i >= trace.frames.length - 1) {
            setPlaying(false);
            return i;
          }
          return i + 1;
        }),
      1000 / speed,
    );
    return () => clearInterval(t);
  }, [playing, trace, speed]);
  useEffect(() => {
    const f = trace?.frames[step];
    if (f?.nodes?.some((n: any) => n.x > 1000) && f.active?.length) {
      const node = f.nodes.find((n: any) => n.id === f.active[0]);
      if (node && canvas.current)
        canvas.current.scrollTo({
          left: Math.max(0, node.x + 25 - canvas.current.clientWidth / 2),
          top: Math.max(0, node.y + 38 - canvas.current.clientHeight / 2),
          behavior: reduced ? "auto" : "smooth",
        });
    }
  }, [trace, step, reduced]);
  if (error)
    return (
      <div className="soft-note">
        <Icon name="info" />
        {error}
      </div>
    );
  if (!trace)
    return (
      <div className="editor-loading">
        <Icon name="loading" className="spin" /> Chuẩn bị mô phỏng…
      </div>
    );
  const f = trace.frames[step],
    active = f.active ?? [],
    done = f.done ?? [];
  const empty = !(
    f.nodes?.length ||
    f.grid?.length ||
    f.values?.length ||
    f.secondary?.length ||
    f.bits?.length ||
    f.buckets?.length
  );
  const boxes = (values: any[], secondary = false) => (
    <div className={`array-visual ${secondary ? "secondary" : ""}`}>
      {values.map((v, i) => (
        <motion.div
          layout={!reduced}
          key={i}
          className={`array-cell ${active.includes(i) && !secondary ? "active" : ""} ${done.includes(i) && !secondary ? "done" : ""}`}
        >
          <span>{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
          <small>{i}</small>
          {Object.entries(f.pointers ?? {})
            .filter(([, index]) => index === i)
            .map(([name]) => (
              <b className="pointer-label" key={name}>
                {name}
                <Icon name="up" size={16} />
              </b>
            ))}
        </motion.div>
      ))}
    </div>
  );
  return (
    <div
      className="visualizer"
      tabIndex={0}
      aria-label="Mô phỏng thuật toán; dùng phím trái/phải để đổi bước, Space để chạy hoặc dừng"
      aria-keyshortcuts="ArrowLeft ArrowRight Home End Space"
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        const next =
          e.key === "ArrowRight"
            ? step + 1
            : e.key === "ArrowLeft"
              ? step - 1
              : e.key === "Home"
                ? 0
                : e.key === "End"
                  ? trace.frames.length - 1
                  : null;
        if (next !== null) {
          e.preventDefault();
          setPlaying(false);
          setStep(Math.max(0, Math.min(trace.frames.length - 1, next)));
        } else if (e.key === " ") {
          e.preventDefault();
          setPlaying((p) => !p);
        }
      }}
    >
      <div className="visualizer-toolbar">
        <span>
          <i className="online" /> MÔ PHỎNG TỪNG BƯỚC
        </span>
        <button
          className="text-link"
          onClick={() => {
            setDataChoice("random");
            setSeed(String(Date.now()));
          }}
        >
          <Icon name="refresh" size={15} /> ĐỔI DỮ LIỆU
        </button>
      </div>
      <div className="simulation-algorithm">
        <label>
          Dữ liệu{" "}
          <select
            aria-label="Dữ liệu mô phỏng"
            value={dataChoice}
            onChange={(e) => setDataChoice(e.target.value)}
          >
            <option value="sample">Ví dụ trong bài</option>
            <option value="random">Dữ liệu mới</option>
            {Array.from({ length: trace.edgeCount ?? 0 }, (_, i) => (
              <option key={i} value={"edge-" + i}>
                Trường hợp biên {i + 1}
              </option>
            ))}
          </select>
        </label>
        {problemId === "sort" && (
          <label>
            Thuật toán{" "}
            <select
              aria-label="Thuật toán sắp xếp"
              value={variant}
              onChange={(e) => setVariant(e.target.value)}
            >
              {[
                "insertion",
                "bubble",
                "selection",
                "merge",
                "quick",
                "counting",
                "radix",
                "heap",
              ].map((v) => (
                <option key={v} value={v}>
                  {v[0].toUpperCase() + v.slice(1)} Sort
                </option>
              ))}
            </select>
          </label>
        )}
        {problemId === "depth" && (
          <label>
            Cách duyệt{" "}
            <select
              aria-label="Cách duyệt cây"
              value={variant}
              onChange={(e) => setVariant(e.target.value)}
            >
              {[
                ["insertion", "DFS tính độ sâu"],
                ["tree-pre", "Preorder"],
                ["tree-in", "Inorder"],
                ["tree-post", "Postorder"],
                ["tree-bfs", "BFS theo tầng"],
              ].map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        )}
        {problemId === "union-find" && (
          <label>
            Cách đếm vùng{" "}
            <select
              aria-label="Cách đếm vùng"
              value={variant}
              onChange={(e) => setVariant(e.target.value)}
            >
              <option value="components-bfs">
                BFS / thành phần liên thông
              </option>
              <option value="insertion">Union-Find / DSU</option>
            </select>
          </label>
        )}
      </div>
      <div
        ref={canvas}
        className={
          "simulation-canvas " +
          (f.nodes?.some((n: any) => n.x > 1000) ? "wide-scene" : "")
        }
      >
        {empty ? (
          <div className="empty-scene">
            <Icon name="info" size={36} />
            <strong>Dữ liệu rỗng</strong>
            <p>
              Không có phần tử để duyệt. Quan sát trường hợp cơ sở và kết quả.
            </p>
          </div>
        ) : f.nodes ? (
          <svg
            viewBox={`0 0 ${Math.max(800, ...f.nodes.map((n: any) => n.x + 65))} ${Math.max(460, ...f.nodes.map((n: any) => n.y + 60))}`}
            style={
              Math.max(...f.nodes.map((n: any) => n.x)) > 1000
                ? {
                    width: Math.max(...f.nodes.map((n: any) => n.x)) + 65,
                    minWidth: Math.max(...f.nodes.map((n: any) => n.x)) + 65,
                    maxWidth: "none",
                    height: Math.max(460, ...f.nodes.map((n: any) => n.y + 60)),
                    maxHeight: "none",
                  }
                : undefined
            }
            role="img"
            aria-label={f.caption}
            className="node-scene"
          >
            <defs>
              <marker
                id={marker}
                viewBox="0 0 10 10"
                refX="25"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M0 0 10 5 0 10" fill="#b5c5b1" />
              </marker>
            </defs>
            {f.edges?.map(([u, v, w]: number[], i: number) => {
              const a = f.nodes.find((n: any) => n.id === u),
                b = f.nodes.find((n: any) => n.id === v);
              if (!a || !b) return null;
              return (
                <g key={i}>
                  <line
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={
                      active.includes(u) && active.includes(v)
                        ? "#58cc02"
                        : "#cbd8c5"
                    }
                    strokeWidth="4"
                    markerEnd={
                      f.structure === "graph" ? `url(#${marker})` : undefined
                    }
                  />
                  {w !== undefined && (
                    <text
                      x={(a.x + b.x) / 2 + 8}
                      y={(a.y + b.y) / 2 - 8}
                      fontSize="18"
                      fill="#687960"
                    >
                      {w}
                    </text>
                  )}
                </g>
              );
            })}
            {f.nodes.map((n: any) => (
              <g key={n.id}>
                <circle
                  cx={n.x}
                  cy={n.y}
                  r="25"
                  fill={
                    active.includes(n.id)
                      ? "#58cc02"
                      : done.includes(n.id)
                        ? "#dcf3cf"
                        : "#fff"
                  }
                  stroke={active.includes(n.id) ? "#43a800" : "#c8d6c1"}
                  strokeWidth="3"
                />
                <text
                  x={n.x}
                  y={n.y + 7}
                  textAnchor="middle"
                  fontSize="23"
                  fontWeight="800"
                  fill={active.includes(n.id) ? "white" : "#426138"}
                >
                  {n.value}
                </text>
              </g>
            ))}
          </svg>
        ) : f.structure === "linked" ? (
          <svg
            viewBox="0 0 800 220"
            className="node-scene"
            role="img"
            aria-label={f.caption}
          >
            <defs>
              <marker
                id={marker}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto"
              >
                <path d="M0 0 10 5 0 10" fill="#91ac80" />
              </marker>
            </defs>
            {f.values.map((v: any, i: number) => {
              const x = 40 + (i * 700) / Math.max(1, f.values.length);
              return (
                <g key={i}>
                  <rect
                    x={x}
                    y={85}
                    width={52}
                    height={52}
                    rx={12}
                    fill={active.includes(i) ? "#58cc02" : "#eff6e8"}
                    stroke="#a5bf96"
                    strokeWidth={2}
                  />
                  <text
                    x={x + 26}
                    y={117}
                    textAnchor="middle"
                    fill="#315139"
                    fontSize={19}
                    fontWeight={800}
                  >
                    {v}
                  </text>
                  <text
                    x={x + 26}
                    y={166}
                    textAnchor="middle"
                    fill="#65785b"
                    fontSize={13}
                  >
                    node {i}
                  </text>
                </g>
              );
            })}
            {f.edges?.map(([u, v]: number[], i: number) => {
              const x = 66 + (u * 700) / Math.max(1, f.values.length),
                y = 66 + (v * 700) / Math.max(1, f.values.length);
              return (
                <path
                  key={i}
                  d={
                    u === v
                      ? `M${x - 13} 80 C${x - 70} 10 ${x + 70} 10 ${x + 13} 80`
                      : `M${x} 80 C${x} 28 ${y} 28 ${y} 80`
                  }
                  fill="none"
                  stroke="#91ac80"
                  strokeWidth={3}
                  markerEnd={`url(#${marker})`}
                />
              );
            })}
          </svg>
        ) : f.grid ? (
          <div
            className={"matrix-visual " + (f.structure ?? "dp")}
            tabIndex={0}
            role="region"
            aria-label="Bảng trạng thái; cuộn để xem các ô còn lại"
            style={{
              gridTemplateColumns: `repeat(${Math.max(1, f.grid[0]?.length ?? 1)},minmax(28px,1fr))`,
            }}
          >
            {f.grid.flatMap((r: any[], row: number) =>
              r.map((v, col) => (
                <div
                  key={row + "-" + col}
                  aria-label={`Hàng ${row}, cột ${col}: ${v}${active.includes(row * r.length + col) ? ", đang xét" : ""}`}
                  className={`${f.structure === "grid" ? (v ? "land" : "water") : ""} ${f.structure === "chess" ? ((row + col) % 2 ? "chess-dark" : "chess-light") : ""} ${active.includes(row * r.length + col) ? "active" : ""} ${f.dependencies?.includes(row * r.length + col) ? "dependency" : ""} ${done.includes(row * r.length + col) ? "visited" : ""}`}
                >
                  {v}
                  {f.structure !== "grid" && f.structure !== "chess" && (
                    <small className="matrix-cell-label">
                      {row},{col}
                    </small>
                  )}
                </div>
              )),
            )}
          </div>
        ) : f.structure === "heap" && f.secondary?.length ? (
          <svg
            className="node-scene"
            viewBox="0 0 800 360"
            role="img"
            aria-label="Cây min heap"
          >
            {f.secondary.map((v: any, i: number) => {
              const level = Math.floor(Math.log2(i + 1)),
                start = 2 ** level - 1,
                pos = i - start,
                x = (800 * (pos + 1)) / (2 ** level + 1),
                y = 50 + level * 85,
                parent = Math.floor((i - 1) / 2),
                plevel = Math.floor(Math.log2(parent + 1)),
                ppos = parent - (2 ** plevel - 1),
                px = (800 * (ppos + 1)) / (2 ** plevel + 1),
                py = 50 + plevel * 85;
              return (
                <g key={i}>
                  {i > 0 && (
                    <line
                      x1={px}
                      y1={py}
                      x2={x}
                      y2={y}
                      stroke="#cbd8c5"
                      strokeWidth="3"
                    />
                  )}
                  <circle
                    cx={x}
                    cy={y}
                    r="24"
                    fill={i === 0 ? "#58cc02" : "#e4f5d9"}
                    stroke="#58b829"
                    strokeWidth="2"
                  />
                  <text
                    x={x}
                    y={y + 7}
                    textAnchor="middle"
                    fontWeight="800"
                    fontSize="21"
                    fill={i === 0 ? "white" : "#426138"}
                  >
                    {v}
                  </text>
                </g>
              );
            })}
          </svg>
        ) : (
          <>
            {boxes(f.values ?? [])}
            {f.structure === "linked" && (
              <div className="link-description">
                {f.edges?.map(([u, v]: number[], i: number) => (
                  <span key={i}>
                    {u} <Icon name="right" size={15} /> {v}
                  </span>
                ))}
              </div>
            )}
            {f.secondary && (
              <div className={`secondary-structure ${f.structure ?? ""}`}>
                <small>
                  {f.structure === "stack"
                    ? "STACK · TOP Ở CUỐI"
                    : f.structure === "queue"
                      ? "QUEUE · FRONT Ở ĐẦU"
                      : "TRẠNG THÁI PHỤ"}
                </small>
                {boxes(f.secondary, true)}
              </div>
            )}
          </>
        )}
        {f.variables && Object.keys(f.variables).length > 0 && (
          <div className="variable-strip">
            {Object.entries(f.variables).map(([key, value]) => (
              <span key={key}>
                <small>{key}</small>
                <b>
                  {typeof value === "object"
                    ? JSON.stringify(value)
                    : String(value)}
                </b>
              </span>
            ))}
          </div>
        )}
        {f.bits && (
          <div className="bit-visual">
            {f.bits.map((bit: number, i: number) => (
              <span key={i}>
                <b className={bit ? "on" : ""}>{bit}</b>
                <small>2^{f.bits.length - 1 - i}</small>
              </span>
            ))}
          </div>
        )}
        {f.buckets && (
          <div className="bucket-visual">
            {f.buckets.map((b: any) => (
              <div key={b.key}>
                <small>Bucket {b.key}</small>
                <span>{b.items.join(" → ") || "∅"}</span>
              </div>
            ))}
          </div>
        )}
        {f.result !== undefined && (
          <div className="simulation-result">
            <Icon name="success" size={22} />
            <span>
              Kết quả: <code>{JSON.stringify(f.result)}</code>
            </span>
          </div>
        )}
      </div>
      <div
        className="simulation-caption"
        aria-live={playing ? "off" : "polite"}
      >
        <span>{step + 1}</span>
        <p>{f.caption}</p>
      </div>
      <div className="simulation-legend">
        <span>
          <b>Đang xét</b>: {f.structure === "chess" ? "ô vàng" : "ô xanh"}
        </span>
        <span>
          <b>Phụ thuộc</b>: viền xanh dương
        </span>
        <span>Focus vào mô phỏng: ← → đổi bước, Space chạy/dừng</span>
      </div>
      {trace.truncated && (
        <p className="simulation-truncation">
          Hiển thị các bước đầu và kết quả cuối của toàn bộ thuật toán; các bước
          giữa được rút gọn để hình nhẹ hơn.
        </p>
      )}
      <details className="simulation-text">
        <summary>Đọc trạng thái bằng chữ</summary>
        <pre>
          {JSON.stringify(
            {
              values: f.values,
              nodes: f.nodes?.map((n: any) => ({ id: n.id, value: n.value })),
              edges: f.edges,
              grid: f.grid,
              secondary: f.secondary,
              variables: f.variables,
              result: f.result,
            },
            null,
            2,
          )}
        </pre>
      </details>
      <div className="simulation-controls">
        <button
          className="icon-button"
          onClick={() => {
            setStep(0);
            setPlaying(false);
          }}
          aria-label="Chạy lại"
        >
          <Icon name="reset" size={20} />
        </button>
        <button
          className="icon-button"
          disabled={step === 0}
          onClick={() => {
            setPlaying(false);
            setStep(Math.max(0, step - 1));
          }}
          aria-label="Bước trước"
        >
          <Icon name="previous" size={20} />
        </button>
        <button
          className="play-button"
          onClick={() => {
            if (step === trace.frames.length - 1) setStep(0);
            setPlaying(!playing);
          }}
          aria-label={playing ? "Dừng" : "Chạy"}
        >
          <Icon name={playing ? "pause" : "play"} size={22} />
        </button>
        <button
          className="icon-button"
          disabled={step >= trace.frames.length - 1}
          onClick={() => {
            setPlaying(false);
            setStep(Math.min(trace.frames.length - 1, step + 1));
          }}
          aria-label="Bước tiếp"
        >
          <Icon name="forward" size={20} />
        </button>
        <input
          type="range"
          min={0}
          max={trace.frames.length - 1}
          value={step}
          aria-label="Vị trí mô phỏng"
          onChange={(e) => {
            setPlaying(false);
            setStep(Number(e.target.value));
          }}
        />
        <select
          aria-label="Tốc độ mô phỏng"
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
        >
          <option value={0.25}>0.25×</option>
          <option value={0.5}>0.5×</option>
          <option value={1}>1×</option>
          <option value={2}>2×</option>
        </select>
      </div>
    </div>
  );
}
