import { random, int } from '../../shared/random.mjs';
import { createGitState, runGitScript, gitFrame, headId, headTree, isAncestor } from '../../shared/git-simulator.mjs';
export const VERSION = 'git-2026.10.13-v1';
const copy = x => structuredClone(x);
const defs = [
 ['init','Tạo kho và commit đầu tiên','Khởi tạo main và lưu README.md đang có thành commit đầu tiên.','repository'],
 ['stage','Chọn snapshot để stage','Stage thay đổi README.md, không tạo commit, không stage notes.txt.','index'],
 ['commit','Commit đúng phần đã stage','Tạo một commit từ index hiện có. Giữ ghi chú chưa track ở working tree.','commit'],
 ['ignore','Giữ file riêng ngoài lịch sử','Tạo .gitignore chứa .env và *.log, commit .gitignore; không commit file .env hoặc debug.log.','ignore'],
 ['branch','Tạo nhánh mà chưa chuyển','Tạo feature từ HEAD, vẫn đứng ở main. Không tạo thêm commit.','branch'],
 ['feature','Làm việc trên feature','Tạo/chuyển sang feature; sửa feature.txt thành feature-ready, stage và commit. main vẫn giữ snapshot ban đầu.','feature'],
 ['merge','Gộp hai công việc độc lập','Merge feature vào main. Giữ cập nhật README.md ở main và feature.txt ở feature; cần commit có hai parent.','merge'],
 ['conflict','Giải quyết xung đột','Merge feature vào main; sửa README.md thành resolved, stage và commit merge có hai parent. Không bỏ lịch sử nhánh nào.','conflict'],
 ['fetch','Nhận lịch sử nhưng chưa tích hợp','Fetch origin; remote-tracking origin/main cập nhật. main và working tree local giữ nguyên.','fetch'],
 ['pull','Cập nhật main bằng fast-forward','Pull origin/main bằng chiến lược --ff-only. main chuyển tới commit remote mới, không tạo thêm commit.','pull'],
 ['push','Chia sẻ commit tới remote ảo','Push main lên origin ảo, đồng bộ origin/main. Không đổi nội dung hoặc tạo commit khác.','push'],
 ['restore','Bỏ sửa đổi chưa stage','Restore README.md từ index; giữ notes.txt chưa track. Không đổi lịch sử.','restore'],
 ['unstage','Bỏ stage, giữ nội dung','Unstage README.md, giữ nội dung đã sửa ở working tree. Không di chuyển nhánh.','unstage'],
 ['reset-soft','Sửa commit local, giữ index','Reset --soft HEAD~1: main về commit trước; snapshot mới vẫn ở index và working tree.','reset'],
 ['reset-mixed','Lùi commit, bỏ stage','Reset --mixed HEAD~1: main và index về commit trước; working tree giữ sửa đổi mới.','reset'],
 ['revert','Sửa lịch sử đã chia sẻ','Revert commit cuối bằng commit mới; giữ commit sai trong ancestry, khôi phục README.md về giá trị trước.','revert'],
 ['stash','Cất việc rồi quay lại','Stash sửa đổi đã track, chuyển feature rồi quay lại main và pop. Giữ thay đổi working tree, index không tự stage, không còn stash.','stash'],
 ['tag','Đánh dấu phiên bản','Tạo tag v1.0.0 tại HEAD, không thêm commit hoặc đổi file.','tag'],
 ['remote','Kết nối remote ảo','Thêm remote origin dùng virtual://team/repo và push main. Không kết nối GitHub thật.','remote'],
 ['collaborate','Đồng bộ trước khi chia sẻ','Fetch origin; merge origin/main để kết hợp cập nhật README.md của bạn và remote.txt của đồng đội; push main.','collaboration'],
 ['cherry-pick','Mang một bản sửa sang main','Cherry-pick commit fix có trên nhánh hotfix sang main. Giữ README.md của main, đưa fix.txt=bug-fixed vào commit mới.','cherry-pick'],
 ['rebase','Đặt feature lên main mới','Đang ở feature. Rebase tuyến tính feature lên main, giữ feature.txt và cập nhật README.md của main. Commit feature được tạo lại.','rebase'],
 ['recovery','Tìm lại commit local','Commit c1 vẫn nằm trong reflog sau khi main lùi về c0. Tạo rescue tại c1; không đổi main hoặc working tree.','reflog'],
 ['release','Chuẩn bị release nhỏ','Merge feature vào main, tạo tag v1.0.0, push main và tag tới origin ảo.','release'],
 ['fix-pr','Thu gọn thay đổi trước review','Đang trên feature với README.md đã stage và notes.txt chưa track. Commit README.md; giữ notes.txt ngoài lịch sử, push feature tới origin ảo.','review'],
 ['secure','Dọn điều kiện trước chia sẻ','README.md đã sửa, .env chưa track, .gitignore bỏ qua .env. Chỉ stage/commit README.md và push main; giữ .env ngoài mọi snapshot.','security'],
];
export const problemIds = defs.map(d => 'git-' + d[0]);
function fixtureCommit(s, id, parent, tree, message) { s.commits[id] = { id, parents: parent == null ? [] : Array.isArray(parent) ? parent : [parent], tree: copy(tree), message }; s.nextCommit = Math.max(s.nextCommit, Number(id.slice(1)) + 1); }
function snapshot(s, branch, id) { s.head = branch; s.branches[branch] = id; s.index = copy(s.commits[id].tree); s.working = copy(s.index); s.reflog.unshift(id); }
function attachRemote(s, tree = null) { const commits = copy(s.commits); let tip = 'c0'; if (tree) { commits.r1 = { id: 'r1', parents: ['c0'], tree: copy(tree), message: 'Team update' }; tip = 'r1'; } s.remotes.origin = { branches: { main: tip }, commits, tags: {} }; s.remoteRefs['origin/main'] = 'c0'; return tip; }
export function generateInput(id, seed = 0) {
  const key = id.replace(/^git-/, ''), rng = random(String(seed) + ':' + id), value = 'base-' + int(rng, 10, 9999), newer = 'draft-' + int(rng, 10, 9999), teammate = 'team-' + int(rng, 10, 9999);
  const s = createGitState({ files: { 'README.md': value } }); let goal;
  if (key === 'init') { const initial = createGitState({ initialized: false, files: { 'README.md': value } }); return { seed: String(seed), initial, goal: { initialized: true, branch: 'main', headFiles: { 'README.md': value }, clean: true, headCommitCount: 1 } }; }
  switch (key) {
    case 'stage': s.working['README.md'] = newer; s.working['notes.txt'] = teammate; goal = { branch: 'main', headFiles: { 'README.md': value }, indexFiles: { 'README.md': newer }, workingFiles: { 'README.md': newer, 'notes.txt': teammate }, exactCommitCount: 1 }; break;
    case 'commit': s.index['README.md'] = newer; s.working['README.md'] = newer; s.working['notes.txt'] = teammate; goal = { branch: 'main', headFiles: { 'README.md': newer }, indexFiles: { 'README.md': newer }, workingFiles: { 'README.md': newer, 'notes.txt': teammate }, exactCommitCount: 2 }; break;
    case 'ignore': s.working['.env'] = 'DEMO_ONLY=' + newer; s.working['debug.log'] = teammate; goal = { branch: 'main', headRequiredFiles: { 'README.md': value }, onlyHeadFiles: ['README.md', '.gitignore'], ignoredPatterns: ['.env', '*.log'], forbiddenInHistory: ['.env', 'debug.log'], exactCommitCount: 2 }; break;
    case 'branch': goal = { branch: 'main', headFiles: { 'README.md': value }, branches: { feature: 'c0', main: 'c0' }, clean: true, exactCommitCount: 1 }; break;
    case 'feature': goal = { branch: 'feature', headFiles: { 'README.md': value, 'feature.txt': 'feature-ready' }, branches: { main: 'c0' }, clean: true, exactCommitCount: 2 }; break;
    case 'merge': case 'conflict': case 'release': {
      fixtureCommit(s, 'c1', 'c0', { 'README.md': newer }, 'Main update');
      const featureTree = key === 'conflict' ? { 'README.md': teammate } : { 'README.md': value, 'feature.txt': 'feature-ready' };
      fixtureCommit(s, 'c2', 'c0', featureTree, 'Feature update'); s.branches.feature = 'c2'; snapshot(s, 'main', 'c1');
      goal = { branch: 'main', headFiles: key === 'conflict' ? { 'README.md': 'resolved' } : { 'README.md': newer, 'feature.txt': 'feature-ready' }, ancestors: ['c1', 'c2'], headParentCount: 2, clean: true, exactCommitCount: 4 };
      if (key === 'release') { attachRemote(s); Object.assign(goal, { tagAtHead: 'v1.0.0', remoteMatches: { remote: 'origin', branch: 'main' }, remoteTag: 'v1.0.0' }); }
      break;
    }
    case 'fetch': { const tip = attachRemote(s, { 'README.md': teammate }); goal = { branch: 'main', headFiles: { 'README.md': value }, branches: { main: 'c0' }, remoteRefs: { 'origin/main': tip }, clean: true }; break; }
    case 'pull': { const tip = attachRemote(s, { 'README.md': teammate }); goal = { branch: 'main', headFiles: { 'README.md': teammate }, branches: { main: tip }, clean: true, exactCommitCount: 2 }; break; }
    case 'push': { fixtureCommit(s, 'c1', 'c0', { 'README.md': newer }, 'Local update'); snapshot(s, 'main', 'c1'); attachRemote(s); goal = { branch: 'main', headFiles: { 'README.md': newer }, remoteMatches: { remote: 'origin', branch: 'main' }, clean: true, exactCommitCount: 2 }; break; }
    case 'restore': s.working['README.md'] = newer; s.working['notes.txt'] = teammate; goal = { branch: 'main', headFiles: { 'README.md': value }, indexFiles: { 'README.md': value }, workingFiles: { 'README.md': value, 'notes.txt': teammate }, exactCommitCount: 1 }; break;
    case 'unstage': s.working['README.md'] = newer; s.index['README.md'] = newer; goal = { branch: 'main', headFiles: { 'README.md': value }, indexFiles: { 'README.md': value }, workingFiles: { 'README.md': newer }, branches: { main: 'c0' }, exactCommitCount: 1 }; break;
    case 'reset-soft': case 'reset-mixed': case 'revert': fixtureCommit(s, 'c1', 'c0', { 'README.md': newer }, 'Local draft'); snapshot(s, 'main', 'c1'); goal = key === 'revert' ? { branch: 'main', headFiles: { 'README.md': value }, ancestors: ['c1'], clean: true, exactCommitCount: 3 } : { branch: 'main', branches: { main: 'c0' }, headFiles: { 'README.md': value }, indexFiles: { 'README.md': key === 'reset-soft' ? newer : value }, workingFiles: { 'README.md': newer }, exactCommitCount: 2 }; break;
    case 'stash': s.branches.feature = 'c0'; s.working['README.md'] = newer; goal = { branch: 'main', headFiles: { 'README.md': value }, indexFiles: { 'README.md': value }, workingFiles: { 'README.md': newer }, stashCount: 0, visitedBranches: ['feature'], exactCommitCount: 1 }; break;
    case 'tag': goal = { branch: 'main', headFiles: { 'README.md': value }, tagAtHead: 'v1.0.0', clean: true, exactCommitCount: 1 }; break;
    case 'remote': goal = { branch: 'main', headFiles: { 'README.md': value }, remoteMatches: { remote: 'origin', branch: 'main' }, clean: true, exactCommitCount: 1 }; break;
    case 'collaborate': fixtureCommit(s, 'c1', 'c0', { 'README.md': newer }, 'Local update'); snapshot(s, 'main', 'c1'); attachRemote(s, { 'README.md': value, 'remote.txt': teammate }); goal = { branch: 'main', headFiles: { 'README.md': newer, 'remote.txt': teammate }, ancestors: ['c1', 'r1'], headParentCount: 2, remoteMatches: { remote: 'origin', branch: 'main' }, clean: true }; break;
    case 'cherry-pick': fixtureCommit(s, 'c1', 'c0', { 'README.md': value, 'fix.txt': 'bug-fixed' }, 'Fix bug'); s.branches.hotfix = 'c1'; fixtureCommit(s, 'c2', 'c0', { 'README.md': newer }, 'Main update'); snapshot(s, 'main', 'c2'); goal = { branch: 'main', headFiles: { 'README.md': newer, 'fix.txt': 'bug-fixed' }, ancestors: ['c2'], notAncestors: ['c1'], clean: true, exactCommitCount: 4 }; break;
    case 'rebase': fixtureCommit(s, 'c1', 'c0', { 'README.md': value, 'feature.txt': 'feature-ready' }, 'Feature'); s.branches.feature = 'c1'; fixtureCommit(s, 'c2', 'c0', { 'README.md': newer }, 'Main update'); s.branches.main = 'c2'; snapshot(s, 'feature', 'c1'); goal = { branch: 'feature', headFiles: { 'README.md': newer, 'feature.txt': 'feature-ready' }, ancestors: ['c2'], notAncestors: ['c1'], headParentCount: 1, branches: { main: 'c2' }, clean: true, exactCommitCount: 4 }; break;
    case 'recovery': fixtureCommit(s, 'c1', 'c0', { 'README.md': newer }, 'Lost local commit'); s.reflog = ['c0', 'c1', 'c0']; goal = { branch: 'main', headFiles: { 'README.md': value }, branches: { main: 'c0', rescue: 'c1' }, clean: true, exactCommitCount: 2 }; break;
    case 'fix-pr': s.branches.feature = 'c0'; s.head = 'feature'; s.index['README.md'] = newer; s.working['README.md'] = newer; s.working['notes.txt'] = teammate; attachRemote(s); goal = { branch: 'feature', headFiles: { 'README.md': newer }, workingFiles: { 'README.md': newer, 'notes.txt': teammate }, branches: { main: 'c0' }, remoteMatches: { remote: 'origin', branch: 'feature' }, forbiddenInHistory: ['notes.txt'], exactCommitCount: 2 }; break;
    case 'secure': s.commits.c0.tree['.gitignore'] = '.env'; s.index['.gitignore'] = '.env'; s.working['.gitignore'] = '.env'; s.working['README.md'] = newer; s.working['.env'] = 'DEMO_ONLY=' + teammate; attachRemote(s); goal = { branch: 'main', headFiles: { 'README.md': newer, '.gitignore': '.env' }, forbiddenInHistory: ['.env'], remoteMatches: { remote: 'origin', branch: 'main' }, exactCommitCount: 2 }; break;
    default: throw new Error('Unknown Git problem: ' + id);
  }
  // A replacement/amended commit with the same required ancestry is valid even
  // while its unreachable predecessor remains stored in this educational model.
  // Templates that explicitly require no new commit retain exactCommitCount.
  if (['commit','ignore','feature','merge','conflict','release','revert','fix-pr','secure','cherry-pick','rebase'].includes(key)) {
    goal.headCommitCount = key === 'cherry-pick' || key === 'rebase' ? 3 : goal.exactCommitCount;
    delete goal.exactCommitCount;
  }
  return { seed: String(seed), initial: s, goal };
}
export const referenceScripts = {
 'git-init': 'git init -b main\ngit add README.md\ngit commit -m "Start project"',
 'git-stage': 'git add README.md', 'git-commit': 'git commit -m "Update README"',
 'git-ignore': 'edit .gitignore ".env\\n*.log"\ngit add .gitignore\ngit commit -m "Ignore private files"',
 'git-branch': 'git branch feature',
 'git-feature': 'git switch -c feature\nedit feature.txt "feature-ready"\ngit add feature.txt\ngit commit -m "Add feature"',
 'git-merge': 'git merge feature',
 'git-conflict': 'git merge feature\nedit README.md "resolved"\ngit add README.md\ngit commit -m "Resolve shared content"',
 'git-fetch': 'git fetch origin', 'git-pull': 'git pull --ff-only origin main', 'git-push': 'git push origin main',
 'git-restore': 'git restore README.md', 'git-unstage': 'git restore --staged README.md',
 'git-reset-soft': 'git reset --soft HEAD~1', 'git-reset-mixed': 'git reset --mixed HEAD~1', 'git-revert': 'git revert HEAD',
 'git-stash': 'git stash\ngit switch feature\ngit switch main\ngit stash pop',
 'git-tag': 'git tag v1.0.0', 'git-remote': 'git remote add origin virtual://team/repo\ngit push origin main',
 'git-collaborate': 'git fetch origin\ngit merge origin/main\ngit push origin main',
 'git-cherry-pick': 'git cherry-pick c1', 'git-rebase': 'git rebase main', 'git-recovery': 'git reflog\ngit branch rescue c1',
 'git-release': 'git merge feature\ngit tag v1.0.0\ngit push origin main\ngit push origin v1.0.0',
 'git-fix-pr': 'git commit -m "Explain README update"\ngit push origin feature',
 'git-secure': 'git add README.md\ngit commit -m "Update public instructions"\ngit push origin main',
};
export function oracle(id, input) { if (!problemIds.includes(id)) throw new Error('Unknown Git problem'); return copy(input.goal); }
const equalTree = (a, b) => Object.keys(a).length === Object.keys(b).length && Object.keys(b).every(k => a[k] === b[k]);
export function checkGitGoal(input, result) {
  if (!result || !result.state || !result.ok || result.errors?.length) return false;
  const s = result.state, g = input.goal, id = headId(s), tree = headTree(s);
  if (g.initialized !== undefined && s.initialized !== g.initialized || g.branch && s.head !== g.branch || g.headFiles && !equalTree(tree, g.headFiles) || g.indexFiles && !equalTree(s.index, g.indexFiles) || g.workingFiles && !equalTree(s.working, g.workingFiles)) return false;
  if (g.headRequiredFiles && Object.entries(g.headRequiredFiles).some(([p, text]) => tree[p] !== text)) return false;
  if (g.onlyHeadFiles && (Object.keys(tree).length !== g.onlyHeadFiles.length || g.onlyHeadFiles.some(p => !Object.hasOwn(tree, p)))) return false;
  if (g.ignoredPatterns) { const lines = (tree['.gitignore'] ?? '').split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#')); if (g.ignoredPatterns.some(pattern => !lines.includes(pattern))) return false; }
  if (g.clean && (!equalTree(tree, s.index) || gitFrame(s).files.some(f => !f.ignored && (f.staged || f.modified || f.untracked || f.conflict)))) return false;
  if (s.conflicts.length || s.merging) return false;
  if (g.branches && Object.entries(g.branches).some(([b, v]) => s.branches[b] !== v)) return false;
  if (g.remoteRefs && Object.entries(g.remoteRefs).some(([b, v]) => s.remoteRefs[b] !== v)) return false;
  if (g.ancestors?.some(a => !isAncestor(s, a, id)) || g.notAncestors?.some(a => isAncestor(s, a, id))) return false;
  if (g.headCommitCount !== undefined && Object.keys(s.commits).filter(commitId => isAncestor(s, commitId, id)).length !== g.headCommitCount) return false;
  if (g.headParentCount !== undefined && s.commits[id]?.parents.length !== g.headParentCount || g.exactCommitCount !== undefined && Object.keys(s.commits).length !== g.exactCommitCount || g.stashCount !== undefined && s.stash.length !== g.stashCount) return false;
  if (g.forbiddenInHistory?.some(p => Object.values(s.commits).some(c => Object.hasOwn(c.tree, p)))) return false;
  if (g.tagAtHead && s.tags[g.tagAtHead]?.commit !== id) return false;
  if (g.remoteMatches) { const { remote, branch } = g.remoteMatches; if (!s.remotes[remote] || s.remotes[remote].branches[branch] !== s.branches[branch] || !s.remotes[remote].commits[s.branches[branch]]) return false; }
  if (g.remoteTag && s.remotes.origin?.tags[g.remoteTag]?.commit !== s.tags[g.remoteTag]?.commit) return false;
  if (g.visitedBranches && g.visitedBranches.some(b => !result.frames?.some(f => f.branch === b))) return false;
  return true;
}
export function checkOutput(id, input, output) {
  if (output?.state) return checkGitGoal(input, output);
  // Used only for conceptual JSON trace questions; command grading always calls gradeGitScript.
  const canonical = x => x && typeof x === 'object' ? Array.isArray(x) ? x.map(canonical) : Object.fromEntries(Object.keys(x).sort().map(k => [k, canonical(x[k])])) : x;
  return JSON.stringify(canonical(output)) === JSON.stringify(canonical(oracle(id, input)));
}
export function gradeGitScript(id, input, script) { const run = runGitScript(input.initial, script); return { ...run, passed: checkGitGoal(input, run), expected: oracle(id, input), notice: 'Checker kiểm tra repository ảo và lịch sử theo đặc tả; không so chuỗi lệnh với đáp án mẫu.' }; }
export function testsFor(id, seed, opts = {}) { const publicOnly = typeof opts === 'boolean' ? opts : !!opts.publicOnly; const samples = [0, 1].map(i => ({ name: 'Kho ảo mẫu ' + (i + 1), group: 'sample', input: generateInput(id, 'sample-' + i) })); return (publicOnly ? samples : [...samples, ...Array.from({ length: 8 }, (_, i) => ({ name: 'Biến thể nội dung ' + (i + 1), group: 'random', input: generateInput(id, String(seed) + ':' + i) }))]).map(t => ({ ...t, expected: oracle(id, t.input) })); }
export const edgeInputs = Object.fromEntries(problemIds.map(id => [id, [generateInput(id, 'empty-adjacent'), generateInput(id, 'same-size-history')]]));
export const problems = Object.fromEntries(defs.map(([key, title, statement, skill]) => { const id = 'git-' + key, sampleInput = generateInput(id, 0); return [id, { id, courseId: 'git', title, statement, description: statement, skill, version: VERSION, runtime: 'git-sim', languages: ['shell'], constraints: 'Mỗi dòng một lệnh trong allowlist, tối đa 120 dòng/64 KB (UTF-8), mỗi dòng tối đa 8 KB; đầu ra và lịch sử mô phỏng tối đa 2 MB. Chấm trạng thái file/index/refs/ancestry và điều kiện đề; ID commit ảo, không SHA thật. Tên file/nhánh cố định giữa test, nội dung ban đầu thay đổi theo seed. edit/delete là thao tác editor ảo, không phải lệnh Git thật.', sampleInput, sampleOutput: oracle(id, sampleInput), hints: ['Quan sát working tree, index và commit riêng biệt trước khi thao tác.', 'Theo dõi nhánh đang dùng và nơi cần áp dụng thay đổi. Đọc điều kiện ancestry/remote của đề.', 'Chia việc thành kiểm tra → thao tác → kiểm tra lại bằng status/log/diff. Giữ những file đề yêu cầu ngoài lịch sử.'], starters: { shell: '# Mô phỏng an toàn: mỗi dòng một thao tác.\n# edit FILE "TEXT" sửa file trong editor ảo.\ngit status\n' } }]; }));
export function problemDetails(id) { const p = problems[id]; if (!p) return null; return { ...p, language: 'shell', starter: p.starters.shell, contract: p.constraints, examples: testsFor(id, 0, true).map(t => ({ input: t.input, output: t.expected })) }; }
export const solutions = Object.fromEntries(problemIds.map(id => [id, referenceScripts[id]]));
export function solution(id) { return solutions[id]; }
export function traceQuestion(id, seed) {
 const input = generateInput(id, seed), rng = random(String(seed)+':trace'), all = referenceScripts[id].split('\n'), take = int(rng,0,all.length), commands = all.slice(0,take), result = runGitScript(input.initial,commands), frame = gitFrame(result.state);
 const answer = {branch:frame.branch,stagedFiles:frame.files.filter(f=>f.staged).length,commits:frame.nodes.length,conflicts:frame.conflicts.length};
 return {prompt:'Sau chuỗi thao tác trong kho ảo, trạng thái {branch, stagedFiles, commits, conflicts} là gì? stagedFiles đếm file có index khác HEAD; commits đếm mọi mốc còn lưu trong mô phỏng, kể cả mốc không còn ref trỏ tới.',input:{initial:input.initial,commands},answer,wrongAnswers:[{...answer,stagedFiles:answer.stagedFiles+1},{...answer,commits:answer.commits+1},{...answer,branch:answer.branch==='main'?'feature':'main'}],explanation:'Quan sát snapshot HEAD và index riêng biệt. Kết quả: '+JSON.stringify(answer)+'. Đồ thị giữ cả mốc chưa bị dọn để học phục hồi; log --all chỉ hiển thị mốc reachable từ refs. ID commit chỉ là minh họa, không SHA thật.'};
}
