/** Small, deterministic math for the teaching figures. Grading is independent at the backend. */
export type Vector2 = [number, number];
export type Matrix2 = [[number, number], [number, number]];
export const identity2: Matrix2 = [
  [1, 0],
  [0, 1],
];
export const dot2 = (a: Vector2, b: Vector2) => a[0] * b[0] + a[1] * b[1];
export const apply2 = (a: Matrix2, v: Vector2): Vector2 => [
  dot2(a[0], v),
  dot2(a[1], v),
];
export const determinant2 = (a: Matrix2) =>
  a[0][0] * a[1][1] - a[0][1] * a[1][0];
export const multiply2 = (a: Matrix2, b: Matrix2): Matrix2 => [
  [
    a[0][0] * b[0][0] + a[0][1] * b[1][0],
    a[0][0] * b[0][1] + a[0][1] * b[1][1],
  ],
  [
    a[1][0] * b[0][0] + a[1][1] * b[1][0],
    a[1][0] * b[0][1] + a[1][1] * b[1][1],
  ],
];
export const scale2 = (v: Vector2, s: number): Vector2 => [v[0] * s, v[1] * s];
export const add2 = (a: Vector2, b: Vector2): Vector2 => [
  a[0] + b[0],
  a[1] + b[1],
];
export function projection2(u: Vector2, onto: Vector2): Vector2 | null {
  const norm2 = dot2(onto, onto);
  return norm2 < 1e-12 ? null : scale2(onto, dot2(u, onto) / norm2);
}
export const rotate2 = (degrees: number): Matrix2 => {
  const radians = (degrees * Math.PI) / 180,
    c = Math.cos(radians),
    s = Math.sin(radians);
  return [
    [c, -s],
    [s, c],
  ];
};
export const interpolate2 = (a: Matrix2, t: number): Matrix2 =>
  a.map((r, i) =>
    r.map((v, j) => (i === j ? 1 : 0) * (1 - t) + v * t),
  ) as Matrix2;
export function symmetricEigen2(a: Matrix2) {
  const center = (a[0][0] + a[1][1]) / 2,
    radius = Math.hypot((a[0][0] - a[1][1]) / 2, a[0][1]);
  const angle = 0.5 * Math.atan2(2 * a[0][1], a[0][0] - a[1][1]);
  return {
    values: [center + radius, center - radius],
    direction: [Math.cos(angle), Math.sin(angle)] as Vector2,
  };
}
export function covariance2(points: Vector2[]) {
  const n = points.length,
    mean: Vector2 = n
      ? (points
          .reduce<Vector2>((sum, p) => add2(sum, p), [0, 0])
          .map((x) => x / n) as Vector2)
      : [0, 0];
  const centered = points.map(
      (p) => [p[0] - mean[0], p[1] - mean[1]] as Vector2,
    ),
    divisor = Math.max(1, n);
  const xx = centered.reduce((s, p) => s + p[0] ** 2, 0) / divisor,
    yy = centered.reduce((s, p) => s + p[1] ** 2, 0) / divisor,
    xy = centered.reduce((s, p) => s + p[0] * p[1], 0) / divisor;
  return {
    mean,
    centered,
    matrix: [
      [xx, xy],
      [xy, yy],
    ] as Matrix2,
  };
}
export type EliminationFrame = {
  label: string;
  matrix: number[][];
  pivot?: [number, number];
  rank?: number;
  solution?: number[];
  status?: string;
};
export function eliminationFrames(
  coefficients: number[][],
  rhs: number[],
): EliminationFrame[] {
  if (
    !coefficients.length ||
    coefficients.some((r) => r.length !== coefficients[0].length) ||
    rhs.length !== coefficients.length
  )
    return [
      {
        label: "Hệ cần ma trận chữ nhật và một vế phải cho mỗi hàng.",
        matrix: [],
      },
    ];
  const variables = coefficients[0].length,
    rows = coefficients.map((row, i) => [...row, rhs[i]]),
    frames: EliminationFrame[] = [];
  const snapshot = (label: string, pivot?: [number, number]) =>
    frames.push({
      label,
      matrix: rows.map((r) => r.map((v) => (Math.abs(v) < 1e-10 ? 0 : v))),
      pivot,
    });
  snapshot("Ghép A với b. Mỗi phép biến đổi hàng giữ nguyên tập nghiệm.");
  let pivotRow = 0;
  const pivots: [number, number][] = [];
  for (let col = 0; col < variables && pivotRow < rows.length; col++) {
    let best = pivotRow;
    for (let i = pivotRow + 1; i < rows.length; i++)
      if (Math.abs(rows[i][col]) > Math.abs(rows[best][col])) best = i;
    if (Math.abs(rows[best][col]) < 1e-10) continue;
    if (best !== pivotRow) {
      [rows[best], rows[pivotRow]] = [rows[pivotRow], rows[best]];
      snapshot(`Đổi R${pivotRow + 1} ↔ R${best + 1} để có pivot khác 0.`, [
        pivotRow,
        col,
      ]);
    }
    const pivot = rows[pivotRow][col];
    rows[pivotRow] = rows[pivotRow].map((v) => v / pivot);
    snapshot(
      `R${pivotRow + 1} ← R${pivotRow + 1} / ${Number(pivot.toFixed(3))}.`,
      [pivotRow, col],
    );
    for (let i = 0; i < rows.length; i++)
      if (i !== pivotRow && Math.abs(rows[i][col]) > 1e-10) {
        const factor = rows[i][col];
        rows[i] = rows[i].map((v, j) => v - factor * rows[pivotRow][j]);
        snapshot(
          `R${i + 1} ← R${i + 1} − (${Number(factor.toFixed(3))}) R${pivotRow + 1}.`,
          [pivotRow, col],
        );
      }
    pivots.push([pivotRow, col]);
    pivotRow++;
  }
  const inconsistent = rows.some(
    (r) =>
      r.slice(0, variables).every((v) => Math.abs(v) < 1e-10) &&
      Math.abs(r[variables]) > 1e-10,
  );
  const solution = Array(variables).fill(0);
  for (const [row, col] of pivots) solution[col] = rows[row][variables];
  frames.push({
    label: inconsistent
      ? "Có hàng 0 = số khác 0: hệ vô nghiệm."
      : pivots.length < variables
        ? "Có biến tự do: hệ có vô số nghiệm."
        : `Nghiệm duy nhất: [${solution.map((v) => Number(v.toFixed(3))).join(", ")}].`,
    matrix: rows.map((r) => [...r]),
    rank: pivots.length,
    status: inconsistent
      ? "inconsistent"
      : pivots.length < variables
        ? "infinite"
        : "unique",
    ...(inconsistent || pivots.length < variables ? {} : { solution }),
  });
  return frames;
}
