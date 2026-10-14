import { useEffect, useId, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { Icon } from "./components";
import { useVisualPlayback, VisualPlayback } from "./VisualPlayback";
import type { Lesson } from "./types";
import {
  add2,
  apply2,
  covariance2,
  determinant2,
  dot2,
  eliminationFrames,
  identity2,
  interpolate2,
  multiply2,
  projection2,
  rotate2,
  scale2,
  symmetricEigen2,
} from "./linearMath";
import type { Matrix2, Vector2 } from "./linearMath";
import "./data-workshops.css";
import "./agent-linear.css";

const names: Record<string, string> = {
  vectors: "Chạm vào đầu mũi tên để đổi vector",
  combination: "Hai vector tạo thành một vị trí mới",
  dot: "Tích vô hướng đo mức cùng hướng",
  projection: "Giữ lại phần nằm trên một hướng",
  matrix: "Ma trận tác động lên cả mặt phẳng",
  product: "Một hàng gặp một cột",
  transform: "Nhìn mặt phẳng biến đổi",
  determinant: "Diện tích và hướng thay đổi ra sao?",
  elimination: "Mỗi phép biến đổi hàng, một bước",
  rank: "Có bao nhiêu hướng độc lập?",
  span: "Hai hướng có phủ được mặt phẳng?",
  eigen: "Một hướng giữ nguyên sau biến đổi",
  cayley: "Đa thức của ma trận cũng là ma trận",
  "least-squares": "Chọn đường có tổng bình phương sai số nhỏ nhất",
  diagonalization: "Đổi cơ sở để thấy phép co giãn",
  pca: "Tìm hướng giữ nhiều phương sai",
  svd: "Xoay → co giãn → xoay",
  markov: "Phân phối thay đổi qua từng bước",
};
const round = (value: number) =>
  Number((Math.abs(value) < 1e-9 ? 0 : value).toFixed(3));
const fmt = (v: number) => round(v).toLocaleString("vi-VN");
const vectorText = (v: Vector2) => `[${fmt(v[0])}; ${fmt(v[1])}]`;
const pair = (value: any, fallback: Vector2): Vector2 =>
  Array.isArray(value) &&
  value.length >= 2 &&
  value.slice(0, 2).every(Number.isFinite)
    ? [value[0], value[1]]
    : fallback;
const square = (value: any, fallback: Matrix2): Matrix2 =>
  Array.isArray(value) &&
  value.length === 2 &&
  value.every(
    (r) => Array.isArray(r) && r.length === 2 && r.every(Number.isFinite),
  )
    ? (value.map((r) => [...r]) as Matrix2)
    : (fallback.map((r) => [...r]) as Matrix2);
function ScalarSlider({
  label,
  value,
  onChange,
  min = -4,
  max = 4,
  step = 0.25,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className="linear-slider">
      <span>
        {label}
        <b>{fmt(value)}</b>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
      />
    </label>
  );
}
function MatrixDisplay({
  matrix,
  label,
  active,
  augmented = false,
  cellOnly = false,
}: {
  matrix: number[][];
  label: string;
  active?: [number, number];
  augmented?: boolean;
  cellOnly?: boolean;
}) {
  return (
    <div className="linear-matrix">
      <span>{label}</span>
      <div
        className="linear-matrix-bracket"
        style={{
          gridTemplateColumns: `repeat(${matrix[0]?.length || 2},minmax(35px,1fr))`,
        }}
        aria-label={`${label}: ${matrix.map((r) => r.map(fmt).join(", ")).join("; ")}`}
      >
        {matrix.flatMap((row, i) =>
          row.map((v, j) => (
            <b
              key={`${i}-${j}`}
              className={`${(cellOnly ? active?.[0] === i && active?.[1] === j : active?.[0] === i || active?.[1] === j) ? "matrix-highlight" : ""} ${augmented && j === row.length - 1 ? "matrix-rhs" : ""}`}
            >
              {fmt(v)}
            </b>
          )),
        )}
      </div>
    </div>
  );
}

type Arrow = {
  value: Vector2;
  label: string;
  color: string;
  from?: Vector2;
  dashed?: boolean;
};
function CoordinatePlot({
  arrows,
  transform = identity2,
  points = [],
  projection,
  area = false,
  reduced,
  onDrag,
  bound = 5,
  axisLabels = ["Trục x", "Trục y"],
  line,
}: {
  arrows: Arrow[];
  transform?: Matrix2;
  points?: Vector2[];
  projection?: Vector2;
  area?: boolean;
  reduced: boolean;
  onDrag?: (value: Vector2) => void;
  bound?: number;
  axisLabels?: string[];
  line?: { m: number; b: number };
}) {
  const id = useId().replaceAll(":", ""),
    svg = useRef<SVGSVGElement>(null),
    [dragging, setDragging] = useState(false);
  const left = 42,
    top = 24,
    size = 290,
    cx = 187,
    cy = 169,
    unit = size / (2 * bound),
    X = (v: number) => cx + v * unit,
    Y = (v: number) => cy - v * unit;
  const p = (v: Vector2) => `${X(v[0])},${Y(v[1])}`;
  const transformedSquare = (
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ] as Vector2[]
  ).map((v) => apply2(transform, v));
  function move(clientX: number, clientY: number) {
    if (!svg.current || !onDrag) return;
    const point = svg.current.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    const matrix = svg.current.getScreenCTM();
    if (!matrix) return;
    const local = point.matrixTransform(matrix.inverse());
    const snap = (n: number) =>
      Math.max(-4, Math.min(4, Math.round(n * 4) / 4));
    onDrag([snap((local.x - cx) / unit), snap((cy - local.y) / unit)]);
  }
  return (
    <svg
      ref={svg}
      className="linear-coordinate"
      viewBox="0 0 375 355"
      role={onDrag ? "group" : "img"}
      aria-label={`Mặt phẳng tọa độ, ${axisLabels.join(", ")}. ${arrows.map((a) => a.label + " " + vectorText(a.value)).join("; ")}${area ? ". Diện tích ảnh của hình vuông đơn vị " + fmt(Math.abs(determinant2(transform))) : ""}`}
      onPointerMove={(e) => {
        if (dragging) move(e.clientX, e.clientY);
      }}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
    >
      <defs>
        <clipPath id={"grid-clip-" + id}>
          <rect x={left} y={top} width={size} height={size} />
        </clipPath>
        {["#50a53e", "#8492d8", "#edaa43"].map((color, i) => (
          <marker
            key={color}
            id={`vector-arrow-${i}-${id}`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M0 0 10 5 0 10" fill={color} />
          </marker>
        ))}
      </defs>
      <rect
        x={left}
        y={top}
        width={size}
        height={size}
        rx="12"
        fill="#f7faf4"
      />
      <g clipPath={`url(#grid-clip-${id})`}>
        {Array.from(
          { length: Math.floor(bound) * 2 + 1 },
          (_, i) => i - Math.floor(bound),
        ).map((value) => (
          <g key={value}>
            <path
              d={`M${X(value)} ${top}V${top + size}M${left} ${Y(value)}H${left + size}`}
              stroke="#e0ebda"
              strokeWidth="1"
            />
            {transform !== identity2 && (
              <>
                <motion.line
                  initial={false}
                  animate={{
                    x1: X(apply2(transform, [value, -bound])[0]),
                    y1: Y(apply2(transform, [value, -bound])[1]),
                    x2: X(apply2(transform, [value, bound])[0]),
                    y2: Y(apply2(transform, [value, bound])[1]),
                  }}
                  stroke="#b4d4a5"
                  strokeWidth="1.2"
                  transition={{ duration: reduced ? 0 : 0.24 }}
                />
                <motion.line
                  initial={false}
                  animate={{
                    x1: X(apply2(transform, [-bound, value])[0]),
                    y1: Y(apply2(transform, [-bound, value])[1]),
                    x2: X(apply2(transform, [bound, value])[0]),
                    y2: Y(apply2(transform, [bound, value])[1]),
                  }}
                  stroke="#b4d4a5"
                  strokeWidth="1.2"
                  transition={{ duration: reduced ? 0 : 0.24 }}
                />
              </>
            )}
          </g>
        ))}
        {area && (
          <motion.polygon
            initial={false}
            animate={{ points: transformedSquare.map(p).join(" ") }}
            fill="#58b735"
            fillOpacity=".17"
            stroke="#5caf43"
            strokeWidth="2"
            transition={{ duration: reduced ? 0 : 0.25 }}
          />
        )}
        {line && (
          <>
            <path
              d={`M${X(-bound)} ${Y(line.m * -bound + line.b)}L${X(bound)} ${Y(line.m * bound + line.b)}`}
              stroke="#8391d4"
              strokeWidth="3"
            />
            {points.map((point, i) => (
              <path
                key={"res-" + i}
                d={`M${X(point[0])} ${Y(point[1])}L${X(point[0])} ${Y(line.m * point[0] + line.b)}`}
                stroke="#e1b66d"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            ))}
          </>
        )}
        {projection &&
          points.map((point, i) => {
            const projected = scale2(projection, dot2(point, projection));
            return (
              <path
                key={"projection-" + i}
                d={`M${p(point)}L${p(projected)}`}
                fill="none"
                stroke="#c1bde0"
                strokeDasharray="3 4"
              />
            );
          })}
        {points.map((point, i) => (
          <circle
            key={i}
            cx={X(point[0])}
            cy={Y(point[1])}
            r="5"
            fill="#58a746"
            stroke="white"
            strokeWidth="1.5"
          >
            <title>{`Điểm ${i + 1}: ${vectorText(point)}`}</title>
          </circle>
        ))}
        {arrows.map((arrow, i) => {
          const from = arrow.from || [0, 0],
            end = add2(from, arrow.value),
            color = ["#50a53e", "#8492d8", "#edaa43"].indexOf(arrow.color);
          return (
            <g key={arrow.label}>
              <motion.line
                initial={false}
                animate={{
                  x1: X(from[0]),
                  y1: Y(from[1]),
                  x2: X(end[0]),
                  y2: Y(end[1]),
                }}
                stroke={arrow.color}
                strokeWidth={arrow.dashed ? 2 : 3.5}
                strokeDasharray={arrow.dashed ? "5 4" : undefined}
                markerEnd={`url(#vector-arrow-${Math.max(0, color)}-${id})`}
                transition={{ duration: reduced ? 0 : 0.24 }}
              />
              <text
                x={X(end[0]) + 8}
                y={Y(end[1]) - 8}
                fontSize="12"
                fontWeight="900"
                fill={arrow.color}
              >
                {arrow.label}
              </text>
            </g>
          );
        })}
      </g>
      <path
        d={`M${left} ${cy}H${left + size}M${cx} ${top + size}V${top}`}
        stroke="#a8bda0"
        strokeWidth="1.5"
      />
      {[-4, -2, 0, 2, 4]
        .filter((v) => Math.abs(v) <= bound)
        .map((v) => (
          <g key={v}>
            <text
              x={X(v)}
              y={cy + 16}
              textAnchor="middle"
              fontSize="9"
              fill="#819277"
            >
              {v}
            </text>
            {v !== 0 && (
              <text
                x={cx - 9}
                y={Y(v) + 3}
                textAnchor="end"
                fontSize="9"
                fill="#819277"
              >
                {v}
              </text>
            )}
          </g>
        ))}
      <text
        x={left + size - 3}
        y={cy - 8}
        textAnchor="end"
        fontSize="10"
        fill="#58734b"
      >
        {axisLabels[0]}
      </text>
      <text x={cx + 8} y={top + 12} fontSize="10" fill="#58734b">
        {axisLabels[1]}
      </text>
      {onDrag && arrows[0] && (
        <circle
          cx={X(arrows[0].value[0])}
          cy={Y(arrows[0].value[1])}
          r="10"
          fill="#50a53e"
          stroke="white"
          strokeWidth="3"
          className="linear-drag-handle"
          role="button"
          tabIndex={0}
          aria-label={`Kéo đầu vector u; phím mũi tên điều chỉnh. u = ${vectorText(arrows[0].value)}`}
          onPointerDown={(e) => {
            e.preventDefault();
            setDragging(true);
            svg.current?.setPointerCapture(e.pointerId);
            move(e.clientX, e.clientY);
          }}
          onKeyDown={(e) => {
            if (
              !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
                e.key,
              )
            )
              return;
            e.preventDefault();
            const [x, y] = arrows[0].value;
            onDrag([
              Math.max(
                -4,
                Math.min(
                  4,
                  x +
                    (e.key === "ArrowRight"
                      ? 0.25
                      : e.key === "ArrowLeft"
                        ? -0.25
                        : 0),
                ),
              ),
              Math.max(
                -4,
                Math.min(
                  4,
                  y +
                    (e.key === "ArrowUp"
                      ? 0.25
                      : e.key === "ArrowDown"
                        ? -0.25
                        : 0),
                ),
              ),
            ]);
          }}
        />
      )}
    </svg>
  );
}

export default function LinearVisualizer({
  lesson,
  compact = false,
}: {
  lesson: Lesson;
  compact?: boolean;
}) {
  const data = lesson.visualData || {},
    scene =
      data.scene ||
      (typeof lesson.visualization === "string"
        ? lesson.visualization
        : lesson.visualization?.scene) ||
      "vectors";
  const initialU = pair(
      scene === "projection" ? data.projection?.u : data.vectors?.u,
      [2, 1],
    ),
    initialV = pair(
      scene === "projection" ? data.projection?.onto : data.vectors?.v,
      [1, 2],
    );
  const initialA = square(
    ["eigen", "diagonalization", "cayley"].includes(scene)
      ? data.eigen?.A
      : data.matrix,
    [
      [2, 1],
      [0, 1],
    ],
  );
  const [u, setU] = useState<Vector2>(initialU),
    [v, setV] = useState<Vector2>(initialV),
    [a, setA] = useState<Matrix2>(initialA),
    [b, setB] = useState<Matrix2>([
      [1, 2],
      [0, 1],
    ]),
    [coefficient, setCoefficient] = useState(1),
    [coefficientU, setCoefficientU] = useState(1),
    [angle, setAngle] = useState(25),
    [sigma1, setSigma1] = useState(2),
    [sigma2, setSigma2] = useState(0.7),
    [variant, setVariant] = useState(0),
    [preset, setPreset] = useState("lesson"),
    [m, setM] = useState(0.8),
    [intercept, setIntercept] = useState(0),
    [cell, setCell] = useState<[number, number]>([0, 0]),
    [startProbability, setStartProbability] = useState(0.9);
  const initialPoints: Vector2[] =
    Array.isArray(data.points) && data.points.length
      ? data.points.map((p: any) => pair(p, [0, 0]))
      : [
          [-3, -2],
          [-2, -1],
          [-1, -1],
          [0, 0],
          [1, 0.5],
          [2, 2],
          [3, 2],
        ];
  const points = useMemo(
    () =>
      initialPoints.map(
        (p, i) =>
          [
            p[0],
            p[1] + (variant ? Math.sin(i * 2.3 + variant) * 0.55 : 0),
          ] as Vector2,
      ),
    [lesson.id, variant],
  );
  const system = data.system || {
      A: [
        [1, 1],
        [2, -1],
      ],
      b: [4, 2],
    },
    systemA = variant
      ? [
          [1, 1],
          [2, variant % 3 ? 2 : -1],
        ]
      : system.A,
    systemB = variant ? [4, variant % 3 === 1 ? 8 : variant % 3 === 2 ? 9 : 2 + variant] : system.b;
  const elimination = eliminationFrames(systemA, systemB),
    steps =
      scene === "elimination"
        ? elimination.length
        : scene === "product"
          ? 9
          : scene === "markov"
            ? 13
            : 13;
  const playback = useVisualPlayback(steps, `${lesson.id}:${variant}:${scene}`),
    t = playback.step / Math.max(1, steps - 1);
  useEffect(() => {
    setU(initialU);
    setV(initialV);
    setA(initialA);
    setB([
      [1, 2],
      [0, 1],
    ]);
    setCoefficient(1);
    setCoefficientU(1);
    setAngle(25);
    setSigma1(2);
    setSigma2(0.7);
    setVariant(0);
    setPreset("lesson");
    setM(0.8);
    setIntercept(0);
    setCell([0, 0]);
    setStartProbability(0.9);
  }, [lesson.id]);
  const matrixMode = ["matrix", "transform", "determinant", "rank"].includes(
      scene,
    ),
    eigenMode = ["eigen", "diagonalization", "cayley"].includes(scene),
    sum = add2(scale2(u, coefficientU), scale2(v, coefficient)),
    dot = dot2(u, v),
    projected = projection2(u, v),
    product = multiply2(a, b),
    av = apply2(a, u),
    det = determinant2(a);
  const complexMode=!!data.eigen?.complex;
  const eigenMatrix = complexMode ? [[variant%3,-(1+variant%2)],[1+variant%2,variant%3]] as Matrix2 : variant ? [[2 + variant % 3, 1],[1, 2]] as Matrix2 : square(data.eigen?.A, [
      [2, 1],
      [1, 2],
    ]),
    eigen = complexMode ? {values:[],direction:null} : symmetricEigen2(eigenMatrix),
    direction: Vector2 = [
      Math.cos((angle * Math.PI) / 180),
      Math.sin((angle * Math.PI) / 180),
    ],
    mappedDirection = apply2(eigenMatrix, direction),
    lambda = dot2(direction, mappedDirection),
    eigenResidual = Math.hypot(
      ...add2(mappedDirection, scale2(direction, -lambda)),
    );
  const covariance = covariance2(points),
    principal = symmetricEigen2(covariance.matrix),
    totalVariance = principal.values[0] + principal.values[1];
  const principalAngle =
      (Math.atan2(principal.direction[1], principal.direction[0]) * 180) /
      Math.PI,
    effectivePcaAngle = angle + (principalAngle - angle) * t;
  const pcaDirection: Vector2 = [
    Math.cos((effectivePcaAngle * Math.PI) / 180),
    Math.sin((effectivePcaAngle * Math.PI) / 180),
  ];
  const effectiveProjectionVariance = dot2(
    pcaDirection,
    apply2(covariance.matrix, pcaDirection),
  );
  const theta = angle,
    rotationV = rotate2(-theta),
    stretch: Matrix2 = [
      [sigma1, 0],
      [0, sigma2],
    ],
    rotationU = rotate2(35),
    svdA = multiply2(rotationU, multiply2(stretch, rotationV));
  const svdPhase = playback.step <= 4 ? 0 : playback.step <= 8 ? 1 : 2,
    svdTransform =
      svdPhase === 0
        ? rotate2((-theta * playback.step) / 4)
        : svdPhase === 1
          ? multiply2(interpolate2(stretch, (playback.step - 4) / 4), rotationV)
          : multiply2(
              rotate2((35 * (playback.step - 8)) / 4),
              multiply2(stretch, rotationV),
            );
  const markov: Matrix2 = [
    [0.8, 0.3],
    [0.2, 0.7],
  ];
  let distribution: Vector2 = [startProbability, 1 - startProbability];
  for (let i = 0; i < playback.step; i++)
    distribution = apply2(markov, distribution);
  const centerX = points.reduce((s, p) => s + p[0], 0) / points.length,
    centerY = points.reduce((s, p) => s + p[1], 0) / points.length,
    denominator = points.reduce((s, p) => s + (p[0] - centerX) ** 2, 0),
    optimalSlope = denominator
      ? points.reduce((s, p) => s + (p[0] - centerX) * (p[1] - centerY), 0) /
        denominator
      : 0;
  const effectiveSlope = m + (optimalSlope - m) * t,
    effectiveIntercept =
      intercept + (centerY - optimalSlope * centerX - intercept) * t,
    predicted = points.map((p) => effectiveSlope * p[0] + effectiveIntercept),
    sse = points.reduce((sum, p, i) => sum + (p[1] - predicted[i]) ** 2, 0);
  useEffect(() => {
    if (scene === "product")
      setCell([
        Math.min(1, Math.floor(playback.step / 4)),
        Math.min(1, Math.floor(Math.min(7,playback.step) / 2) % 2),
      ]);
  }, [playback.step, scene]);
  const matrixTrace =
      scene === "cayley" ? eigenMatrix[0][0] + eigenMatrix[1][1] : 0,
    cayleyResult =
      scene === "cayley"
        ? multiply2(eigenMatrix, eigenMatrix).map((row, i) =>
            row.map(
              (value, j) =>
                value -
                matrixTrace * eigenMatrix[i][j] +
                (i === j ? determinant2(eigenMatrix) : 0),
            ),
          )
        : [];
  let arrows: Arrow[] = [{ value: u, label: "u", color: "#50a53e" }],
    transform: Matrix2 = identity2,
    plotPoints: Vector2[] = [],
    projectionDirection: Vector2 | undefined,
    line: { m: number; b: number } | undefined;
  if (matrixMode) {
    transform = interpolate2(a, t);
    arrows = [
      { value: u, label: "u", color: "#8492d8", dashed: true },
      { value: apply2(transform, u), label: "Aₜu", color: "#50a53e" },
    ];
  } else if (eigenMode) {
    transform = interpolate2(eigenMatrix, t);
    arrows = [
      { value: direction, label: "v", color: "#8492d8" },
      {
        value: apply2(transform, direction),
        label: "Aₜv",
        color: "#50a53e",
      },
    ];
  } else if (scene === "svd") {
    transform = svdTransform;
    arrows = [
      { value: u, label: "u", color: "#8492d8", dashed: true },
      { value: apply2(transform, u), label: "Ảnh của u", color: "#50a53e" },
    ];
  } else if (scene === "pca") {
    plotPoints = covariance.centered;
    projectionDirection = pcaDirection;
    arrows = [
      {
        value: scale2(pcaDirection, 4),
        label: "Hướng chiếu",
        color: "#8492d8",
      },
    ];
  } else if (scene === "least-squares") {
    plotPoints = points;
    line = { m: effectiveSlope, b: effectiveIntercept };
    arrows = [];
  } else if (["dot", "projection"].includes(scene)) {
    arrows.push({ value: v, label: "v", color: "#8492d8" });
    if (projected && playback.step >= 4) {
      arrows.push({ value: projected, label: "projᵥu", color: "#edaa43" });
      if (playback.step >= 8)
        arrows.push({
          value: add2(u, scale2(projected, -1)),
          from: projected,
          label: "Sai lệch",
          color: "#8492d8",
          dashed: true,
        });
    }
  } else {
    arrows.push({
      value: scale2(v, coefficient),
      label: "bv",
      color: "#8492d8",
    });
    if (["combination", "span"].includes(scene) && coefficientU !== 1)
      arrows.push({value:scale2(u,coefficientU),label:"au",color:"#50a53e",dashed:true});
    if (playback.step >= 4)
      arrows.push({
        value: scale2(v, coefficient),
        from: scale2(u,coefficientU),
        label: "Đặt nối đuôi",
        color: "#8492d8",
        dashed: true,
      });
    if (playback.step >= 8)
      arrows.push({ value: sum, label: "au + bv", color: "#edaa43" });
  }
  const chartExtent = matrixMode ? [u,av] : eigenMode ? [direction,mappedDirection] : scene === "svd" ? [[Math.hypot(...u),0],[Math.hypot(...apply2(svdA,u)),0]] : scene === "pca" ? covariance.centered : scene === "least-squares" ? points : [u,v,scale2(u,coefficientU),scale2(v,coefficient),sum];
  const chartBound = Math.max(5,Math.ceil(Math.max(0,...chartExtent.flatMap(point=>point.map(Math.abs))))+1);
  const changeData = () => {
    setVariant((s) => s + 1);
    if (scene === "markov") setStartProbability(((variant + 2) % 9 + 1) / 10);
    setU([
      round(1 + Math.sin(variant + 2) * 2),
      round(Math.cos(variant + 1) * 2),
    ]);
    setV([variant % 2 ? 1 : 2, (variant % 3) - 1]);
    setA([
      [1 + (variant % 3), variant % 2 ? -1 : 1],
      [variant % 2, 1],
    ]);
    playback.reset();
  };
  function choosePreset(value: string) {
    setPreset(value);
    playback.reset();
    setA(
      value === "rotation"
        ? rotate2(45)
        : value === "shear"
          ? [
              [1, 1],
              [0, 1],
            ]
          : value === "collapse"
            ? [
                [1, 2],
                [0.5, 1],
              ]
            : value === "reflection"
              ? [
                  [-1, 0],
                  [0, 1],
                ]
              : initialA,
    );
  }
  const explanations: Record<string, string> = {
    vectors:
      "Vector có hướng và độ dài. Kéo đầu u hoặc dùng thanh trượt để xem từng thành phần.",
    combination:
      "Nối đuôi bv vào au. Điểm cuối là au + bv; hệ số âm đổi hướng của vector.",
    span:
      Math.abs(u[0] * v[1] - u[1] * v[0]) < 1e-8
        ? "Hai vector phụ thuộc: các tổ hợp chỉ nằm trên một đường (hoặc một điểm nếu cả hai bằng 0)."
        : "Hai vector độc lập: tổ hợp tuyến tính của chúng phủ toàn mặt phẳng.",
    dot: `u·v = ${fmt(u[0])}×${fmt(v[0])} + ${fmt(u[1])}×${fmt(v[1])} = ${fmt(dot)}. Tích bằng 0 nghĩa là vuông góc nếu cả hai khác 0.`,
    projection: projected
      ? `projᵥu = (u·v / v·v) v = ${vectorText(projected)}. Phần dư vuông góc với v.`
      : "Vector hướng v bằng 0: phép chiếu lên hướng v không được xác định bằng công thức này.",
    matrix:
      "Cột thứ nhất là ảnh của e₁, cột thứ hai là ảnh của e₂. Kết quả trên hình dùng Aₜ = (1−t)I + tA.",
    transform:
      "Lưới xanh là ảnh của lưới ban đầu. Nội suy chỉ giúp quan sát; các ma trận trung gian có thể không khả nghịch.",
    determinant: `det(A) = ${fmt(det)}; diện tích hình vuông đơn vị ở A mục tiêu là ${fmt(Math.abs(det))}. ${det < 0 ? "Hướng bị đảo." : det === 0 ? "Mặt phẳng bị ép mất một chiều." : "Hướng được giữ."}`,
    rank: `Trong ví dụ 2×2: rank(A) = ${Math.abs(det) > 1e-9 ? 2 : a.flat().every((x) => Math.abs(x) < 1e-9) ? 0 : 1}. Rank đếm các hướng cột độc lập, không đếm số ô khác 0.`,
    eigen: complexMode ? `A có trị riêng ${fmt(eigenMatrix[0][0])} ± ${fmt(eigenMatrix[1][0])}i. Mọi hướng thực khác 0 đều bị xoay: không có vector riêng thực. Số phức trong bài Python dùng cặp real/imag.` : `Av song song v khi phần lệch bằng 0. Hai eigenvalue của ma trận đối xứng này: ${eigen.values.map(fmt).join(" và ")}.`,
    diagonalization:
      "Ma trận đối xứng thực có cơ sở eigenvector trực chuẩn. Trong cơ sở đó, phép biến đổi là co giãn theo từng eigenvalue.",
    cayley:
      "Với ma trận 2×2: A² − tr(A)A + det(A)I = 0. Mỗi phần tử của ma trận kết quả cần bằng 0 (trong sai số số thực).",
    pca: "Dữ liệu đã được trừ mean. Hướng PCA đầu tiên tối đa hóa phương sai chiếu; hình dùng covariance của tập điểm với mẫu số n.",
    svd: "Trong ví dụ dựng sẵn A = UΣVᵀ, Vᵀ xoay đầu vào, Σ co giãn không âm, U xoay đầu ra. Đây là SVD của đúng ma trận được dựng trên màn hình.",
    "least-squares":
      "Các đoạn nét đứt là residual theo trục y. Đường bình phương tối thiểu giảm tổng bình phương những residual này.",
    markov:
      "Vector xác suất là cột. Mỗi cột của P cộng bằng 1; bước tiếp theo là pₜ₊₁ = Ppₜ. Đây là chuỗi Markov hai trạng thái giả lập.",
  };
  return (
    <section
      className={`linear-workshop ${compact ? "workshop-compact" : ""}`}
      tabIndex={0}
      onKeyDown={playback.onKeyDown}
      aria-label="Khám phá đại số tuyến tính; phím trái/phải đổi bước, Space chạy/dừng"
      aria-keyshortcuts="ArrowLeft ArrowRight Home End Space"
    >
      <header className="workshop-heading">
        <div>
          <span className="eyebrow">ĐẠI SỐ TUYẾN TÍNH · THỬ & QUAN SÁT</span>
          <h3>{complexMode?'Khi phép xoay cần đến số phức':names[scene] || names.vectors}</h3>
        </div>
        <span className="workshop-count">
          <Icon name="move" size={16} />
          TƯƠNG TÁC
        </span>
      </header>
      {scene === "elimination" ? (
        <div className="linear-elimination">
          <MatrixDisplay
            matrix={elimination[playback.step]?.matrix || []}
            label="Ma trận mở rộng [A | b]"
            active={elimination[playback.step]?.pivot}
            augmented
          />
          <div className="linear-step-caption" aria-live="polite">
            <span className="eyebrow">BIẾN ĐỔI HÀNG</span>
            <h4>{elimination[playback.step]?.label}</h4>
            <small>
              Pivot phải khác 0. Các cột cuối là vế phải, không tính vào
              rank(A).
            </small>
            {elimination[playback.step]?.rank !== undefined && (
              <strong>rank(A) = {elimination[playback.step]?.rank}</strong>
            )}
          </div>
        </div>
      ) : scene === "product" ? (
        <div className="linear-product">
          <div className="linear-product-matrices">
            <MatrixDisplay matrix={a} label="A · 2×2" active={[cell[0], -1]} />
            <Icon name="x" />
            <MatrixDisplay matrix={b} label="B · 2×2" active={[-1, cell[1]]} />
            <span>=</span>
            <MatrixDisplay matrix={product} label="AB · 2×2" active={cell} cellOnly />
          </div>
          <div className="linear-product-cells">
            {product.flatMap((row, i) =>
              row.map((value, j) => (
                <button
                  key={`${i}${j}`}
                  className={cell[0] === i && cell[1] === j ? "selected" : ""}
                  aria-pressed={cell[0] === i && cell[1] === j}
                  onClick={() => {
                    setCell([i, j]);
                    playback.go(i * 4 + j * 2);
                  }}
                >
                  Ô ({i + 1}, {j + 1})<b>{fmt(value)}</b>
                </button>
              )),
            )}
          </div>
          <p className="linear-equation" aria-live="polite">
            ({fmt(a[cell[0]][0])} × {fmt(b[0][cell[1]])}) + (
            {fmt(a[cell[0]][1])} × {fmt(b[1][cell[1]])}) ={" "}
            <b>{fmt(product[cell[0]][cell[1]])}</b>
          </p>
          <small>
            Mỗi ô lấy tích vô hướng hàng của A với cột của B. Thứ tự AB có ý
            nghĩa.
          </small>
        </div>
      ) : scene === "markov" ? (
        <div className="linear-markov">
          <MatrixDisplay matrix={markov} label="P · cột cộng bằng 1" />
          <div className="linear-probabilities">
            {distribution.map((value, i) => (
              <div key={i}>
                <span>
                  {i === 0 ? "Ở trạng thái A" : "Ở trạng thái B"}
                  <b>{(value * 100).toFixed(1)}%</b>
                </span>
                <div>
                  <motion.i
                    initial={false}
                    animate={{ width: `${value * 100}%` }}
                    transition={{ duration: playback.reduced ? 0 : 0.35 }}
                  />
                </div>
              </div>
            ))}
            <p>Tổng xác suất: {fmt(distribution[0] + distribution[1])}</p>
          </div>
        </div>
      ) : (
        <div className="linear-workspace">
          <CoordinatePlot
            arrows={arrows}
            transform={transform}
            points={plotPoints}
            bound={chartBound}
            projection={projectionDirection}
            line={line}
            area={matrixMode || scene === "svd"}
            reduced={playback.reduced}
            onDrag={
              !matrixMode &&
              !eigenMode &&
              !["svd", "pca", "least-squares"].includes(scene)
                ? setU
                : undefined
            }
            axisLabels={[data.xLabel || "Trục x", data.yLabel || "Trục y"]}
          />
          <div className="linear-readout" aria-live="polite">
            {matrixMode ? (
              <>
                <MatrixDisplay matrix={a} label="Ma trận A" />
                <span>t = {fmt(t)}</span>
                <p>
                  Au = <strong>{vectorText(av)}</strong>
                </p>
                <p>
                  det(A) mục tiêu <strong>{fmt(det)}</strong>
                </p>
                <p>
                  det(Aₜ) trên hình{" "}
                  <strong>{fmt(determinant2(transform))}</strong>
                </p>
              </>
            ) : eigenMode ? (
              <>
                <MatrixDisplay matrix={eigenMatrix} label={complexMode?'A xoay và co giãn':'A đối xứng'} />
                <p>
                  Hệ số thử λ = vᵀAv (v đơn vị) <strong>{fmt(lambda)}</strong>
                </p>
                <p>
                  ||Av − λv|| tại A <strong>{fmt(eigenResidual)}</strong>
                </p>
                {scene === "cayley" && (
                  <MatrixDisplay
                    matrix={cayleyResult}
                    label="A² − tr(A)A + det(A)I"
                  />
                )}
                {!complexMode&&eigen.direction&&<button
                  className="text-link"
                  onClick={() => {
                    setAngle(
                      (Math.atan2(eigen.direction![1], eigen.direction![0]) *
                        180) /
                        Math.PI,
                    );
                    playback.go(steps - 1);
                  }}
                >
                  CHỌN HƯỚNG EIGENVECTOR
                </button>}
              </>
            ) : scene === "pca" ? (
              <>
                <MatrixDisplay
                  matrix={covariance.matrix}
                  label="Covariance · chia n"
                />
                <p>
                  Mean gốc <strong>{vectorText(covariance.mean)}</strong>
                </p>
                <p>Góc hiện tại <strong>{fmt(effectivePcaAngle)}°</strong></p>
                <p>
                  Phương sai chiếu{" "}
                  <strong>{fmt(effectiveProjectionVariance)}</strong>
                </p>
                <p>
                  Tỷ lệ trên hướng chọn{" "}
                  <strong>
                    {totalVariance
                      ? (
                          (effectiveProjectionVariance / totalVariance) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </strong>
                </p>
                <button
                  className="text-link"
                  onClick={() => {
                    setAngle(
                      (Math.atan2(
                        principal.direction[1],
                        principal.direction[0],
                      ) *
                        180) /
                        Math.PI,
                    );
                    playback.go(steps - 1);
                  }}
                >
                  TÌM HƯỚNG PCA
                </button>
              </>
            ) : scene === "svd" ? (
              <>
                <MatrixDisplay matrix={svdA} label="A = UΣVᵀ" />
                <MatrixDisplay matrix={stretch} label="Σ · singular values" />
                <p>
                  Đang xem{" "}
                  <strong>
                    {
                      ["Vᵀ · xoay đầu vào", "Σ · co giãn", "U · xoay đầu ra"][
                        svdPhase
                      ]
                    }
                  </strong>
                </p>
                <p>
                  Au cuối <strong>{vectorText(apply2(svdA, u))}</strong>
                </p>
              </>
            ) : scene === "least-squares" ? (
              <>
                <p>
                  ŷ ={" "}
                  <strong>
                    {fmt(effectiveSlope)}x + {fmt(effectiveIntercept)}
                  </strong>
                </p>
                <p>
                  SSE <strong>{fmt(sse)}</strong>
                </p>
                <button
                  className="text-link"
                  onClick={() => {
                    setM(optimalSlope);
                    setIntercept(centerY - optimalSlope * centerX);
                    playback.go(steps - 1);
                  }}
                >
                  CHỌN ĐƯỜNG BÌNH PHƯƠNG TỐI THIỂU
                </button>
              </>
            ) : (
              <>
                <p>
                  u = <strong>{vectorText(u)}</strong>
                </p>
                <p>
                  v = <strong>{vectorText(v)}</strong>
                </p>
                <p>
                  ||u|| = <strong>{fmt(Math.hypot(...u))}</strong>
                </p>
                <p>
                  {["dot", "projection"].includes(scene) ? "u·v" : "au + bv"} ={" "}
                  <strong>
                    {["dot", "projection"].includes(scene)
                      ? fmt(dot)
                      : vectorText(sum)}
                  </strong>
                </p>
                {scene === "projection" && (
                  <p>
                    projᵥu ={" "}
                    <strong>
                      {projected
                        ? vectorText(projected)
                        : "v = 0 · không xác định"}
                    </strong>
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
      <p className="workshop-caption" role="status">
        {scene === "elimination"
          ? elimination[playback.step]?.label
          : explanations[scene] || explanations.vectors}
      </p>
      <div className="linear-tweaks">
        {matrixMode && (
          <>
            <label>
              Phép biến đổi
              <select
                aria-label="Chọn phép biến đổi ma trận"
                value={preset}
                onChange={(e) => choosePreset(e.target.value)}
              >
                <option value="lesson">Ví dụ trong bài</option>
                <option value="rotation">Xoay 45°</option>
                <option value="shear">Shear · nghiêng</option>
                <option value="reflection">Phản xạ</option>
                <option value="collapse">Ép xuống một hướng</option>
              </select>
            </label>
            <div
              className="linear-matrix-inputs"
              role="group"
              aria-label="Các phần tử ma trận A"
            >
              {a.flatMap((row, i) =>
                row.map((value, j) => (
                  <label key={`${i}${j}`}>
                    a{i + 1}
                    {j + 1}
                    <input
                      type="number"
                      min="-4"
                      max="4"
                      step=".25"
                      value={round(value)}
                      aria-label={`A hàng ${i + 1} cột ${j + 1}`}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        if (!Number.isFinite(n)) return;
                        setA(
                          (old) =>
                            old.map((r, ri) =>
                              r.map((v, cj) =>
                                ri === i && cj === j
                                  ? Math.max(-4, Math.min(4, n))
                                  : v,
                              ),
                            ) as Matrix2,
                        );
                        setPreset("lesson");
                        playback.go(steps - 1);
                      }}
                    />
                  </label>
                )),
              )}
            </div>
          </>
        )}
        {[
          "vectors",
          "combination",
          "span",
          "dot",
          "projection",
          "svd",
        ].includes(scene) && (
          <>
            <ScalarSlider
              label="Vector u · x"
              value={u[0]}
              onChange={(x) => setU([x, u[1]])}
            />
            <ScalarSlider
              label="Vector u · y"
              value={u[1]}
              onChange={(y) => setU([u[0], y])}
            />
          </>
        )}
        {["vectors", "combination", "span", "dot", "projection"].includes(
          scene,
        ) && (
          <>
            <ScalarSlider
              label="Vector v · x"
              value={v[0]}
              onChange={(x) => setV([x, v[1]])}
            />
            <ScalarSlider
              label="Vector v · y"
              value={v[1]}
              onChange={(y) => setV([v[0], y])}
            />
            {["combination", "span"].includes(scene) && (
              <ScalarSlider
                label="Hệ số a của u"
                value={coefficientU}
                min={-2}
                max={2}
                onChange={setCoefficientU}
              />
            )}{" "}
            {!["dot", "projection"].includes(scene) && (
              <ScalarSlider
                label="Hệ số b của v"
                value={coefficient}
                min={-2}
                max={2}
                onChange={setCoefficient}
              />
            )}
          </>
        )}
        {(eigenMode || scene === "pca" || scene === "svd") && (
          <ScalarSlider
            label={scene === "svd" ? "Góc xoay V" : "Góc hướng đang thử (°)"}
            value={angle}
            min={-180}
            max={180}
            step={1}
            onChange={(value) => {
              setAngle(value);
              playback.go(0);
            }}
          />
        )}
        {scene === "svd" && (
          <>
            <ScalarSlider
              label="Singular value σ₁"
              value={sigma1}
              min={0}
              max={3}
              step={0.1}
              onChange={setSigma1}
            />
            <ScalarSlider
              label="Singular value σ₂"
              value={sigma2}
              min={0}
              max={3}
              step={0.1}
              onChange={setSigma2}
            />
          </>
        )}
        {scene === "least-squares" && (
          <>
            <ScalarSlider
              label="Độ dốc m"
              value={m}
              min={-2}
              max={2}
              step={0.05}
              onChange={(value) => {
                setM(value);
                playback.reset();
              }}
            />
            <ScalarSlider
              label="Giao điểm b"
              value={intercept}
              min={-2}
              max={2}
              step={0.05}
              onChange={(value) => {
                setIntercept(value);
                playback.reset();
              }}
            />
          </>
        )}
        {scene === "markov" && (
          <ScalarSlider
            label="Xác suất A ban đầu"
            value={startProbability}
            min={0}
            max={1}
            step={0.05}
            onChange={(value) => {
              setStartProbability(value);
              playback.reset();
            }}
          />
        )}
      </div>
      <label className="visual-timeline">
        Dòng thời gian
        <input
          type="range"
          min="0"
          max={Math.max(0, steps - 1)}
          value={playback.step}
          aria-label="Chọn bước đại số tuyến tính"
          onChange={(e) => {
            const index = Number(e.target.value);
            playback.go(index);
            if (scene === "product")
              setCell([
                Math.min(1, Math.floor(index / 4)),
                Math.min(1, Math.floor(Math.min(7,index) / 2) % 2),
              ]);
          }}
        />
      </label>
      <VisualPlayback playback={playback} onChangeData={changeData} />
      <details className="workshop-reading">
        <summary>Đọc hình · giả định và công thức</summary>
        <p>{explanations[scene] || explanations.vectors}</p>
        <p>
          Ví dụ nhỏ trên hình dùng số thực và đơn vị “{data.unit || "đơn vị"}”.
          Số hiển thị được rút gọn đến 3 chữ số thập phân; bài code cần giữ độ chính xác khi tính.
          Có thể kéo đầu vector bằng chuột hoặc dùng phím mũi tên/thanh trượt.
          Hình là nơi khám phá, bài code được checker backend chấm riêng.
        </p>
        {scene === "svd" && (
          <p>
            U là phép xoay 35°. V là phép xoay theo góc chọn; cả hai trực giao.
            Nếu muốn singular values được sắp giảm như quy ước thường dùng, chọn
            σ₁ ≥ σ₂.
          </p>
        )}
        {scene === "pca" && (
          <p>
            Các điểm đã center, chưa scale. Scaling làm thay đổi bài toán khi
            các đặc trưng có đơn vị khác nhau. Dữ liệu bằng nhau cho covariance
            0: không có một hướng PCA ưu tiên duy nhất.
          </p>
        )}
        {scene === "elimination" && (
          <p>
            Hình dùng Gauss–Jordan có đổi hàng khi cần, không chia cho pivot
            bằng 0. Hệ vô nghiệm và hệ có biến tự do được hiển thị thành trạng
            thái riêng.
          </p>
        )}
      </details>
    </section>
  );
}
