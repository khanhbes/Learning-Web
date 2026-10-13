import { treeFrom, treeArray } from "../content/problems.mjs";
// Independent algorithm states; the final answer comes from the traced algorithm.
export function detailedTrace(id, d, variant = "insertion") {
  const supported = [
    "depth",
    "diameter",
    "invert",
    "lca",
    "same-tree",
    "codec",
    "tree-dp",
    "coin",
    "lis",
    "trie",
    "nqueens",
    "interval-dp",
    "union-find",
    "mst",
    "graph-cycle",
    "xor",
    "sort",
    "knapsack",
    "product",
    "difference",
    "house",
  ];
  if (!supported.includes(id)) return null;
  const frames = [];
  let count = 0,
    result,
    values = d.nums ?? [],
    base = {};
  const emit = (caption, extra = {}) => {
    count++;
    if (frames.length < 299)
      frames.push(
        structuredClone({
          caption,
          values,
          active: [],
          done: [],
          variables: {},
          ...base,
          ...extra,
        }),
      );
  };
  if (
    [
      "depth",
      "diameter",
      "invert",
      "lca",
      "same-tree",
      "codec",
      "tree-dp",
    ].includes(id)
  ) {
    const root = treeFrom(d.tree ?? d.p ?? []),
      ids = new Map();
    let sequence = 0;
    const index = (n) => {
      if (!n) return;
      ids.set(n, sequence++);
      index(n.l);
      index(n.r);
    };
    index(root);
    const scene = () => {
      const nodes = [],
        edges = [];
      const ordered = [];
      const inorder = (n) => {
        if (!n) return;
        inorder(n.l);
        ordered.push(n);
        inorder(n.r);
      };
      inorder(root);
      const offset = Math.max(0, (800 - (ordered.length + 1) * 70) / 2),
        positions = new Map(ordered.map((n, i) => [n, offset + (i + 1) * 70]));
      const f = (n, depth = 0, parent) => {
        if (!n) return;
        const i = ids.get(n);
        nodes.push({
          id: i,
          value: n.v,
          x: positions.get(n),
          y: 55 + depth * 85,
        });
        if (parent !== undefined) edges.push([parent, i]);
        f(n.l, depth + 1, i);
        f(n.r, depth + 1, i);
      };
      f(root);
      return { nodes, edges, structure: "tree" };
    };
    const draw = (caption, n, variables = {}) =>
      emit(caption, { ...scene(), active: n ? [ids.get(n)] : [], variables });
    draw(
      root
        ? "Đọc cây: mỗi đường nối dẫn đến một cây con."
        : "Cây rỗng là trường hợp cơ sở.",
      root,
    );
    if (id === "depth" && variant.startsWith("tree-")) {
      const order = [];
      const visit = (n, level = 1) => {
        if (!n) return 0;
        const record = () => {
          order.push(n.v);
          draw(`Thăm ${n.v} ở tầng ${level}.`, n, { order: [...order], level });
        };
        if (variant === "tree-pre") record();
        const l = visit(n.l, level + 1);
        if (variant === "tree-in") record();
        const r = visit(n.r, level + 1);
        if (variant === "tree-post") record();
        return 1 + Math.max(l, r);
      };
      if (variant === "tree-bfs") {
        const q = root ? [[root, 1]] : [];
        result = 0;
        for (let k = 0; k < q.length; k++) {
          const [n, level] = q[k];
          order.push(n.v);
          result = Math.max(result, level);
          if (n.l) q.push([n.l, level + 1]);
          if (n.r) q.push([n.r, level + 1]);
          draw(`BFS thăm ${n.v}: lấy từ đầu queue.`, n, {
            order: [...order],
            level,
            frontier: q.slice(k + 1).map(([x]) => x.v),
          });
        }
      } else result = visit(root);
      emit("Thứ tự duyệt và độ sâu là hai thông tin khác nhau.", {
        ...scene(),
        variables: { order, depth: result },
      });
    } else if (["depth", "diameter", "tree-dp"].includes(id)) {
      let best = 0;
      const visit = (n, stack = []) => {
        if (!n) return id === "tree-dp" ? [0, 0] : 0;
        draw(`Đi xuống node ${n.v}; giữ lời gọi trên stack.`, n, {
          callStack: [...stack, n.v],
        });
        const l = visit(n.l, [...stack, n.v]),
          r = visit(n.r, [...stack, n.v]);
        if (id === "tree-dp") {
          const take = n.v + l[1] + r[1],
            skip = Math.max(...l) + Math.max(...r);
          draw(`Chọn ${n.v}: ${take}; bỏ ${n.v}: ${skip}.`, n, {
            take,
            skip,
            left: l,
            right: r,
          });
          return [take, skip];
        }
        const height = 1 + Math.max(l, r);
        best = Math.max(best, l + r);
        draw(
          `Node ${n.v}: cao = 1 + max(${l},${r}) = ${height}; đường qua node = ${l + r} cạnh.`,
          n,
          { leftHeight: l, rightHeight: r, height, diameter: best },
        );
        return height;
      };
      const answer = visit(root);
      result =
        id === "tree-dp" ? Math.max(...answer) : id === "depth" ? answer : best;
    } else if (id === "invert") {
      const visit = (n) => {
        if (!n) return;
        [n.l, n.r] = [n.r, n.l];
        draw(`Đổi hai nhánh tại ${n.v}.`, n);
        visit(n.l);
        visit(n.r);
      };
      visit(root);
      result = treeArray(root);
    } else if (id === "lca") {
      const visit = (n) => {
        if (!n) return null;
        if (n.v === d.p || n.v === d.q) {
          draw(`Tìm thấy mục tiêu ${n.v}; gửi node này lên cha.`, n, {
            target: n.v,
          });
          return n;
        }
        const l = visit(n.l),
          r = visit(n.r);
        draw(
          `Node ${n.v}: nhánh trái ${l?.v ?? "—"}, nhánh phải ${r?.v ?? "—"}.`,
          n,
          { left: l?.v ?? null, right: r?.v ?? null },
        );
        return l && r ? n : (l ?? r);
      };
      result = visit(root)?.v ?? null;
    } else if (id === "same-tree") {
      const other = treeFrom(d.q);
      const compare = (a, b) => {
        if (!a || !b) {
          emit(
            `So vị trí trống: ${!a ? "null" : a.v} / ${!b ? "null" : b.v}.`,
            { variables: { equal: a === b } },
          );
          return a === b;
        }
        draw(`So hai node: ${a.v} và ${b.v}.`, a, {
          other: b.v,
          equal: a.v === b.v,
        });
        return a.v === b.v && compare(a.l, b.l) && compare(a.r, b.r);
      };
      result = compare(root, other);
    } else {
      const q = root ? [root] : [],
        parts = [];
      for (let i = 0; i < q.length; i++) {
        const n = q[i];
        parts.push(n ? String(n.v) : "#");
        if (n) q.push(n.l, n.r);
        draw(`BFS ghi ${parts.at(-1)}; giữ # để không mất nhánh.`, n, {
          encoded: parts.join(","),
          frontier: q.slice(i + 1).map((n) => n?.v ?? "#"),
        });
      }
      result = { encoded: parts.join(","), decoded: treeArray(root) };
    }
    base = scene();
  } else if (id === "nqueens") {
    const board = Array.from({ length: d.n }, () => Array(d.n).fill("·")),
      cols = new Set(),
      diag1 = new Set(),
      diag2 = new Set();
    let solutions = 0;
    base = { grid: board, structure: "chess" };
    emit("Mỗi hàng đặt một quân hậu; tránh cùng cột và đường chéo.");
    const place = (r) => {
      if (r === d.n) {
        solutions++;
        emit(`Tìm được cách ${solutions}; quay lại tìm cách khác.`, {
          grid: board,
          variables: { solutions },
        });
        return;
      }
      for (let c = 0; c < d.n; c++) {
        const allowed = !cols.has(c) && !diag1.has(r - c) && !diag2.has(r + c);
        emit(
          `Thử hàng ${r}, cột ${c}: ${allowed ? "an toàn" : "bị tấn công"}.`,
          {
            grid: board,
            active: [r * d.n + c],
            variables: { row: r, column: c, allowed, solutions },
          },
        );
        if (!allowed) continue;
        board[r][c] = "♛";
        cols.add(c);
        diag1.add(r - c);
        diag2.add(r + c);
        emit("Đặt hậu rồi đi tới hàng tiếp theo.", {
          grid: board,
          active: [r * d.n + c],
        });
        place(r + 1);
        board[r][c] = "·";
        cols.delete(c);
        diag1.delete(r - c);
        diag2.delete(r + c);
        emit("Hoàn tác vị trí vừa thử.", {
          grid: board,
          active: [r * d.n + c],
        });
      }
    };
    place(0);
    result = solutions;
  } else if (id === "trie") {
    const root = { children: {}, count: 0, id: 0, value: "∅" },
      nodes = [{ id: 0, value: "∅", x: 400, y: 45 }],
      edges = [];
    let next = 1;
    const layout = () => {
      const levels = [];
      const walk = (n, level) => {
        (levels[level] ??= []).push(n);
        Object.values(n.children).forEach((c) => walk(c, level + 1));
      };
      walk(root, 0);
      nodes.length = 0;
      for (let l = 0; l < levels.length; l++)
        levels[l].forEach((n, i) =>
          nodes.push({
            id: n.id,
            value: n.value,
            x: (800 * (i + 1)) / (levels[l].length + 1),
            y: 45 + l * 65,
          }),
        );
    };
    base = { structure: "tree" };
    emit("Root biểu diễn tiền tố rỗng.", { nodes, edges });
    for (const word of d.words) {
      let n = root;
      n.count++;
      for (const c of word) {
        if (!n.children[c]) {
          n.children[c] = { children: {}, count: 0, id: next++, value: c };
          edges.push([n.id, n.children[c].id]);
        }
        n = n.children[c];
        n.count++;
        layout();
        emit(`Thêm ký tự ${c} trong “${word}”; số từ qua node = ${n.count}.`, {
          nodes,
          edges,
          active: [n.id],
          variables: { word, count: n.count },
        });
      }
      emit(`Kết thúc từ “${word}”.`, { nodes, edges, active: [n.id] });
    }
    result = d.prefixes.map((prefix) => {
      let n = root;
      for (const c of prefix) {
        n = n?.children[c];
        emit(`Tìm tiền tố “${prefix}”: theo cạnh ${c}.`, {
          nodes,
          edges,
          active: n ? [n.id] : [],
          variables: { found: !!n },
        });
      }
      const answer = n?.count ?? 0;
      emit(`“${prefix}” khớp ${answer} từ, kể cả từ lặp.`, {
        nodes,
        edges,
        variables: { prefix, count: answer },
      });
      return answer;
    });
    base = { ...base, nodes, edges };
  } else if (id === "union-find" && variant === "components-bfs") {
    const adj = Array.from({ length: d.n }, () => []),
      seen = new Set();
    for (const [u, v] of d.edges) {
      adj[u].push(v);
      adj[v].push(u);
    }
    const nodes = adj.map((_, i) => ({
      id: i,
      value: i,
      x: 400 + Math.cos((2 * Math.PI * i) / Math.max(1, d.n)) * 190,
      y: 225 + Math.sin((2 * Math.PI * i) / Math.max(1, d.n)) * 170,
    }));
    base = { nodes, edges: d.edges, structure: "undirected" };
    let components = 0;
    emit("Mỗi lần bắt đầu BFS ở node chưa thăm là một vùng mới.");
    for (let start = 0; start < d.n; start++) {
      if (seen.has(start)) continue;
      components++;
      const q = [start];
      seen.add(start);
      emit(`Bắt đầu thành phần ${components} từ node ${start}.`, {
        active: [start],
        done: [...seen],
        variables: { components, frontier: q },
      });
      for (let k = 0; k < q.length; k++) {
        const u = q[k];
        for (const v of adj[u])
          if (!seen.has(v)) {
            seen.add(v);
            q.push(v);
          }
        emit(`BFS xử lý ${u}, đánh dấu hàng xóm khi enqueue.`, {
          active: [u],
          done: [...seen],
          variables: { components, frontier: q.slice(k + 1) },
        });
      }
    }
    result = components;
  } else if (["union-find", "mst", "graph-cycle"].includes(id)) {
    const parent = Array.from({ length: d.n }, (_, i) => i),
      size = Array(d.n).fill(1);
    let components = d.n,
      total = 0,
      cycle = false;
    const nodes = parent.map((i) => ({
      id: i,
      value: i,
      x: 400 + Math.cos((2 * Math.PI * i) / Math.max(1, d.n)) * 190,
      y: 225 + Math.sin((2 * Math.PI * i) / Math.max(1, d.n)) * 170,
    }));
    base = { nodes, edges: d.edges, structure: "undirected", values: parent };
    emit("Ban đầu mỗi node là một tập riêng.", {
      variables: { parent, components },
    });
    const find = (x) => {
      while (parent[x] !== x) {
        const old = parent[x];
        parent[x] = parent[old];
        emit(`Nén đường của ${x}: cha ${old} → ${parent[x]}.`, {
          active: [x, parent[x]],
          variables: { parent, components },
        });
        x = parent[x];
      }
      return x;
    };
    const edges =
      id === "mst" ? [...d.edges].sort((a, b) => a[2] - b[2]) : d.edges;
    for (const [u, v, w] of edges) {
      let a = find(u),
        b = find(v);
      const join = a !== b;
      if (join) {
        if (size[a] < size[b]) [a, b] = [b, a];
        parent[b] = a;
        size[a] += size[b];
        components--;
        total += w ?? 0;
      } else cycle = true;
      emit(
        `${join ? "Nối" : "Bỏ"} cạnh ${u}–${v}${w !== undefined ? " (" + w + ")" : ""}: ${join ? "hai tập khác nhau" : "đã cùng tập, sẽ tạo chu trình"}.`,
        { active: [u, v], variables: { parent, components, total, cycle } },
      );
    }
    result =
      id === "mst"
        ? d.n === 0 || components === 1
          ? total
          : -1
        : id === "graph-cycle"
          ? cycle
          : components;
  } else if (id === "difference") {
    const diff = Array(values.length + 1).fill(0),
      out = [...values];
    base = { structure: "dp" };
    emit("Mỗi cập nhật chỉ ghi ở hai ranh giới.", { secondary: diff });
    for (const [l, r, v] of d.updates) {
      diff[l] += v;
      diff[r + 1] -= v;
      emit(`Đoạn [${l},${r}]: diff[${l}]+=${v}, diff[${r + 1}]-=${v}.`, {
        secondary: diff,
        variables: { left: l, right: r, delta: v },
      });
    }
    let add = 0;
    for (let i = 0; i < out.length; i++) {
      add += diff[i];
      out[i] += add;
      emit(`Cộng dồn tại ${i}: thêm ${add}, giá trị mới ${out[i]}.`, {
        values: out,
        active: [i],
        secondary: diff,
        variables: { added: add },
      });
    }
    values = out;
    result = out;
  } else if (id === "product") {
    const out = Array(values.length).fill(1);
    let left = 1,
      right = 1;
    emit("Mỗi ô bắt đầu với tích rỗng bằng 1.", { secondary: out });
    for (let i = 0; i < values.length; i++) {
      out[i] = left;
      emit(`Ô ${i} nhận tích bên trái ${left}.`, {
        active: [i],
        secondary: out,
        variables: { leftProduct: left },
      });
      left *= values[i];
    }
    for (let i = values.length - 1; i >= 0; i--) {
      out[i] *= right;
      emit(`Ô ${i} nhân thêm tích bên phải ${right} → ${out[i]}.`, {
        active: [i],
        secondary: out,
        variables: { rightProduct: right },
      });
      right *= values[i];
    }
    result = out;
  } else if (id === "house") {
    const dp = [0, 0];
    base = { structure: "dp" };
    emit("Chưa chọn nhà nào: kết quả 0.", { secondary: dp });
    for (let i = 0; i < values.length; i++) {
      const take = dp[i] + values[i],
        skip = dp[i + 1];
      dp.push(Math.max(take, skip));
      emit(`Nhà ${i}: lấy=${take}, bỏ=${skip}; chọn ${dp.at(-1)}.`, {
        active: [i],
        secondary: dp,
        variables: { take, skip },
      });
    }
    result = dp.at(-1);
  } else if (id === "coin") {
    const dp = Array(d.amount + 1).fill(Infinity);
    dp[0] = 0;
    values = Array.from({ length: dp.length }, (_, i) => i);
    base = { structure: "dp" };
    emit("Không cần đồng xu để tạo tổng 0.", {
      secondary: dp.map((x) => (Number.isFinite(x) ? x : "∞")),
    });
    for (let x = 1; x <= d.amount; x++)
      for (const c of d.coins)
        if (c <= x) {
          dp[x] = Math.min(dp[x], dp[x - c] + 1);
          emit(`Tổng ${x}, thử xu ${c}: lấy dp[${x - c}]+1.`, {
            active: [x],
            secondary: dp.map((x) => (Number.isFinite(x) ? x : "∞")),
            variables: { amount: x, coin: c, dependency: x - c },
          });
        }
    result = Number.isFinite(dp[d.amount]) ? dp[d.amount] : -1;
  } else if (id === "lis") {
    const dp = values.map(() => 1);
    base = { structure: "dp" };
    emit("Mỗi phần tử tự tạo một dãy tăng dài 1.", { secondary: dp });
    for (let i = 0; i < values.length; i++) {
      for (let j = 0; j < i; j++) {
        if (values[j] < values[i]) dp[i] = Math.max(dp[i], dp[j] + 1);
        emit(
          `So ${values[j]} < ${values[i]}: ${values[j] < values[i] ? "có thể nối" : "không được nối"}.`,
          { active: [j, i], secondary: dp, variables: { i, j, length: dp[i] } },
        );
      }
    }
    result = Math.max(0, ...dp);
  } else if (id === "interval-dp") {
    const n = d.dims.length - 1,
      dp = Array.from({ length: n }, () => Array(n).fill(0));
    base = { structure: "dp" };
    emit("Một ma trận không cần phép nhân.", { grid: dp });
    for (let len = 2; len <= n; len++)
      for (let i = 0; i + len <= n; i++) {
        const j = i + len - 1;
        dp[i][j] = Infinity;
        for (let k = i; k < j; k++) {
          const candidate =
            dp[i][k] + dp[k + 1][j] + d.dims[i] * d.dims[k + 1] * d.dims[j + 1];
          dp[i][j] = Math.min(dp[i][j], candidate);
          emit(
            `Đoạn [${i},${j}], chia tại ${k}: chi phí ${candidate}; tốt nhất ${dp[i][j]}.`,
            {
              grid: dp.map((r) => r.map((x) => (Number.isFinite(x) ? x : "∞"))),
              active: [i * n + j],
              dependencies: [i * n + k, (k + 1) * n + j],
              variables: { left: i, right: j, split: k, cost: candidate },
            },
          );
        }
      }
    result = dp[0][n - 1];
    base = { ...base, grid: dp };
  } else if (id === "knapsack") {
    const dp = Array.from({ length: d.weights.length + 1 }, () =>
      Array(d.capacity + 1).fill(0),
    );
    values = d.weights;
    base = { structure: "dp" };
    emit("Hàng i: chỉ dùng i vật đầu; cột w: sức chứa w.", { grid: dp });
    for (let i = 1; i < dp.length; i++)
      for (let w = 0; w <= d.capacity; w++) {
        const skip = dp[i - 1][w],
          take =
            w >= d.weights[i - 1]
              ? dp[i - 1][w - d.weights[i - 1]] + d.values[i - 1]
              : null;
        dp[i][w] = Math.max(skip, take ?? skip);
        emit(
          `Vật ${i - 1}, sức chứa ${w}: bỏ=${skip}, lấy=${take ?? "không vừa"} → ${dp[i][w]}.`,
          {
            grid: dp,
            active: [i * (d.capacity + 1) + w],
            dependencies: [
              (i - 1) * (d.capacity + 1) + w,
              ...(take === null
                ? []
                : [(i - 1) * (d.capacity + 1) + w - d.weights[i - 1]]),
            ],
            variables: { item: i - 1, capacity: w, skip, take },
          },
        );
      }
    result = dp.at(-1).at(-1);
    base = { ...base, grid: dp };
  } else if (id === "xor") {
    let x = 0;
    base = { structure: "bits" };
    emit("Bắt đầu với 0; hai số giống nhau XOR sẽ triệt tiêu.", {
      bits: Array(10).fill(0),
      variables: { accumulator: 0 },
    });
    for (let i = 0; i < values.length; i++) {
      const before = x;
      x ^= values[i];
      emit(`${before} XOR ${values[i]} = ${x}.`, {
        active: [i],
        bits: Array.from({ length: 10 }, (_, k) => (x >> (9 - k)) & 1),
        variables: { before, operand: values[i], accumulator: x },
      });
    }
    result = x;
  } else if (id === "sort") {
    values = [...values];
    const snap = (caption) => emit(caption, { values });
    emit(`Bắt đầu ${variant}; màu xanh đánh dấu phần đang xét.`);
    const swap = (i, j) => {
      [values[i], values[j]] = [values[j], values[i]];
      emit(`Đổi chỗ chỉ số ${i} và ${j}.`, { values, active: [i, j] });
    };
    if (variant === "bubble")
      for (let end = values.length - 1; end > 0; end--)
        for (let i = 0; i < end; i++) {
          emit(`So hai hàng xóm ${values[i]} và ${values[i + 1]}.`, {
            values,
            active: [i, i + 1],
          });
          if (values[i] > values[i + 1]) swap(i, i + 1);
        }
    else if (variant === "selection")
      for (let i = 0; i < values.length; i++) {
        let m = i;
        for (let j = i + 1; j < values.length; j++) {
          if (values[j] < values[m]) m = j;
          emit(`Ứng viên nhỏ nhất cho vị trí ${i}: chỉ số ${m}.`, {
            values,
            active: [i, j, m],
          });
        }
        swap(i, m);
      }
    else if (variant === "merge") {
      const merge = (l, r) => {
        if (r - l < 2) return;
        const mid = (l + r) >> 1;
        emit(`Chia đoạn [${l},${r}) tại ${mid}.`, {
          values,
          active: Array.from({ length: r - l }, (_, i) => l + i),
        });
        merge(l, mid);
        merge(mid, r);
        const left = values.slice(l, mid),
          right = values.slice(mid, r),
          out = [];
        let i = 0,
          j = 0;
        while (i < left.length || j < right.length) {
          out.push(
            j === right.length || (i < left.length && left[i] <= right[j])
              ? left[i++]
              : right[j++],
          );
          emit("Lấy phần tử nhỏ hơn từ hai nửa đã sắp.", {
            values,
            secondary: out,
          });
        }
        values.splice(l, r - l, ...out);
        snap("Trộn xong đoạn; invariant: đoạn này đã tăng.");
      };
      merge(0, values.length);
    } else if (variant === "quick") {
      const quick = (l, r) => {
        if (l >= r) return;
        let i = l;
        const pivot = values[r];
        emit(`Chọn pivot ${pivot} ở ${r}.`, {
          values,
          pointers: { pivot: r },
          variables: { left: l, right: r },
        });
        for (let j = l; j < r; j++) if (values[j] <= pivot) swap(i++, j);
        swap(i, r);
        emit(`Pivot ở ${i}; bên trái ≤ pivot, bên phải > pivot.`, {
          values,
          pointers: { pivot: i },
        });
        quick(l, i - 1);
        quick(i + 1, r);
      };
      quick(0, values.length - 1);
    } else if (variant === "counting") {
      const min = Math.min(0, ...values),
        max = Math.max(0, ...values),
        counts = Array(max - min + 1).fill(0);
      for (const v of values) {
        counts[v - min]++;
        emit(`Đếm ${v} tại bucket ${v - min} (offset=${-min}).`, {
          values,
          secondary: counts,
          variables: { minimum: min, offset: -min },
        });
      }
      values = counts.flatMap((n, i) => Array(n).fill(i + min));
      snap("Phát mỗi key đủ số lần xuất hiện.");
    } else if (variant === "radix") {
      const sortDigits = (a, sign) => {
        const max = Math.max(0, ...a);
        for (let exp = 1; exp <= max; exp *= 10) {
          const buckets = Array.from({ length: 10 }, () => []);
          for (const v of a) buckets[Math.floor(v / exp) % 10].push(v);
          a = buckets.flat();
          emit(`Radix ${sign}: chữ số hàng ${exp}; mỗi bucket giữ thứ tự.`, {
            values: a,
            buckets: buckets.map((items, i) => ({ key: i, items })),
            variables: { digit: exp },
          });
        }
        return a;
      };
      values = [
        ...sortDigits(
          values.filter((x) => x < 0).map((x) => -x),
          "âm",
        )
          .reverse()
          .map((x) => -x),
        ...sortDigits(
          values.filter((x) => x >= 0),
          "không âm",
        ),
      ];
      snap("Ghép phần âm trước phần không âm.");
    } else if (variant === "heap") {
      const sift = (i, n) => {
        while (2 * i + 1 < n) {
          let j = 2 * i + 1;
          if (j + 1 < n && values[j + 1] > values[j]) j++;
          if (values[i] >= values[j]) break;
          swap(i, j);
          i = j;
        }
      };
      for (let i = (values.length >> 1) - 1; i >= 0; i--)
        sift(i, values.length);
      snap("Build max heap bottom-up.");
      for (let end = values.length - 1; end > 0; end--) {
        swap(0, end);
        sift(0, end);
        emit(`Phần từ ${end} đến cuối đã ở đúng vị trí.`, {
          values,
          done: Array.from({ length: values.length - end }, (_, i) => end + i),
        });
      }
    } else
      for (let i = 1; i < values.length; i++) {
        const v = values[i];
        let j = i - 1;
        while (j >= 0 && values[j] > v) {
          values[j + 1] = values[j];
          emit(`Dịch ${values[j]} sang phải để mở chỗ.`, {
            values,
            active: [j, j + 1],
            variables: { held: v },
          });
          j--;
        }
        values[j + 1] = v;
        snap(`Chèn ${v}; đoạn đầu dài ${i + 1} đã tăng.`);
      }
    result = values;
  }
  frames.push(
    structuredClone({
      caption: "Kết quả từ các bước thuật toán vừa chạy.",
      values,
      active: [],
      done: [],
      variables: {},
      ...base,
      result,
    }),
  );
  return {
    id,
    input: d,
    frames,
    truncated: count > 299,
    totalSteps: count + 1,
    algorithm: variant,
  };
}
