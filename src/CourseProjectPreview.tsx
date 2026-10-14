import { useState } from "react";
import { AgentGraph } from "./AgentVisualizer";
import { Icon } from "./components";
import "./agent-linear.css";

/** These views display only the attempt inputs. They never run an oracle or reveal a graded answer. */
export default function CourseProjectPreview({
  courseId,
  tasks,
}: {
  courseId: string;
  tasks: Record<string, any>;
}) {
  const options =
    courseId === "agent"
      ? [
          ["agent-dependencies", "Tiên quyết"],
          ["agent-policy", "Công cụ & quyền"],
          ["agent-evaluate", "Kết quả quan sát"],
        ]
      : [
          ["linear-transform-batch", "Điểm & phép biến đổi"],
          ["linear-solve-report", "Hệ phương trình"],
          ["linear-least-squares", "Dữ liệu quan sát"],
        ];
  const [selected, setSelected] = useState(options[0][0]),
    [point, setPoint] = useState(-1),
    input = tasks[selected];
  if (!input) return null;
  const matrix = (values: number[][], caption: string) => (
    <div className="workshop-table-wrap">
      <table className="workshop-table">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Hàng</th>
            {values[0]?.map((_, i) => (
              <th scope="col" key={i}>
                Cột {i + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {values.map((row, i) => (
            <tr key={i}>
              <th scope="row">{i + 1}</th>
              {row.map((value, j) => (
                <td key={j}>{Number(value.toFixed(3))}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  const points =
    selected === "linear-least-squares"
      ? input.x.map((x: number, i: number) => [x, input.y[i]])
      : input.points;
  const minX = Array.isArray(points)
      ? Math.min(0, ...points.map((p: number[]) => p[0]))
      : 0,
    maxX = Array.isArray(points)
      ? Math.max(1, ...points.map((p: number[]) => p[0]))
      : 1,
    minY = Array.isArray(points)
      ? Math.min(0, ...points.map((p: number[]) => p[1]))
      : 0,
    maxY = Array.isArray(points)
      ? Math.max(1, ...points.map((p: number[]) => p[1]))
      : 1;
  const X = (x: number) => 55 + ((x - minX) / (maxX - minX)) * 330,
    Y = (y: number) => 220 - ((y - minY) / (maxY - minY)) * 175;
  return (
    <section
      className="course-project-preview"
      aria-label="Khám phá đầu vào bài cuối khóa"
    >
      <header>
        <Icon name={courseId === "agent" ? "network" : "move"} size={25} />
        <div>
          <h3>
            {courseId === "agent"
              ? "Một agent, ba chức năng cần kiểm chứng"
              : "Nhìn dữ liệu trước khi lập luận"}
          </h3>
          <p>Đầu vào của lượt làm đang lưu. Chọn một phần để xem cấu trúc.</p>
        </div>
      </header>
      <div className="project-preview-tabs">
        {options.map(([id, label]) => (
          <button
            key={id}
            className={selected === id ? "selected" : ""}
            aria-pressed={selected === id}
            onClick={() => {
              setSelected(id);
              setPoint(-1);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {selected === "agent-dependencies" && (
        <>
          <AgentGraph nodes={input.tasks} edges={input.edges} />
          <small>
            Mũi tên a → b yêu cầu hoàn thành a trước b. Hãy tự kiểm tra trường
            hợp có chu trình.
          </small>
        </>
      )}
      {selected === "agent-policy" && (
        <>
          <div className="project-tools">
            {input.tools.map((tool: any) => (
              <div key={tool.id}>
                <Icon name={tool.risky ? "shield" : "code"} size={22} />
                <b>{tool.id}</b>
                <span>Scope: {tool.scope}</span>
                <small>
                  {tool.risky ? "Cần xem xét xác nhận" : "Không đánh dấu risky"}
                </small>
              </div>
            ))}
          </div>
          <p>
            Scope được cấp:{" "}
            <b>{input.allowedScopes.join(", ") || "(không có)"}</b>. ID đã được
            xác nhận: <b>{input.approved.join(", ") || "(không có)"}</b>.
          </p>
          <div className="project-call-sequence">
            {input.calls.map((call: any, i: number) => (
              <span key={call.id}>
                <small>{i + 1}</small>
                <b>{call.id}</b>
                <code>{call.tool}</code>
              </span>
            ))}
          </div>
        </>
      )}
      {selected === "agent-evaluate" && (
        <div className="workshop-table-wrap">
          <table className="workshop-table">
            <caption>Boolean true: nên cho phép / thực tế đã cho phép</caption>
            <thead>
              <tr>
                <th>Trường hợp</th>
                <th>Expected</th>
                <th>Actual</th>
              </tr>
            </thead>
            <tbody>
              {input.expected.map((expected: boolean, i: number) => (
                <tr key={i}>
                  <th scope="row">{i + 1}</th>
                  <td>{String(expected)}</td>
                  <td>{String(input.actual[i])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {Array.isArray(points) && (
        <div className="project-linear-input">
          <svg
            viewBox="0 0 430 270"
            role="group"
            aria-label="Các điểm đầu vào. Chọn một điểm để đọc tọa độ; chưa áp dụng phép biến đổi hay fit đường."
          >
            <path
              d="M55 35V220H385"
              fill="none"
              stroke="#a8bb9b"
              strokeWidth="2"
            />
            {[0, 0.5, 1].map((f) => (
              <g key={f}>
                <text
                  x="44"
                  y={Y(minY + f * (maxY - minY)) + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="#7f9270"
                >
                  {Number((minY + f * (maxY - minY)).toFixed(2))}
                </text>
                <text
                  x={X(minX + f * (maxX - minX))}
                  y="239"
                  textAnchor="middle"
                  fontSize="10"
                  fill="#7f9270"
                >
                  {Number((minX + f * (maxX - minX)).toFixed(2))}
                </text>
              </g>
            ))}
            {points.map((p: number[], i: number) => (
              <g
                key={i}
                tabIndex={0}
                role="button"
                aria-label={`Điểm ${i + 1}: x=${p[0]}, y=${p[1]}`}
                aria-pressed={point === i}
                onClick={() => setPoint(i)}
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    setPoint(i);
                  }
                }}
              >
                <circle
                  cx={X(p[0])}
                  cy={Y(p[1])}
                  r={point === i ? 9 : 6}
                  fill={point === i ? "#8896d9" : "#74b94e"}
                  stroke="white"
                  strokeWidth="2"
                />
                <title>{`Điểm ${i + 1}: [${p[0]}, ${p[1]}]`}</title>
              </g>
            ))}
            <text x="220" y="262" textAnchor="middle" fontSize="11">
              Trục x (đơn vị của dữ liệu)
            </text>
            <text
              transform="translate(15 130) rotate(-90)"
              textAnchor="middle"
              fontSize="11"
            >
              Trục y
            </text>
          </svg>
          <div>
            {input.A && matrix(input.A, "Ma trận A · đầu vào")}
            {input.b && (
              <p>
                Vector dịch b: <b>[{input.b.join("; ")}]</b>
              </p>
            )}
            <p role="status">
              {point >= 0
                ? `Điểm ${point + 1}: x=${points[point][0]}, y=${points[point][1]}.`
                : "Chọn một điểm để xem tọa độ."}
            </p>
          </div>
        </div>
      )}
      {selected === "linear-solve-report" && (
        <>
          {matrix(input.A, "Ma trận hệ số A")}
          <p>
            Vế phải b: <b>[{input.b.join("; ")}]</b>
          </p>
        </>
      )}
      <small>
        Hình chỉ đọc đầu vào. Kết quả, phân tích và trường hợp biên do bạn thực
        hiện trong bài nộp.
      </small>
    </section>
  );
}
