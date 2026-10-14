/** BytePath educational Git model. Pure data only: no shell, filesystem or network. */
export const GIT_SIM_VERSION = 'git-sim-1';
export const GIT_SIM_NOTICE = 'Mô phỏng Git an toàn: mã c0/c1 là ID minh họa, không phải SHA thật. Remote, file và lệnh chỉ tồn tại trong bài học.';
export const GIT_SIM_LIMITS = Object.freeze({ lines: 120, lineBytes: 8192, scriptBytes: 65536, outputBytes: 2 * 1024 * 1024 });
const bytes = text => new TextEncoder().encode(text).byteLength;
const clone = value => structuredClone(value);
const canonical = x => x && typeof x === 'object' ? Array.isArray(x) ? x.map(canonical) : Object.fromEntries(Object.keys(x).sort().map(k => [k, canonical(x[k])])) : x ?? null;
const same = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
const own = (o, k) => Object.hasOwn(o, k);
const fail = message => { throw new Error(message); };
const reserved = new Set(['__proto__', 'constructor', 'prototype']);
function name(value) { if (typeof value !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._/-]{0,79}$/.test(value) || value.includes('..') || value.endsWith('/') || value.split('/').some(x => reserved.has(x))) fail('Tên nhánh/tag/remote chưa hợp lệ trong mô phỏng.'); return value; }
function path(value) { if (typeof value !== 'string' || !/^[a-zA-Z0-9_.][a-zA-Z0-9._/-]{0,159}$/.test(value) || value.includes('..') || value.includes('//') || value.endsWith('/') || value.split('/').some(x => x === '.git' || reserved.has(x))) fail('Chỉ dùng đường dẫn file tương đối trong dự án ảo; không truy cập .git hoặc file trên máy.'); return value; }
function assertCount(a, lo, hi = lo) { if (a.length < lo || a.length > hi) fail('Số tham số chưa đúng; xem lệnh mẫu trong bài.'); }
function rejectFlags(a) { if (a.some(x => x.startsWith('-'))) fail('Tùy chọn này chưa được hỗ trợ trong mô phỏng.'); }
export function parseGitCommand(line) {
  if (typeof line !== 'string' || bytes(line) > GIT_SIM_LIMITS.lineBytes) fail('Lệnh phải là văn bản tối đa 8 KB (UTF-8).');
  if (line.includes('$(') || line.includes('`') || /[\r\n\0]/.test(line)) fail('Không hỗ trợ shell substitution hoặc nhiều lệnh trên một dòng.');
  const tokens = []; let token = '', quote = '', started = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quote) { if (c === quote) quote = ''; else if (c === '\\' && quote === '"') { const next = line[++i]; if (next === undefined) fail('Chuỗi chưa đóng.'); token += next === 'n' ? '\n' : next === 't' ? '\t' : next; } else token += c; started = true; }
    else if (c === '"' || c === "'") { quote = c; started = true; }
    else if (/\s/.test(c)) { if (started) { tokens.push(token); token = ''; started = false; } }
    else if (c === '#' && !started) break;
    else if (';&|<>'.includes(c)) fail('Không chạy toán tử shell; mỗi dòng chỉ chứa một thao tác mô phỏng.');
    else { token += c; started = true; }
  }
  if (quote) fail('Dấu nháy chưa đóng.');
  if (started) tokens.push(token);
  return tokens;
}
export function createGitState(options = {}) {
  const files = clone(options.files ?? { 'README.md': 'Hello BytePath' });
  Object.keys(files).forEach(path);
  if (Object.values(files).some(x => typeof x !== 'string' || x.length > 65536)) fail('Nội dung file ảo phải là văn bản dưới 64 KB.');
  const initialized = options.initialized !== false, branch = options.branch ?? 'main'; name(branch);
  return { version: GIT_SIM_VERSION, initialized, head: branch, branches: initialized ? { [branch]: 'c0' } : {}, commits: initialized ? { c0: { id: 'c0', parents: [], tree: clone(files), message: 'Initial snapshot' } } : {}, working: files, index: initialized ? clone(files) : {}, remotes: {}, remoteRefs: {}, tags: {}, stash: [], conflicts: [], merging: null, reflog: initialized ? ['c0'] : [], nextCommit: initialized ? 1 : 0, upstream: {}, config: {} };
}
export function headId(s) { return own(s.branches, s.head) ? s.branches[s.head] : s.head; }
export function headTree(s) { return s.commits[headId(s)]?.tree ?? {}; }
export function isAncestor(s, ancestor, descendant) {
  if (ancestor === null) return true;
  const stack = [descendant], seen = new Set();
  while (stack.length) { const id = stack.pop(); if (id === ancestor) return true; if (seen.has(id) || id == null) continue; seen.add(id); stack.push(...(s.commits[id]?.parents ?? [])); }
  return false;
}
function resolve(s, ref) {
  let base = ref, n = 0; const m = ref.match(/^(.*?)(~|\^)(\d*)$/); if (m) { base = m[1]; n = Number(m[3] || 1); }
  let id = base === 'HEAD' ? headId(s) : own(s.branches, base) ? s.branches[base] : own(s.tags, base) ? s.tags[base].commit : own(s.remoteRefs, base) ? s.remoteRefs[base] : own(s.commits, base) ? base : undefined;
  if (id === undefined || n > 100) fail('Không tìm thấy ref/commit: ' + ref);
  if (m?.[2] === '^' && n) { id = s.commits[id]?.parents[n - 1]; if (id === undefined) fail('Không có commit cha được chỉ định cho ref này.'); }
  else if (m?.[2] === '~') for (let i = 0; i < n; i++) { id = s.commits[id]?.parents[0]; if (id === undefined) fail('Không có commit cha cho ref này.'); }
  return id;
}
function clean(s) { return same(s.index, headTree(s)) && same(Object.fromEntries(Object.entries(s.working).filter(([p]) => !ignored(s, p))), s.index) && !s.conflicts.length; }
function requireClean(s) { if (!clean(s)) fail('Hãy commit, restore hoặc stash thay đổi trước; mô phỏng không tự ghi đè công việc.'); }
function withIgnoredFiles(s, tree) { return { ...Object.fromEntries(Object.entries(s.working).filter(([p]) => ignored(s, p) && !own(tree, p))), ...clone(tree) }; }
function moveHead(s, id, checkout = false) { if (own(s.branches, s.head)) s.branches[s.head] = id; else s.head = id; s.reflog.unshift(id); if (checkout) { const tree = s.commits[id]?.tree ?? {}; s.working = withIgnoredFiles(s, tree); s.index = clone(tree); } }
function commit(s, message, parents = null) {
  if (!message?.trim()) fail('Commit cần thông điệp có ý nghĩa.');
  if (s.conflicts.length) fail('Còn conflict chưa được git add xác nhận.');
  const before = headId(s); if (!parents && !s.merging && same(s.index, headTree(s))) fail('Không có thay đổi đã stage để commit.');
  const id = 'c' + s.nextCommit++;
  s.commits[id] = { id, tree: clone(s.index), parents: parents ?? (s.merging ? [before, s.merging.other].filter(x => x != null) : before == null ? [] : [before]), message };
  moveHead(s, id); s.merging = null; return id;
}
function ignored(s, p) {
  if (own(headTree(s), p) || own(s.index, p)) return false;
  const lines = (s.working['.gitignore'] ?? '').split('\n').map(x => x.trim()).filter(x => x && !x.startsWith('#'));
  // Deliberately small supported pattern set: exact path, suffix glob and directory prefix.
  return lines.some(pattern => pattern.endsWith('/') ? p.startsWith(pattern) : pattern.startsWith('*.') ? p.endsWith(pattern.slice(1)) : pattern === p);
}
function paths(s, a) { const available = [...new Set([...Object.keys(s.working), ...Object.keys(s.index)])]; return a.includes('.') || a.includes('-A') ? available : a.map(path); }
function mergeBase(s, a, b) { const queue = [a], seen = new Set(); while (queue.length) { const x = queue.shift(); if (x == null || seen.has(x)) continue; seen.add(x); if (isAncestor(s, x, b)) return x; queue.push(...(s.commits[x]?.parents ?? [])); } return null; }
function mergeTrees(base, ours, theirs) {
  const tree = {}, conflicts = [];
  for (const p of new Set([...Object.keys(base), ...Object.keys(ours), ...Object.keys(theirs)])) {
    const b = base[p], o = ours[p], t = theirs[p]; let value;
    if (o === t) value = o; else if (o === b) value = t; else if (t === b) value = o;
    else { conflicts.push(p); value = '<<<<<<< HEAD\n' + (o ?? '') + '\n=======\n' + (t ?? '') + '\n>>>>>>> incoming'; }
    if (value !== undefined) tree[p] = value;
  }
  return { tree, conflicts };
}
function merge(s, ref, mode = '--ff') {
  requireClean(s); const ours = headId(s), other = resolve(s, ref);
  if (isAncestor(s, other, ours)) return 'Already up to date.';
  if (isAncestor(s, ours, other) && mode !== '--no-ff') { moveHead(s, other, true); return 'Fast-forward: chỉ di chuyển con trỏ nhánh, không tạo merge commit.'; }
  if (mode === '--ff-only') fail('Không thể fast-forward: hai nhánh đã phân kỳ.');
  const base = mergeBase(s, ours, other); if (base == null) fail('Không merge lịch sử không có tổ tiên chung trong mô phỏng.');
  const result = mergeTrees(s.commits[base].tree, headTree(s), s.commits[other].tree);
  const before = { working: clone(s.working), index: clone(s.index) };
  s.working = withIgnoredFiles(s, result.tree); s.index = clone(result.tree); s.conflicts = result.conflicts;
  s.merging = { other, before, ours };
  if (s.conflicts.length) { s.conflicts.forEach(p => { if (own(headTree(s), p)) s.index[p] = headTree(s)[p]; else delete s.index[p]; }); return 'CONFLICT: sửa file bằng edit, git add rồi git commit; hoặc git merge --abort.'; }
  return 'Created merge commit ' + commit(s, 'Merge ' + ref);
}
function applyPatch(s, from, to, message) {
  requireClean(s); const result = mergeTrees(from, headTree(s), to);
  if (result.conflicts.length) fail('Patch có conflict; tình huống này chưa được mô phỏng cho cherry-pick/revert.');
  s.working = withIgnoredFiles(s, result.tree); s.index = clone(result.tree); return commit(s, message);
}
function execute(s, t) {
  if (!t.length) return 'Dòng trống / ghi chú.';
  if (t[0] === 'edit') { assertCount(t, 3); s.working[path(t[1])] = t[2]; return 'Editor ảo: đã sửa ' + t[1]; }
  if (t[0] === 'delete') { assertCount(t, 2); const p = path(t[1]); if (!own(s.working, p)) fail('File không tồn tại.'); delete s.working[p]; return 'Editor ảo: đã xóa ' + p; }
  if (t[0] !== 'git') fail('Chỉ hỗ trợ Git allowlist, edit và delete trong kho ảo. Không thực thi chương trình trên máy.');
  const cmd = t[1], a = t.slice(2);
  if (cmd === 'init') { if (a.length && !(a.length === 2 && a[0] === '-b')) fail('Dùng git init hoặc git init -b main.'); if (s.initialized) return 'Repository ảo đã tồn tại.'; const branch = a[1] ?? 'main'; name(branch); s.initialized = true; s.head = branch; s.branches[branch] = null; return 'Initialized virtual repository (nhánh chưa có commit).'; }
  if (!s.initialized) fail('Chưa có repository; hãy git init trước.');
  if (cmd === 'status') {
    if (a.some(x => !['--short', '-s'].includes(x))) fail('status chỉ hỗ trợ --short/-s.');
    const rows = gitFrame(s).files.filter(f => !f.ignored && (f.staged || f.modified || f.untracked || f.conflict));
    const change = (before, after) => before === after ? ' ' : before === null ? 'A' : after === null ? 'D' : 'M';
    return rows.length ? rows.map(f => f.conflict ? 'UU ' + f.path : f.untracked ? '?? ' + f.path : change(f.committed, f.index) + change(f.index, f.working) + ' ' + f.path).join('\n') : 'Working tree clean.';
  }
  if (cmd === 'add') { if (!a.length || a.some(x => x.startsWith('-') && x !== '-A')) fail('Dùng git add <file>, git add . hoặc git add -A.'); const list = paths(s, a); if (list.some(p => !own(s.working, p) && !own(s.index, p))) fail('Không tìm thấy file cần stage.'); for (const p of list) { if (ignored(s, p)) { if (!a.includes('.') && !a.includes('-A')) fail('File bị .gitignore bỏ qua.'); continue; } if (s.working[p]?.includes('<<<<<<<') && s.conflicts.includes(p)) fail('Còn conflict marker trong file.'); if (own(s.working, p)) s.index[p] = s.working[p]; else delete s.index[p]; s.conflicts = s.conflicts.filter(x => x !== p); } return 'Đã stage snapshot hiện tại của file.'; }
  if (cmd === 'commit') { if (a.length !== 2 && a.length !== 3) fail('Dùng git commit -m "message" hoặc git commit --amend -m "message".'); const amend = a[0] === '--amend'; if ((amend && (a[1] !== '-m' || a.length !== 3)) || (!amend && (a[0] !== '-m' || a.length !== 2))) fail('Tùy chọn commit chưa hỗ trợ.'); const parents = amend ? s.commits[headId(s)]?.parents : null; if (amend && !parents) fail('Chưa có commit để amend.'); return 'Created virtual commit ' + commit(s, a.at(-1), parents); }
  if (cmd === 'log') { if (a.some(x => !['--oneline', '--graph', '--all'].includes(x))) fail('log chỉ hỗ trợ --oneline --graph --all.'); const tips = a.includes('--all') ? [headId(s), ...Object.values(s.branches), ...Object.values(s.remoteRefs), ...Object.values(s.tags).map(t => t.commit)] : [headId(s)]; const ids = Object.keys(s.commits).filter(id => tips.some(tip => isAncestor(s, id, tip))); return ids.reverse().map(id => id + ' ' + s.commits[id].message).join('\n') || 'Chưa có commit.'; }
  if (cmd === 'diff') { if (a.some(x => !['--staged', '--cached'].includes(x))) fail('diff chỉ hỗ trợ --staged/--cached.'); const staged = a.length > 0, before = staged ? headTree(s) : s.index, after = staged ? s.index : s.working; return [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(p => before[p] !== after[p]).map(p => p + ':\n- ' + (before[p] ?? '(absent)') + '\n+ ' + (after[p] ?? '(absent)')).join('\n') || 'Không có khác biệt.'; }
  if (cmd === 'branch') { if (!a.length || (a.length === 1 && a[0] === '-a')) return Object.keys(s.branches).map(b => (b === s.head ? '* ' : '  ') + b).concat(a[0] === '-a' ? Object.keys(s.remoteRefs) : []).join('\n'); if (a[0] === '-d') { assertCount(a, 2); const b = name(a[1]); if (b === s.head || !own(s.branches, b)) fail('Không thể xóa nhánh đang dùng/không tồn tại.'); if (!isAncestor(s, s.branches[b], headId(s))) fail('Nhánh chưa được merge; không xóa với -d.'); delete s.branches[b]; return 'Deleted branch ' + b; } assertCount(a, 1, 2); rejectFlags(a); const b = name(a[0]); if (own(s.branches, b)) fail('Nhánh đã tồn tại.'); s.branches[b] = a[1] ? resolve(s, a[1]) : headId(s); return 'Created branch ' + b; }
  if (cmd === 'switch' || cmd === 'checkout') { const create = (cmd === 'switch' && a[0] === '-c') || (cmd === 'checkout' && a[0] === '-b'); assertCount(a, create ? 2 : 1); if (!create) rejectFlags(a); requireClean(s); const b = name(a[create ? 1 : 0]); if (create) { if (own(s.branches, b)) fail('Nhánh đã tồn tại.'); s.branches[b] = headId(s); } if (!own(s.branches, b)) fail('Chỉ switch/checkout nhánh có tên trong mô phỏng.'); s.head = b; const tree = headTree(s); s.working = withIgnoredFiles(s, tree); s.index = clone(tree); return 'Switched to ' + b; }
  if (cmd === 'merge') { if (same(a, ['--abort'])) { if (!s.merging) fail('Không có merge để abort.'); s.working = s.merging.before.working; s.index = s.merging.before.index; s.conflicts = []; s.merging = null; return 'Merge aborted.'; } const mode = a[0]?.startsWith('-') ? a[0] : '--ff'; if (!['--ff', '--ff-only', '--no-ff'].includes(mode)) fail('Tùy chọn merge chưa hỗ trợ.'); assertCount(a, a[0]?.startsWith('-') ? 2 : 1); return merge(s, a.at(-1), mode); }
  if (cmd === 'restore') { const staged = a[0] === '--staged'; const list = a.slice(staged ? 1 : 0); if (!list.length) fail('restore cần tên file.'); rejectFlags(list); const from = staged ? headTree(s) : s.index; for (const p of list.includes('.') ? Object.keys(staged ? s.index : s.working) : list.map(path)) { if (!own(from, p) && !own(s.index, p)) fail('File chưa được track.'); if (own(from, p)) (staged ? s.index : s.working)[p] = from[p]; else delete (staged ? s.index : s.working)[p]; } return staged ? 'Đã unstage; giữ nguyên file làm việc.' : 'Đã khôi phục working tree từ index.'; }
  if (cmd === 'reset') { if (s.merging) fail('Abort merge trước khi reset.'); const mode = a[0]?.startsWith('-') ? a[0] : '--mixed'; if (!['--soft', '--mixed', '--hard'].includes(mode)) fail('Tùy chọn reset chưa hỗ trợ.'); assertCount(a, a[0]?.startsWith('-') ? 2 : 1); const id = resolve(s, a.at(-1)), old = { ...headTree(s), ...s.index }, tree = s.commits[id]?.tree ?? {}; moveHead(s, id); if (mode !== '--soft') s.index = clone(tree); if (mode === '--hard') { for (const p of Object.keys(old)) delete s.working[p]; Object.assign(s.working, clone(tree)); } return 'Reset ' + mode + '; reflog vẫn giữ ID commit cũ trong phiên mô phỏng.'; }
  if (cmd === 'revert' || cmd === 'cherry-pick') { assertCount(a, 1); rejectFlags(a); const id = resolve(s, a[0]), c = s.commits[id]; if (c.parents.length > 1) fail('Không mô phỏng patch từ merge commit.'); const parent = s.commits[c.parents[0]]?.tree ?? {}; const created = cmd === 'revert' ? applyPatch(s, c.tree, parent, 'Revert ' + id) : applyPatch(s, parent, c.tree, 'Cherry-pick ' + id); return 'Created ' + created; }
  if (cmd === 'stash') {
    const action = a[0] === '-u' ? 'push' : a[0] ?? 'push';
    if (!['push', 'list', 'apply', 'pop', 'drop'].includes(action)) fail('Tùy chọn stash chưa hỗ trợ.');
    if (action === 'push') {
      const untracked = a.includes('-u');
      if (a.some(x => !['push', '-u'].includes(x))) fail('Dùng git stash, git stash push hoặc git stash push -u.');
      const tree = headTree(s), files = Object.fromEntries(Object.entries(s.working).filter(([p]) => own(tree, p) || own(s.index, p) || untracked && !ignored(s, p)));
      if (same(files, tree) && same(s.index, tree)) fail('Không có thay đổi để stash.');
      s.stash.unshift({ base: clone(tree), working: files, index: clone(s.index) }); s.index = clone(tree);
      for (const p of Object.keys(files)) delete s.working[p]; Object.assign(s.working, clone(tree));
      return 'Saved stash; -u gồm file untracked chưa bị ignore. File ignored vẫn ở working tree.';
    }
    assertCount(a, 1);
    if (action === 'list') return s.stash.map((_, i) => 'stash@{' + i + '}').join('\n') || 'Không có stash.';
    if (!s.stash.length) fail('Không có stash để dùng.');
    if (action === 'drop') { s.stash.shift(); return 'Dropped newest stash.'; }
    requireClean(s);
    const result = mergeTrees(s.stash[0].base, headTree(s), s.stash[0].working);
    if (result.conflicts.length) fail('Stash có conflict; tình huống này chưa hỗ trợ trong mô phỏng.');
    // Preserve ignored files that never belonged to the stash snapshot.
    const retained = Object.fromEntries(Object.entries(s.working).filter(([p]) => !own(headTree(s), p) && !own(s.stash[0].working, p)));
    s.working = { ...retained, ...result.tree };
    if (action === 'pop') s.stash.shift();
    return action === 'pop' ? 'Applied and removed stash (không tự stage).' : 'Applied stash, retained entry (không tự stage).';
  }
  if (cmd === 'tag') { if (!a.length) return Object.keys(s.tags).join('\n'); let b, ref = 'HEAD', message = null; if (a[0] === '-a') { if (a.length !== 4 || a[2] !== '-m') fail('Dùng git tag -a <tag> -m "message".'); b = name(a[1]); message = a[3]; } else { assertCount(a, 1, 2); rejectFlags(a); b = name(a[0]); ref = a[1] ?? 'HEAD'; } if (own(s.tags, b)) fail('Tag đã tồn tại.'); s.tags[b] = { commit: resolve(s, ref), message }; return 'Created tag ' + b; }
  if (cmd === 'remote') { if (!a.length || same(a, ['-v'])) return Object.keys(s.remotes).map(r => r + ' virtual://' + r).join('\n'); if (a[0] === 'add') { assertCount(a, 3); const r = name(a[1]); if (!/^virtual:\/\/[a-zA-Z0-9._/-]+$/.test(a[2])) fail('Chỉ chấp nhận virtual:// trong mô phỏng, không truy cập Internet.'); if (own(s.remotes, r)) fail('Remote đã tồn tại.'); s.remotes[r] = { branches: {}, commits: {}, tags: {} }; return 'Added virtual remote ' + r; } fail('remote chỉ hỗ trợ -v và add tên virtual://...'); }
  if (cmd === 'fetch') { const prune = a[0] === '--prune', rest = a.slice(prune ? 1 : 0); assertCount(rest, 0, 1); const rem = rest[0] ?? 'origin'; name(rem); if (!own(s.remotes, rem)) fail('Remote ảo chưa có.'); const remote = s.remotes[rem]; Object.assign(s.commits, clone(remote.commits)); for (const [b, id] of Object.entries(remote.branches)) s.remoteRefs[rem + '/' + b] = id; if (prune) for (const r of Object.keys(s.remoteRefs)) if (r.startsWith(rem + '/') && !own(remote.branches, r.slice(rem.length + 1))) delete s.remoteRefs[r]; return 'Fetched vào remote-tracking refs; working tree và nhánh local không đổi.'; }
  if (cmd === 'pull') { const mode = a[0]?.startsWith('-') ? a[0] : '--ff-only'; if (!['--ff-only', '--no-rebase'].includes(mode)) fail('Dùng pull --ff-only hoặc --no-rebase; rebase được học riêng.'); const rest = a.slice(a[0]?.startsWith('-') ? 1 : 0); assertCount(rest, 2); name(rest[0]); name(rest[1]); requireClean(s); execute(s, ['git', 'fetch', rest[0]]); return merge(s, rest[0] + '/' + rest[1], mode === '--no-rebase' ? '--ff' : '--ff-only'); }
  if (cmd === 'push') { const upstream = a[0] === '-u'; const rest = a.slice(upstream ? 1 : 0); assertCount(rest, 2); rejectFlags(rest); const rem = name(rest[0]), b = name(rest[1]); if (!own(s.remotes, rem)) fail('Remote ảo chưa có.'); const remote = s.remotes[rem]; if (own(s.tags, b) && !own(s.branches, b)) { remote.tags[b] = clone(s.tags[b]); Object.assign(remote.commits, clone(s.commits)); return 'Pushed virtual tag ' + b; } if (!own(s.branches, b)) fail('Nhánh local không tồn tại.'); const before = remote.branches[b]; Object.assign(s.commits, clone(remote.commits)); if (before !== undefined && !isAncestor(s, before, s.branches[b])) fail('Push bị từ chối non-fast-forward. Fetch rồi tích hợp trước; không hỗ trợ force push.'); Object.assign(remote.commits, clone(s.commits)); remote.branches[b] = s.branches[b]; s.remoteRefs[rem + '/' + b] = s.branches[b]; if (upstream) s.upstream[b] = rem + '/' + b; return 'Pushed to virtual remote only.'; }
  if (cmd === 'reflog') { assertCount(a, 0); return s.reflog.map((id, i) => 'HEAD@{' + i + '} ' + id).join('\n'); }
  if (cmd === 'rebase') { assertCount(a, 1); rejectFlags(a); requireClean(s); const onto = resolve(s, a[0]), tip = headId(s), base = mergeBase(s, tip, onto); if (base === null) fail('Không có tổ tiên chung.'); if (isAncestor(s, onto, tip)) return 'Current branch is up to date; không tạo lại commit.'; const chain = []; let cursor = tip; while (cursor !== base) { const c = s.commits[cursor]; if (!c || c.parents.length !== 1) fail('Chỉ mô phỏng rebase tuyến tính không có merge commit.'); chain.unshift(c); cursor = c.parents[0]; } let newTree = clone(s.commits[onto].tree); const patches = []; for (const c of chain) { const result = mergeTrees(s.commits[c.parents[0]].tree, newTree, c.tree); if (result.conflicts.length) fail('Rebase có conflict: chưa hỗ trợ continue/abort trong mô phỏng này.'); newTree = result.tree; patches.push({ tree: clone(newTree), message: c.message }); } moveHead(s, onto, true); for (const patch of patches) { s.working = withIgnoredFiles(s, patch.tree); s.index = patch.tree; commit(s, patch.message, [headId(s)]); } return 'Rebased: commit mới với ID mới; commit gốc vẫn có trong reflog phiên ảo.'; }
  fail('Lệnh chưa được mô phỏng: ' + (cmd ?? '(thiếu lệnh)') + '. Xem phạm vi trong bài; không chạy Git thật.');
}
export function gitFrame(s, label = 'Trạng thái repository ảo') {
  const tree = headTree(s), files = [...new Set([...Object.keys(s.working), ...Object.keys(s.index), ...Object.keys(tree)])].sort().map(p => ({ path: p, working: s.working[p] ?? null, index: s.index[p] ?? null, committed: tree[p] ?? null, staged: s.index[p] !== tree[p], modified: s.working[p] !== s.index[p], untracked: !own(tree, p) && !own(s.index, p), conflict: s.conflicts.includes(p), ignored: ignored(s, p) }));
  return { label, notice: GIT_SIM_NOTICE, branch: s.head, head: headId(s) ?? null, files, nodes: Object.values(s.commits).map(c => ({ id: c.id, parents: [...c.parents], message: c.message, branches: Object.keys(s.branches).filter(b => s.branches[b] === c.id), tags: Object.keys(s.tags).filter(t => s.tags[t].commit === c.id) })), branches: clone(s.branches), remoteBranches: clone(s.remoteRefs), conflicts: [...s.conflicts], stashCount: s.stash.length };
}
export function runGitCommand(state, line) {
  const next = clone(state);
  try { const output = execute(next, parseGitCommand(line)); return { state: next, ok: true, output, conflict: next.conflicts.length > 0, frame: gitFrame(next, line) }; }
  catch (error) { return { state: clone(state), ok: false, output: '', error: error.message, frame: gitFrame(state, 'Lệnh chưa áp dụng: ' + line) }; }
}
export function runGitScript(initial, script) {
  const lines = typeof script === 'string' ? script.split(/\r?\n/) : Array.isArray(script) ? script : null;
  if (!lines || lines.length > GIT_SIM_LIMITS.lines || lines.some(x => typeof x !== 'string') || bytes(lines.join('\n')) > GIT_SIM_LIMITS.scriptBytes) return { state: clone(initial), ok: false, steps: [], frames: [gitFrame(initial)], errors: [{ line: 0, error: 'Tối đa 120 dòng / 64 KB (UTF-8) lệnh mô phỏng.' }] };
  let state = clone(initial); const steps = [], frames = [gitFrame(state)], errors = [];
  let outputBytes = bytes(JSON.stringify(frames));
  for (const [i, line] of lines.entries()) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const r = runGitCommand(state, line), step = { line: i + 1, command: line, ok: r.ok, output: r.output, error: r.error, conflict: r.conflict };
    const addedBytes = bytes(JSON.stringify(step)) + bytes(JSON.stringify(r.frame)) + (r.ok ? 0 : bytes(JSON.stringify({ line: i + 1, error: r.error })) + 1) + 2;
    if (outputBytes + addedBytes + bytes(JSON.stringify(r.state)) > GIT_SIM_LIMITS.outputBytes - 4096) {
      errors.push({ line: i + 1, error: 'Đầu ra và lịch sử mô phỏng vượt giới hạn 2 MB. Lệnh này chưa áp dụng; giảm các lần diff/log hoặc dữ liệu minh họa.' });
      break;
    }
    state = r.state; outputBytes += addedBytes; steps.push(step); frames.push(r.frame);
    if (!r.ok) errors.push({ line: i + 1, error: r.error });
  }
  return { state, ok: errors.length === 0, steps, frames, errors };
}
