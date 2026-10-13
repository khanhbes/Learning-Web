import { generateInput, oracle, checkOutput, problems } from "./problems.mjs";
import { traceFor } from "../shared/traces.mjs";
import { shuffle, random } from "../shared/random.mjs";
import { debugExercises } from "./debug-exercises.mjs";
const vocabulary = {
  program: [
    ["Biến", "Tên gắn với một giá trị"],
    ["Phép gán", "Thay giá trị gắn với tên"],
    ["Kiểu dữ liệu", "Quy tắc biểu diễn và xử lý giá trị"],
  ],
  condition: [
    ["Điều kiện", "Biểu thức cho true hoặc false"],
    ["Nhánh if", "Chạy khi điều kiện đúng"],
    ["Nhánh else", "Chạy khi điều kiện sai"],
  ],
  loop: [
    ["Vòng lặp", "Lặp lại công việc có quy tắc"],
    ["Biến điều khiển", "Giúp vòng lặp tiến tới điểm dừng"],
    ["Accumulator", "Giữ kết quả tích lũy"],
  ],
  function: [
    ["Parameter", "Tên nhận đầu vào của hàm"],
    ["Return", "Gửi kết quả về nơi gọi"],
    ["Local variable", "Biến thuộc lời gọi hàm hiện tại"],
  ],
  complexity: [
    ["O", "Chặn trên của tốc độ tăng"],
    ["Ω", "Chặn dưới của tốc độ tăng"],
    ["Θ", "Chặn chặt của tốc độ tăng"],
  ],
  array: [
    ["Index", "Vị trí của phần tử"],
    ["Value", "Dữ liệu tại một vị trí"],
    ["Length", "Số phần tử của dãy"],
  ],
  prefix: [
    ["P[0]", "Tổng tiền tố rỗng bằng 0"],
    ["P[i+1]", "Tổng từ đầu đến chỉ số i"],
    ["P[r+1]−P[l]", "Tổng đoạn đóng từ l đến r"],
  ],
  linked: [
    ["Node", "Đơn vị giữ dữ liệu và liên kết"],
    ["Next", "Tham chiếu tới node tiếp theo"],
    ["Head", "Node đầu danh sách"],
  ],
  floyd: [
    ["Slow", "Mỗi lượt đi một liên kết"],
    ["Fast", "Mỗi lượt đi hai liên kết"],
    ["Cycle", "Đường nối quay về node đã đi qua"],
  ],
  recursion: [
    ["Base case", "Điểm dừng không gọi tiếp"],
    ["Call stack", "Các lời gọi chưa hoàn tất"],
    ["Backtracking", "Thử lựa chọn rồi hoàn tác"],
  ],
  sorting: [
    ["Stable", "Giữ thứ tự tương đối của khóa bằng nhau"],
    ["Pivot", "Mốc để chia vùng trong Quick Sort"],
    ["Merge", "Trộn hai dãy đã có thứ tự"],
  ],
  search: [
    ["Left/right", "Ranh giới đoạn còn xét"],
    ["Mid", "Chỉ số giữa đoạn"],
    ["Predicate", "Điều kiện đúng hoặc sai cần kiểm tra"],
  ],
  pointers: [
    ["Left", "Con trỏ ở phía trái"],
    ["Right", "Con trỏ ở phía phải"],
    ["Invariant", "Điều luôn được giữ khi con trỏ tiến"],
  ],
  window: [
    ["Window", "Một đoạn liên tiếp đang xét"],
    ["Expand", "Thêm phần tử ở phía phải"],
    ["Shrink", "Bỏ phần tử ở phía trái"],
  ],
  heap: [
    ["Root", "Phần tử có ưu tiên cao nhất"],
    ["Sift-up", "Đưa phần tử mới lên đúng vị trí"],
    ["Sift-down", "Sửa thứ tự heap khi thay gốc"],
  ],
  greedy: [
    ["Greedy choice", "Lựa chọn cục bộ theo quy tắc"],
    ["Counterexample", "Trường hợp làm một cách chọn sai"],
    ["Exchange argument", "Đổi lựa chọn để chứng minh không kém"],
  ],
  topo: [
    ["Indegree", "Số cạnh đi vào node"],
    ["DAG", "Đồ thị có hướng không có chu trình"],
    ["Topological order", "Mọi tiên quyết đứng trước việc phụ thuộc"],
  ],
  shortest: [
    ["Distance", "Chi phí đường tốt nhất đang biết"],
    ["Relax", "Cải thiện một khoảng cách qua cạnh"],
    ["Priority queue", "Lấy khoảng cách nhỏ nhất tiếp theo"],
  ],
  bit: [
    ["AND (&)", "Bit 1 khi cả hai bit là 1"],
    ["OR (|)", "Bit 1 khi ít nhất một bit là 1"],
    ["XOR (^)", "Bit 1 khi hai bit khác nhau"],
  ],
  trie: [
    ["Prefix", "Phần đầu của một từ"],
    ["Edge", "Một ký tự dẫn tới node tiếp"],
    ["Root", "Đại diện tiền tố rỗng"],
  ],
  dsu: [
    ["Find", "Tìm đại diện một tập"],
    ["Union", "Nhập hai tập khác nhau"],
    ["Path compression", "Rút ngắn đường tới đại diện"],
  ],
  stack: [
    ["Push", "Thêm ở đỉnh"],
    ["Pop", "Lấy khỏi đỉnh"],
    ["LIFO", "Vào sau, ra trước"],
  ],
  queue: [
    ["Enqueue", "Thêm ở cuối"],
    ["Dequeue", "Lấy ở đầu"],
    ["FIFO", "Vào trước, ra trước"],
  ],
  hash: [
    ["Key", "Khóa dùng để tìm"],
    ["Value", "Dữ liệu đi cùng khóa"],
    ["Collision", "Hai khóa cùng bucket"],
  ],
  tree: [
    ["Root", "Node gốc"],
    ["Leaf", "Node không có con"],
    ["Edge", "Đường nối hai node"],
  ],
  dp: [
    ["State", "Một bài toán con"],
    ["Transition", "Cách kết hợp kết quả nhỏ"],
    ["Base case", "Kết quả đã biết để bắt đầu"],
  ],
  graph: [
    ["Visited", "Node đã được đánh dấu"],
    ["Frontier", "Node đang chờ xử lý"],
    ["Component", "Một nhóm node liên thông"],
  ],
};
export function createLab(lesson, seed) {
  const rng = random(seed + ":lab"),
    pid = lesson.problemIds[0],
    input = generateInput(pid, seed + ":hands-on");
  const trace = traceFor(pid, input, {
      variant: lesson.id === 39 ? "components-bfs" : "insertion",
    }),
    unique = trace.frames.filter(
      (f, i, a) => a.findIndex((x) => x.caption === f.caption) === i,
    );
  const indices = [
    0,
    Math.floor((unique.length - 1) / 2),
    unique.length - 1,
  ].filter((v, i, a) => a.indexOf(v) === i);
  const steps = indices.map((i, k) => ({
    id: "step-" + k,
    text: unique[i].caption,
  }));
  const pack = lesson.pack === "advanced" ? "dp" : lesson.pack;
  const pairs = (
    vocabulary[pack] ?? [
      ["Input", "Dữ liệu nhận vào"],
      ["Process", "Các bước xử lý"],
      ["Output", "Kết quả trả về"],
    ]
  ).map(([left, right], i) => ({ id: "pair-" + i, left, right }));
  const bug = debugExercises[Math.floor(rng() * debugExercises.length)];
  return {
    version: 1,
    responses: {},
    questions: [
      {
        id: "order",
        kind: "order",
        title: "Xếp hành trình thuật toán",
        prompt:
          "Đưa các bước sau về đúng thứ tự xảy ra. Dùng kéo thả hoặc nút lên/xuống.",
        items: shuffle(steps, rng),
        answer: steps.map((s) => s.id),
        explanation:
          "Đọc đầu vào → xử lý các bước → trả kết quả. Mô phỏng cho thấy thứ tự này.",
      },
      {
        id: "match",
        kind: "match",
        title: "Ghép để nhớ",
        prompt: "Nối mỗi thuật ngữ với ý nghĩa của nó.",
        pairs: pairs.map(({ id, left }) => ({ id, left })),
        options: shuffle(
          pairs.map(({ id, right }) => ({ id, text: right })),
          rng,
        ),
        answer: Object.fromEntries(pairs.map((p) => [p.id, p.id])),
        explanation: pairs.map((p) => p.left + " = " + p.right).join(" · "),
      },
      {
        id: "output",
        kind: "output",
        title: "Bạn là máy tính",
        prompt:
          "Chạy tay " +
          problems[pid].title +
          ". Nhập kết quả theo JSON; mọi nghiệm hợp lệ đều được chấp nhận.",
        input,
        problemId: pid,
        answer: oracle(pid, input),
        explanation:
          "Đối chiếu trạng thái trong mô phỏng; kết quả chuẩn: " +
          JSON.stringify(oracle(pid, input)),
      },
      {
        id: "debug",
        kind: "choice",
        title: "Tìm lỗi trước khi chạy",
        ...bug,
        options: shuffle(bug.options, rng),
      },
    ],
  };
}
export function publicLab(lab) {
  if (!lab) return null;
  return {
    ...lab,
    questions: lab.questions.map(({ answer, explanation, ...q }) => q),
  };
}
export function checkLab(q, value) {
  if (q.kind === "output") {
    try {
      const got = JSON.parse(String(value));
      return checkOutput(q.problemId, q.input, got);
    } catch {
      return false;
    }
  }
  if (q.kind === "match")
    return (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(q.answer).every((k) => value[k] === q.answer[k]) &&
      Object.keys(value).length === Object.keys(q.answer).length
    );
  if (q.kind === "order")
    return (
      Array.isArray(value) && JSON.stringify(value) === JSON.stringify(q.answer)
    );
  return value === q.answer;
}
