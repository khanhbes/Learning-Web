import { oracle, treeFrom } from "../content/problems.mjs";
import { detailedTrace } from "./detailed-traces.mjs";
// Teaching traces always use canonical algorithms, never execute learner code.
export function traceFor(id, data, options = {}) {
  const detailed = detailedTrace(id, data, options.variant);
  if (detailed) return detailed;
  const frames = [];
  let a =
    data.nums ??
    data.prices ??
    (data.s
      ? [...data.s]
      : data.a && Array.isArray(data.a)
        ? [...data.a, ...data.b]
        : []);
  const push = (caption, extra = {}) =>
    frames.push({
      caption,
      values: [...a],
      active: [],
      done: [],
      variables: {},
      ...structuredClone(extra),
    });
  if (["add", "parity"].includes(id)) {
    a = id === "add" ? [data.a, data.b] : [data.n];
    push("Nhận giá trị đầu vào.");
    push(
      id === "add"
        ? "Cộng a và b, rồi return."
        : "Tính phần dư khi chia cho 2.",
      { active: a.map((_, i) => i), variables: { result: oracle(id, data) } },
    );
  } else if (id === "window-max") {
    const q = [],
      output = [];
    push("Deque chứa chỉ số, giá trị giảm dần từ đầu tới cuối.", {
      structure: "queue",
    });
    for (let i = 0; i < a.length; i++) {
      while (q.length && q[0] <= i - data.k) {
        const expired = q.shift();
        push(`Bỏ chỉ số ${expired} đã ra ngoài cửa sổ.`, {
          active: [i],
          secondary: [...q],
          structure: "queue",
        });
      }
      while (q.length && a[q.at(-1)] <= a[i]) {
        const smaller = q.pop();
        push(
          `Bỏ ${smaller}: ${a[smaller]} không lớn hơn ${a[i]}, lại hết hạn sớm hơn.`,
          { active: [smaller, i], secondary: [...q], structure: "queue" },
        );
      }
      q.push(i);
      if (i >= data.k - 1) output.push(a[q[0]]);
      push(`Thêm chỉ số ${i}; đầu deque là ứng viên lớn nhất.`, {
        active: [q[0], i],
        pointers: { L: Math.max(0, i - data.k + 1), R: i },
        secondary: [...q],
        structure: "queue",
        variables: {
          indices: [...q],
          values: q.map((j) => a[j]),
          output: [...output],
        },
      });
    }
  } else if (
    [
      "sum",
      "maximum",
      "count",
      "stock",
      "xor",
      "house",
      "kadane",
      "product",
    ].includes(id)
  ) {
    let total = 0,
      best = a[0] ?? 0,
      minimum = Infinity,
      cur = a[0] ?? 0,
      previous = 0,
      current = 0,
      prefix = 1;
    push("Khởi tạo trạng thái trước khi duyệt.");
    a.forEach((v, i) => {
      total += v;
      if (id !== "stock") best = Math.max(best, v);
      minimum = Math.min(minimum, v);
      if (id === "stock") best = Math.max(i ? best : 0, v - minimum);
      if (id === "kadane") {
        cur = i ? Math.max(v, cur + v) : v;
        best = i ? Math.max(best, cur) : v;
      }
      if (id === "xor") current ^= v;
      if (id === "house")
        [previous, current] = [current, Math.max(current, previous + v)];
      prefix *= v;
      push(`Xét phần tử ở chỉ số ${i}: ${v}.`, {
        active: [i],
        done: Array.from({ length: i }, (_, j) => j),
        variables:
          id === "sum"
            ? { total }
            : id === "maximum"
              ? { best }
              : id === "count"
                ? {
                    count: a.slice(0, i + 1).filter((x) => x === data.target)
                      .length,
                  }
                : id === "stock"
                  ? { minimum, best }
                  : id === "kadane"
                    ? { current: cur, best }
                    : id === "product"
                      ? { prefix }
                      : { previous, current },
      });
    });
    if (id === "product") {
      let p = 1;
      for (let i = a.length - 1; i >= 0; i--) {
        push(`Kết hợp tích hậu tố ở chỉ số ${i}.`, {
          active: [i],
          variables: { suffix: p },
        });
        p *= a[i];
      }
    }
  } else if (["two-sum", "duplicate", "anagram"].includes(id)) {
    a = id === "anagram" ? [...data.s] : a;
    let map = {},
      found = false;
    push("Bảng nhớ ban đầu trống.");
    a.forEach((v, i) => {
      if (found) return;
      let need = (data.target ?? 0) - Number(v);
      if (id === "two-sum" && Object.hasOwn(map, String(need))) {
        push(`Đã gặp ${need} tại ${map[need]}; ghép với ${v}.`, {
          active: [map[need], i],
          variables: { target: data.target, map },
        });
        found = true;
      } else if (id === "duplicate" && Object.hasOwn(map, String(v))) {
        push(`${v} đã xuất hiện trước đó.`, {
          active: [i],
          variables: { map },
        });
        found = true;
      } else {
        map[v] = id === "anagram" ? (map[v] ?? 0) + 1 : i;
        push(`Ghi nhớ ${v}.`, { active: [i], variables: { map } });
      }
    });
    if (id === "anagram")
      push("Đối chiếu tần suất của chuỗi t.", {
        variables: { s: data.s, t: data.t },
      });
  } else if (["prefix", "difference"].includes(id)) {
    let p = [0],
      sum = 0;
    push("Bắt đầu với prefix[0]=0.");
    a.forEach((v, i) => {
      sum += v;
      p.push(sum);
      push(`prefix[${i + 1}] = prefix[${i}] + ${v} = ${sum}.`, {
        active: [i],
        secondary: p,
        variables: { sum },
      });
    });
    if (id === "prefix")
      for (const [l, r] of data.queries)
        push(
          `Tổng [${l},${r}] = prefix[${r + 1}] − prefix[${l}] = ${p[r + 1] - p[l]}.`,
          {
            active: Array.from({ length: r - l + 1 }, (_, i) => l + i),
            secondary: p,
            variables: { l, r, sum: p[r + 1] - p[l] },
          },
        );
    else {
      let diff = Array(a.length + 1).fill(0);
      for (const [l, r, v] of data.updates) {
        diff[l] += v;
        diff[r + 1] -= v;
        push(`Cộng ${v} ở diff[${l}], trừ ${v} ở diff[${r + 1}].`, {
          active: [l, r],
          secondary: diff,
        });
      }
      let add = 0;
      const values = [...a];
      for (let i = 0; i < a.length; i++) {
        add += diff[i];
        values[i] += add;
        push(`Tái dựng a[${i}] = ${values[i]}.`, {
          values: [...values],
          active: [i],
          secondary: diff,
          variables: { add },
        });
      }
    }
  } else if (["binary", "rotated"].includes(id)) {
    let left = 0,
      right = a.length - 1;
    push("Xác định đoạn tìm kiếm [left,right].");
    while (left <= right) {
      let mid = left + Math.floor((right - left) / 2);
      push(`mid=${mid}; so ${a[mid]} với target=${data.target}.`, {
        active: [mid],
        done: a.map((_, i) => i).filter((i) => i < left || i > right),
        pointers: { L: left, M: mid, R: right },
        variables: { left, right, mid, target: data.target },
      });
      if (a[mid] === data.target) break;
      if (id === "binary") {
        if (a[mid] < data.target) left = mid + 1;
        else right = mid - 1;
      } else if (a[left] <= a[mid]) {
        if (a[left] <= data.target && data.target < a[mid]) right = mid - 1;
        else left = mid + 1;
      } else {
        if (a[mid] < data.target && data.target <= a[right]) left = mid + 1;
        else right = mid - 1;
      }
    }
  } else if (id === "bad-version") {
    a = Array.from({ length: Math.min(data.n, 12) }, (_, i) => i + 1);
    let l = 1,
      r = data.n;
    push("Các phiên bản tốt đứng trước các phiên bản lỗi.");
    while (l < r) {
      let m = l + Math.floor((r - l) / 2);
      push(
        `Kiểm tra bản ${m}: ${m >= data.first ? "lỗi → tìm về trái" : "tốt → tìm về phải"}.`,
        { variables: { left: l, right: r, mid: m, isBad: m >= data.first } },
      );
      if (m >= data.first) r = m;
      else l = m + 1;
    }
  } else if (["sort", "merge-array", "merge-list"].includes(id)) {
    if (id !== "sort") {
      let i = 0,
        j = 0,
        result = [];
      push("Hai dãy đã có thứ tự.");
      while (i < data.a.length || j < data.b.length) {
        if (j >= data.b.length || (i < data.a.length && data.a[i] <= data.b[j]))
          result.push(data.a[i++]);
        else result.push(data.b[j++]);
        push("Lấy đầu nhỏ hơn vào dãy kết quả.", {
          secondary: [...result],
          variables: { i, j },
        });
      }
    } else {
      let b = [...a];
      push("Insertion Sort: phần đầu đang được xây thành dãy đã sắp.");
      for (let i = 1; i < b.length; i++) {
        let x = b[i],
          j = i - 1;
        while (j >= 0 && b[j] > x) {
          b[j + 1] = b[j];
          j--;
          push(`Dời phần tử lớn hơn ${x} sang phải.`, {
            values: [...b],
            active: [j + 1, j + 2],
            done: Array.from({ length: i }, (_, k) => k),
          });
        }
        b[j + 1] = x;
        push(`Chèn ${x} vào vị trí ${j + 1}.`, {
          values: [...b],
          active: [j + 1],
          done: Array.from({ length: i + 1 }, (_, k) => k),
        });
      }
    }
  } else if (
    [
      "window-sum",
      "substring",
      "replacement",
      "palindrome",
      "three-sum",
    ].includes(id)
  ) {
    push("Đặt con trỏ và trạng thái ban đầu.");
    if (id === "palindrome") {
      let l = 0,
        r = a.length - 1;
      while (l < r) {
        push(`So hai đầu: ${a[l]} và ${a[r]}.`, {
          active: [l, r],
          pointers: { L: l, R: r },
        });
        if (a[l] !== a[r]) break;
        l++;
        r--;
      }
    } else if (id === "window-sum") {
      let sum = 0;
      for (let r = 0; r < a.length; r++) {
        sum += a[r];
        if (r >= data.k) sum -= a[r - data.k];
        push(`Cửa sổ kết thúc ở ${r}, tổng=${sum}.`, {
          active: Array.from(
            { length: Math.min(r + 1, data.k) },
            (_, i) => Math.max(0, r - data.k + 1) + i,
          ),
          pointers: { L: Math.max(0, r - data.k + 1), R: r },
          variables: { sum, k: data.k },
        });
      }
    } else if (id === "three-sum") {
      let b = [...a].sort((x, y) => x - y);
      a = b;
      for (let i = 0; i < b.length - 2; i++) {
        if (i && b[i] === b[i - 1]) continue;
        let l = i + 1,
          r = b.length - 1;
        while (l < r) {
          let sum = b[i] + b[l] + b[r];
          push(`Cố định i=${i}; tổng=${sum}.`, {
            values: b,
            active: [i, l, r],
            pointers: { I: i, L: l, R: r },
            variables: { sum },
          });
          if (sum === 0) {
            l++;
            r--;
            while (l < r && b[l] === b[l - 1]) l++;
            while (l < r && b[r] === b[r + 1]) r--;
          } else if (sum < 0) l++;
          else r--;
        }
      }
    } else {
      let left = 0,
        last = {},
        freq = {},
        max = 0;
      for (let right = 0; right < a.length; right++) {
        let v = a[right];
        if (id === "substring") left = Math.max(left, (last[v] ?? -1) + 1);
        else {
          freq[v] = (freq[v] ?? 0) + 1;
          max = Math.max(max, freq[v]);
          while (right - left + 1 - max > data.k) freq[a[left++]]--;
        }
        last[v] = right;
        push(`Cửa sổ [${left},${right}] dài ${right - left + 1}.`, {
          active: Array.from({ length: right - left + 1 }, (_, i) => left + i),
          pointers: { L: left, R: right },
          variables: {
            left,
            right,
            ...(id === "replacement" ? { k: data.k, maxFrequency: max } : {}),
          },
        });
      }
    }
  } else if (
    ["parentheses", "min-stack", "queue", "temperatures"].includes(id)
  ) {
    let st = [],
      mins = [];
    push("Cấu trúc ban đầu rỗng.", {
      structure: id === "queue" ? "queue" : "stack",
      secondary: [],
    });
    if (id === "parentheses") {
      for (let i = 0; i < a.length; i++) {
        let c = a[i],
          mp = { ")": "(", "]": "[", "}": "{" };
        if (mp[c]) {
          if (st.at(-1) !== mp[c]) {
            push(`Dấu ${c} không khớp top.`, {
              active: [i],
              secondary: st,
              structure: "stack",
            });
            break;
          }
          st.pop();
        } else st.push(c);
        push(`Xử lý dấu ${c}.`, {
          active: [i],
          secondary: [...st],
          structure: "stack",
        });
      }
    } else if (id === "temperatures") {
      let answer = Array(a.length).fill(0);
      for (let i = 0; i < a.length; i++) {
        while (st.length && a[i] > a[st.at(-1)]) {
          let j = st.pop();
          answer[j] = i - j;
          push(`Ngày ${i} ấm hơn ngày ${j}; chờ ${i - j} ngày.`, {
            active: [j, i],
            secondary: [...st],
            variables: { answer: [...answer] },
            structure: "stack",
          });
        }
        st.push(i);
        push(`Lưu chỉ số ${i} chưa có ngày ấm hơn.`, {
          active: [i],
          secondary: [...st],
          structure: "stack",
        });
      }
    } else
      for (const [op, value] of data.ops) {
        if (op === "push") {
          st.push(value);
          mins.push(Math.min(value, mins.at(-1) ?? value));
        } else if (op === "pop") {
          if (id === "queue") st.shift();
          else {
            st.pop();
            mins.pop();
          }
        }
        push(`${op}${value !== undefined ? " " + value : ""}.`, {
          secondary: [...st],
          structure: id === "queue" ? "queue" : "stack",
          variables: {
            ...(id === "min-stack" ? { minimum: mins.at(-1) ?? "—" } : {}),
          },
        });
      }
  } else if (["reverse-list", "list-cycle"].includes(id)) {
    const edges = a.slice(1).map((_, i) => [i, i + 1]);
    if (id === "reverse-list") {
      push("head trỏ vào node đầu.", { edges, structure: "linked" });
      for (let i = 0; i < a.length; i++) {
        const links = [];
        for (let j = 1; j <= i; j++) links.push([j, j - 1]);
        for (let j = i + 1; j < a.length - 1; j++) links.push([j, j + 1]);
        push(`Lưu next, rồi đổi node ${i}.next về previous.`, {
          edges: links,
          active: [i],
          structure: "linked",
          variables: {
            previous: i > 0 ? i - 1 : null,
            current: i,
            next: i + 1 < a.length ? i + 1 : null,
          },
        });
      }
    } else {
      if (a.length && data.pos >= 0) edges.push([a.length - 1, data.pos]);
      let slow = 0,
        fast = 0;
      push("Slow và fast cùng xuất phát từ head.", {
        edges,
        structure: "linked",
      });
      const next = (i) => (i < a.length - 1 ? i + 1 : data.pos);
      for (let step = 0; step < a.length * 2 + 1 && a.length; step++) {
        if (fast < 0 || next(fast) < 0) break;
        slow = next(slow);
        fast = next(next(fast));
        push(`Slow=${slow}, fast=${fast}.`, {
          edges,
          active: [slow, fast].filter((x) => x >= 0),
          pointers: { S: slow, F: fast },
          structure: "linked",
        });
        if (slow === fast) break;
      }
    }
  } else if (
    [
      "depth",
      "invert",
      "lca",
      "diameter",
      "same-tree",
      "codec",
      "tree-dp",
    ].includes(id)
  ) {
    let root = treeFrom(data.tree ?? data.p),
      nodes = [],
      edges = [];
    function visit(n, parent = -1, level = 0, x = 400, width = 180) {
      if (!n) return;
      let index = nodes.length;
      nodes.push({ id: index, value: n.v, x, y: level * 88 + 42 });
      if (parent >= 0) edges.push([parent, index]);
      visit(n.left, index, level + 1, x - width, width / 2);
      visit(n.right, index, level + 1, x + width, width / 2);
    }
    visit(root);
    a = nodes.map((n) => n.value);
    push("Cây được dựng từ level-order, giữ vị trí null.", {
      nodes,
      edges,
      structure: "tree",
    });
    const order =
      id === "codec"
        ? nodes.map((n) => n.id)
        : [...nodes].reverse().map((n) => n.id);
    for (let i = 0; i < order.length; i++)
      push(
        id === "codec"
          ? "BFS: xử lý theo tầng."
          : "Giải cây con trước, rồi kết hợp tại node đang xét.",
        {
          nodes,
          edges,
          structure: "tree",
          active: [order[i]],
          done: order.slice(0, i),
          variables: { node: nodes[order[i]].value },
        },
      );
  } else if (
    [
      "islands",
      "clone",
      "graph-cycle",
      "union-find",
      "topo",
      "shortest",
      "bellman",
      "mst",
    ].includes(id)
  ) {
    if (id === "islands") {
      const g = data.grid,
        h = g.length,
        w = g[0]?.length ?? 0;
      let seen = new Set(),
        component = 0;
      push("Mỗi ô 1 là đất; chỉ nối theo 4 hướng.", {
        grid: g,
        structure: "grid",
      });
      for (let i = 0; i < h; i++)
        for (let j = 0; j < w; j++)
          if (g[i][j] && !seen.has(i * w + j)) {
            component++;
            let q = [[i, j]];
            seen.add(i * w + j);
            for (let k = 0; k < q.length; k++) {
              const [x, y] = q[k];
              for (const [dx, dy] of [
                [1, 0],
                [-1, 0],
                [0, 1],
                [0, -1],
              ]) {
                let xx = x + dx,
                  yy = y + dy;
                if (
                  xx >= 0 &&
                  xx < h &&
                  yy >= 0 &&
                  yy < w &&
                  g[xx][yy] &&
                  !seen.has(xx * w + yy)
                ) {
                  seen.add(xx * w + yy);
                  q.push([xx, yy]);
                }
              }
              push(`Đang thăm đảo ${component}.`, {
                grid: g,
                structure: "grid",
                active: [x * w + y],
                done: [...seen],
                variables: { islands: component, frontier: q.slice(k + 1) },
              });
            }
          }
    } else {
      const n = data.n ?? data.adj.length,
        edges =
          data.edges ??
          data.adj
            .flatMap((row, i) => row.map((j) => [i, j]))
            .filter(([i, j]) => i < j);
      const nodes = Array.from({ length: n }, (_, i) => ({
        id: i,
        value: i,
        x:
          400 +
          Math.cos((i * 2 * Math.PI) / Math.max(1, n) - Math.PI / 2) * 180,
        y:
          210 +
          Math.sin((i * 2 * Math.PI) / Math.max(1, n) - Math.PI / 2) * 155,
      }));
      a = nodes.map((n) => n.value);
      const base = {
        nodes,
        edges,
        structure: id === "clone" ? "undirected" : "graph",
      };
      push("Biểu diễn đồ thị từ cùng danh sách cạnh.", base);
      if (["shortest", "bellman"].includes(id)) {
        let dist = Array(n).fill(Infinity);
        dist[data.start] = 0;
        if (id === "shortest") {
          const frontier = [[0, data.start]],
            settled = [];
          while (frontier.length) {
            frontier.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
            const [distance, u] = frontier.shift();
            if (distance !== dist[u]) {
              push(
                `Bỏ entry cũ của node ${u}: ${distance} khác dist=${dist[u]}.`,
                { ...base, active: [u] },
              );
              continue;
            }
            settled.push(u);
            push(`Lấy node ${u} có khoảng cách nhỏ nhất ${distance}.`, {
              ...base,
              active: [u],
              done: [...settled],
              variables: {
                frontier: structuredClone(frontier),
                dist: dist.map((x) => (Number.isFinite(x) ? x : "∞")),
              },
            });
            for (const [from, v, w] of edges)
              if (from === u && distance + w < dist[v]) {
                dist[v] = distance + w;
                frontier.push([dist[v], v]);
                push(`Relax ${u}→${v}: ${distance}+${w}=${dist[v]}.`, {
                  ...base,
                  active: [u, v],
                  done: [...settled],
                  variables: {
                    dist: dist.map((x) => (Number.isFinite(x) ? x : "∞")),
                    frontier: structuredClone(frontier),
                  },
                });
              }
          }
        } else
          for (let round = 0; round < n - 1; round++) {
            let changed = false;
            for (const [u, v, w] of edges)
              if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                changed = true;
                push(`Relax ${u}→${v} với w=${w}: dist[${v}]=${dist[v]}.`, {
                  ...base,
                  active: [u, v],
                  variables: {
                    dist: dist.map((x) => (Number.isFinite(x) ? x : "∞")),
                  },
                });
              }
            if (!changed) break;
          }
      } else if (id === "topo") {
        const ind = Array(n).fill(0);
        for (const [u, v] of edges) ind[v]++;
        let q = ind.flatMap((x, i) => (x === 0 ? [i] : [])),
          order = [];
        for (let k = 0; k < q.length; k++) {
          const u = q[k];
          order.push(u);
          for (const [x, v] of edges) if (x === u && --ind[v] === 0) q.push(v);
          push(`Lấy node ${u} có indegree=0.`, {
            ...base,
            active: [u],
            done: [...order],
            variables: { order: [...order], indegree: [...ind] },
          });
        }
      } else {
        let adj = Array.from({ length: n }, () => []);
        for (const [u, v] of edges) {
          adj[u].push(v);
          adj[v].push(u);
        }
        let seen = new Set();
        for (let start = 0; start < n; start++) {
          if (seen.has(start)) continue;
          let q = [start];
          seen.add(start);
          for (let k = 0; k < q.length; k++) {
            let u = q[k];
            for (let v of adj[u])
              if (!seen.has(v)) {
                seen.add(v);
                q.push(v);
              }
            push(`BFS thăm node ${u}; đánh dấu trước khi đưa vào queue.`, {
              ...base,
              active: [u],
              done: [...seen],
              variables: { queue: q.slice(k + 1) },
            });
          }
        }
      }
    }
  } else if (["top-k", "priority"].includes(id)) {
    a = id === "priority" ? data.tasks.map((t) => t.priority) : a;
    let heap = [];
    const compare = (x, y) =>
      id === "priority"
        ? x.priority - y.priority || x.order - y.order || x.id - y.id
        : x - y;
    const show = (caption, active = []) =>
      push(caption, {
        active,
        secondary: heap.map((x) => (typeof x === "object" ? x.priority : x)),
        structure: "heap",
        variables: {
          k: data.k ?? "—",
          heap: structuredClone(heap),
          top: heap[0] ?? null,
        },
      });
    const removeMin = () => {
      const root = heap[0],
        last = heap.pop();
      if (heap.length) {
        heap[0] = last;
        show("Đưa phần tử cuối lên gốc để sift-down.");
        let i = 0;
        while (2 * i + 1 < heap.length) {
          let child = 2 * i + 1;
          if (
            child + 1 < heap.length &&
            compare(heap[child + 1], heap[child]) < 0
          )
            child++;
          if (compare(heap[i], heap[child]) <= 0) break;
          [heap[i], heap[child]] = [heap[child], heap[i]];
          show(`Sift-down: đổi vị trí ${i} và ${child}.`);
          i = child;
        }
      }
      return root;
    };
    push("Min heap ban đầu rỗng.", { structure: "heap" });
    for (let i = 0; i < a.length; i++) {
      heap.push(id === "priority" ? data.tasks[i] : a[i]);
      show(`Thêm ${a[i]} vào cuối heap.`, [i]);
      let j = heap.length - 1;
      while (j > 0) {
        const parent = (j - 1) >> 1;
        if (compare(heap[parent], heap[j]) <= 0) break;
        [heap[parent], heap[j]] = [heap[j], heap[parent]];
        show(`Sift-up: đổi vị trí ${parent} và ${j}.`, [i]);
        j = parent;
      }
      if (id === "top-k" && heap.length > data.k) {
        removeMin();
        show("Bỏ giá trị nhỏ nhất, giữ k giá trị lớn nhất.");
      }
    }
    if (id === "priority") {
      const order = [];
      while (heap.length) {
        order.push(removeMin().id);
        show(
          `Lấy công việc tiếp theo: ${order.at(-1)}. Thứ tự: ${order.join(", ")}.`,
        );
      }
    }
  } else if (
    ["fib", "knapsack", "lcs", "edit", "coin", "lis", "interval-dp"].includes(
      id,
    )
  ) {
    if (id === "fib") {
      a = Array.from({ length: data.n + 1 }, (_, i) => i);
      let dp = [0, 1];
      push("Base case: F(0)=0, F(1)=1.", { secondary: dp });
      for (let i = 2; i <= data.n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2];
        push(`dp[${i}] = ${dp[i - 1]} + ${dp[i - 2]} = ${dp[i]}.`, {
          active: [i],
          secondary: [...dp],
          variables: { state: i },
        });
      }
    } else if (id === "knapsack") {
      let dp = Array(data.capacity + 1).fill(0);
      a = data.weights;
      push("dp[w] ban đầu =0, không lấy vật nào.", { secondary: dp });
      for (let i = 0; i < a.length; i++) {
        for (let w = data.capacity; w >= a[i]; w--)
          dp[w] = Math.max(dp[w], dp[w - a[i]] + data.values[i]);
        push(
          `Xét vật ${i}: wt=${a[i]}, value=${data.values[i]}; capacity đi giảm.`,
          { active: [i], secondary: [...dp] },
        );
      }
    } else if (["lcs", "edit"].includes(id)) {
      a = [...data.a];
      let dp = Array.from({ length: a.length + 1 }, () =>
        Array(data.b.length + 1).fill(0),
      );
      if (id === "edit") {
        for (let i = 0; i <= a.length; i++) dp[i][0] = i;
        for (let j = 0; j <= data.b.length; j++) dp[0][j] = j;
      }
      for (let i = 1; i <= a.length; i++)
        for (let j = 1; j <= data.b.length; j++) {
          dp[i][j] =
            data.a[i - 1] === data.b[j - 1]
              ? dp[i - 1][j - 1] + (id === "lcs" ? 1 : 0)
              : id === "lcs"
                ? Math.max(dp[i - 1][j], dp[i][j - 1])
                : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
          push(`Tính dp[${i}][${j}] từ các state đã biết.`, {
            grid: dp.map((row) => [...row]),
            structure: "matrix",
            active: [i * (data.b.length + 1) + j],
            dependencies:
              data.a[i - 1] === data.b[j - 1]
                ? [(i - 1) * (data.b.length + 1) + j - 1]
                : [
                    (i - 1) * (data.b.length + 1) + j,
                    i * (data.b.length + 1) + j - 1,
                    ...(id === "edit"
                      ? [(i - 1) * (data.b.length + 1) + j - 1]
                      : []),
                  ],
            variables: { a: data.a, b: data.b },
          });
        }
    } else
      push("Tính state từ các trạng thái nhỏ hơn theo recurrence trong bài.", {
        variables: { input: data },
      });
  } else if (["subsets", "nqueens"].includes(id)) {
    let path = [];
    if (id === "subsets") {
      const f = (i) => {
        if (i === a.length) {
          push("Đạt lá: lưu bản sao path.", {
            secondary: [...path],
            structure: "stack",
          });
          return;
        }
        push(`Không chọn a[${i}].`, {
          active: [i],
          secondary: [...path],
          structure: "stack",
        });
        f(i + 1);
        path.push(a[i]);
        push(`Chọn ${a[i]}.`, {
          active: [i],
          secondary: [...path],
          structure: "stack",
        });
        f(i + 1);
        path.pop();
        push("Hoàn tác để thử nhánh khác.", {
          secondary: [...path],
          structure: "stack",
        });
      };
      f(0);
    } else
      push("Thử cột, kiểm tra hai đường chéo và hoàn tác.", {
        variables: { n: data.n },
      });
  } else if (id === "schedule") {
    a = data.intervals.map((e) => `[${e[0]},${e[1]})`);
    let sorted = [...data.intervals].sort((a, b) => a[1] - b[1]),
      end = -Infinity,
      count = 0;
    push("Sắp khoảng theo thời gian kết thúc.");
    for (let [s, e] of sorted) {
      let accept = s >= end;
      if (accept) {
        count++;
        end = e;
      }
      push(`${accept ? "Chọn" : "Bỏ"} [${s},${e}).`, {
        variables: { end, count },
      });
    }
  } else
    push("Đọc dữ liệu, áp dụng thuật toán chuẩn trong bài.", {
      variables: { input: data },
    });
  push("Kết quả của thuật toán chuẩn.", {
    result: oracle(id, data),
    done: a.map((_, i) => i),
  });
  return {
    id,
    input: data,
    frames:
      frames.length > 300 ? [...frames.slice(0, 299), frames.at(-1)] : frames,
    truncated: frames.length > 300,
  };
}
