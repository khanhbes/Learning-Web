export const componentsGuide = {
  intuition:
    "Đếm các vùng trên bản đồ: mỗi lần bắt đầu BFS từ nơi chưa thăm là một vùng mới.",
  algorithm:
    "Dựng danh sách kề vô hướng. Duyệt mọi node; với node chưa thăm, tăng số vùng và dùng queue thăm toàn vùng. Đánh dấu khi enqueue.",
  counterexample:
    "Chỉ BFS từ node 0 sẽ bỏ sót các vùng tách biệt. Một node không có cạnh vẫn là một thành phần.",
  complexity: "O(V+E) thời gian; O(V+E) danh sách kề và O(V) trạng thái/queue.",
};
export function componentsSolution(language) {
  return language === "python"
    ? `def solve(data):
    n = data['n']
    adj = [[] for _ in range(n)]
    for u, v in data['edges']:
        adj[u].append(v)
        adj[v].append(u)
    seen = [False] * n
    components = 0
    for start in range(n):
        if seen[start]:
            continue
        components += 1
        seen[start] = True
        frontier = deque([start])
        while frontier:
            u = frontier.popleft()
            for v in adj[u]:
                if not seen[v]:
                    seen[v] = True
                    frontier.append(v)
    return components`
    : `json solve(json data) {
    int n = data["n"];
    vector<vector<int>> adj(n);
    for (auto edge : data["edges"]) {
        int u = edge[0], v = edge[1];
        adj[u].push_back(v);
        adj[v].push_back(u);
    }
    vector<bool> seen(n, false);
    int components = 0;
    for (int start = 0; start < n; ++start) {
        if (seen[start]) continue;
        ++components;
        seen[start] = true;
        queue<int> frontier;
        frontier.push(start);
        while (!frontier.empty()) {
            int u = frontier.front(); frontier.pop();
            for (int v : adj[u]) {
                if (!seen[v]) {
                    seen[v] = true;
                    frontier.push(v);
                }
            }
        }
    }
    return components;
}`;
}
