// Reference implementations are executed against independently checked fixtures.
// These helpers are available in the editor harness and in the solutions viewer.
export const pythonHelpers = `import json, sys, heapq, bisect
from collections import deque, Counter
class ListNode:
    def __init__(self, val=0, next=None): self.val, self.next = val, next
def make_list(values):
    dummy = ListNode(); tail = dummy
    for v in values: tail.next = ListNode(v); tail = tail.next
    return dummy.next
def list_values(head):
    result = []
    while head: result.append(head.val); head = head.next
    return result
class TreeNode:
    def __init__(self, val): self.val, self.left, self.right = val, None, None
def make_tree(values):
    if not values or values[0] is None: return None
    root = TreeNode(values[0]); q = deque([root]); i = 1
    while q and i < len(values):
        node = q.popleft()
        for key in ('left', 'right'):
            if i < len(values):
                v = values[i]; i += 1
                if v is not None:
                    child = TreeNode(v); setattr(node, key, child); q.append(child)
    return root
def tree_values(root):
    if not root: return []
    q = deque([root]); values = []
    while q:
        node = q.popleft(); values.append(node.val if node else None)
        if node: q.extend([node.left, node.right])
    while values and values[-1] is None: values.pop()
    return values
def is_bad(v): return v >= __fixture['first']
`;
export const cppHelpers = `#include <bits/stdc++.h>
#include <nlohmann/json.hpp>
using namespace std;
using json = nlohmann::json;
struct ListNode {int val; ListNode* next; ListNode(int v):val(v),next(nullptr){}};
ListNode* make_list(const json& a) {ListNode dummy(0);auto t=&dummy;for(auto v:a){t->next=new ListNode(v.get<int>());t=t->next;}return dummy.next;}
json list_values(ListNode* h){json a=json::array();while(h){a.push_back(h->val);h=h->next;}return a;}
struct TreeNode{int val;TreeNode *left=nullptr,*right=nullptr;TreeNode(int v):val(v){}};
TreeNode* make_tree(const json& a){if(a.empty()||a[0].is_null())return nullptr;auto root=new TreeNode(a[0].get<int>());queue<TreeNode*>q;q.push(root);size_t i=1;while(!q.empty()&&i<a.size()){auto n=q.front();q.pop();for(auto ptr:{&n->left,&n->right})if(i<a.size()){auto v=a[i++];if(!v.is_null()){*ptr=new TreeNode(v.get<int>());q.push(*ptr);}}}return root;}
json tree_values(TreeNode* root){json a=json::array();if(!root)return a;queue<TreeNode*>q;q.push(root);while(!q.empty()){auto n=q.front();q.pop();if(n){a.push_back(n->val);q.push(n->left);q.push(n->right);}else a.push_back(nullptr);}while(!a.empty()&&a.back().is_null())a.erase(a.size()-1);return a;}
json __fixture;
bool isBad(int v){return v>=__fixture["first"].get<int>();}
`;
const py = {
  "window-max": `a = data['nums']; k = data['k']; q = deque(); result = []
for i, value in enumerate(a):
    while q and q[0] <= i-k: q.popleft()
    while q and a[q[-1]] <= value: q.pop()
    q.append(i)
    if i >= k-1: result.append(a[q[0]])
return result`,
  add: `return data['a'] + data['b']`,
  parity: `return data['n'] % 2 == 0`,
  sum: `total = 0
for value in data['nums']: total += value
return total`,
  maximum: `best = data['nums'][0]
for value in data['nums']: best = max(best, value)
return best`,
  count: `count = 0
for value in data['nums']:
    if value == data['target']: count += 1
return count`,
  "two-sum": `seen = {}
for i, value in enumerate(data['nums']):
    complement = data['target'] - value
    if complement in seen: return [seen[complement], i]
    seen[value] = i
return []`,
  stock: `minimum = float('inf'); best = 0
for price in data['prices']:
    best = max(best, price - minimum)
    minimum = min(minimum, price)
return best`,
  duplicate: `seen = set()
for value in data['nums']:
    if value in seen: return True
    seen.add(value)
return False`,
  product: `a = data['nums']; result = [1] * len(a); prefix = 1
for i, value in enumerate(a): result[i] = prefix; prefix *= value
suffix = 1
for i in range(len(a)-1, -1, -1): result[i] *= suffix; suffix *= a[i]
return result`,
  kadane: `a = data['nums']; current = best = a[0]
for value in a[1:]: current = max(value, current + value); best = max(best, current)
return best`,
  "merge-array": `a, b = data['a'], data['b']; i = j = 0; result = []
while i < len(a) and j < len(b):
    if a[i] <= b[j]: result.append(a[i]); i += 1
    else: result.append(b[j]); j += 1
return result + a[i:] + b[j:]`,
  anagram: `return Counter(data['s']) == Counter(data['t'])`,
  substring: `last = {}; left = best = 0
for right, char in enumerate(data['s']):
    left = max(left, last.get(char, -1) + 1)
    last[char] = right
    best = max(best, right-left+1)
return best`,
  replacement: `frequency = Counter(); left = best = maximum = 0
for right, char in enumerate(data['s']):
    frequency[char] += 1; maximum = max(maximum, frequency[char])
    while right-left+1-maximum > data['k']:
        frequency[data['s'][left]] -= 1; left += 1
    best = max(best, right-left+1)
return best`,
  binary: `a = data['nums']; left, right = 0, len(a)-1
while left <= right:
    mid = left + (right-left)//2
    if a[mid] == data['target']: return mid
    if a[mid] < data['target']: left = mid + 1
    else: right = mid - 1
return -1`,
  rotated: `a = data['nums']; left, right = 0, len(a)-1; target = data['target']
while left <= right:
    mid = (left+right)//2
    if a[mid] == target: return mid
    if a[left] <= a[mid]:
        if a[left] <= target < a[mid]: right = mid-1
        else: left = mid+1
    else:
        if a[mid] < target <= a[right]: left = mid+1
        else: right = mid-1
return -1`,
  "bad-version": `left, right = 1, data['n']
while left < right:
    mid = left + (right-left)//2
    if is_bad(mid): right = mid
    else: left = mid+1
return left`,
  "reverse-list": `current = make_list(data['nums']); previous = None
while current:
    following = current.next; current.next = previous
    previous, current = current, following
return list_values(previous)`,
  "merge-list": `a, b = make_list(data['a']), make_list(data['b']); dummy = ListNode(); tail = dummy
while a and b:
    if a.val <= b.val: tail.next = a; a = a.next
    else: tail.next = b; b = b.next
    tail = tail.next
tail.next = a or b
return list_values(dummy.next)`,
  "list-cycle": `head = make_list(data['nums']); nodes = []; current = head
while current: nodes.append(current); current = current.next
if nodes and data['pos'] >= 0: nodes[-1].next = nodes[data['pos']]
slow = fast = head
while fast and fast.next:
    slow, fast = slow.next, fast.next.next
    if slow is fast: return True
return False`,
  parentheses: `stack = []; opening = {')':'(', ']':'[', '}':'{'}
for char in data['s']:
    if char in opening:
        if not stack or stack.pop() != opening[char]: return False
    else: stack.append(char)
return not stack`,
  "min-stack": `stack = []; minima = []; result = []
for op in data['ops']:
    if op[0] == 'push':
        stack.append(op[1]); minima.append(min(op[1], minima[-1] if minima else op[1])); result.append(None)
    elif op[0] == 'pop': stack.pop(); minima.pop(); result.append(None)
    elif op[0] == 'top': result.append(stack[-1])
    else: result.append(minima[-1])
return result`,
  temperatures: `a = data['nums']; answer = [0]*len(a); stack = []
for i, temperature in enumerate(a):
    while stack and temperature > a[stack[-1]]:
        j = stack.pop(); answer[j] = i-j
    stack.append(i)
return answer`,
  depth: `def height(node): return 0 if not node else 1 + max(height(node.left), height(node.right))
return height(make_tree(data['tree']))`,
  invert: `def invert(node):
    if node: node.left, node.right = invert(node.right), invert(node.left)
    return node
return tree_values(invert(make_tree(data['tree'])))`,
  lca: `def find(node):
    if not node or node.val in (data['p'], data['q']): return node
    left, right = find(node.left), find(node.right)
    return node if left and right else left or right
return find(make_tree(data['tree'])).val`,
  diameter: `best = 0
def height(node):
    nonlocal best
    if not node: return 0
    left, right = height(node.left), height(node.right)
    best = max(best, left+right)
    return 1+max(left, right)
height(make_tree(data['tree']))
return best`,
  "same-tree": `def same(p, q):
    if not p or not q: return p is q
    return p.val == q.val and same(p.left,q.left) and same(p.right,q.right)
return same(make_tree(data['p']), make_tree(data['q']))`,
  codec: `root = make_tree(data['tree']); queue = deque([root]) if root else deque(); parts = []
while queue:
    node = queue.popleft(); parts.append(str(node.val) if node else '#')
    if node: queue.extend([node.left, node.right])
encoded = ','.join(parts)
# Decode the serialized values into a new tree.
values = [None if x == '#' else int(x) for x in encoded.split(',')] if encoded else []
decoded = make_tree(values)
return {'encoded': encoded, 'decoded': tree_values(decoded)}`,
  islands: `grid = [row[:] for row in data['grid']]; count = 0; h = len(grid); w = len(grid[0]) if h else 0
for i in range(h):
    for j in range(w):
        if not grid[i][j]: continue
        count += 1; grid[i][j] = 0; stack = [(i,j)]
        while stack:
            x,y = stack.pop()
            for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
                xx,yy = x+dx,y+dy
                if 0 <= xx < h and 0 <= yy < w and grid[xx][yy]: grid[xx][yy] = 0; stack.append((xx,yy))
return count`,
  clone: `class Node:
    def __init__(self, val): self.val, self.neighbors = val, []
original = [Node(i) for i in range(len(data['adj']))]
for i, row in enumerate(data['adj']): original[i].neighbors = [original[j] for j in row]
copies = {}
def copy(node):
    if node in copies: return copies[node]
    result = Node(node.val); copies[node] = result
    result.neighbors = [copy(neighbor) for neighbor in node.neighbors]
    return result
return [[neighbor.val for neighbor in copy(node).neighbors] for node in original]`,
  "graph-cycle": `parent = list(range(data['n']))
def find(x):
    while parent[x] != x: parent[x] = parent[parent[x]]; x = parent[x]
    return x
for u,v in data['edges']:
    a,b = find(u),find(v)
    if a == b: return True
    parent[a] = b
return False`,
  fib: `previous, current = 0, 1
for _ in range(data['n']): previous, current = current, previous+current
return previous`,
  knapsack: `dp = [0]*(data['capacity']+1)
for weight,value in zip(data['weights'],data['values']):
    for capacity in range(data['capacity'],weight-1,-1): dp[capacity] = max(dp[capacity],dp[capacity-weight]+value)
return dp[data['capacity']]`,
  lcs: `a,b = data['a'],data['b']; dp = [[0]*(len(b)+1) for _ in range(len(a)+1)]
for i in range(1,len(a)+1):
    for j in range(1,len(b)+1): dp[i][j] = dp[i-1][j-1]+1 if a[i-1] == b[j-1] else max(dp[i-1][j],dp[i][j-1])
return dp[-1][-1]`,
  prefix: `prefix = [0]
for value in data['nums']: prefix.append(prefix[-1]+value)
return [prefix[r+1]-prefix[l] for l,r in data['queries']]`,
  difference: `a = data['nums']; difference = [0]*(len(a)+1)
for l,r,value in data['updates']: difference[l] += value; difference[r+1] -= value
current = 0; result = []
for i,value in enumerate(a): current += difference[i]; result.append(value+current)
return result`,
  queue: `queue = deque(); result = []
for op in data['ops']:
    if op[0] == 'push': queue.append(op[1]); result.append(None)
    else: result.append(queue.popleft())
return result`,
  sort: `a = list(data['nums'])
def merge_sort(values):
    if len(values) <= 1: return values
    middle = len(values)//2
    left, right = merge_sort(values[:middle]), merge_sort(values[middle:])
    result = []; i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]: result.append(left[i]); i += 1
        else: result.append(right[j]); j += 1
    return result + left[i:] + right[j:]
return merge_sort(a)`,
  palindrome: `s = data['s']; left,right = 0,len(s)-1
while left < right:
    if s[left] != s[right]: return False
    left += 1; right -= 1
return True`,
  "three-sum": `a = sorted(data['nums']); result = []
for i in range(len(a)-2):
    if i and a[i] == a[i-1]: continue
    left,right = i+1,len(a)-1
    while left < right:
        total = a[i]+a[left]+a[right]
        if total == 0:
            result.append([a[i],a[left],a[right]]); left += 1; right -= 1
            while left < right and a[left] == a[left-1]: left += 1
            while left < right and a[right] == a[right+1]: right -= 1
        elif total < 0: left += 1
        else: right -= 1
return result`,
  "window-sum": `a = data['nums']; k = data['k']; current = best = sum(a[:k])
for right in range(k,len(a)): current += a[right]-a[right-k]; best = max(best,current)
return best`,
  subsets: `result = []; path = []; a = data['nums']
def explore(i):
    if i == len(a): result.append(path[:]); return
    explore(i+1); path.append(a[i]); explore(i+1); path.pop()
explore(0)
return result`,
  "top-k": `heap = []
for value in data['nums']:
    heapq.heappush(heap,value)
    if len(heap) > data['k']: heapq.heappop(heap)
return heap[0]`,
  schedule: `end = float('-inf'); count = 0
for start,finish in sorted(data['intervals'],key=lambda x:x[1]):
    if start >= end: count += 1; end = finish
return count`,
  topo: `adj = [[] for _ in range(data['n'])]; degree = [0]*data['n']
for u,v in data['edges']: adj[u].append(v); degree[v] += 1
queue = deque(i for i,v in enumerate(degree) if v == 0); order = []
while queue:
    u = queue.popleft(); order.append(u)
    for v in adj[u]:
        degree[v] -= 1
        if degree[v] == 0: queue.append(v)
return order if len(order) == data['n'] else []`,
  shortest: `adj = [[] for _ in range(data['n'])]
for u,v,w in data['edges']: adj[u].append((v,w))
dist = [float('inf')]*data['n']; dist[data['start']] = 0; heap = [(0,data['start'])]
while heap:
    current,u = heapq.heappop(heap)
    if current != dist[u]: continue
    for v,w in adj[u]:
        if current+w < dist[v]: dist[v] = current+w; heapq.heappush(heap,(dist[v],v))
return [v if v != float('inf') else -1 for v in dist]`,
  xor: `result = 0
for value in data['nums']: result ^= value
return result`,
  priority: `heap = [(t['priority'],t['order'],t['id']) for t in data['tasks']]; heapq.heapify(heap)
return [heapq.heappop(heap)[2] for _ in range(len(heap))]`,
  "union-find": `parent = list(range(data['n'])); count = data['n']
def find(x):
    if parent[x] != x: parent[x] = find(parent[x])
    return parent[x]
for u,v in data['edges']:
    a,b = find(u),find(v)
    if a != b: parent[a] = b; count -= 1
return count`,
  coin: `dp = [float('inf')]*(data['amount']+1); dp[0] = 0
for value in range(1,data['amount']+1):
    for coin in data['coins']:
        if coin <= value: dp[value] = min(dp[value],dp[value-coin]+1)
return -1 if dp[-1] == float('inf') else dp[-1]`,
  lis: `tails = []
for value in data['nums']:
    i = bisect.bisect_left(tails,value)
    if i == len(tails): tails.append(value)
    else: tails[i] = value
return len(tails)`,
  edit: `a,b = data['a'],data['b']; previous = list(range(len(b)+1))
for i,x in enumerate(a,1):
    current = [i]+[0]*len(b)
    for j,y in enumerate(b,1): current[j] = previous[j-1] if x == y else 1+min(previous[j-1],previous[j],current[j-1])
    previous = current
return previous[-1]`,
  trie: `root = {'count':0,'children':{}}
for word in data['words']:
    node = root; node['count'] += 1
    for char in word:
        node = node['children'].setdefault(char,{'count':0,'children':{}}); node['count'] += 1
result = []
for prefix in data['prefixes']:
    node = root
    for char in prefix: node = node['children'].get(char) if node else None
    result.append(node['count'] if node else 0)
return result`,
  nqueens: `n = data['n']; columns = set(); down = set(); up = set()
def place(row):
    if row == n: return 1
    count = 0
    for col in range(n):
        if col in columns or row-col in down or row+col in up: continue
        columns.add(col); down.add(row-col); up.add(row+col)
        count += place(row+1)
        columns.remove(col); down.remove(row-col); up.remove(row+col)
    return count
return place(0)`,
  mst: `parent = list(range(data['n'])); count = data['n']; cost = 0
def find(x):
    if parent[x] != x: parent[x] = find(parent[x])
    return parent[x]
for u,v,w in sorted(data['edges'],key=lambda e:e[2]):
    a,b = find(u),find(v)
    if a != b: parent[a] = b; count -= 1; cost += w
return cost if count <= 1 else -1`,
  bellman: `dist = [float('inf')]*data['n']; dist[data['start']] = 0
for _ in range(data['n']-1):
    changed = False
    for u,v,w in data['edges']:
        if dist[u]+w < dist[v]: dist[v] = dist[u]+w; changed = True
    if not changed: break
return [x if x != float('inf') else -1 for x in dist]`,
  house: `previous = current = 0
for value in data['nums']: previous,current = current,max(current,previous+value)
return current`,
  "interval-dp": `dims = data['dims']; n = len(dims)-1; dp = [[0]*n for _ in range(n)]
for length in range(2,n+1):
    for i in range(n-length+1):
        j = i+length-1
        dp[i][j] = min(dp[i][k]+dp[k+1][j]+dims[i]*dims[k+1]*dims[j+1] for k in range(i,j))
return dp[0][-1]`,
  "tree-dp": `def explore(node):
    if not node: return (0,0)
    left_in,left_out = explore(node.left); right_in,right_out = explore(node.right)
    return (node.val+left_out+right_out, max(left_in,left_out)+max(right_in,right_out))
return max(explore(make_tree(data['tree'])))`,
};
const cpp = {
  "window-max": `auto a=data["nums"].get<vector<int>>();int k=data["k"];deque<int>q;json result=json::array();for(int i=0;i<(int)a.size();i++){while(!q.empty()&&q.front()<=i-k)q.pop_front();while(!q.empty()&&a[q.back()]<=a[i])q.pop_back();q.push_back(i);if(i>=k-1)result.push_back(a[q.front()]);}return result;`,
  add: `return data["a"].get<int>() + data["b"].get<int>();`,
  parity: `return data["n"].get<int>() % 2 == 0;`,
  sum: `long long total=0; for(int value:data["nums"]) total+=value; return total;`,
  maximum: `auto a=data["nums"].get<vector<int>>(); return *max_element(a.begin(),a.end());`,
  count: `int result=0; for(int value:data["nums"]) if(value==data["target"].get<int>()) result++; return result;`,
  "two-sum": `auto a=data["nums"].get<vector<int>>(); int target=data["target"]; unordered_map<int,int> seen;
for(int i=0;i<(int)a.size();i++){int need=target-a[i];if(seen.count(need))return json::array({seen[need],i});seen[a[i]]=i;} return json::array();`,
  stock: `int minimum=INT_MAX,best=0;for(int p:data["prices"]){minimum=min(minimum,p);best=max(best,p-minimum);}return best;`,
  duplicate: `unordered_set<int> seen;for(int x:data["nums"]){if(seen.count(x))return true;seen.insert(x);}return false;`,
  product: `auto a=data["nums"].get<vector<long long>>();vector<long long>r(a.size(),1);long long p=1;for(int i=0;i<(int)a.size();i++){r[i]=p;p*=a[i];}p=1;for(int i=(int)a.size()-1;i>=0;i--){r[i]*=p;p*=a[i];}return r;`,
  kadane: `auto a=data["nums"].get<vector<int>>();int current=a[0],best=a[0];for(int i=1;i<(int)a.size();i++){current=max(a[i],current+a[i]);best=max(best,current);}return best;`,
  "merge-array": `auto a=data["a"].get<vector<int>>(),b=data["b"].get<vector<int>>();vector<int>result;int i=0,j=0;while(i<(int)a.size()&&j<(int)b.size()){if(a[i]<=b[j])result.push_back(a[i++]);else result.push_back(b[j++]);}while(i<(int)a.size())result.push_back(a[i++]);while(j<(int)b.size())result.push_back(b[j++]);return result;`,
  anagram: `string s=data["s"],t=data["t"];array<int,26>frequency{};for(char c:s)frequency[c-'a']++;for(char c:t)frequency[c-'a']--;return all_of(frequency.begin(),frequency.end(),[](int x){return x==0;});`,
  substring: `string s=data["s"];vector<int>last(256,-1);int left=0,best=0;for(int right=0;right<(int)s.size();right++){left=max(left,last[(unsigned char)s[right]]+1);last[(unsigned char)s[right]]=right;best=max(best,right-left+1);}return best;`,
  replacement: `string s=data["s"];int k=data["k"],left=0,best=0,maximum=0;array<int,26>f{};for(int right=0;right<(int)s.size();right++){maximum=max(maximum,++f[s[right]-'A']);while(right-left+1-maximum>k)f[s[left++]-'A']--;best=max(best,right-left+1);}return best;`,
  binary: `auto a=data["nums"].get<vector<int>>();int target=data["target"],left=0,right=(int)a.size()-1;while(left<=right){int mid=left+(right-left)/2;if(a[mid]==target)return mid;if(a[mid]<target)left=mid+1;else right=mid-1;}return -1;`,
  rotated: `auto a=data["nums"].get<vector<int>>();int target=data["target"],l=0,r=(int)a.size()-1;while(l<=r){int m=l+(r-l)/2;if(a[m]==target)return m;if(a[l]<=a[m]){if(a[l]<=target&&target<a[m])r=m-1;else l=m+1;}else{if(a[m]<target&&target<=a[r])l=m+1;else r=m-1;}}return -1;`,
  "bad-version": `int l=1,r=data["n"];while(l<r){int m=l+(r-l)/2;if(isBad(m))r=m;else l=m+1;}return l;`,
  "reverse-list": `auto current=make_list(data["nums"]);ListNode* previous=nullptr;while(current){auto following=current->next;current->next=previous;previous=current;current=following;}return list_values(previous);`,
  "merge-list": `auto a=make_list(data["a"]),b=make_list(data["b"]);ListNode dummy(0);auto tail=&dummy;while(a&&b){if(a->val<=b->val){tail->next=a;a=a->next;}else{tail->next=b;b=b->next;}tail=tail->next;}tail->next=a?a:b;return list_values(dummy.next);`,
  "list-cycle": `auto head=make_list(data["nums"]);vector<ListNode*>nodes;for(auto c=head;c;c=c->next)nodes.push_back(c);int pos=data["pos"];if(!nodes.empty()&&pos>=0)nodes.back()->next=nodes[pos];auto slow=head,fast=head;while(fast&&fast->next){slow=slow->next;fast=fast->next->next;if(slow==fast)return true;}return false;`,
  parentheses: `string s=data["s"];stack<char>st;unordered_map<char,char>mp={{')','('},{']','['},{'}','{'}};for(char c:s){if(mp.count(c)){if(st.empty()||st.top()!=mp[c])return false;st.pop();}else st.push(c);}return st.empty();`,
  "min-stack": `vector<int>st,mins;json result=json::array();for(auto op:data["ops"]){string name=op[0];if(name=="push"){int x=op[1];st.push_back(x);mins.push_back(min(x,mins.empty()?x:mins.back()));result.push_back(nullptr);}else if(name=="pop"){st.pop_back();mins.pop_back();result.push_back(nullptr);}else result.push_back(name=="top"?st.back():mins.back());}return result;`,
  temperatures: `auto a=data["nums"].get<vector<int>>();vector<int>answer(a.size()),st;for(int i=0;i<(int)a.size();i++){while(!st.empty()&&a[i]>a[st.back()]){int j=st.back();st.pop_back();answer[j]=i-j;}st.push_back(i);}return answer;`,
  depth: `function<int(TreeNode*)>height=[&](TreeNode*n){return n?1+max(height(n->left),height(n->right)):0;};return height(make_tree(data["tree"]));`,
  invert: `function<TreeNode*(TreeNode*)>invert=[&](TreeNode*n)->TreeNode*{if(n){swap(n->left,n->right);invert(n->left);invert(n->right);}return n;};return tree_values(invert(make_tree(data["tree"])));`,
  lca: `int p=data["p"],q=data["q"];function<TreeNode*(TreeNode*)>find=[&](TreeNode*n)->TreeNode*{if(!n||n->val==p||n->val==q)return n;auto l=find(n->left),r=find(n->right);return l&&r?n:l?l:r;};return find(make_tree(data["tree"]))->val;`,
  diameter: `int best=0;function<int(TreeNode*)>height=[&](TreeNode*n){if(!n)return 0;int l=height(n->left),r=height(n->right);best=max(best,l+r);return 1+max(l,r);};height(make_tree(data["tree"]));return best;`,
  "same-tree": `function<bool(TreeNode*,TreeNode*)>same=[&](TreeNode*p,TreeNode*q){if(!p||!q)return p==q;return p->val==q->val&&same(p->left,q->left)&&same(p->right,q->right);};return same(make_tree(data["p"]),make_tree(data["q"]));`,
  codec: `auto root=make_tree(data["tree"]);queue<TreeNode*>q;if(root)q.push(root);string encoded;json values=json::array();while(!q.empty()){auto n=q.front();q.pop();if(!encoded.empty())encoded+=",";encoded+=n?to_string(n->val):"#";if(n){values.push_back(n->val);q.push(n->left);q.push(n->right);}else values.push_back(nullptr);}auto decoded=make_tree(values);return json{{"encoded",encoded},{"decoded",tree_values(decoded)}};`,
  islands: `auto g=data["grid"].get<vector<vector<int>>>();int h=g.size(),w=h?g[0].size():0,count=0;vector<pair<int,int>>dirs={{1,0},{-1,0},{0,1},{0,-1}};for(int i=0;i<h;i++)for(int j=0;j<w;j++)if(g[i][j]){count++;g[i][j]=0;stack<pair<int,int>>st;st.push({i,j});while(!st.empty()){auto [x,y]=st.top();st.pop();for(auto [dx,dy]:dirs){int xx=x+dx,yy=y+dy;if(xx>=0&&xx<h&&yy>=0&&yy<w&&g[xx][yy]){g[xx][yy]=0;st.push({xx,yy});}}}}return count;`,
  clone: `struct Node{int val;vector<Node*>neighbors;Node(int v):val(v){}};vector<Node*>nodes;for(int i=0;i<(int)data["adj"].size();i++)nodes.push_back(new Node(i));for(int i=0;i<(int)nodes.size();i++)for(int j:data["adj"][i])nodes[i]->neighbors.push_back(nodes[j]);unordered_map<Node*,Node*>copies;function<Node*(Node*)>copy=[&](Node*n){if(copies.count(n))return copies[n];auto c=new Node(n->val);copies[n]=c;for(auto v:n->neighbors)c->neighbors.push_back(copy(v));return c;};json result=json::array();for(auto n:nodes){json row=json::array();for(auto v:copy(n)->neighbors)row.push_back(v->val);result.push_back(row);}return result;`,
  "graph-cycle": `int n=data["n"];vector<int>parent(n);iota(parent.begin(),parent.end(),0);function<int(int)>find=[&](int x){return parent[x]==x?x:parent[x]=find(parent[x]);};for(auto e:data["edges"]){int a=find(e[0]),b=find(e[1]);if(a==b)return true;parent[a]=b;}return false;`,
  fib: `long long previous=0,current=1;for(int i=0;i<data["n"].get<int>();i++){auto next=previous+current;previous=current;current=next;}return previous;`,
  knapsack: `int cap=data["capacity"];vector<int>dp(cap+1);for(int i=0;i<(int)data["weights"].size();i++){int weight=data["weights"][i],value=data["values"][i];for(int w=cap;w>=weight;w--)dp[w]=max(dp[w],dp[w-weight]+value);}return dp[cap];`,
  lcs: `string a=data["a"],b=data["b"];vector<vector<int>>dp(a.size()+1,vector<int>(b.size()+1));for(int i=1;i<=(int)a.size();i++)for(int j=1;j<=(int)b.size();j++)dp[i][j]=a[i-1]==b[j-1]?dp[i-1][j-1]+1:max(dp[i-1][j],dp[i][j-1]);return dp.back().back();`,
  prefix: `auto a=data["nums"].get<vector<int>>();vector<long long>p(a.size()+1);for(int i=0;i<(int)a.size();i++)p[i+1]=p[i]+a[i];json result=json::array();for(auto q:data["queries"]){int l=q[0],r=q[1];result.push_back(p[r+1]-p[l]);}return result;`,
  difference: `auto a=data["nums"].get<vector<long long>>();vector<long long>diff(a.size()+1);for(auto q:data["updates"]){int l=q[0],r=q[1];long long v=q[2];diff[l]+=v;diff[r+1]-=v;}long long current=0;for(int i=0;i<(int)a.size();i++){current+=diff[i];a[i]+=current;}return a;`,
  queue: `queue<int>q;json result=json::array();for(auto op:data["ops"]){if(op[0]=="push"){q.push(op[1]);result.push_back(nullptr);}else{result.push_back(q.front());q.pop();}}return result;`,
  sort: `auto a=data["nums"].get<vector<int>>();vector<int>buffer(a.size());function<void(int,int)>ms=[&](int l,int r){if(r-l<=1)return;int m=l+(r-l)/2;ms(l,m);ms(m,r);int i=l,j=m,t=l;while(i<m&&j<r)buffer[t++]=a[i]<=a[j]?a[i++]:a[j++];while(i<m)buffer[t++]=a[i++];while(j<r)buffer[t++]=a[j++];for(int k=l;k<r;k++)a[k]=buffer[k];};ms(0,a.size());return a;`,
  palindrome: `string s=data["s"];int l=0,r=(int)s.size()-1;while(l<r)if(s[l++]!=s[r--])return false;return true;`,
  "three-sum": `auto a=data["nums"].get<vector<int>>();sort(a.begin(),a.end());json result=json::array();for(int i=0;i<(int)a.size()-2;i++){if(i&&a[i]==a[i-1])continue;int l=i+1,r=a.size()-1;while(l<r){int sum=a[i]+a[l]+a[r];if(sum==0){result.push_back(json::array({a[i],a[l],a[r]}));l++;r--;while(l<r&&a[l]==a[l-1])l++;while(l<r&&a[r]==a[r+1])r--;}else if(sum<0)l++;else r--;}}return result;`,
  "window-sum": `auto a=data["nums"].get<vector<int>>();int k=data["k"];long long current=accumulate(a.begin(),a.begin()+k,0LL),best=current;for(int i=k;i<(int)a.size();i++){current+=a[i]-a[i-k];best=max(best,current);}return best;`,
  subsets: `auto a=data["nums"].get<vector<int>>();json result=json::array();vector<int>path;function<void(int)>explore=[&](int i){if(i==(int)a.size()){result.push_back(path);return;}explore(i+1);path.push_back(a[i]);explore(i+1);path.pop_back();};explore(0);return result;`,
  "top-k": `priority_queue<int,vector<int>,greater<int>>heap;int k=data["k"];for(int x:data["nums"]){heap.push(x);if((int)heap.size()>k)heap.pop();}return heap.top();`,
  schedule: `auto a=data["intervals"].get<vector<vector<int>>>();sort(a.begin(),a.end(),[](auto&x,auto&y){return x[1]<y[1];});int end=INT_MIN,count=0;for(auto e:a)if(e[0]>=end){count++;end=e[1];}return count;`,
  topo: `int n=data["n"];vector<vector<int>>adj(n);vector<int>degree(n);for(auto e:data["edges"]){int u=e[0],v=e[1];adj[u].push_back(v);degree[v]++;}queue<int>q;for(int i=0;i<n;i++)if(!degree[i])q.push(i);vector<int>result;while(!q.empty()){int u=q.front();q.pop();result.push_back(u);for(int v:adj[u])if(--degree[v]==0)q.push(v);}if((int)result.size()!=n)result.clear();return result;`,
  shortest: `int n=data["n"],start=data["start"];vector<vector<pair<int,int>>>adj(n);for(auto e:data["edges"])adj[e[0].get<int>()].push_back({e[1],e[2]});vector<long long>dist(n,LLONG_MAX/4);dist[start]=0;priority_queue<pair<long long,int>,vector<pair<long long,int>>,greater<pair<long long,int>>>heap;heap.push({0,start});while(!heap.empty()){auto [current,u]=heap.top();heap.pop();if(current!=dist[u])continue;for(auto [v,w]:adj[u])if(current+w<dist[v]){dist[v]=current+w;heap.push({dist[v],v});}}for(auto&x:dist)if(x==LLONG_MAX/4)x=-1;return dist;`,
  xor: `int result=0;for(int x:data["nums"])result^=x;return result;`,
  priority: `using Task=tuple<int,int,int>;priority_queue<Task,vector<Task>,greater<Task>>heap;for(auto t:data["tasks"])heap.push({t["priority"],t["order"],t["id"]});vector<int>result;while(!heap.empty()){result.push_back(get<2>(heap.top()));heap.pop();}return result;`,
  "union-find": `int n=data["n"],count=n;vector<int>parent(n);iota(parent.begin(),parent.end(),0);function<int(int)>find=[&](int x){return parent[x]==x?x:parent[x]=find(parent[x]);};for(auto e:data["edges"]){int a=find(e[0]),b=find(e[1]);if(a!=b){parent[a]=b;count--;}}return count;`,
  coin: `int amount=data["amount"];vector<int>dp(amount+1,1000000);dp[0]=0;for(int v=1;v<=amount;v++)for(int c:data["coins"])if(c<=v)dp[v]=min(dp[v],dp[v-c]+1);return dp[amount]>=1000000?-1:dp[amount];`,
  lis: `vector<int>tails;for(int x:data["nums"]){auto it=lower_bound(tails.begin(),tails.end(),x);if(it==tails.end())tails.push_back(x);else *it=x;}return (int)tails.size();`,
  edit: `string a=data["a"],b=data["b"];vector<int>previous(b.size()+1);iota(previous.begin(),previous.end(),0);for(int i=1;i<=(int)a.size();i++){vector<int>current(b.size()+1);current[0]=i;for(int j=1;j<=(int)b.size();j++)current[j]=a[i-1]==b[j-1]?previous[j-1]:1+min({previous[j-1],previous[j],current[j-1]});previous=current;}return previous.back();`,
  trie: `struct Node{int count=0;map<char,Node*>children;};auto root=new Node;for(string word:data["words"]){auto n=root;n->count++;for(char c:word){if(!n->children.count(c))n->children[c]=new Node;n=n->children[c];n->count++;}}json result=json::array();for(string prefix:data["prefixes"]){auto n=root;for(char c:prefix){if(!n||!n->children.count(c)){n=nullptr;break;}n=n->children[c];}result.push_back(n?n->count:0);}return result;`,
  nqueens: `int n=data["n"];set<int>cols,down,up;function<int(int)>place=[&](int row){if(row==n)return 1;int count=0;for(int c=0;c<n;c++){if(cols.count(c)||down.count(row-c)||up.count(row+c))continue;cols.insert(c);down.insert(row-c);up.insert(row+c);count+=place(row+1);cols.erase(c);down.erase(row-c);up.erase(row+c);}return count;};return place(0);`,
  mst: `int n=data["n"],count=n;vector<int>parent(n);iota(parent.begin(),parent.end(),0);function<int(int)>find=[&](int x){return parent[x]==x?x:parent[x]=find(parent[x]);};auto edges=data["edges"].get<vector<vector<int>>>();sort(edges.begin(),edges.end(),[](auto&a,auto&b){return a[2]<b[2];});long long cost=0;for(auto e:edges){int a=find(e[0]),b=find(e[1]);if(a!=b){parent[a]=b;count--;cost+=e[2];}}return count<=1?cost:-1;`,
  bellman: `int n=data["n"];vector<long long>dist(n,LLONG_MAX/4);dist[data["start"].get<int>()]=0;for(int i=1;i<n;i++){bool changed=false;for(auto e:data["edges"]){int u=e[0],v=e[1],w=e[2];if(dist[u]!=LLONG_MAX/4&&dist[u]+w<dist[v]){dist[v]=dist[u]+w;changed=true;}}if(!changed)break;}for(auto&x:dist)if(x==LLONG_MAX/4)x=-1;return dist;`,
  house: `long long previous=0,current=0;for(int x:data["nums"]){auto next=max(current,previous+x);previous=current;current=next;}return current;`,
  "interval-dp": `auto dims=data["dims"].get<vector<int>>();int n=dims.size()-1;vector<vector<long long>>dp(n,vector<long long>(n));for(int len=2;len<=n;len++)for(int i=0;i+len<=n;i++){int j=i+len-1;dp[i][j]=LLONG_MAX;for(int k=i;k<j;k++)dp[i][j]=min(dp[i][j],dp[i][k]+dp[k+1][j]+1LL*dims[i]*dims[k+1]*dims[j+1]);}return dp[0][n-1];`,
  "tree-dp": `function<pair<long long,long long>(TreeNode*)>explore=[&](TreeNode*n)->pair<long long,long long>{if(!n)return {0,0};auto [li,lo]=explore(n->left);auto [ri,ro]=explore(n->right);return {n->val+lo+ro,max(li,lo)+max(ri,ro)};};auto [in,out]=explore(make_tree(data["tree"]));return max(in,out);`,
};
export function solution(id, language) {
  const body = (language === "python" ? py : cpp)[id];
  if (!body) throw new Error("Missing reference " + id);
  return language === "python"
    ? `def solve(data):\n${body
        .split("\n")
        .map((l) => "    " + l)
        .join("\n")}\n`
    : `json solve(const json& data) {\n${body
        .split("\n")
        .map((l) => "    " + l)
        .join("\n")}\n}\n`;
}
export function starter(id, language) {
  return language === "python"
    ? `def solve(data):\n    # Viết lời giải ở đây. Trả kết quả bằng return.\n    return None\n`
    : `json solve(const json& data) {\n    // Viết lời giải ở đây. Trả kết quả bằng return.\n    return nullptr;\n}\n`;
}
export function wrapCode(code, language, { multi = false } = {}) {
  if (language === "python")
    return (
      pythonHelpers +
      "\n" +
      code +
      `\nfor __line in sys.stdin:\n    __fixture = json.loads(__line)\n    print(json.dumps(solve(__fixture), ensure_ascii=False, allow_nan=False))\n${multi ? "" : "    break\n"}`
    );
  return (
    cppHelpers +
    "\n" +
    code +
    `\nint main(){string line;while(getline(cin,line)){__fixture=json::parse(line);cout<<solve(__fixture).dump()<<endl;${multi ? "" : "break;"}}}\n`
  );
}
