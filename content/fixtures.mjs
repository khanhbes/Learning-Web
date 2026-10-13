// Authored boundary fixtures: each input satisfies the published problem contract.
// These are deliberately independent of the random input generator.
export function edgeInputs(id) {
  const cases = {
    add: [
      { a: 0, b: 0 },
      { a: -1000, b: 1000 },
      { a: 1000, b: 1000 },
    ],
    parity: [{ n: 0 }, { n: -1 }, { n: -1000 }, { n: 999 }],
    sum: [
      { nums: [] },
      { nums: [0] },
      { nums: [-1000, 1000] },
      { nums: [-5, -2] },
    ],
    maximum: [{ nums: [-1000] }, { nums: [-8, -2, -9] }, { nums: [4, 4, 4] }],
    count: [
      { nums: [], target: 0 },
      { nums: [0, 0, 0], target: 0 },
      { nums: [1, 2], target: 3 },
    ],
    "two-sum": [
      { nums: [], target: 0 },
      { nums: [3], target: 6 },
      { nums: [3, 3], target: 6 },
      { nums: [-2, 0, 2, 4], target: 2 },
      { nums: [1, 2], target: 9 },
    ],
    stock: [
      { prices: [] },
      { prices: [5] },
      { prices: [9, 7, 2] },
      { prices: [0, 0, 1000] },
    ],
    duplicate: [
      { nums: [] },
      { nums: [1] },
      { nums: [0, 0] },
      { nums: [-1, 0, 1] },
    ],
    product: [
      { nums: [] },
      { nums: [0] },
      { nums: [2, 0, 3] },
      { nums: [0, 2, 0] },
      { nums: [-2, 3, -1] },
    ],
    kadane: [
      { nums: [-1000] },
      { nums: [-5, -2, -8] },
      { nums: [0, 0] },
      { nums: [5, -10, 6] },
    ],
    "merge-array": [
      { a: [], b: [] },
      { a: [], b: [1, 1] },
      { a: [-2, 2], b: [-2, 0, 2] },
    ],
    "merge-list": [
      { a: [], b: [] },
      { a: [], b: [1, 1] },
      { a: [-2, 2], b: [-2, 0, 2] },
    ],
    anagram: [
      { s: "", t: "" },
      { s: "a", t: "" },
      { s: "aab", t: "abb" },
      { s: "ab", t: "ba" },
    ],
    substring: [{ s: "" }, { s: "aaaa" }, { s: "abba" }, { s: "abcde" }],
    replacement: [
      { s: "", k: 0 },
      { s: "ABAB", k: 0 },
      { s: "ABCD", k: 4 },
      { s: "AABABBA", k: 1 },
    ],
    binary: [
      { nums: [], target: 0 },
      { nums: [2], target: 2 },
      { nums: [2, 2, 2], target: 2 },
      { nums: [1, 3], target: 2 },
    ],
    rotated: [
      { nums: [], target: 1 },
      { nums: [1], target: 1 },
      { nums: [2, 1], target: 1 },
      { nums: [1, 2, 3], target: 4 },
    ],
    "bad-version": [
      { n: 1, first: 1 },
      { n: 1000000, first: 1 },
      { n: 1000000, first: 1000000 },
    ],
    "reverse-list": [{ nums: [] }, { nums: [1] }, { nums: [2, 2, 2] }],
    "list-cycle": [
      { nums: [], pos: -1 },
      { nums: [1], pos: -1 },
      { nums: [1], pos: 0 },
      { nums: [1, 2, 3], pos: 2 },
    ],
    parentheses: [
      { s: "" },
      { s: "(" },
      { s: ")(" },
      { s: "([)]" },
      { s: "{[()]}" },
    ],
    "min-stack": [
      { ops: [] },
      { ops: [["push", 2], ["push", 2], ["pop"], ["min"]] },
      { ops: [["push", -3], ["min"], ["top"], ["pop"]] },
    ],
    temperatures: [
      { nums: [] },
      { nums: [0] },
      { nums: [100, 99, 98] },
      { nums: [40, 40, 41] },
    ],
    depth: [
      { tree: Array.from({ length: 127 }, (_, i) => i + 1) },
      { tree: [] },
      { tree: [1] },
      { tree: [1, 2, null, 3, null, 4] },
    ],
    invert: [{ tree: [] }, { tree: [1] }, { tree: [1, null, 2, null, 3] }],
    lca: [
      { tree: [1], p: 1, q: 1 },
      { tree: [1, 2, 3], p: 1, q: 2 },
      { tree: [1, 2, 3, 4], p: 4, q: 3 },
    ],
    diameter: [{ tree: [] }, { tree: [1] }, { tree: [1, 2, null, 3, null, 4] }],
    "same-tree": [
      { p: [], q: [] },
      { p: [1, 2], q: [1, null, 2] },
      { p: [1], q: [1, null, null] },
      { p: [1], q: [2] },
    ],
    codec: [
      { tree: [] },
      { tree: [1] },
      { tree: [1, null, 2, null, 3] },
      { tree: [-2, 0, 0] },
    ],
    islands: [
      { grid: [] },
      { grid: [[0]] },
      { grid: [[1]] },
      {
        grid: [
          [1, 0],
          [0, 1],
        ],
      },
      {
        grid: [
          [1, 1, 1],
          [1, 1, 1],
        ],
      },
    ],
    clone: [
      { adj: [] },
      { adj: [[]] },
      { adj: [[1], [0], []] },
      {
        adj: [
          [1, 2],
          [0, 2],
          [0, 1],
        ],
      },
    ],
    "graph-cycle": [
      { n: 0, edges: [] },
      {
        n: 4,
        edges: [
          [0, 1],
          [2, 3],
        ],
      },
      {
        n: 3,
        edges: [
          [0, 1],
          [1, 2],
          [2, 0],
        ],
      },
    ],
    fib: [{ n: 0 }, { n: 1 }, { n: 40 }],
    knapsack: [
      { weights: [], values: [], capacity: 0 },
      { weights: [2], values: [9], capacity: 1 },
      { weights: [2], values: [3], capacity: 4 },
      { weights: [1, 2], values: [0, 4], capacity: 2 },
    ],
    lcs: [
      { a: "", b: "" },
      { a: "a", b: "" },
      { a: "aa", b: "a" },
      { a: "abc", b: "xyz" },
      { a: "abc", b: "abc" },
    ],
    prefix: [
      { nums: [0], queries: [[0, 0]] },
      {
        nums: [-3, 2, 5],
        queries: [
          [0, 2],
          [0, 0],
          [2, 2],
          [1, 2],
        ],
      },
      { nums: [4], queries: [] },
    ],
    difference: [
      { nums: [0], updates: [[0, 0, -2]] },
      {
        nums: [1, 2, 3],
        updates: [
          [0, 2, 5],
          [1, 2, -5],
          [0, 0, -1],
        ],
      },
      { nums: [4], updates: [] },
    ],
    queue: [
      { ops: [] },
      { ops: [["push", 0], ["pop"]] },
      {
        ops: [["push", 1], ["push", 2], ["pop"], ["push", 3], ["pop"], ["pop"]],
      },
    ],
    sort: [
      { nums: [] },
      { nums: [3] },
      { nums: [3, 3, 1, -2, 1] },
      { nums: [5, 4, 3, 2, 1] },
    ],
    palindrome: [{ s: "" }, { s: "a" }, { s: "abba" }, { s: "abca" }],
    "three-sum": [
      { nums: [] },
      { nums: [0, 0, 0, 0] },
      { nums: [-1, -1, 2, 2] },
      { nums: [1, 2, 3] },
    ],
    "window-sum": [
      { nums: [-3], k: 1 },
      { nums: [-5, -2, -7], k: 2 },
      { nums: [1, 2, 3], k: 3 },
    ],
    "window-max": [
      { nums: [-3], k: 1 },
      { nums: [3, 3, 3], k: 2 },
      { nums: [5, 4, 3, 2], k: 3 },
      { nums: [1, 2, 3], k: 3 },
    ],
    subsets: [{ nums: [] }, { nums: [0] }, { nums: [-1, 1] }],
    "top-k": [
      { nums: [1], k: 1 },
      { nums: [3, 3, 3], k: 2 },
      { nums: [-5, -1, -3], k: 3 },
    ],
    schedule: [
      { intervals: [] },
      {
        intervals: [
          [0, 1],
          [1, 2],
        ],
      },
      {
        intervals: [
          [0, 9],
          [1, 2],
          [2, 3],
          [3, 4],
        ],
      },
    ],
    topo: [
      { n: 0, edges: [] },
      { n: 4, edges: [] },
      {
        n: 3,
        edges: [
          [0, 1],
          [1, 2],
          [2, 0],
        ],
      },
      {
        n: 4,
        edges: [
          [0, 2],
          [1, 2],
        ],
      },
    ],
    shortest: [
      { n: 1, edges: [], start: 0 },
      { n: 3, edges: [[0, 1, 0]], start: 0 },
      {
        n: 4,
        edges: [
          [0, 1, 8],
          [0, 2, 1],
          [2, 1, 1],
        ],
        start: 0,
      },
    ],
    xor: [{ nums: [0] }, { nums: [1000, 0, 1000] }, { nums: [1, 1, 2, 2, 0] }],
    priority: [
      { tasks: [] },
      {
        tasks: [
          { id: 2, priority: 1, order: 0 },
          { id: 1, priority: 1, order: 0 },
        ],
      },
      {
        tasks: [
          { id: 0, priority: 2, order: 1 },
          { id: 1, priority: 1, order: 9 },
        ],
      },
    ],
    "union-find": [
      { n: 0, edges: [] },
      { n: 4, edges: [] },
      {
        n: 4,
        edges: [
          [0, 1],
          [1, 2],
          [2, 0],
        ],
      },
    ],
    coin: [
      { coins: [2], amount: 0 },
      { coins: [2], amount: 3 },
      { coins: [1, 3, 4], amount: 6 },
      { coins: [], amount: 1 },
    ],
    lis: [
      { nums: [] },
      { nums: [2, 2, 2] },
      { nums: [3, 2, 1] },
      { nums: [-3, -2, -1] },
    ],
    edit: [
      { a: "", b: "" },
      { a: "", b: "abc" },
      { a: "a", b: "a" },
      { a: "ab", b: "ba" },
    ],
    trie: [
      { words: [], prefixes: ["", "a"] },
      {
        words: ["", "app", "app", "apple"],
        prefixes: ["", "app", "apple", "apps"],
      },
    ],
    nqueens: [{ n: 1 }, { n: 2 }, { n: 3 }, { n: 8 }],
    mst: [
      { n: 0, edges: [] },
      { n: 1, edges: [] },
      { n: 3, edges: [[0, 1, 1]] },
      {
        n: 3,
        edges: [
          [0, 1, 0],
          [1, 2, 0],
          [0, 2, 1],
        ],
      },
    ],
    bellman: [
      { n: 1, edges: [], start: 0 },
      {
        n: 3,
        edges: [
          [0, 1, -1],
          [1, 2, 0],
        ],
        start: 0,
      },
      {
        n: 4,
        edges: [
          [0, 1, 4],
          [0, 2, 2],
          [1, 3, -10],
          [2, 3, 1],
        ],
        start: 0,
      },
    ],
    house: [
      { nums: [] },
      { nums: [0] },
      { nums: [2, 1, 1, 2] },
      { nums: [9, 0, 0, 9] },
    ],
    "interval-dp": [
      { dims: [1, 1] },
      { dims: [20, 20, 20] },
      { dims: [10, 1, 10, 1] },
    ],
    "tree-dp": [
      { tree: [] },
      { tree: [-1] },
      { tree: [5, 4, 4] },
      { tree: [0, -2, 3] },
    ],
  };
  if (!cases[id]) throw new Error("Missing authored boundaries: " + id);
  return structuredClone(cases[id]);
}

export function stressInput(id) {
  const nums = Array.from({ length: 20000 }, (_, i) => i % 1000);
  const tree = Array.from({ length: 127 }, (_, i) => i + 1);
  const chain = Array.from({ length: 39 }, (_, i) => [i, i + 1]);
  if (
    [
      "sum",
      "maximum",
      "count",
      "duplicate",
      "sort",
      "reverse-list",
      "temperatures",
    ].includes(id)
  )
    return {
      nums: id === "temperatures" ? nums.map((x) => x % 101) : nums,
      target: 37,
    };
  if (id === "two-sum") return { nums, target: 9999 };
  if (id === "list-cycle") return { nums, pos: 777 };
  if (id === "kadane") return { nums: nums.map((x) => x - 500) };
  if (id === "house") return { nums };
  if (id === "stock") return { prices: nums };
  if (id === "anagram")
    return { s: "abcde".repeat(4000), t: "edcba".repeat(4000) };
  if (["substring", "palindrome"].includes(id))
    return { s: "abcde".repeat(4000) };
  if (id === "replacement") return { s: "ABCDE".repeat(4000), k: 30 };
  if (id === "parentheses") return { s: "(".repeat(10000) + ")".repeat(10000) };
  if (id === "binary")
    return { nums: [...nums].sort((a, b) => a - b), target: 999 };
  if (id === "rotated")
    return {
      nums: Array.from({ length: 20000 }, (_, i) => (i + 7131) % 20000),
      target: 17000,
    };
  if (["merge-array", "merge-list"].includes(id))
    return {
      a: nums.slice(0, 10000).sort((a, b) => a - b),
      b: nums.slice(10000).sort((a, b) => a - b),
    };
  if (["window-sum", "window-max", "top-k"].includes(id))
    return { nums, k: 100 };
  if (id === "prefix") return { nums, queries: nums.map((_, i) => [0, i]) };
  if (id === "difference")
    return { nums, updates: nums.map((_, i) => [i, 19999, 1]) };
  if (id === "queue")
    return {
      ops: [
        ...nums.slice(0, 10000).map((x) => ["push", x]),
        ...nums.slice(0, 10000).map(() => ["pop"]),
      ],
    };
  if (id === "min-stack")
    return {
      ops: nums.flatMap((x, i) => (i % 2 ? [["min"]] : [["push", -x]])),
    };
  if (["depth", "invert", "diameter", "codec", "tree-dp"].includes(id))
    return { tree };
  if (id === "lca") return { tree, p: 126, q: 127 };
  if (id === "same-tree") return { p: tree, q: tree };
  if (id === "islands")
    return {
      grid: Array.from({ length: 40 }, (_, r) =>
        Array.from({ length: 40 }, (_, c) => (r + c) % 2),
      ),
    };
  if (id === "clone")
    return {
      adj: Array.from({ length: 40 }, (_, i) =>
        Array.from({ length: 40 }, (_, j) => j).filter((j) => j !== i),
      ),
    };
  if (["topo", "graph-cycle", "union-find"].includes(id))
    return { n: 40, edges: chain };
  if (["shortest", "bellman", "mst"].includes(id))
    return {
      n: 40,
      start: 0,
      edges: chain.map(([u, v]) => [
        u,
        v,
        id === "bellman" ? (u % 5) - 2 : u % 21,
      ]),
    };
  if (["lcs", "edit"].includes(id))
    return { a: "ab".repeat(30), b: "ba".repeat(30) };
  if (id === "knapsack")
    return {
      weights: Array.from({ length: 14 }, (_, i) => i + 1),
      values: Array.from({ length: 14 }, (_, i) => i * 3),
      capacity: 60,
    };
  if (id === "priority")
    return {
      tasks: nums.map((x, i) => ({ id: i, priority: x % 7, order: i })),
    };
  if (id === "xor")
    return {
      nums: [
        ...Array.from({ length: 10000 }, (_, i) => [i % 1000, i % 1000]).flat(),
        1000,
      ],
    };
  if (id === "three-sum")
    return { nums: Array.from({ length: 70 }, (_, i) => (i % 41) - 20) };
  if (id === "subsets")
    return { nums: Array.from({ length: 10 }, (_, i) => i) };
  if (id === "schedule")
    return { intervals: Array.from({ length: 70 }, (_, i) => [i, i + 2]) };
  if (id === "trie")
    return {
      words: Array.from({ length: 1000 }, (_, i) => "a".repeat((i % 30) + 1)),
      prefixes: ["a", "aa", "z", ""],
    };
  if (id === "lis")
    return { nums: Array.from({ length: 500 }, (_, i) => 500 - i) };
  if (id === "coin") return { coins: [1, 3, 7, 11, 20], amount: 200 };
  if (id === "interval-dp")
    return { dims: Array.from({ length: 10 }, (_, i) => (i % 20) + 1) };
  // Bounded problems use the upper boundary as their resource fixture.
  if (id === "add") return { a: 1000, b: 1000 };
  if (id === "parity") return { n: 1000 };
  if (id === "bad-version") return { n: 1000000, first: 999999 };
  if (id === "fib") return { n: 40 };
  if (id === "product") return { nums: Array(12).fill(3) };
  if (id === "nqueens") return { n: 8 };
  throw new Error("Missing stress input: " + id);
}
