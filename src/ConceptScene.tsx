import { useState, useId } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { Lesson } from "./types";

const stories: Record<string, [string, string[], string]> = {
  program: [
    "Một chiếc máy làm theo chỉ dẫn",
    [
      "Nhận hai giá trị a=3, b=5.",
      "Xử lý: cộng hai giá trị.",
      "Trả kết quả 8. Biến không tự tính lại khi đầu vào đổi.",
    ],
    "flow",
  ],
  condition: [
    "Một ngã rẽ, hai lựa chọn",
    [
      "Nhận số n=12.",
      "Kiểm tra n % 2 == 0.",
      "Đi theo nhánh đúng: 12 là số chẵn.",
    ],
    "flow",
  ],
  loop: [
    "Đi qua từng ô, chỉ một lần",
    [
      "Bắt đầu với tổng 0.",
      "Mỗi lượt đọc một ô rồi cập nhật tổng.",
      "Dừng trước chỉ số n; không bước ra ngoài dãy.",
    ],
    "array",
  ],
  function: [
    "Hàm là một công việc có đầu vào và kết quả",
    [
      "Đưa dữ liệu vào hàm.",
      "Biến cục bộ giúp thực hiện công việc.",
      "return gửi kết quả cho nơi gọi; print chỉ hiển thị.",
    ],
    "flow",
  ],
  array: [
    "Những cuốn sách có địa chỉ",
    [
      "Dãy có 5 ô; chỉ số bắt đầu từ 0.",
      "Chỉ số 2 là vị trí; 4 là giá trị ở vị trí đó.",
      "Chỉ số cuối là 4. Ô số 5 không tồn tại.",
    ],
    "array",
  ],
  hash: [
    "Ngăn tủ nhớ những gì đã gặp",
    [
      "Minh họa hash(key)=key%4: key 1 vào ngăn 1.",
      "Key 5 cũng vào ngăn 1: collision không có nghĩa hai key bằng nhau.",
      "Ngăn phải giữ cả hai key và kiểm tra đúng key khi tìm.",
    ],
    "hash",
  ],
  prefix: [
    "Đếm một lần, trả lời nhiều lần",
    [
      "Viết tổng tích lũy trước mỗi vị trí, bắt đầu bằng 0.",
      "Đoạn [1,3] gồm 1, 4 và 2.",
      "Lấy P[4]−P[1]=10−3=7; không cộng lại từng ô.",
    ],
    "prefix",
  ],
  stack: [
    "Chồng đĩa: chiếc trên cùng ra trước",
    [
      "Đã có đĩa 1 ở đáy.",
      "Push đĩa 2 lên đỉnh.",
      "Pop lấy đĩa 2; đĩa 1 vẫn ở đáy.",
    ],
    "stack",
  ],
  queue: [
    "Xếp hàng: ai đến trước ra trước",
    [
      "An đến trước Bình.",
      "Chi vào cuối hàng.",
      "Phục vụ An; Bình trở thành người đầu hàng.",
    ],
    "queue",
  ],
  linked: [
    "Các toa tàu nối bằng tham chiếu",
    [
      "A biết đường đi đến B; B biết đường đi đến C.",
      "Muốn đổi liên kết, giữ lại nơi sẽ đi tiếp.",
      "Đảo các đường nối: C → B → A → null.",
    ],
    "linked",
  ],
  floyd: [
    "Hai người chạy với hai tốc độ",
    [
      "Slow đi một liên kết, fast đi hai liên kết.",
      "Nếu gặp null thì đường nối không có vòng.",
      "Nếu có vòng, khoảng cách trong vòng sẽ thay đổi và hai người gặp nhau.",
    ],
    "graph",
  ],
  recursion: [
    "Giải việc nhỏ rồi quay lại",
    [
      "Giữ công việc hiện tại trong call stack.",
      "Gọi việc nhỏ hơn; dừng ở base case.",
      "Quay lại kết hợp kết quả; backtracking hoàn tác lựa chọn.",
    ],
    "tree",
  ],
  sorting: [
    "Đưa những tấm thẻ về đúng vị trí",
    [
      "Các thẻ chưa có thứ tự: 5, 2, 4, 1, 3.",
      "Insertion: giữ 2, dịch 5 sang phải rồi chèn 2.",
      "Khi hoàn thành, các thẻ tăng dần và giữ đủ phần tử trùng.",
    ],
    "bars",
  ],
  search: [
    "Tìm một cuốn sách trong dãy đã sắp",
    [
      "Chỉ áp dụng tìm kiếm nhị phân khi đoạn xét có thứ tự phù hợp.",
      "So mục tiêu với phần tử giữa để bỏ nửa không thể chứa nó.",
      "Đoạn còn lại nhỏ hơn; xác định rõ cập nhật left/right để luôn tiến.",
    ],
    "array",
  ],
  pointers: [
    "Hai đầu cùng tiến",
    [
      "L=0, R=4: hai chữ r giống nhau.",
      "L=1, R=3: hai chữ a giống nhau.",
      "Hai con trỏ gặp ở d: chuỗi radar đối xứng.",
    ],
    "pointers",
  ],
  window: [
    "Một khung cửa đi qua dữ liệu",
    [
      "Cửa sổ [0,2]: 2+1+5=8.",
      "Trượt sang [1,3]: bỏ 2, thêm 1 → 7.",
      "Trượt sang [2,4]: bỏ 1, thêm 3 → 9.",
    ],
    "window",
  ],
  tree: [
    "Một gốc, nhiều nhánh",
    [
      "Root nối đến hai cây con.",
      "DFS giải nhánh sâu; BFS dùng hàng đợi để đi theo tầng.",
      "Chiều cao tính số node; đường kính trong khóa tính số cạnh.",
    ],
    "tree",
  ],
  heap: [
    "Giữ người ưu tiên ở đỉnh",
    [
      "Heap không sắp toàn bộ dãy: chỉ cha ưu tiên hơn con.",
      "Phần tử mới đi lên nếu ưu tiên hơn cha.",
      "Lấy gốc: đưa phần tử cuối lên rồi sift-down để sửa invariant.",
    ],
    "tree",
  ],
  greedy: [
    "Chọn một việc rồi giữ chỗ cho việc sau",
    [
      "Các lịch [0,9), [1,2), [2,3) cùng cạnh tranh.",
      "Chọn lịch kết thúc sớm [1,2).",
      "Tiếp tục được [2,3): hai lịch tốt hơn chọn ngay lịch dài [0,9).",
    ],
    "interval",
  ],
  graph: [
    "Bản đồ có nhiều ngả",
    [
      "Node là địa điểm; edge là đường nối.",
      "Visited tránh xử lý lặp; frontier giữ nơi đang chờ.",
      "Muốn xét toàn bản đồ, bắt đầu lại ở thành phần chưa thăm.",
    ],
    "graph",
  ],
  topo: [
    "Có việc phải làm trước việc khác",
    [
      "Hai nhiệm vụ 0 và 1 chưa cần tiên quyết.",
      "Sau khi xử lý cả 0 và 1, nhiệm vụ 2 mới sẵn sàng.",
      "Nếu mọi việc còn lại đều chờ nhau thì tồn tại chu trình.",
    ],
    "graph",
  ],
  shortest: [
    "Đường ít cạnh chưa chắc có chi phí thấp",
    [
      "Từ 0 tới 1 trực tiếp tốn 4.",
      "Đi từ 0 tới 2 tốn 1.",
      "Đi tiếp 2 → 1 tốn 2: tổng 3 tốt hơn 4. Dijkstra cần trọng số không âm.",
    ],
    "weighted",
  ],
  dp: [
    "Mỗi ô là một câu hỏi nhỏ",
    [
      "Xác định ô đang trả lời bài toán con nào.",
      "Đọc các ô phụ thuộc đã có kết quả.",
      "Lưu kết quả để lần sau dùng lại; đừng chọn công thức trước khi hiểu state.",
    ],
    "grid",
  ],
  bit: [
    "Những công tắc chỉ có hai trạng thái",
    [
      "0 là tắt, 1 là bật; mỗi vị trí có trọng số 2ᵏ.",
      "XOR với 1 đảo bit; XOR với 0 giữ nguyên.",
      "Đảo hai lần trở lại ban đầu: x XOR x = 0.",
    ],
    "bits",
  ],
  trie: [
    "Những từ chung đường đi",
    [
      "app và apple dùng chung đường a → p → p.",
      "Qua tiền tố app chưa có nghĩa mọi từ đều kết thúc ở đây.",
      "Đếm từ đi qua node để trả lời có bao nhiêu từ bắt đầu bằng tiền tố.",
    ],
    "tree",
  ],
  dsu: [
    "Nhập các nhóm mà không nối lại mọi người",
    [
      "Ban đầu mỗi người thuộc nhóm riêng.",
      "Union nối đại diện của hai nhóm.",
      "Find tìm đại diện; path compression giúp lần sau đi nhanh hơn.",
    ],
    "graph",
  ],
  advanced: [
    "Giải theo từng đoạn hoặc cây con",
    [
      "State chỉ rõ đoạn [i,j] hoặc cây con đang xét.",
      "Thử cách chia; đọc kết quả của các đoạn/cây nhỏ.",
      "Kết hợp và lưu lựa chọn tốt nhất; base case phải rõ.",
    ],
    "grid",
  ],
  complexity: [
    "Dữ liệu tăng, công việc tăng ra sao?",
    [
      "So số thao tác khi kích thước đầu vào n tăng.",
      "Duyệt một lần tăng tuyến tính; hai vòng đầy đủ thường tăng theo n².",
      "Đây là mô hình số thao tác, không phải đo giây hay suy Big-O từ tốc độ máy.",
    ],
    "complexity",
  ],
};
export default function ConceptScene({
  lesson,
  complexity = false,
}: {
  lesson: Lesson;
  complexity?: boolean;
}) {
  const [step, setStep] = useState(0),
    [n, setN] = useState(16);
  const reduced = useReducedMotion();
  const [title, captions, diagramKind] =
    stories[complexity ? "complexity" : lesson.pack] ?? stories.array;
  const kind = !complexity && lesson.pack === "trie" ? "trie" : diagramKind;
  const marker = "concept-" + useId().replaceAll(":", "");
  const color = "#58b900",
    ink = "#315139",
    muted = "#b8c9b0";
  const box = (
    x: number,
    y: number,
    value: string,
    i: number,
    selected = false,
  ) => (
    <g key={x + "-" + y}>
      <rect
        x={x}
        y={y}
        width={78}
        height={65}
        rx={14}
        fill={selected ? "#e4f5d6" : "#fff"}
        stroke={selected ? color : muted}
        strokeWidth={3}
      />
      <text
        x={x + 39}
        y={y + 39}
        textAnchor="middle"
        fill={ink}
        fontWeight={800}
        fontSize={23}
      >
        {value}
      </text>
      <text x={x + 39} y={y + 88} textAnchor="middle" fill={ink} fontSize={14}>
        {i}
      </text>
    </g>
  );
  const link = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    key: number,
    directed = true,
  ) => (
    <path
      key={key}
      d={`M${x1} ${y1} L${x2} ${y2}`}
      fill="none"
      stroke={muted}
      strokeWidth={4}
      markerEnd={directed ? `url(#${marker})` : undefined}
    />
  );
  return (
    <figure className="concept-scene">
      <div className="concept-heading">
        <span>NHÌN MỘT LẦN, HIỂU MỘT Ý</span>
        <strong>{title}</strong>
      </div>
      <motion.svg
        viewBox="0 0 720 270"
        role="img"
        aria-label={title + ". " + captions[step]}
        initial={false}
        animate={{ opacity: 1 }}
        className="concept-svg"
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
            <path d="M0 0 10 5 0 10" fill={muted} />
          </marker>
        </defs>
        <path d="M45 230H675" stroke="#dfead8" strokeWidth={2} />
        {kind === "flow" && (
          <>
            {["Đầu vào", "Xử lý", "Kết quả"].map((name, i) => (
              <g key={name}>
                {i > 0 && link(205 + (i - 1) * 215, 125, 27 + i * 215, 125, i)}
                <rect
                  x={35 + i * 215}
                  y={75}
                  width={160}
                  height={100}
                  rx={22}
                  fill={i === step ? "#e4f5d6" : "white"}
                  stroke={i === step ? color : muted}
                  strokeWidth={3}
                />
                <text
                  x={115 + i * 215}
                  y={108}
                  textAnchor="middle"
                  fill={ink}
                  fontSize={16}
                >
                  {name}
                </text>
                <text
                  x={115 + i * 215}
                  y={148}
                  textAnchor="middle"
                  fill={ink}
                  fontWeight={900}
                  fontSize={25}
                >
                  {lesson.pack === "condition"
                    ? ["12", "% 2", "true"][i]
                    : i === 0
                      ? "3, 5"
                      : i === 1
                        ? "+"
                        : "8"}
                </text>
              </g>
            ))}
          </>
        )}
        {["array", "pointers", "window", "prefix"].includes(kind) && (
          <>
            {(kind === "pointers"
              ? ["r", "a", "d", "a", "r"]
              : kind === "window"
                ? ["2", "1", "5", "1", "3"]
                : kind === "prefix"
                  ? ["3", "1", "4", "2", "5"]
                  : ["5", "2", "4", "1", "3"]
            ).map((v, i) =>
              box(
                106 + i * 100,
                kind === "prefix" ? 36 : 88,
                v,
                i,
                kind === "window"
                  ? i >= step && i <= step + 2
                  : kind === "pointers"
                    ? i === step || i === 4 - step
                    : i === step,
              ),
            )}
            {kind === "pointers" && (
              <>
                <text
                  x={145 + step * 100}
                  y={62}
                  textAnchor="middle"
                  fill={color}
                  fontWeight={900}
                >
                  L
                </text>
                <text
                  x={145 + (4 - step) * 100}
                  y={62}
                  textAnchor="middle"
                  fill={color}
                  fontWeight={900}
                >
                  R
                </text>
              </>
            )}
            {kind === "window" && (
              <rect
                x={102 + step * 100}
                y={80}
                width={286}
                height={84}
                rx={18}
                fill="none"
                stroke={color}
                strokeWidth={4}
              />
            )}
            {kind === "prefix" && (
              <>
                {[0, 3, 4, 8, 10, 15].map((v, i) => (
                  <g key={i}>
                    <rect
                      x={58 + i * 100}
                      y={164}
                      width={78}
                      height={49}
                      rx={10}
                      fill={i === 1 || i === 4 ? "#e4f5d6" : "#eff3eb"}
                    />
                    <text
                      x={97 + i * 100}
                      y={195}
                      textAnchor="middle"
                      fill={ink}
                      fontWeight={800}
                      fontSize={21}
                    >
                      {v}
                    </text>
                  </g>
                ))}
              </>
            )}
          </>
        )}
        {kind === "bars" && (
          <>
            {(step === 0
              ? [5, 2, 4, 1, 3]
              : step === 1
                ? [2, 5, 4, 1, 3]
                : [1, 2, 3, 4, 5]
            ).map((v, i) => (
              <motion.g key={i} animate={reduced ? {} : { y: 0 }}>
                <motion.rect
                  x={120 + i * 100}
                  width={60}
                  rx={9}
                  fill={i === step ? color : "#c9e8b9"}
                  animate={{ y: 220 - v * 30, height: v * 30 }}
                  transition={{ duration: reduced ? 0 : 0.35 }}
                />
                <text
                  x={150 + i * 100}
                  y={205 - v * 30}
                  textAnchor="middle"
                  fill={ink}
                  fontSize={24}
                  fontWeight={900}
                >
                  {v}
                </text>
              </motion.g>
            ))}
          </>
        )}
        {kind === "stack" && (
          <>
            {(step === 1 ? [1, 2] : [1]).map((v, i) => (
              <g key={v}>
                <ellipse
                  cx={360}
                  cy={183 - i * 50}
                  rx={105}
                  ry={28}
                  fill={i === 1 ? color : "#c9e8b9"}
                  stroke={ink}
                  strokeWidth={2}
                />
                <path
                  d={`M260 ${188 - i * 50} Q360 ${235 - i * 50} 460 ${188 - i * 50}`}
                  fill="none"
                  stroke={ink}
                  strokeWidth={3}
                />
                <text
                  x={360}
                  y={188 - i * 50}
                  textAnchor="middle"
                  fill={ink}
                  fontSize={23}
                  fontWeight={800}
                >
                  Đĩa {v}
                </text>
              </g>
            ))}
            <text x={510} y={step === 1 ? 138 : 188} fill={ink} fontSize={19}>
              ← TOP
            </text>
          </>
        )}
        {kind === "queue" && (
          <>
            {(step === 0
              ? ["An", "Bình"]
              : step === 1
                ? ["An", "Bình", "Chi"]
                : ["Bình", "Chi"]
            ).map((v, i) => (
              <g key={v}>
                <circle
                  cx={205 + i * 140}
                  cy={80}
                  r={25}
                  fill={i === 0 ? color : "#c9e8b9"}
                />
                <rect
                  x={169 + i * 140}
                  y={110}
                  width={72}
                  height={82}
                  rx={22}
                  fill={i === 0 ? color : "#c9e8b9"}
                />
                <text
                  x={205 + i * 140}
                  y={224}
                  textAnchor="middle"
                  fill={ink}
                  fontWeight={800}
                  fontSize={21}
                >
                  {v}
                </text>
              </g>
            ))}
            <text x={45} y={135} fill={ink} fontSize={18}>
              FRONT ←
            </text>
            <text x={560} y={135} fill={ink} fontSize={18}>
              ← thêm
            </text>
          </>
        )}
        {kind === "linked" && (
          <>
            {["A", "B", "C"].map((v, i) =>
              box(145 + i * 165, 96, v, i, i === step),
            )}
            {[0, 1].map((i) =>
              step === 2
                ? link(310 + i * 165, 125, 238 + i * 165, 125, i)
                : link(235 + i * 165, 125, 298 + i * 165, 125, i),
            )}
            <text
              x={step === 2 ? 510 : 180}
              y={63}
              fill={color}
              fontWeight={900}
            >
              HEAD
            </text>
            <text x={step === 2 ? 65 : 647} y={138} fill={ink}>
              null
            </text>
          </>
        )}
        {kind === "hash" && (
          <>
            {[0, 1, 2, 3].map((i) => (
              <g key={i}>
                <rect
                  x={100 + i * 150}
                  y={95}
                  width={110}
                  height={95}
                  rx={15}
                  fill={i === 1 ? "#e4f5d6" : "white"}
                  stroke={muted}
                  strokeWidth={3}
                />
                <text
                  x={155 + i * 150}
                  y={79}
                  textAnchor="middle"
                  fill={ink}
                  fontSize={15}
                >
                  bucket {i}
                </text>
                <text
                  x={155 + i * 150}
                  y={147}
                  textAnchor="middle"
                  fill={ink}
                  fontWeight={900}
                  fontSize={24}
                >
                  {i === 1
                    ? step === 0
                      ? "1"
                      : "1 → 5"
                    : i === 2 && step === 2
                      ? "2"
                      : "∅"}
                </text>
              </g>
            ))}
          </>
        )}
        {["tree", "graph", "weighted"].includes(kind) && (
          <>
            {(kind === "tree"
              ? [
                  [360, 53],
                  [220, 135],
                  [500, 135],
                  [140, 210],
                  [295, 210],
                  [440, 210],
                  [570, 210],
                ]
              : [
                  [170, 140],
                  [525, 65],
                  [525, 210],
                ]
            ).map(([x, y], i) => (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r={27}
                  fill={i === step ? color : "white"}
                  stroke={muted}
                  strokeWidth={3}
                />
                <text
                  x={x}
                  y={y + 7}
                  textAnchor="middle"
                  fill={i === step ? "white" : ink}
                  fontSize={23}
                  fontWeight={900}
                >
                  {i}
                </text>
              </g>
            ))}
            {kind === "tree"
              ? [
                  [360, 80, 220, 108],
                  [360, 80, 500, 108],
                  [220, 162, 140, 183],
                  [220, 162, 295, 183],
                  [500, 162, 440, 183],
                  [500, 162, 570, 183],
                ].map(([a, b, c, d], i) => link(a, b, c, d, i, false))
              : lesson.pack === "topo"
                ? [link(197, 150, 498, 200, 1), link(525, 93, 525, 183, 2)]
                : [
                    link(197, 132, 498, 76, 0, kind === "weighted"),
                    link(197, 150, 498, 200, 1, kind === "weighted"),
                    link(525, 183, 525, 93, 2, kind === "weighted"),
                  ]}
            {kind === "weighted" && (
              <>
                <text x={345} y={92} fill={ink} fontSize={21}>
                  4
                </text>
                <text x={345} y={197} fill={ink} fontSize={21}>
                  1
                </text>
                <text x={546} y={143} fill={ink} fontSize={21}>
                  2
                </text>
              </>
            )}
          </>
        )}
        {kind === "grid" && (
          <>
            {Array.from({ length: 16 }, (_, i) => {
              const x = 215 + (i % 4) * 75,
                y = 25 + Math.floor(i / 4) * 57;
              return (
                <g key={i}>
                  <rect
                    x={x}
                    y={y}
                    width={66}
                    height={48}
                    rx={8}
                    fill={
                      i === 10
                        ? color
                        : [5, 6, 9].includes(i)
                          ? "#ddf1cf"
                          : "white"
                    }
                    stroke={muted}
                    strokeWidth={2}
                  />
                  <text
                    x={x + 33}
                    y={y + 29}
                    textAnchor="middle"
                    fill={i === 10 ? "white" : ink}
                    fontSize={15}
                  >
                    {i === 10
                      ? "state"
                      : [5, 6, 9].includes(i)
                        ? "đã biết"
                        : "·"}
                  </text>
                </g>
              );
            })}
          </>
        )}
        {kind === "trie" && (
          <>
            {[
              [300, 30, "∅"],
              [215, 83, "a"],
              [215, 136, "p"],
              [215, 189, "p"],
              [295, 220, "l"],
              [365, 220, "e"],
              [485, 83, "b"],
              [485, 136, "a"],
              [485, 189, "t"],
            ].map(([x, y, v], i) => (
              <g key={i}>
                <circle
                  cx={Number(x)}
                  cy={Number(y)}
                  r={19}
                  fill={i === step + 1 ? color : "white"}
                  stroke={muted}
                  strokeWidth={2}
                />
                <text
                  x={Number(x)}
                  y={Number(y) + 6}
                  textAnchor="middle"
                  fill={ink}
                  fontWeight={900}
                  fontSize={18}
                >
                  {v}
                </text>
              </g>
            ))}
            {[
              [281, 41, 227, 68],
              [318, 41, 473, 68],
              [215, 103, 215, 116],
              [215, 156, 215, 169],
              [232, 200, 278, 213],
              [315, 220, 345, 220],
              [485, 103, 485, 116],
              [485, 156, 485, 169],
            ].map(([a, b, c, d], i) => link(a, b, c, d, i, false))}
          </>
        )}
        {kind === "bits" && (
          <>
            {[0, 0, 1, step === 1 ? 0 : 1, 0, 1].map((v, i) => (
              <g key={i}>
                <rect
                  x={96 + i * 90}
                  y={87}
                  width={72}
                  height={79}
                  rx={18}
                  fill={v ? color : "#edf1e9"}
                  stroke={muted}
                  strokeWidth={2}
                />
                <text
                  x={132 + i * 90}
                  y={137}
                  textAnchor="middle"
                  fill={v ? "white" : ink}
                  fontSize={32}
                  fontWeight={900}
                >
                  {v}
                </text>
                <text
                  x={132 + i * 90}
                  y={202}
                  textAnchor="middle"
                  fill={ink}
                  fontSize={18}
                >
                  2^{5 - i}
                </text>
              </g>
            ))}
          </>
        )}
        {kind === "interval" && (
          <>
            {[
              [0, 9],
              [1, 2],
              [2, 3],
            ].map(([s, e], i) => (
              <g key={i}>
                <rect
                  x={100 + s * 55}
                  y={40 + i * 64}
                  width={(e - s) * 55}
                  height={38}
                  rx={9}
                  fill={i === 0 ? "#e4e9de" : color}
                />
                <text
                  x={110 + s * 55}
                  y={66 + i * 64}
                  fill={ink}
                  fontSize={17}
                >{`[${s},${e})`}</text>
              </g>
            ))}
          </>
        )}
        {kind === "complexity" && (
          <>
            <path
              d="M85 20V225H680"
              fill="none"
              stroke={muted}
              strokeWidth={2}
            />
            {[
              ["n²", "#315139", (x: number) => x * x],
              ["n", color, (x: number) => x],
              ["log₂n", "#96ad86", (x: number) => Math.log2(Math.max(1, x))],
            ].map(([label, c, fn]) => (
              <polyline
                key={String(label)}
                fill="none"
                stroke={String(c)}
                strokeWidth={4}
                points={Array.from(
                  { length: 32 },
                  (_, i) =>
                    `${85 + i * 18},${225 - ((fn as (x: number) => number)(i + 1) / 1024) * 195}`,
                ).join(" ")}
              />
            ))}
            <text x={640} y={49} fill={ink} fontSize={21}>
              n²
            </text>
            <text x={627} y={207} fill={color} fontSize={21}>
              n
            </text>
            <text x={88} y={253} fill={ink} fontSize={17}>
              n=1
            </text>
            <text x={604} y={253} fill={ink} fontSize={17}>
              n=32
            </text>
            <line
              x1={85 + (n - 1) * 18}
              x2={85 + (n - 1) * 18}
              y1={22}
              y2={225}
              stroke="#ffc800"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          </>
        )}
      </motion.svg>
      {kind === "complexity" ? (
        <div className="growth-controls">
          <label>
            Thay kích thước n: <b>{n}</b>
            <input
              type="range"
              min={1}
              max={32}
              value={n}
              onChange={(e) => setN(Number(e.target.value))}
            />
          </label>
          <output aria-live="polite">
            1 thao tác · log₂n ≈ {Math.log2(n).toFixed(1)} · n = {n} · n² ={" "}
            {n * n}
          </output>
        </div>
      ) : (
        <div className="scene-tabs" aria-label="Các bước minh họa">
          {["Nhìn", "Thử", "Ghi nhớ"].map((s, i) => (
            <button
              key={s}
              aria-pressed={step === i}
              onClick={() => setStep(i)}
            >
              {i + 1}. {s}
            </button>
          ))}
        </div>
      )}
      <figcaption aria-live="polite">{captions[step]}</figcaption>
    </figure>
  );
}
