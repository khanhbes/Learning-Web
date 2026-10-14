import { useEffect, useId, useRef, useState } from "react";
import { motion } from "motion/react";
import { api } from "./api";
import { Icon } from "./components";
import { LoadingScene } from "./Delight";
import { useVisualPlayback, VisualPlayback } from "./VisualPlayback";
import type { Lesson } from "./types";
import "./data-workshops.css";
import "./agent-linear.css";

type Node = { id: string; label: string; status?: string };
type Entry = { label: string; value: unknown };
type Frame = {
  label?: string;
  caption?: string;
  activeNode?: string;
  nodes?: Node[];
  edges?: [string, string][];
  entries?: Entry[];
  [key: string]: any;
};
type Trace = {
  title?: string;
  mode?: string;
  frames: Frame[];
  input?: any;
  result?: any;
  notice?: string;
};
const nodeNames: Record<string, string> = {
  observe: "Quan sát",
  policy: "Quyết định",
  plan: "Lập kế hoạch",
  tool: "Công cụ",
  memory: "Bộ nhớ",
  evaluate: "Kiểm chứng",
  finish: "Kết thúc",
};
const modeNames: Record<string, string> = {
  reflex: "Quan sát → chọn hành động",
  memory: "Điều đã nhớ thay đổi quyết định",
  planning: "Chọn đường đi tới mục tiêu",
  utility: "So sánh lợi ích của từng lựa chọn",
  learning: "Cập nhật từ phản hồi",
  "multi-agent": "Các agent chia sẻ công việc",
  hierarchy: "Một mục tiêu, nhiều nhiệm vụ nhỏ",
  tools: "Kiểm tra trước và sau khi gọi công cụ",
  retrieval: "Tìm bằng chứng trước khi trả lời",
  evaluation: "Đúng kết quả và đúng giới hạn",
};
const display = (value: unknown) =>
  typeof value === "string"
    ? value
    : value === undefined
      ? "—"
      : JSON.stringify(value);
const stateName=(status?:string)=>({idle:'chờ lượt',visited:'đã xét',active:'đang xét',done:'đã xong',pending:'đang chờ',failed:'lỗi'} as Record<string,string>)[status||'']||'chưa xét';

function AgentFlow({
  frame,
  selected,
  onSelect,
  marker,
  reduced,
}: {
  frame: Frame;
  selected: string;
  onSelect: (id: string) => void;
  marker: string;
  reduced: boolean;
}) {
  const nodes: Node[] = frame.nodes?.length
    ? frame.nodes
    : Object.entries(nodeNames).map(([id, label]) => ({ id, label }));
  const positions = new Map(
    nodes.map((node, i) => [
      node.id,
      { x: 95 + (i % 3) * 180, y: 58 + Math.floor(i / 3) * 105 },
    ]),
  );
  const height = 35 + Math.ceil(nodes.length / 3) * 105;
  return (
    <svg
      className="agent-flow"
      viewBox={`0 0 550 ${height}`}
      role="group"
      aria-label={`Luồng agent. ${frame.label || frame.caption || ""} Đang xét: ${nodes.find(n=>n.id===frame.activeNode)?.label || "chưa bắt đầu"}. Chọn một nút để xem tên và trạng thái.`}
    >
      <defs>
        <marker
          id={marker}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
        >
          <path d="M0 0 10 5 0 10" fill="#87ab94" />
        </marker>
      </defs>
      {(frame.edges || []).map(([from, to], i) => {
        const a = positions.get(from),
          b = positions.get(to);
        if (!a || !b) return null;
        const sameRow = a.y === b.y,
          active = to === frame.activeNode;
        return (
          <motion.path
            key={`${from}-${to}-${i}`}
            initial={false}
            animate={{ stroke: active ? "#459d60" : "#bcd2c2" }}
            transition={{ duration: reduced ? 0 : 0.25 }}
            d={
              sameRow
                ? `M${a.x + 50} ${a.y}H${b.x - 53}`
                : `M${a.x} ${a.y + 26}C${a.x} ${a.y + 58} ${b.x} ${b.y - 55} ${b.x} ${b.y - 30}`
            }
            fill="none"
            strokeWidth={active ? 3 : 2}
            markerEnd={`url(#${marker})`}
          />
        );
      })}
      {nodes.map((node) => {
        const p = positions.get(node.id)!,
          active = node.id === frame.activeNode,
          done = ["done", "complete", "passed", "success"].includes(
            node.status || "",
          );
        return (
          <g
            key={node.id}
            role="button"
            tabIndex={0}
            aria-label={`${node.label}: ${active ? "đang xét" : done ? "đã xong" : stateName(node.status)}`}
            aria-pressed={selected === node.id}
            onClick={() => onSelect(node.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(node.id);
              }
            }}
            className="agent-flow-node"
          >
            <motion.rect
              x={p.x - 65}
              y={p.y - 29}
              width="130"
              height="59"
              rx="17"
              initial={false}
              animate={{
                fill: active ? "#e1f5d5" : done ? "#edf6ec" : "#fff",
                stroke: active || selected === node.id ? "#52ae39" : "#d5e3d2",
              }}
              transition={{ duration: reduced ? 0 : 0.2 }}
              strokeWidth={active || selected === node.id ? 3 : 2}
            />
            <text
              x={p.x}
              y={p.y + 3}
              textAnchor="middle"
              fontSize="13"
              fontWeight="900"
              fill="#3c6742"
            >
              {node.label}
            </text>
            <text
              x={p.x}
              y={p.y + 47}
              textAnchor="middle"
              fontSize="10"
              fill={active ? "#428c38" : "#829180"}
            >
              {active
                ? "ĐANG XÉT"
                : done
                  ? "ĐÃ XONG"
                  : node.status === "blocked"
                    ? "BỊ CHẶN"
                    : " "}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
function RetrievalEvidence({ frame }: { frame: Frame }) {
  const documents =
    frame.docs || frame.documents || frame.retrieved || frame.candidates;
  if (!Array.isArray(documents) || !documents.length) return null;
  const max = Math.max(
    1,
    ...documents.map((doc: any) => Number(doc.score || 0)),
  );
  return (
    <div className="agent-evidence">
      <h4>Đối chiếu token · top {frame.k || 0}</h4>
      {documents.map((doc: any, i: number) => {
        const score = Number(doc.score ?? doc.similarity ?? 0);
        return (
          <div key={doc.id || i}>
            <span>
              <b>{doc.id || `Đoạn ${i + 1}`}</b>
              {doc.tokens ? (
                <span className="agent-token-row">
                  {doc.tokens.map((token: string, j: number) => (
                    <i
                      key={token + j}
                      className={frame.query?.includes(token) ? "matched" : ""}
                    >
                      {token}
                    </i>
                  ))}
                </span>
              ) : (
                doc.text || doc.content || doc.label || ""
              )}
            </span>
            {Number.isFinite(score) && (
              <>
                <meter
                  min="0"
                  max={max}
                  value={score}
                  aria-label={`Điểm tìm kiếm đoạn ${i + 1}: ${score}`}
                />
                <small>{score.toFixed(0)}</small>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
export function AgentGraph({
  nodes,
  edges,
  visited = [],
  path = [],
  caption = "Đồ thị nhiệm vụ · cạnh a → b yêu cầu a trước b",
}: {
  nodes: string[];
  edges: [string, string][];
  visited?: string[];
  path?: string[];
  caption?: string;
}) {
  const marker = "task-arrow-" + useId().replaceAll(":", ""),
    positions = new Map(
      nodes.map((id, i) => [
        id,
        { x: 62 + (i % 4) * 110, y: 48 + Math.floor(i / 4) * 82 },
      ]),
    );
  return (
    <svg
      className="agent-task-graph"
      viewBox={`0 0 460 ${Math.max(140, Math.ceil(nodes.length / 4) * 82 + 30)}`}
      role="img"
      aria-label={`${caption}. ${edges.map(([a, b]) => a + " tới " + b).join("; ")}${path.length ? ". Đường đang xét " + path.join(" → ") : ""}`}
    >
      <defs>
        <marker
          id={marker}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
        >
          <path d="M0 0 10 5 0 10" fill="#a8be9a" />
        </marker>
      </defs>
      {edges.map(([from, to], i) => {
        const a = positions.get(from),
          b = positions.get(to);
        if (!a || !b) return null;
        const active =
            path.indexOf(from) >= 0 && path[path.indexOf(from) + 1] === to,
          distance = Math.hypot(b.x - a.x, b.y - a.y) || 1,
          dx = (b.x - a.x) / distance,
          dy = (b.y - a.y) / distance;
        return (
          <path
            key={from + to + i}
            d={
              from === to
                ? `M${a.x - 19} ${a.y - 15}C${a.x - 60} ${a.y - 65} ${a.x + 60} ${a.y - 65} ${a.x + 19} ${a.y - 15}`
                : `M${a.x + dx * 24} ${a.y + dy * 24}L${b.x - dx * 26} ${b.y - dy * 26}`
            }
            fill="none"
            stroke={active ? "#66ad43" : "#bac9b1"}
            strokeWidth={active ? 3 : 2}
            markerEnd={`url(#${marker})`}
          />
        );
      })}
      {nodes.map((id) => {
        const p = positions.get(id)!;
        return (
          <g key={id}>
            <circle
              cx={p.x}
              cy={p.y}
              r="22"
              fill={
                path.includes(id)
                  ? "#a9d68b"
                  : visited.includes(id)
                    ? "#e7f4dd"
                    : "white"
              }
              stroke="#a8c091"
              strokeWidth="2"
            />
            <text
              x={p.x}
              y={p.y + 4}
              textAnchor="middle"
              fill="#50793b"
              fontSize="12"
              fontWeight="900"
            >
              {id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
function AgentHierarchy({tree,states,reduced}:{tree:{id:string;children:string[]}[];states:Record<string,string>;reduced:boolean}) {
  const byId=new Map(tree.map(n=>[n.id,n])),children=new Set(tree.flatMap(n=>n.children)),positions=new Map<string,{x:number;y:number}>(),visited=new Set<string>();
  let leaf=0,maxDepth=0;
  function place(id:string,depth:number):number {
    if(visited.has(id)||!byId.has(id))return 60;
    visited.add(id);maxDepth=Math.max(maxDepth,depth);
    const node=byId.get(id)!,xs=node.children.map(child=>place(child,depth+1)),x=xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:60+leaf++*120;
    positions.set(id,{x,y:40+depth*100});return x;
  }
  tree.filter(n=>!children.has(n.id)).forEach(n=>place(n.id,0));
  return <svg className="agent-hierarchy" viewBox={`0 0 ${Math.max(340,leaf*120)} ${maxDepth*100+85}`} role="img" aria-label={'Cây trách nhiệm, kết quả đi từ con lên cha. '+tree.map(n=>n.id+': '+stateName(states[n.id])).join('; ')}>
    {tree.flatMap(n=>n.children.map(child=>{const a=positions.get(n.id),b=positions.get(child);return a&&b?<path key={n.id+'>'+child} d={`M${a.x} ${a.y+24}V${b.y-40}H${b.x}V${b.y-24}`} fill="none" stroke="#bacdb0" strokeWidth="2"/>:null;}))}
    {tree.map(n=>{const p=positions.get(n.id);if(!p)return null;const state=states[n.id],fill=state==='done'?'#e3f4d6':state==='failed'?'#ffead9':state==='pending'?'#edf0fb':'#fff';return <g key={n.id}><motion.rect x={p.x-49} y={p.y-24} width="98" height="48" rx="12" initial={false} animate={{fill}} transition={{duration:reduced?0:.2}} stroke="#b8cea9" strokeWidth="2"/><text x={p.x} y={p.y-2} textAnchor="middle" fontSize="12" fontWeight="900" fill="#43683b">{n.id}</text><text x={p.x} y={p.y+15} textAnchor="middle" fontSize="10" fill="#718466">{stateName(state)}</text></g>;})}
  </svg>;
}
function AgentState({ frame,reduced }: { frame: Frame;reduced:boolean }) {
  const memory =
    frame.memory &&
    typeof frame.memory === "object" &&
    !Array.isArray(frame.memory)
      ? Object.entries(frame.memory)
      : null;
  const graph =
    frame.graph && typeof frame.graph === "object" ? frame.graph : null;
  return (
    <div className="agent-state-visual">
      {frame.world && (
        <div className="agent-world">
          <svg
            viewBox="0 0 170 120"
            role="img"
            aria-label={`Robot giả lập: pin ${frame.world.battery}%, ${frame.world.dirty ? "có bụi" : "sàn sạch"}, hành động ${frame.world.action}`}
          >
            <rect
              x="15"
              y="11"
              width="137"
              height="95"
              rx="17"
              fill="#f4f7ee"
            />
            {frame.world.dirty &&
              [
                [35, 74],
                [114, 41],
                [122, 78],
                [55, 28],
              ].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="3" fill="#cbb79a" />
              ))}
            <circle cx="83" cy="61" r="31" fill="#a9bde1" />
            <circle cx="83" cy="58" r="23" fill="#edf2fc" />
            <circle cx="76" cy="56" r="3" fill="#637b9c" />
            <circle cx="90" cy="56" r="3" fill="#637b9c" />
            <path
              d="M77 68h12"
              stroke="#637b9c"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          <div>
            <span>
              Pin <strong>{frame.world.battery}%</strong>
            </span>
            <progress
              max="100"
              value={frame.world.battery}
              aria-label="Pin robot giả lập"
            />
            <b>
              {(
                {
                  clean: "DỌN BỤI",
                  charge: "SẠC PIN",
                  move: "DI CHUYỂN",
                } as Record<string, string>
              )[frame.world.action] || frame.world.action}
            </b>
          </div>
        </div>
      )}
      {memory && (
        <div className="agent-memory-grid" aria-label="Bộ nhớ hiện tại">
          {memory.map(([key, value]) => (
            <div key={key}>
              <small>{key}</small>
              <strong>{display(value)}</strong>
            </div>
          ))}
        </div>
      )}
      {graph && (
        <AgentGraph
          nodes={Object.keys(graph)}
          edges={Object.entries(graph).flatMap(([from, tos]: any) =>
            (tos as string[]).map((to) => [from, to] as [string, string]),
          )}
          visited={frame.visited}
          path={frame.path}
          caption="Đồ thị môi trường · mũi tên là một hành động hợp lệ"
        />
      )}
      {frame.dependencies && (
        <AgentGraph
          nodes={frame.tasks}
          edges={frame.dependencies}
          visited={frame.tasks.filter(
            (task: string) => !frame.remaining.includes(task),
          )}
          path={[]}
        />
      )}
      {Array.isArray(frame.hierarchy)&&<AgentHierarchy tree={frame.hierarchy} states={frame.states||{}} reduced={reduced}/>}
      {Array.isArray(frame.workers)&&<section className="agent-worker-loads" aria-label="Phân công và tải của các agent">
        <h4>Phân việc theo kỹ năng · tải hiện tại</h4>
        {frame.workers.map((worker:any)=><div className="agent-worker-row" key={worker.id}><div><strong>{worker.id}</strong><small>{worker.skills.join(' · ')}</small></div><div className="agent-load-track"><motion.div initial={false} animate={{width:`${worker.load/Math.max(1,...frame.workers.map((w:any)=>w.load))*100}%`}} transition={{duration:reduced?0:.25}}/></div><b>{worker.load}</b></div>)}
        <p>{frame.assignments?.map((a:any)=>a.task+' → '+(a.worker??'chưa có người phù hợp')).join(' · ')}</p>
      </section>}
      {Array.isArray(frame.scores) && (
        <div className="agent-score-bars">
          {frame.scores.map((score: any) => {
            const max = Math.max(
              1,
              ...frame.scores.map((s: any) => Math.abs(s.score)),
            );
            return (
              <div key={score.id}>
                <span>{score.id}</span>
                <div>
                  <i
                    style={{
                      width: `${(Math.abs(score.score) / max) * 100}%`,
                      background: score.score < 0 ? "#dfb08c" : "#99c47c",
                    }}
                  />
                </div>
                <b>{Number(score.score.toFixed(2))}</b>
              </div>
            );
          })}
          <small>Độ dài cột = |score|; màu cam biểu thị score âm.</small>
        </div>
      )}
      {Array.isArray(frame.workers) && (
        <div className="agent-memory-grid">
          {frame.workers.map((worker: any) => (
            <div key={worker.id}>
              <small>
                {worker.id} · {worker.skills.join(", ")}
              </small>
              <strong>{worker.load} việc</strong>
            </div>
          ))}
        </div>
      )}
      {typeof frame.budget === "number" && (
        <div className="agent-budget">
          <span>
            Context đang dùng{" "}
            <b>
              {frame.used}/{frame.budget}
            </b>
          </span>
          <progress
            max={Math.max(1, frame.budget)}
            value={frame.used}
            aria-label="Chi phí context đã dùng"
          />
          <div className="agent-token-row">
            {frame.messages.map((message: any) => (
              <i key={message.id}>
                {message.id} · {message.cost}
              </i>
            ))}
          </div>
        </div>
      )}
      {frame.matrix &&
        typeof frame.matrix === "object" &&
        !Array.isArray(frame.matrix) && (
          <div className="agent-evaluation">
            <span>Thực tế / quyết định</span>
            <b>Cho phép</b>
            <b>Chặn</b>
            <b>Nên cho phép</b>
            <strong>TP {frame.matrix.tp}</strong>
            <strong>FN {frame.matrix.fn}</strong>
            <b>Nên chặn</b>
            <strong>FP {frame.matrix.fp}</strong>
            <strong>TN {frame.matrix.tn}</strong>
          </div>
        )}
    </div>
  );
}
export default function AgentVisualizer({
  lesson,
  compact = false,
}: {
  lesson: Lesson;
  compact?: boolean;
}) {
  const visual =
    (typeof lesson.visualization === "object"
      ? lesson.visualization
      : lesson.visualData) || {};
  const problemId = visual.problemId || lesson.problemIds[0],
    mode = visual.mode || "reflex";
  const [trace, setTrace] = useState<Trace | null>(null),
    [seed, setSeed] = useState(""),
    [busy, setBusy] = useState(true),
    [error, setError] = useState(""),
    [selected, setSelected] = useState(""),
    [prediction, setPrediction] = useState(""),
    [guessResult, setGuessResult] = useState("");
  const request = useRef(0),
    marker = "agent-arrow-" + useId().replaceAll(":", "");
  const playback = useVisualPlayback(
      trace?.frames.length || 0,
      `${lesson.id}:${problemId}:${seed}`,
    ),
    frame = trace?.frames[playback.step];
  useEffect(() => {
    const ticket = ++request.current;
    setBusy(true);
    setError("");
    setTrace(null);
    setSelected("");
    setPrediction("");
    setGuessResult("");
    void api<Trace>(
      "/traces/" +
        encodeURIComponent(problemId) +
        "?" +
        new URLSearchParams({
          lessonId: String(lesson.id),
          seed: seed || "lesson-" + lesson.id,
        }),
    )
      .then((data) => {
        if (ticket !== request.current) return;
        if (!Array.isArray(data.frames) || !data.frames.length)
          throw new Error("Mô phỏng chưa có trạng thái để hiển thị.");
        setTrace(data);
      })
      .catch((e) => {
        if (ticket === request.current) setError((e as Error).message);
      })
      .finally(() => {
        if (ticket === request.current) setBusy(false);
      });
    return () => {
      request.current++;
    };
  }, [lesson.id, problemId, seed]);
  const changeData = () => {
    playback.reset();
    setSeed(String(Date.now()));
  };
  useEffect(() => {
    setSelected("");
    setPrediction("");
    setGuessResult("");
  }, [playback.step]);
  const selectedNode = frame?.nodes?.find(
    (n) => n.id === (selected || frame.activeNode),
  );
  return (
    <section
      className={`agent-workshop ${compact ? "workshop-compact" : ""}`}
      tabIndex={0}
      onKeyDown={playback.onKeyDown}
      aria-label="Khám phá luồng AI Agent; phím trái/phải đổi bước, Space chạy/dừng"
      aria-keyshortcuts="ArrowLeft ArrowRight Home End Space"
    >
      <header className="workshop-heading">
        <div>
          <span className="eyebrow">AI AGENT · MÔ PHỎNG KIỂM CHỨNG</span>
          <h3>
            {modeNames[mode] || trace?.title || "Quan sát một quyết định"}
          </h3>
        </div>
        <span className="workshop-count">
          <Icon name="network" size={16} />
          TỪNG BƯỚC
        </span>
      </header>
      {busy ? (
        <LoadingScene
          compact
          title="Đang dựng luồng agent…"
          detail="Tính trạng thái từ dữ liệu của ví dụ."
        />
      ) : error ? (
        <div className="soft-note" role="status">
          <Icon name="info" />
          {error}
          <button className="text-link" onClick={changeData}>
            THỬ LẠI
          </button>
        </div>
      ) : (
        frame && (
          <>
            <p className="workshop-caption">
              {visual.caption ? 'Ví dụ trong bài: '+visual.caption :
                "Agent quan sát, chọn hành động rồi kiểm tra kết quả. Hãy theo dõi dữ liệu thực sự thay đổi qua mỗi bước."}
            </p>
            <div className="agent-workspace">
              <AgentFlow
                frame={frame}
                selected={selected}
                onSelect={setSelected}
                marker={marker}
                reduced={playback.reduced}
              />
              <div className="agent-inspector" aria-live="polite">
                <span className="eyebrow">TRẠNG THÁI HIỆN TẠI</span>
                <h4>
                  {frame.label ||
                    frame.caption ||
                    nodeNames[frame.activeNode || ""]}
                </h4>
                {(frame.entries || []).map((entry, i) => (
                  <div className="agent-entry" key={entry.label + i}>
                    <small>{entry.label}</small>
                    {display(entry.value).length > 130 ? (
                      <details>
                        <summary>
                          Mở dữ liệu ·{" "}
                          {Array.isArray(entry.value)
                            ? entry.value.length + " mục"
                            : "trạng thái"}
                        </summary>
                        <code>{display(entry.value)}</code>
                      </details>
                    ) : (
                      <code>{display(entry.value)}</code>
                    )}
                  </div>
                ))}
                {selectedNode && (
                  <p className="agent-selection">
                    <Icon name="info" size={15} />
                    {selectedNode.label} ·{" "}
                    {selectedNode.id === frame.activeNode
                      ? "đang xử lý"
                      : stateName(selectedNode.status)}
                  </p>
                )}
              </div>
            </div>
            <AgentState frame={frame} reduced={playback.reduced} />
            <RetrievalEvidence frame={frame} />
            <label className="visual-timeline">
              Dòng thời gian
              <input
                type="range"
                min="0"
                max={Math.max(0, trace!.frames.length - 1)}
                value={playback.step}
                aria-label="Chọn bước mô phỏng agent"
                onChange={(e) => {
                  playback.go(Number(e.target.value));
                  setGuessResult("");
                }}
              />
            </label>
            {!compact && playback.step < trace!.frames.length - 1 && (
              <div className="agent-predict">
                <label>
                  Dự đoán nút được xét tiếp
                  <select
                    aria-label="Dự đoán bước kế tiếp"
                    value={prediction}
                    onChange={(e) => {
                      setPrediction(e.target.value);
                      setGuessResult("");
                    }}
                  >
                    <option value="">Chọn một nút…</option>
                    {(frame.nodes || []).map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="text-link"
                  disabled={!prediction}
                  onClick={() => {
                    const next = trace!.frames[playback.step + 1];
                    setGuessResult(
                      prediction === next.activeNode
                        ? "Đúng hướng! Xem bước sau để kiểm tra dữ liệu."
                        : "Hãy thử bước sau và so sánh điều kiện quyết định.",
                    );
                  }}
                >
                  THỬ DỰ ĐOÁN
                </button>
                {guessResult && <p role="status">{guessResult}</p>}
              </div>
            )}
          </>
        )
      )}
      <VisualPlayback
        playback={playback}
        onChangeData={changeData}
        busy={busy}
      />
      <details className="workshop-reading">
        <summary>Đọc hình · giới hạn của mô phỏng</summary>
        <p>
          {trace?.notice ||
            visual.notice ||
            "Đây là agent mô phỏng xác định, dùng chính dữ liệu và thuật toán của bài. Không gọi model, gửi dữ liệu hay thực hiện hành động trên tài khoản thật."}
        </p>
        <p>
          Hình không chấm điểm bài nộp. Nút màu xanh là bước hiện tại; đổi dữ
          liệu tạo một ví dụ mới cùng dạng.
        </p>
        {trace?.input !== undefined && (
          <details>
            <summary>Xem đầu vào của ví dụ</summary>
            <pre>{JSON.stringify(trace.input, null, 2)}</pre>
          </details>
        )}
      </details>
    </section>
  );
}
