import { random, int, shuffle } from "../shared/random.mjs";
import { learningGuide } from "./teaching.mjs";
import { edgeInputs, stressInput } from "./fixtures.mjs";
export const LEGACY_VERSION = "2026.10.12-v1";
export const VERSION = "2026.10.13-v2";
const defs = [
  [
    "window-max",
    "Giá trị lớn nhất từng cửa sổ",
    "Trả mảng giá trị lớn nhất của từng đoạn liên tiếp dài k, theo thứ tự từ trái sang phải.",
    '{"nums":[1,3,-1,-3,5,3,6,7],"k":3}',
    "[3,3,5,5,6,7]",
    "1≤k≤n≤20000; số nguyên; giữ đủ các cửa sổ kể cả khi kết quả trùng.",
    "queue",
  ],
  [
    "add",
    "Cộng hai số",
    "Trả về a + b.",
    '{"a":3,"b":5}',
    "8",
    "a,b là số nguyên trong [-1000,1000].",
    "arithmetic",
  ],
  [
    "parity",
    "Chẵn hay lẻ?",
    "Trả về true nếu n chẵn, ngược lại false.",
    '{"n":12}',
    "true",
    "n ∈ [-1000,1000].",
    "condition",
  ],
  [
    "sum",
    "Tổng một dãy",
    "Trả về tổng tất cả phần tử nums. Mảng rỗng có tổng 0.",
    '{"nums":[2,3,5]}',
    "10",
    "0 ≤ n ≤ 20000; |nums[i]| ≤ 1000.",
    "array",
  ],
  [
    "maximum",
    "Tìm phần tử lớn nhất",
    "Trả về giá trị lớn nhất trong nums.",
    '{"nums":[-2,5,3]}',
    "5",
    "1 ≤ n ≤ 20000; |nums[i]| ≤ 1000.",
    "array",
  ],
  [
    "count",
    "Đếm mục tiêu",
    "Đếm số lần target xuất hiện trong nums.",
    '{"nums":[2,3,2],"target":2}',
    "2",
    "0 ≤ n ≤ 20000; số nguyên.",
    "array",
  ],
  [
    "two-sum",
    "Two Sum",
    "Trả về hai chỉ số khác nhau có tổng bằng target; chấp nhận bất kỳ cặp đúng, bất kỳ thứ tự. Không có cặp: [].",
    '{"nums":[2,7,11,15],"target":9}',
    "[0,1]",
    "0 ≤ n ≤ 20000; chỉ số từ 0; có thể nhiều nghiệm.",
    "hash",
  ],
  [
    "stock",
    "Best Time to Buy & Sell Stock",
    "Mua một lần rồi bán ở ngày sau. Trả lợi nhuận lớn nhất, hoặc 0 nếu không có lợi nhuận.",
    '{"prices":[7,1,5,3,6,4]}',
    "5",
    "0 ≤ n ≤ 20000; prices[i] ∈ [0,1000].",
    "greedy",
  ],
  [
    "duplicate",
    "Contains Duplicate",
    "Trả true nếu có ít nhất hai phần tử bằng nhau.",
    '{"nums":[1,2,3,1]}',
    "true",
    "0 ≤ n ≤ 20000.",
    "hash",
  ],
  [
    "product",
    "Product of Array Except Self",
    "Trả mảng tích mọi phần tử ngoại trừ phần tử tại chỉ số đó. Không dùng phép chia trong lời giải chuẩn.",
    '{"nums":[1,2,3,4]}',
    "[24,12,8,6]",
    "0 ≤ n ≤ 12; phần tử ∈ [-3,3]; tích mảng rỗng = 1. Bộ chấm kiểm tra kết quả, không xác nhận có dùng phép chia.",
    "prefix",
  ],
  [
    "kadane",
    "Maximum Subarray",
    "Trả tổng lớn nhất của một mảng con liên tiếp không rỗng.",
    '{"nums":[-2,1,-3,4,-1,2,1,-5,4]}',
    "6",
    "1 ≤ n ≤ 20000; |nums[i]| ≤ 1000.",
    "dp",
  ],
  [
    "merge-array",
    "Merge Sorted Arrays",
    "Trả mảng đã trộn tăng dần từ a và b. Giữ đủ số lần xuất hiện.",
    '{"a":[1,2,4],"b":[1,3,4]}',
    "[1,1,2,3,4,4]",
    "a,b tăng không giảm; mỗi mảng dài ≤10000. Bài này trả mảng mới; bài học cũng giải thích biến thể in-place.",
    "sorting",
  ],
  [
    "anagram",
    "Valid Anagram",
    "Trả true nếu hai chuỗi có cùng tần suất ký tự.",
    '{"s":"listen","t":"silent"}',
    "true",
    "s,t chỉ gồm a–z; độ dài ≤20000.",
    "hash",
  ],
  [
    "substring",
    "Longest Substring Without Repeating Characters",
    "Trả độ dài chuỗi con liên tiếp dài nhất không lặp ký tự.",
    '{"s":"abcabcbb"}',
    "3",
    "s gồm a–z, độ dài ≤20000.",
    "window",
  ],
  [
    "replacement",
    "Longest Repeating Character Replacement",
    "Đổi tối đa k ký tự để một chuỗi con liên tiếp chỉ gồm cùng một chữ. Trả độ dài lớn nhất.",
    '{"s":"AABABBA","k":1}',
    "4",
    "s gồm A–Z; độ dài ≤20000; 0 ≤ k ≤ độ dài.",
    "window",
  ],
  [
    "binary",
    "Binary Search",
    "Trả chỉ số bất kỳ có giá trị target, hoặc -1 nếu không có.",
    '{"nums":[-1,0,3,5,9,12],"target":9}',
    "4",
    "nums tăng không giảm, dài ≤20000; có thể trùng.",
    "search",
  ],
  [
    "rotated",
    "Search in Rotated Sorted Array",
    "Trả chỉ số target hoặc -1 trong mảng tăng bị xoay.",
    '{"nums":[4,5,6,7,0,1,2],"target":0}',
    "4",
    "Các giá trị khác nhau; độ dài ≤20000.",
    "search",
  ],
  [
    "bad-version",
    "First Bad Version",
    "Các phiên bản từ 1 đến n; mọi bản từ first trở đi đều lỗi. Trả bản lỗi đầu tiên.",
    '{"n":5,"first":4}',
    "4",
    "1 ≤ first ≤ n ≤ 1000000. Harness cung cấp is_bad(v) / isBad(v); field first chỉ dùng tạo fixture.",
    "search",
  ],
  [
    "reverse-list",
    "Reverse Linked List",
    "Đảo danh sách và trả dãy giá trị từ head mới.",
    '{"nums":[1,2,3,4,5]}',
    "[5,4,3,2,1]",
    "0 ≤ n ≤ 20000; dạng JSON biểu diễn các node.",
    "linked",
  ],
  [
    "merge-list",
    "Merge Two Sorted Lists",
    "Trộn hai danh sách tăng dần, trả dãy giá trị kết quả.",
    '{"a":[1,2,4],"b":[1,3,4]}',
    "[1,1,2,3,4,4]",
    "Mỗi danh sách dài ≤10000, tăng không giảm.",
    "linked",
  ],
  [
    "list-cycle",
    "Linked List Cycle",
    "Node cuối nối về chỉ số pos, hoặc NULL nếu pos=-1. Trả true nếu danh sách có chu trình.",
    '{"nums":[3,2,0,-4],"pos":1}',
    "true",
    "0 ≤ n ≤ 20000; pos=-1 hoặc chỉ số hợp lệ.",
    "linked",
  ],
  [
    "parentheses",
    "Valid Parentheses",
    "Chuỗi ngoặc (), [], {} phải khớp đúng loại và thứ tự. Chuỗi rỗng hợp lệ.",
    '{"s":"()[]{}"}',
    "true",
    "Chỉ ký tự ngoặc; độ dài ≤20000.",
    "stack",
  ],
  [
    "min-stack",
    "Min Stack",
    "Thực hiện ops. push x và pop trả null; top trả đỉnh; min trả nhỏ nhất. Trả mảng các kết quả.",
    '{"ops":[["push",-2],["push",0],["push",-3],["min"],["pop"],["top"],["min"]]}',
    "[null,null,null,-3,null,0,-2]",
    "Không pop/top/min khi rỗng; số thao tác ≤20000.",
    "stack",
  ],
  [
    "temperatures",
    "Daily Temperatures",
    "Mỗi ngày cần chờ bao nhiêu ngày tới nhiệt độ lớn hơn? Không có ngày đó: 0.",
    '{"nums":[73,74,75,71,69,72,76,73]}',
    "[1,1,4,2,1,1,0,0]",
    "0 ≤ n ≤ 20000; nhiệt độ ∈ [0,100].",
    "stack",
  ],
  [
    "depth",
    "Maximum Depth of Binary Tree",
    "Trả độ sâu lớn nhất tính bằng số node. Cây rỗng: 0.",
    '{"tree":[1,2,3,4,5,null,6]}',
    "3",
    "Cây level-order; null là node thiếu; số node ≤127.",
    "tree",
  ],
  [
    "invert",
    "Invert Binary Tree",
    "Đổi con trái/phải ở mọi node; trả cây level-order, bỏ null ở cuối.",
    '{"tree":[1,2,3,4,5,6,7]}',
    "[1,3,2,7,6,5,4]",
    "≤127 node; nhãn nguyên.",
    "tree",
  ],
  [
    "lca",
    "Lowest Common Ancestor",
    "Trả giá trị tổ tiên chung thấp nhất của p,q.",
    '{"tree":[3,5,1,6,2,0,8],"p":5,"q":1}',
    "3",
    "Giá trị node khác nhau; p,q đều tồn tại; p có thể bằng q.",
    "tree",
  ],
  [
    "diameter",
    "Diameter of Binary Tree",
    "Trả độ dài đường đi dài nhất giữa hai node, tính bằng số cạnh.",
    '{"tree":[1,2,3,4,5,null,6,7]}',
    "5",
    "Cây rỗng/một node có đường kính 0; ≤127 node.",
    "tree",
  ],
  [
    "same-tree",
    "Same Tree",
    "Trả true nếu p và q giống cấu trúc và giá trị.",
    '{"p":[1,2,3],"q":[1,2,3]}',
    "true",
    "Cây level-order; ≤127 node; null cuối không thay đổi cây.",
    "tree",
  ],
  [
    "codec",
    "Serialize and Deserialize Binary Tree",
    'Trả {encoded,decoded}. encoded là BFS đủ cả null dạng #, phân cách bằng dấu phẩy; cây rỗng encoded="". decoded là cây tái dựng, bỏ null cuối.',
    '{"tree":[1,2,3]}',
    '{"encoded":"1,2,3,#,#,#,#","decoded":[1,2,3]}',
    "≤127 node; định dạng codec được cố định để chấm.",
    "tree",
  ],
  [
    "islands",
    "Number of Islands",
    "Đếm vùng ô 1 nối theo trên/dưới/trái/phải; đường chéo không nối.",
    '{"grid":[[1,1,0],[0,1,0],[1,0,1]]}',
    "3",
    "Lưới chữ nhật 0/1, mỗi chiều ≤40; [] có 0 đảo.",
    "graph",
  ],
  [
    "clone",
    "Clone Graph",
    "Trả danh sách kề của bản sao đồ thị gồm đủ n node. Có thể đổi thứ tự láng giềng.",
    '{"adj":[[1,2],[0],[0]]}',
    "[[1,2],[0],[0]]",
    "Đồ thị đơn vô hướng; node 0..n-1; n≤40. Checker xác minh cấu trúc, không chứng minh độc lập địa chỉ bộ nhớ qua JSON.",
    "graph",
  ],
  [
    "graph-cycle",
    "Detect Cycle in Undirected Graph",
    "Trả true nếu đồ thị đơn vô hướng có chu trình, kể cả thành phần không chứa node 0.",
    '{"n":3,"edges":[[0,1],[1,2],[2,0]]}',
    "true",
    "0 ≤ n ≤40; không self-loop/cạnh song song.",
    "graph",
  ],
  [
    "fib",
    "Fibonacci Number",
    "Trả F(n), với F(0)=0, F(1)=1.",
    '{"n":6}',
    "8",
    "0 ≤ n ≤40.",
    "dp",
  ],
  [
    "knapsack",
    "0/1 Knapsack",
    "Mỗi vật lấy tối đa một lần. Trả tổng giá trị lớn nhất với tổng khối lượng ≤capacity.",
    '{"weights":[1,3,4,5],"values":[1,4,5,7],"capacity":7}',
    "9",
    "n≤14; khối lượng dương; capacity≤60; giá trị không âm.",
    "dp",
  ],
  [
    "lcs",
    "Longest Common Subsequence",
    "Trả độ dài dãy con chung dài nhất. Dãy con không cần liên tiếp.",
    '{"a":"abcde","b":"ace"}',
    "3",
    "Chuỗi a–z; mỗi chuỗi dài ≤60.",
    "dp",
  ],
  [
    "prefix",
    "Truy vấn tổng đoạn",
    "Với mỗi [l,r], trả tổng nums[l..r], bao gồm hai đầu.",
    '{"nums":[3,1,4,2,5],"queries":[[1,3],[0,4]]}',
    "[7,15]",
    "1≤n≤20000; 0≤l≤r<n; tối đa 20000 truy vấn.",
    "prefix",
  ],
  [
    "difference",
    "Cập nhật khoảng",
    "Mỗi [l,r,v] cộng v vào nums[l..r]. Trả mảng sau mọi cập nhật.",
    '{"nums":[3,1,4,2,5],"updates":[[1,3,5]]}',
    "[3,6,9,7,5]",
    "1≤n≤20000; khoảng hợp lệ; |v|≤1000.",
    "prefix",
  ],
  [
    "queue",
    "Hàng đợi công việc",
    "push x thêm cuối; pop lấy đầu. Trả mảng gồm null cho push, giá trị cho pop.",
    '{"ops":[["push",10],["push",20],["pop"]]}',
    "[null,null,10]",
    "Không pop khi rỗng; tối đa 20000 thao tác.",
    "queue",
  ],
  [
    "sort",
    "Sắp xếp tăng dần",
    "Trả một hoán vị tăng không giảm của nums.",
    '{"nums":[5,1,4,2,8]}',
    "[1,2,4,5,8]",
    "0≤n≤20000; giữ các phần tử trùng.",
    "sorting",
  ],
  [
    "palindrome",
    "Valid Palindrome",
    "Trả true nếu s đọc xuôi và ngược giống nhau.",
    '{"s":"abba"}',
    "true",
    "Chỉ chữ a–z; chuỗi rỗng hợp lệ.",
    "pointers",
  ],
  [
    "three-sum",
    "3Sum",
    "Trả mọi bộ ba giá trị khác chỉ số có tổng 0; không lặp bộ ba. Thứ tự tùy ý.",
    '{"nums":[-1,0,1,2,-1,-4]}',
    "[[-1,-1,2],[-1,0,1]]",
    "0≤n≤70; giá trị ∈ [-20,20].",
    "pointers",
  ],
  [
    "window-sum",
    "Cửa sổ tổng lớn nhất",
    "Trả tổng lớn nhất của đoạn liên tiếp dài đúng k.",
    '{"nums":[2,1,5,1,3,2],"k":3}',
    "9",
    "1≤k≤n≤20000; có thể số âm.",
    "window",
  ],
  [
    "subsets",
    "Sinh tập con",
    "Trả mọi tập con của nums, không lặp. Thứ tự tùy ý.",
    '{"nums":[1,2]}',
    "[[],[1],[2],[1,2]]",
    "nums gồm các số khác nhau; n≤10.",
    "recursion",
  ],
  [
    "top-k",
    "Kth Largest",
    "Trả giá trị lớn thứ k, tính cả các phần tử bằng nhau.",
    '{"nums":[3,2,1,5,6,4],"k":2}',
    "5",
    "1≤k≤n≤20000.",
    "heap",
  ],
  [
    "schedule",
    "Chọn lịch không chồng nhau",
    "Trả số khoảng tối đa không chồng nhau. Khoảng [start,end), hai khoảng chạm đầu mút được cùng chọn.",
    '{"intervals":[[1,3],[0,5],[4,6],[7,9],[3,8]]}',
    "3",
    "n≤70; start<end; thời gian nguyên.",
    "greedy",
  ],
  [
    "topo",
    "Lịch học có tiên quyết",
    "Mỗi [u,v] là u phải học trước v. Trả thứ tự gồm đủ n node, hoặc [] nếu có chu trình.",
    '{"n":4,"edges":[[0,1],[0,2],[2,3]]}',
    "[0,1,2,3]",
    "0≤n≤40; chấp nhận mọi thứ tự topo hợp lệ.",
    "graph",
  ],
  [
    "shortest",
    "Dijkstra: đường ngắn nhất",
    "Trả khoảng cách từ start tới từng node; không tới được: -1. Cạnh [u,v,w] có hướng.",
    '{"n":3,"edges":[[0,1,4],[0,2,1],[2,1,2]],"start":0}',
    "[0,3,1]",
    "1≤n≤40; trọng số không âm ≤20; không cạnh song song.",
    "graph",
  ],
  [
    "xor",
    "Phần tử duy nhất",
    "Mọi giá trị xuất hiện đúng hai lần, trừ một giá trị xuất hiện một lần. Trả giá trị đó.",
    '{"nums":[4,1,2,1,2]}',
    "4",
    "Số nguyên không âm ≤1000; n lẻ ≤20001.",
    "bit",
  ],
  [
    "priority",
    "Công việc ưu tiên",
    "Trả các id theo priority nhỏ trước; bằng nhau thì theo order nhỏ trước, rồi id nhỏ trước.",
    '{"tasks":[{"id":0,"priority":2,"order":0},{"id":1,"priority":1,"order":1}]}',
    "[1,0]",
    "id khác nhau; tối đa 20000 task; priority/order nguyên.",
    "heap",
  ],
  [
    "union-find",
    "Thành phần liên thông",
    "Trả số thành phần liên thông của đồ thị vô hướng n node.",
    '{"n":4,"edges":[[0,1],[2,3]]}',
    "2",
    "0≤n≤40; đồ thị đơn.",
    "graph",
  ],
  [
    "coin",
    "Đổi tiền ít đồng nhất",
    "Dùng mỗi loại xu không giới hạn lần. Trả số đồng ít nhất để đạt amount, hoặc -1.",
    '{"coins":[1,3,4],"amount":6}',
    "2",
    "Xu dương khác nhau ≤20; amount≤200.",
    "dp",
  ],
  [
    "lis",
    "Dãy con tăng dài nhất",
    "Trả độ dài dãy con tăng nghiêm ngặt dài nhất.",
    '{"nums":[3,1,5,2,6,4,9]}',
    "4",
    "0≤n≤500; giá trị nguyên.",
    "dp",
  ],
  [
    "edit",
    "Edit Distance",
    "Trả số thao tác thêm/xóa/thay một ký tự ít nhất để đổi a thành b.",
    '{"a":"kitten","b":"sitting"}',
    "3",
    "a,b chữ a–z, dài ≤60.",
    "dp",
  ],
  [
    "trie",
    "Từ điển tiền tố",
    "Với mỗi prefix, trả số từ trong words bắt đầu bằng prefix. Mỗi từ trong words khác nhau.",
    '{"words":["app","apple","bat"],"prefixes":["app","b",""]}',
    "[2,1,3]",
    "≤1000 từ; mỗi từ dài ≤30.",
    "trie",
  ],
  [
    "nqueens",
    "N-Queens",
    "Trả số cách đặt n quân hậu trên bàn n×n không tấn công nhau.",
    '{"n":4}',
    "2",
    "1≤n≤8.",
    "recursion",
  ],
  [
    "mst",
    "Kruskal: cây khung nhỏ nhất",
    "Trả tổng trọng số cây khung nhỏ nhất; không liên thông trả -1; n≤1 trả 0.",
    '{"n":3,"edges":[[0,1,4],[1,2,2],[0,2,1]]}',
    "3",
    "Đồ thị vô hướng đơn; n≤40; trọng số không âm.",
    "graph",
  ],
  [
    "bellman",
    "Bellman–Ford",
    "Trả khoảng cách từ start, node không tới được -1. Fixtures là DAG nên không có chu trình âm.",
    '{"n":3,"edges":[[0,1,4],[0,2,1],[1,2,-5]],"start":0}',
    "[0,4,-1]",
    "n≤40; cạnh chỉ từ node nhỏ sang node lớn; trọng số ∈[-10,20]. -1 cũng có thể là khoảng cách thật.",
    "graph",
  ],
  [
    "house",
    "House Robber",
    "Chọn các giá trị không kề nhau để tổng lớn nhất. Có thể chọn rỗng.",
    '{"nums":[2,7,9,3,1]}',
    "12",
    "0≤n≤20000; giá trị không âm.",
    "dp",
  ],
  [
    "interval-dp",
    "Nhân chuỗi ma trận",
    "dims mô tả kích thước ma trận i là dims[i]×dims[i+1]. Trả số phép nhân vô hướng ít nhất.",
    '{"dims":[10,20,30,40]}',
    "18000",
    "1≤số ma trận≤9; kích thước 1..20 trong đề sinh.",
    "dp",
  ],
  [
    "tree-dp",
    "Chọn node không kề nhau",
    "Mỗi node có giá trị không âm. Chọn tập node không chứa cả cha và con để tổng lớn nhất.",
    '{"tree":[3,2,3,null,3,null,1]}',
    "7",
    "≤127 node; cho phép tập rỗng.",
    "tree",
  ],
];
export const problems = Object.fromEntries(
  defs.map((d) => [
    d[0],
    {
      id: d[0],
      title: d[1],
      statement: d[2],
      sampleInput: JSON.parse(d[3]),
      sampleOutput: JSON.parse(d[4]),
      constraints: d[5],
      skill: d[6],
      version: VERSION,
      hints: learningGuide(d[0]).hints,
    },
  ]),
);
export const interviewIds = [
  "two-sum",
  "stock",
  "duplicate",
  "product",
  "kadane",
  "merge-array",
  "anagram",
  "substring",
  "replacement",
  "binary",
  "rotated",
  "bad-version",
  "reverse-list",
  "merge-list",
  "list-cycle",
  "parentheses",
  "min-stack",
  "temperatures",
  "depth",
  "invert",
  "lca",
  "diameter",
  "same-tree",
  "codec",
  "islands",
  "clone",
  "graph-cycle",
  "fib",
  "knapsack",
  "lcs",
];
export function treeFrom(a) {
  if (!a.length || a[0] === null) return null;
  let root = { v: a[0], l: null, r: null },
    q = [root],
    i = 1;
  for (let j = 0; j < q.length && i < a.length; j++) {
    for (const key of ["l", "r"])
      if (i < a.length) {
        const v = a[i++];
        if (v !== null) {
          const n = { v, l: null, r: null };
          q[j][key] = n;
          q.push(n);
        }
      }
  }
  return root;
}
export function treeArray(root) {
  if (!root) return [];
  let q = [root],
    out = [];
  for (let i = 0; i < q.length; i++) {
    const n = q[i];
    out.push(n ? n.v : null);
    if (n) q.push(n.l, n.r);
  }
  while (out.at(-1) === null) out.pop();
  return out;
}
const canonicalSet = (a) =>
  [
    ...new Set(a.map((x) => JSON.stringify([...x].sort((a, b) => a - b)))),
  ].sort();
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
export function oracle(id, d) {
  const a = d.nums ?? [];
  switch (id) {
    case "add":
      return d.a + d.b;
    case "parity":
      return d.n % 2 === 0;
    case "sum":
      return a.reduce((s, x) => s + x, 0);
    case "maximum":
      return Math.max(...a);
    case "count":
      return a.filter((x) => x === d.target).length;
    case "two-sum": {
      let m = new Map();
      for (let i = 0; i < a.length; i++) {
        if (m.has(d.target - a[i])) return [m.get(d.target - a[i]), i];
        m.set(a[i], i);
      }
      return [];
    }
    case "stock": {
      let min = Infinity,
        best = 0;
      for (const p of d.prices) {
        best = Math.max(best, p - min);
        min = Math.min(min, p);
      }
      return best;
    }
    case "duplicate":
      return new Set(a).size < a.length;
    case "product": {
      let r = Array(a.length).fill(1),
        p = 1;
      for (let i = 0; i < a.length; i++) {
        r[i] = p;
        p *= a[i];
      }
      p = 1;
      for (let i = a.length - 1; i >= 0; i--) {
        r[i] *= p;
        p *= a[i];
      }
      return r;
    }
    case "kadane": {
      let cur = a[0],
        best = cur;
      for (const x of a.slice(1)) {
        cur = Math.max(x, cur + x);
        best = Math.max(best, cur);
      }
      return best;
    }
    case "merge-array":
    case "merge-list":
      return [...d.a, ...d.b].sort((a, b) => a - b);
    case "anagram":
      return [...d.s].sort().join("") === [...d.t].sort().join("");
    case "substring": {
      let m = new Map(),
        l = 0,
        best = 0;
      for (let r = 0; r < d.s.length; r++) {
        l = Math.max(l, (m.get(d.s[r]) ?? -1) + 1);
        m.set(d.s[r], r);
        best = Math.max(best, r - l + 1);
      }
      return best;
    }
    case "replacement": {
      let freq = {},
        l = 0,
        max = 0,
        best = 0;
      for (let r = 0; r < d.s.length; r++) {
        max = Math.max(max, (freq[d.s[r]] = (freq[d.s[r]] ?? 0) + 1));
        while (r - l + 1 - max > d.k) freq[d.s[l++]]--;
        best = Math.max(best, r - l + 1);
      }
      return best;
    }
    case "binary":
    case "rotated":
      return a.indexOf(d.target);
    case "bad-version":
      return d.first;
    case "reverse-list":
      return [...a].reverse();
    case "list-cycle":
      return d.pos >= 0 && a.length > 0;
    case "parentheses": {
      let st = [],
        mp = { ")": "(", "]": "[", "}": "{" };
      for (const c of d.s) {
        if (mp[c]) {
          if (st.pop() !== mp[c]) return false;
        } else st.push(c);
      }
      return st.length === 0;
    }
    case "min-stack": {
      let st = [];
      return d.ops.map(([op, x]) => {
        if (op === "push") {
          st.push(x);
          return null;
        }
        if (op === "pop") {
          st.pop();
          return null;
        }
        return op === "top" ? st.at(-1) : Math.min(...st);
      });
    }
    case "queue": {
      let q = [],
        head = 0;
      return d.ops.map(([op, x]) => {
        if (op === "push") {
          q.push(x);
          return null;
        }
        return q[head++];
      });
    }
    case "temperatures": {
      let st = [],
        ans = Array(a.length).fill(0);
      for (let i = 0; i < a.length; i++) {
        while (st.length && a[i] > a[st.at(-1)]) {
          let j = st.pop();
          ans[j] = i - j;
        }
        st.push(i);
      }
      return ans;
    }
    case "depth": {
      const f = (n) => (n ? 1 + Math.max(f(n.l), f(n.r)) : 0);
      return f(treeFrom(d.tree));
    }
    case "invert": {
      const f = (n) => {
        if (n) [n.l, n.r] = [f(n.r), f(n.l)];
        return n;
      };
      return treeArray(f(treeFrom(d.tree)));
    }
    case "lca": {
      const f = (n) => {
        if (!n || n.v === d.p || n.v === d.q) return n;
        let l = f(n.l),
          r = f(n.r);
        return l && r ? n : (l ?? r);
      };
      return f(treeFrom(d.tree)).v;
    }
    case "diameter": {
      let best = 0;
      const f = (n) => {
        if (!n) return 0;
        let l = f(n.l),
          r = f(n.r);
        best = Math.max(best, l + r);
        return 1 + Math.max(l, r);
      };
      f(treeFrom(d.tree));
      return best;
    }
    case "same-tree":
      return equal(treeArray(treeFrom(d.p)), treeArray(treeFrom(d.q)));
    case "codec": {
      let root = treeFrom(d.tree),
        q = root ? [root] : [],
        parts = [];
      for (let i = 0; i < q.length; i++) {
        let n = q[i];
        parts.push(n ? String(n.v) : "#");
        if (n) q.push(n.l, n.r);
      }
      return { encoded: parts.join(","), decoded: treeArray(root) };
    }
    case "islands": {
      let g = d.grid.map((r) => [...r]),
        n = g.length,
        m = g[0]?.length ?? 0,
        c = 0;
      for (let i = 0; i < n; i++)
        for (let j = 0; j < m; j++)
          if (g[i][j]) {
            c++;
            g[i][j] = 0;
            let st = [[i, j]];
            while (st.length) {
              let [x, y] = st.pop();
              for (let [dx, dy] of [
                [1, 0],
                [-1, 0],
                [0, 1],
                [0, -1],
              ]) {
                let xx = x + dx,
                  yy = y + dy;
                if (xx >= 0 && xx < n && yy >= 0 && yy < m && g[xx][yy]) {
                  g[xx][yy] = 0;
                  st.push([xx, yy]);
                }
              }
            }
          }
      return c;
    }
    case "clone":
      return d.adj.map((r) => [...r]);
    case "graph-cycle":
    case "union-find":
    case "mst": {
      let p = Array.from({ length: d.n }, (_, i) => i),
        count = d.n,
        cost = 0,
        cycle = false;
      const find = (x) => (p[x] === x ? x : (p[x] = find(p[x])));
      for (let [u, v, w = 0] of id === "mst"
        ? [...d.edges].sort((a, b) => a[2] - b[2])
        : d.edges) {
        let x = find(u),
          y = find(v);
        if (x === y) cycle = true;
        else {
          p[x] = y;
          count--;
          cost += w;
        }
      }
      return id === "graph-cycle"
        ? cycle
        : id === "union-find"
          ? count
          : d.n <= 1
            ? 0
            : count === 1
              ? cost
              : -1;
    }
    case "fib": {
      let x = 0,
        y = 1;
      for (let i = 0; i < d.n; i++) [x, y] = [y, x + y];
      return x;
    }
    case "knapsack": {
      let dp = Array(d.capacity + 1).fill(0);
      for (let i = 0; i < d.weights.length; i++)
        for (let w = d.capacity; w >= d.weights[i]; w--)
          dp[w] = Math.max(dp[w], dp[w - d.weights[i]] + d.values[i]);
      return dp[d.capacity];
    }
    case "lcs":
    case "edit": {
      let dp = Array.from({ length: d.a.length + 1 }, () =>
        Array(d.b.length + 1).fill(0),
      );
      if (id === "edit") {
        for (let i = 0; i <= d.a.length; i++) dp[i][0] = i;
        for (let j = 0; j <= d.b.length; j++) dp[0][j] = j;
      }
      for (let i = 1; i <= d.a.length; i++)
        for (let j = 1; j <= d.b.length; j++)
          dp[i][j] =
            d.a[i - 1] === d.b[j - 1]
              ? dp[i - 1][j - 1] + (id === "lcs" ? 1 : 0)
              : id === "lcs"
                ? Math.max(dp[i - 1][j], dp[i][j - 1])
                : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      return dp[d.a.length][d.b.length];
    }
    case "prefix": {
      let p = [0];
      for (let x of a) p.push(p.at(-1) + x);
      return d.queries.map(([l, r]) => p[r + 1] - p[l]);
    }
    case "difference": {
      let diff = Array(a.length + 1).fill(0);
      for (let [l, r, v] of d.updates) {
        diff[l] += v;
        diff[r + 1] -= v;
      }
      let cur = 0;
      return a.map((x, i) => x + (cur += diff[i]));
    }
    case "sort":
      return [...a].sort((a, b) => a - b);
    case "palindrome":
      return d.s === [...d.s].reverse().join("");
    case "three-sum": {
      let r = [],
        b = [...a].sort((a, b) => a - b);
      for (let i = 0; i < b.length - 2; i++) {
        if (i && b[i] === b[i - 1]) continue;
        let l = i + 1,
          h = b.length - 1;
        while (l < h) {
          let s = b[i] + b[l] + b[h];
          if (s === 0) {
            r.push([b[i], b[l], b[h]]);
            l++;
            h--;
            while (l < h && b[l] === b[l - 1]) l++;
            while (l < h && b[h] === b[h + 1]) h--;
          } else if (s < 0) l++;
          else h--;
        }
      }
      return r;
    }
    case "window-sum": {
      let s = a.slice(0, d.k).reduce((s, x) => s + x, 0),
        b = s;
      for (let i = d.k; i < a.length; i++) {
        s += a[i] - a[i - d.k];
        b = Math.max(b, s);
      }
      return b;
    }
    case "window-max": {
      const q = [],
        result = [];
      let head = 0;
      for (let i = 0; i < a.length; i++) {
        while (head < q.length && q[head] <= i - d.k) head++;
        while (q.length > head && a[q.at(-1)] <= a[i]) q.pop();
        q.push(i);
        if (i >= d.k - 1) result.push(a[q[head]]);
      }
      return result;
    }
    case "subsets": {
      let r = [[]];
      for (let x of a) r.push(...r.map((s) => [...s, x]));
      return r;
    }
    case "top-k":
      return [...a].sort((a, b) => b - a)[d.k - 1];
    case "schedule": {
      let end = -Infinity,
        c = 0;
      for (let [s, e] of [...d.intervals].sort((a, b) => a[1] - b[1]))
        if (s >= end) {
          c++;
          end = e;
        }
      return c;
    }
    case "topo": {
      let adj = Array.from({ length: d.n }, () => []),
        ind = Array(d.n).fill(0);
      for (let [u, v] of d.edges) {
        adj[u].push(v);
        ind[v]++;
      }
      let q = ind.flatMap((x, i) => (x === 0 ? [i] : []));
      for (let i = 0; i < q.length; i++)
        for (let v of adj[q[i]]) if (--ind[v] === 0) q.push(v);
      return q.length === d.n ? q : [];
    }
    case "shortest":
    case "bellman": {
      let dist = Array(d.n).fill(Infinity);
      dist[d.start] = 0;
      for (let i = 0; i < d.n - 1; i++) {
        let changed = false;
        for (let [u, v, w] of d.edges)
          if (dist[u] + w < dist[v]) {
            dist[v] = dist[u] + w;
            changed = true;
          }
        if (!changed) break;
      }
      return dist.map((x) => (Number.isFinite(x) ? x : -1));
    }
    case "xor":
      return a.reduce((s, x) => s ^ x, 0);
    case "priority":
      return [...d.tasks]
        .sort(
          (a, b) => a.priority - b.priority || a.order - b.order || a.id - b.id,
        )
        .map((x) => x.id);
    case "coin": {
      let dp = Array(d.amount + 1).fill(Infinity);
      dp[0] = 0;
      for (let v = 1; v <= d.amount; v++)
        for (let c of d.coins)
          if (c <= v) dp[v] = Math.min(dp[v], 1 + dp[v - c]);
      return Number.isFinite(dp[d.amount]) ? dp[d.amount] : -1;
    }
    case "lis": {
      let dp = a.map(() => 1),
        b = 0;
      for (let i = 0; i < a.length; i++) {
        for (let j = 0; j < i; j++)
          if (a[j] < a[i]) dp[i] = Math.max(dp[i], dp[j] + 1);
        b = Math.max(b, dp[i]);
      }
      return b;
    }
    case "trie":
      return d.prefixes.map(
        (p) => d.words.filter((w) => w.startsWith(p)).length,
      );
    case "nqueens": {
      let c = 0;
      const f = (r, cols, d1, d2) => {
        if (r === d.n) {
          c++;
          return;
        }
        for (let j = 0; j < d.n; j++)
          if (!cols.has(j) && !d1.has(r - j) && !d2.has(r + j))
            f(
              r + 1,
              new Set([...cols, j]),
              new Set([...d1, r - j]),
              new Set([...d2, r + j]),
            );
      };
      f(0, new Set(), new Set(), new Set());
      return c;
    }
    case "house": {
      let x = 0,
        y = 0;
      for (let v of a) [x, y] = [y, Math.max(y, x + v)];
      return y;
    }
    case "interval-dp": {
      let n = d.dims.length - 1,
        dp = Array.from({ length: n }, () => Array(n).fill(0));
      for (let len = 2; len <= n; len++)
        for (let i = 0; i + len <= n; i++) {
          let j = i + len - 1;
          dp[i][j] = Infinity;
          for (let k = i; k < j; k++)
            dp[i][j] = Math.min(
              dp[i][j],
              dp[i][k] +
                dp[k + 1][j] +
                d.dims[i] * d.dims[k + 1] * d.dims[j + 1],
            );
        }
      return dp[0][n - 1];
    }
    case "tree-dp": {
      const f = (n) => {
        if (!n) return [0, 0];
        let [li, lo] = f(n.l),
          [ri, ro] = f(n.r);
        return [n.v + lo + ro, Math.max(li, lo) + Math.max(ri, ro)];
      };
      return Math.max(...f(treeFrom(d.tree)));
    }
    default:
      throw new Error("Unknown oracle " + id);
  }
}
export function checkOutput(id, d, got) {
  const expected = oracle(id, d);
  if (id === "two-sum") {
    if (!Array.isArray(got)) return false;
    if (!expected.length) return got.length === 0;
    return (
      got.length === 2 &&
      got.every((x) => Number.isInteger(x) && x >= 0 && x < d.nums.length) &&
      got[0] !== got[1] &&
      d.nums[got[0]] + d.nums[got[1]] === d.target
    );
  }
  if (id === "binary") {
    return (
      Number.isInteger(got) &&
      (expected === -1
        ? got === -1
        : got >= 0 && got < d.nums.length && d.nums[got] === d.target)
    );
  }
  if (id === "topo") {
    if (!Array.isArray(got)) return false;
    if (d.n > 0 && expected.length === 0) return got.length === 0;
    if (
      got.length !== d.n ||
      new Set(got).size !== d.n ||
      !got.every((x) => Number.isInteger(x) && x >= 0 && x < d.n)
    )
      return false;
    let p = Object.fromEntries(got.map((v, i) => [v, i]));
    return d.edges.every(([u, v]) => p[u] < p[v]);
  }
  if (id === "three-sum" || id === "subsets") {
    if (
      !Array.isArray(got) ||
      !got.every((r) => Array.isArray(r) && r.every(Number.isInteger))
    )
      return false;
    const g = canonicalSet(got);
    return g.length === got.length && equal(g, canonicalSet(expected));
  }
  if (id === "clone") {
    return (
      Array.isArray(got) &&
      got.length === d.adj.length &&
      got.every(
        (r, i) =>
          Array.isArray(r) &&
          r.length === d.adj[i].length &&
          equal(
            [...r].sort((a, b) => a - b),
            [...d.adj[i]].sort((a, b) => a - b),
          ),
      )
    );
  }
  if (id === "invert")
    return Array.isArray(got) && equal(treeArray(treeFrom(got)), expected);
  if (id === "codec")
    return (
      got &&
      typeof got === "object" &&
      got.encoded === expected.encoded &&
      equal(got.decoded, expected.decoded)
    );
  return equal(got, expected);
}
export function generateInput(id, seed) {
  let r = random(`${id}:${seed}`),
    n = int(r, 0, 14),
    nums = Array.from({ length: n }, () => int(r, -8, 8)),
    s = Array.from({ length: n }, () =>
      String.fromCharCode(97 + int(r, 0, 4)),
    ).join("");
  switch (id) {
    case "add":
      return { a: int(r, -1000, 1000), b: int(r, -1000, 1000) };
    case "parity":
      return { n: int(r, -1000, 1000) };
    case "sum":
    case "count":
    case "duplicate":
    case "reverse-list":
    case "sort":
    case "lis":
      return { nums, target: int(r, -8, 8) };
    case "maximum":
    case "kadane":
      return { nums: nums.length ? nums : [int(r, -8, 8)] };
    case "stock":
      return { prices: nums.map(Math.abs) };
    case "two-sum":
      return { nums, target: int(r, -12, 12) };
    case "product":
      return { nums: nums.slice(0, 12).map((x) => x % 4) };
    case "merge-array":
    case "merge-list":
      return {
        a: nums.slice(0, n >> 1).sort((a, b) => a - b),
        b: nums.slice(n >> 1).sort((a, b) => a - b),
      };
    case "anagram":
      return { s, t: r() < 0.5 ? shuffle([...s], r).join("") : s + "z" };
    case "substring":
    case "palindrome":
      return { s: r() < 0.3 ? s + [...s].reverse().join("") : s };
    case "parentheses":
      return { s: shuffle([..."()[]{}".repeat(int(r, 0, 4))], r).join("") };
    case "replacement":
      return { s: s.toUpperCase(), k: int(r, 0, n) };
    case "binary":
      return { nums: nums.sort((a, b) => a - b), target: int(r, -8, 8) };
    case "rotated": {
      let a = [...new Set(nums)].sort((a, b) => a - b),
        k = int(r, 0, a.length);
      return { nums: [...a.slice(k), ...a.slice(0, k)], target: int(r, -8, 8) };
    }
    case "bad-version": {
      let n = int(r, 1, 1000000);
      return { n, first: int(r, 1, n) };
    }
    case "list-cycle":
      return { nums, pos: n ? int(r, -1, n - 1) : -1 };
    case "queue":
    case "min-stack": {
      let ops = [],
        count = 0;
      for (let i = 0; i < 25; i++) {
        let op =
          count === 0 || r() < 0.55
            ? "push"
            : id === "queue"
              ? "pop"
              : shuffle(["pop", "top", "min"], r)[0];
        ops.push(op === "push" ? [op, int(r, -30, 30)] : [op]);
        if (op === "push") count++;
        if (op === "pop") count--;
      }
      return { ops };
    }
    case "temperatures":
      return { nums: nums.map((x) => x + 70) };
    case "depth":
    case "diameter":
    case "invert":
    case "codec":
    case "tree-dp":
    case "lca":
    case "same-tree": {
      let tree = n ? [1] : [];
      for (let i = 1; i < n; i++) tree.push(r() < 0.2 ? null : i + 1);
      tree = treeArray(treeFrom(tree));
      if (id === "same-tree")
        return {
          p: tree,
          q:
            r() < 0.5
              ? [...tree]
              : tree.map((x) => (x === null ? null : x + 1)),
        };
      if (id === "lca") {
        if (!tree.length) tree = [1];
        let vals = tree.filter((x) => x !== null);
        return {
          tree,
          p: vals[int(r, 0, vals.length - 1)],
          q: vals[int(r, 0, vals.length - 1)],
        };
      }
      return { tree };
    }
    case "islands": {
      let h = int(r, 0, 8),
        w = int(r, 1, 8);
      return {
        grid: Array.from({ length: h }, () =>
          Array.from({ length: w }, () => int(r, 0, 1)),
        ),
      };
    }
    case "graph-cycle":
    case "union-find":
    case "mst":
    case "topo":
    case "clone":
    case "shortest":
    case "bellman": {
      let n = int(r, id === "shortest" || id === "bellman" ? 1 : 0, 10),
        edges = [];
      for (let i = 0; i < n; i++)
        for (let j = i + 1; j < n; j++)
          if (r() < 0.25)
            edges.push(
              id === "mst" || id === "shortest" || id === "bellman"
                ? [i, j, int(r, id === "bellman" ? -10 : 0, 20)]
                : [i, j],
            );
      if (id === "topo" && n >= 3 && r() < 0.4)
        edges = [
          [0, 1],
          [1, 2],
          [2, 0],
        ];
      if (id === "clone") {
        let adj = Array.from({ length: n }, () => []);
        for (let [u, v] of edges) {
          adj[u].push(v);
          adj[v].push(u);
        }
        return { adj };
      }
      return {
        n,
        edges,
        ...(id === "shortest" || id === "bellman"
          ? { start: int(r, 0, n - 1) }
          : {}),
      };
    }
    case "fib":
      return { n: int(r, 0, 40) };
    case "knapsack":
      return {
        weights: nums.map((x) => Math.abs(x) + 1),
        values: nums.map((x) => Math.abs(x) * 2),
        capacity: int(r, 0, 30),
      };
    case "lcs":
    case "edit":
      return {
        a: s,
        b: shuffle([...s], r)
          .slice(0, int(r, 0, n))
          .join(""),
      };
    case "prefix":
    case "difference": {
      if (!nums.length) nums = [0];
      let qs = Array.from({ length: 10 }, () => {
        let l = int(r, 0, nums.length - 1),
          h = int(r, l, nums.length - 1);
        return id === "prefix" ? [l, h] : [l, h, int(r, -10, 10)];
      });
      return { nums, [id === "prefix" ? "queries" : "updates"]: qs };
    }
    case "three-sum":
      return { nums };
    case "window-sum":
    case "window-max":
    case "top-k": {
      if (!nums.length) nums = [0];
      return { nums, k: int(r, 1, nums.length) };
    }
    case "subsets":
      return { nums: [...new Set(nums)].slice(0, 8) };
    case "schedule":
      return { intervals: nums.map((x) => [x, x + int(r, 1, 7)]) };
    case "xor": {
      let a = [...new Set(nums.map(Math.abs))],
        unique = int(r, 100, 200);
      return { nums: shuffle([...a, ...a, unique], r) };
    }
    case "priority":
      return {
        tasks: nums.map((x, i) => ({
          id: i,
          priority: Math.abs(x),
          order: int(r, 0, 5),
        })),
      };
    case "coin":
      return {
        coins: [...new Set(nums.map((x) => Math.abs(x) + 1))],
        amount: int(r, 0, 60),
      };
    case "trie":
      return {
        words: [...new Set([s, "apple", "app", "bat"])],
        prefixes: ["", s.slice(0, 2), "app", "z"],
      };
    case "nqueens":
      return { n: int(r, 1, 8) };
    case "house":
      return { nums: nums.map(Math.abs) };
    case "interval-dp":
      return {
        dims: Array.from({ length: int(r, 2, 8) }, () => int(r, 1, 20)),
      };
    default:
      throw new Error("Unknown generator " + id);
  }
}
export function testsFor(
  id,
  seed,
  { publicOnly = false, version = VERSION } = {},
) {
  const p = problems[id];
  if (!p) throw new Error("Unknown problem");
  let tests = [{ group: "sample", input: p.sampleInput }];
  if (!publicOnly) {
    if (version !== LEGACY_VERSION)
      for (const input of edgeInputs(id)) tests.push({ group: "edge", input });
    for (let i = version === LEGACY_VERSION ? 0 : 4; i < 12; i++)
      tests.push({
        group: version === LEGACY_VERSION && i < 4 ? "edge" : "random",
        input: generateInput(id, `${seed}:${i}`),
      });
    const perf =
      version === LEGACY_VERSION ? performanceInput(id) : stressInput(id);
    if (perf) tests.push({ group: "performance", input: perf });
  }
  return tests.map((t, i) => ({
    ...t,
    id: i + 1,
    expected: oracle(id, t.input),
  }));
}
function performanceInput(id) {
  const a = Array.from({ length: 20000 }, (_, i) => i % 1000);
  switch (id) {
    case "sum":
    case "maximum":
    case "count":
    case "duplicate":
    case "sort":
    case "reverse-list":
    case "temperatures":
      return { nums: a, target: 37 };
    case "two-sum":
      return { nums: a, target: 9999 };
    case "kadane":
      return { nums: a.map((x) => x - 500) };
    case "stock":
      return { prices: a };
    case "substring":
    case "palindrome":
      return { s: "abcde".repeat(4000) };
    case "replacement":
      return { s: "ABCDE".repeat(4000), k: 30 };
    case "anagram":
      return { s: "abcde".repeat(4000), t: "edcba".repeat(4000) };
    case "prefix":
      return {
        nums: a,
        queries: Array.from({ length: 20000 }, (_, i) => [0, i]),
      };
    case "difference":
      return {
        nums: a,
        updates: Array.from({ length: 20000 }, (_, i) => [i, 19999, 1]),
      };
    case "binary":
      return { nums: a.sort((a, b) => a - b), target: 999 };
    case "window-sum":
    case "window-max":
    case "top-k":
      return { nums: a, k: 100 };
    case "house":
      return { nums: a };
    default:
      return null;
  }
}
