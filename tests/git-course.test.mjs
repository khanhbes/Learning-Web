import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import * as git from '../content/git/index.mjs';
import { validateContent } from '../content/schema.mjs';
import { headId, headTree, isAncestor, GIT_SIM_LIMITS } from '../shared/git-simulator.mjs';
const sorted = o => Object.fromEntries(Object.entries(o).sort(([a],[b])=>a.localeCompare(b)));

test('Git: all ten source pages are read, hashed and mapped; 24+6 lessons and four exams',()=>{
 const files=readdirSync(new URL('../study documents/Git Github/',import.meta.url)).filter(f=>/\.jpg$/i.test(f));
 assert.equal(files.length,10);assert.equal(git.sourceCatalog.length,10);assert.deepEqual(git.sourceCatalog.map(s=>s.page),[1,2,3,4,5,6,7,8,9,10]);
 for(const s of git.sourceCatalog){assert(files.includes(s.file));assert.equal(createHash('sha256').update(readFileSync(new URL('../study documents/Git Github/'+s.file,import.meta.url))).digest('hex'),s.sha256);assert(s.lessonIds.length);assert(s.topic.length>10);}
 assert.deepEqual(validateContent({course:git.course,lessons:git.lessons,problems:git.problems,sources:git.sourceCatalog}),{lessons:30,problems:26,sources:10});
 assert.deepEqual(git.lessons.filter(l=>l.kind==='exam').map(l=>l.id),[6,12,18,24]);
 assert.equal(git.lessons.filter(l=>l.kind==='lesson').length,20);assert.equal(git.lessons.filter(l=>l.kind==='advanced').length,6);
 assert.equal(git.knowledgeTipRows.length,12);assert.equal(git.knowledgeInterviewRows.length,20);assert(git.corrections.length>=9);
 for(const l of git.lessons){assert.equal(l.activityCount,8);assert(l.blocks.length>=7);assert(l.visualization.initial);assert(l.visualization.commands.length);assert(l.blocks.some(b=>b.label.includes('Bổ sung')));}
});

test('Git: 200 seeds per each of 26 templates; semantic goals accept refs and reject wrong operations',()=>{
 for(const id of git.problemIds){const versions=new Set();for(let seed=0;seed<200;seed++){
  const input=git.generateInput(id,seed),original=structuredClone(input),grade=git.gradeGitScript(id,input,git.referenceScripts[id]);
  assert.equal(grade.passed,true,id+' seed '+seed+' '+JSON.stringify(grade.errors));assert.deepEqual(input,original,'never mutates frozen attempt fixture');
  assert.equal(git.gradeGitScript(id,input,'git status').passed,false,id+' no-op cannot solve this template');
  assert.equal(git.gradeGitScript(id,input,git.referenceScripts[id]+'\nedit README.md "wrong-final"\ngit add README.md\ngit commit -m "Wrong"').passed,false,id+' wrong state/history');
  assert(git.checkOutput(id,input,git.oracle(id,input)));assert(!git.checkOutput(id,input,{...git.oracle(id,input),branch:'wrong'}));versions.add(input.initial.working['README.md']);
 }assert(versions.size>180,id+' seed really changes content');}
});

test('Git: equivalent valid command sequences and commit messages, graph invariants independently checked',()=>{
 const input=git.generateInput('git-feature','alternatives');
 const one=git.gradeGitScript('git-feature',input,'git branch feature\ngit checkout feature\nedit feature.txt "feature-ready"\ngit diff\ngit add feature.txt\ngit diff --staged\ngit commit -m "A different valid message"\ngit log --oneline --graph --all');assert(one.passed);
 const two=git.gradeGitScript('git-feature',input,'git checkout -b feature\nedit feature.txt "feature-ready"\ngit add .\ngit commit -m "Create tiny feature"');assert(two.passed);
 const amended=git.gradeGitScript('git-feature',input,git.referenceScripts['git-feature']+'\ngit commit --amend -m "Improve the feature message"');assert(amended.passed,'unreachable replaced commit must not invalidate an equivalent required history');
 assert.equal(one.state.branches.main,'c0');assert.equal(headTree(one.state)['feature.txt'],'feature-ready');assert.equal(one.state.commits[headId(one.state)].parents[0],'c0');
 const merged=git.gradeGitScript('git-merge',git.generateInput('git-merge',2),'git status\ngit merge --no-ff feature\ngit log --graph --all');assert(merged.passed);
 const tip=merged.state.commits[headId(merged.state)];assert.deepEqual(new Set(tip.parents),new Set(['c1','c2']));assert(isAncestor(merged.state,'c0',tip.id));
 const picked=git.gradeGitScript('git-cherry-pick',git.generateInput('git-cherry-pick',2),'git cherry-pick hotfix');assert(picked.passed);assert(!isAncestor(picked.state,'c1',headId(picked.state)));
 const ignore=git.generateInput('git-ignore','pattern-order');
 assert(git.gradeGitScript('git-ignore',ignore,'edit .gitignore "# Local files\\n*.log\\n.env\\n"\ngit add .\ngit commit -m "Keep local configuration private"').passed,'pattern order/comments/trailing newline are equivalent');
 assert(!git.gradeGitScript('git-ignore',ignore,'edit .gitignore ".env\\n"\ngit add .gitignore\ngit commit -m "Missing log rule"').passed);
});

test('Git: staging snapshots, restore and reset modes checked without trusting goal oracle',()=>{
 const initial=git.createGitState({files:{'README.md':'A'}}),run=git.runGitScript(initial,'edit README.md "B"\ngit add README.md\nedit README.md "C"\ngit commit -m "Stage snapshot"');
 assert(run.ok);assert.equal(headTree(run.state)['README.md'],'B');assert.equal(run.state.index['README.md'],'B');assert.equal(run.state.working['README.md'],'C');
 const restore=git.runGitCommand(run.state,'git restore README.md');assert.equal(restore.state.working['README.md'],'B');
 const input=git.generateInput('git-reset-soft','modes'),before=input.initial.working['README.md'];
 const soft=git.runGitCommand(input.initial,'git reset --soft HEAD~1').state,mixed=git.runGitCommand(input.initial,'git reset --mixed HEAD~1').state;
 assert.equal(soft.branches.main,'c0');assert.equal(soft.index['README.md'],before);assert.equal(soft.working['README.md'],before);
 assert.equal(mixed.branches.main,'c0');assert.equal(mixed.index['README.md'],input.initial.commits.c0.tree['README.md']);assert.equal(mixed.working['README.md'],before);
 const hard=git.runGitScript(input.initial,'edit notes.txt "untracked"\ngit reset --hard HEAD~1').state;assert.equal(hard.working['notes.txt'],'untracked');assert.equal(hard.working['README.md'],input.initial.commits.c0.tree['README.md']);
 const unstage=git.runGitScript(initial,'edit new.txt "X"\ngit add new.txt\ngit restore --staged new.txt').state;assert(!Object.hasOwn(unstage.index,'new.txt'));assert.equal(unstage.working['new.txt'],'X');
});

test('Git: exhaustive 27 small snapshot states distinguish add, commit and restore sources',()=>{
 for(const head of ['', 'A', 'B'])for(const index of ['', 'A', 'B'])for(const working of ['', 'A', 'B']){
  const state=git.createGitState({files:{'README.md':head}});state.index['README.md']=index;state.working['README.md']=working;
  const committed=git.runGitCommand(state,'git commit -m "Save index"');assert.equal(committed.ok,index!==head);if(committed.ok){assert.equal(headTree(committed.state)['README.md'],index);assert.equal(committed.state.working['README.md'],working);}
  const restored=git.runGitCommand(state,'git restore README.md');assert(restored.ok);assert.equal(restored.state.working['README.md'],index);assert.equal(headTree(restored.state)['README.md'],head);
  const unstaged=git.runGitCommand(state,'git restore --staged README.md');assert(unstaged.ok);assert.equal(unstaged.state.index['README.md'],head);assert.equal(unstaged.state.working['README.md'],working);
  const staged=git.runGitCommand(state,'git add README.md');assert(staged.ok);assert.equal(staged.state.index['README.md'],working);assert.equal(headTree(staged.state)['README.md'],head);
  assert.equal(state.index['README.md'],index);assert.equal(state.working['README.md'],working);
 }
});

test('Git: conflict stop/resolve/abort; content-only fake merge rejected',()=>{
 const input=git.generateInput('git-conflict',5),start=git.runGitCommand(input.initial,'git merge feature');assert(start.ok);assert.deepEqual(start.state.conflicts,['README.md']);assert(start.state.working['README.md'].includes('<<<<<<< HEAD'));
 const invalid=git.runGitCommand(start.state,'git add README.md');assert(!invalid.ok);assert.deepEqual(invalid.state,start.state);
 const aborted=git.runGitCommand(start.state,'git merge --abort');assert(aborted.ok);assert.deepEqual(sorted(aborted.state.working),sorted(input.initial.working));assert.deepEqual(aborted.state.conflicts,[]);assert.equal(aborted.state.branches.main,'c1');
 const valid=git.gradeGitScript('git-conflict',input,'git merge feature\nedit README.md "resolved"\ngit add README.md\ngit commit -m "Keep both histories"');assert(valid.passed);
 assert(!git.gradeGitScript('git-conflict',input,'edit README.md "resolved"\ngit add README.md\ngit commit -m "Skipped merge"').passed);
});

test('Git: remote fetch/pull/push are pure virtual operations and non-fast-forward denied',()=>{
 const input=git.generateInput('git-fetch',1),fetched=git.runGitCommand(input.initial,'git fetch origin');assert(fetched.ok);assert.deepEqual(fetched.state.working,input.initial.working);assert.equal(fetched.state.branches.main,'c0');assert.equal(fetched.state.remoteRefs['origin/main'],'r1');
 const div=git.generateInput('git-collaborate',2),blocked=git.runGitCommand(div.initial,'git push origin main');assert(!blocked.ok);assert.match(blocked.error,/non-fast-forward/);assert.deepEqual(blocked.state,div.initial);
 const pulled=git.runGitCommand(div.initial,'git pull --ff-only origin main');assert(!pulled.ok);assert.deepEqual(pulled.state,div.initial,'model deliberately rolls back whole failed command');
 const r=git.gradeGitScript('git-collaborate',div,git.referenceScripts['git-collaborate']);assert(r.passed);assert.equal(r.state.remotes.origin.branches.main,r.state.branches.main);
 const prune=structuredClone(input.initial);prune.remoteRefs['origin/deleted']='c0';assert.equal(git.runGitCommand(prune,'git fetch --prune origin').state.remoteRefs['origin/deleted'],undefined);
});

test('Git: 120 dangerous/unsupported commands are rejected atomically without shell or filesystem access',()=>{
 const state=git.createGitState(),commands=['rm -rf /','curl https://example.com','git add .; curl x','git status && git log','git status | powershell','git add $(Get-Content .env)','git commit -m `whoami`','git push --force origin main','git add ../../.env','edit C:/Users/khanh/.env "x"','edit .git/config "x"','edit __proto__ "x"','git branch __proto__','git rebase -i HEAD~1','git clean -f','git config --global core.editor x','git prune','git clone https://github.com/x/y','git remote add origin https://github.com/x/y','git status --bogus'];
 for(let i=0;i<120;i++){const line=commands[i%commands.length],r=git.runGitCommand(state,line);assert(!r.ok,line);assert.deepEqual(r.state,state,line+' must not mutate');assert(r.error.length);}
 assert(!git.runGitScript(state,Array(121).fill('git status')).ok);assert(!git.runGitScript(state,['git status\ngit log']).ok);
 assert.equal(git.runGitScript(state,'# comment\ngit status').steps.length,1);
});

test('Git: ignored files, stash tracked/untracked, rebase IDs and tag semantics',()=>{
 const s=git.createGitState({files:{'README.md':'A','.gitignore':'.env\n*.log'}}),ignored=git.runGitScript(s,'edit .env "DEMO_ONLY"\nedit debug.log "demo"\ngit add .\ngit status');assert(ignored.ok);assert(!Object.hasOwn(ignored.state.index,'.env'));assert(!ignored.steps.at(-1).output.includes('.env'));
 const tracked=git.createGitState({files:{'README.md':'A','.env':'already-tracked','.gitignore':'.env'}});assert(git.runGitScript(tracked,'edit .env "changed"\ngit add .').state.index['.env']==='changed');
 const stash=git.runGitScript(s,'edit README.md "B"\nedit notes.txt "private"\ngit stash');assert(stash.ok);assert.equal(stash.state.working['notes.txt'],'private');assert.equal(stash.state.working['README.md'],'A');
 const popped=git.runGitCommand(git.runGitCommand(stash.state,'delete notes.txt').state,'git stash pop');assert(popped.ok);assert.equal(popped.state.working['README.md'],'B');assert.equal(popped.state.index['README.md'],'A');assert.equal(popped.state.stash.length,0);
 const rebased=git.gradeGitScript('git-rebase',git.generateInput('git-rebase',8),'git rebase main');assert(rebased.passed);assert.equal(rebased.state.branches.feature,'c3');assert.deepEqual(rebased.state.commits.c3.parents,['c2']);assert(rebased.state.commits.c1);
 assert(git.gradeGitScript('git-tag',git.generateInput('git-tag',4),'git tag -a v1.0.0 -m "Release note"').passed);
});

test('Git: status reports added/deleted/index vs working accurately; ignored files survive stash and checkout',()=>{
 const initial=git.createGitState({files:{'README.md':'A','old.txt':'remove-me','.gitignore':'.env\n*.log'}});
 const run=git.runGitScript(initial,'edit README.md "B"\nedit new.txt "N"\ngit add new.txt\ndelete old.txt\ngit add old.txt\nedit .env "DEMO_ONLY"\nedit private.log "local"\ngit status --short');
 assert(run.ok);assert.equal(run.steps.at(-1).output,' M README.md\nA  new.txt\nD  old.txt');
 const untracked=git.createGitState({files:{'README.md':'A','.gitignore':'.env'}});
 const stashed=git.runGitScript(untracked,'edit README.md "B"\nedit notes.txt "N"\nedit .env "DEMO_ONLY"\ngit stash -u\ngit switch -c feature\ngit switch main\ngit stash pop');
 assert(stashed.ok,JSON.stringify(stashed.errors));assert.equal(stashed.state.working['README.md'],'B');assert.equal(stashed.state.working['notes.txt'],'N');assert.equal(stashed.state.working['.env'],'DEMO_ONLY');assert.equal(stashed.state.index['README.md'],'A');assert(!Object.hasOwn(stashed.state.index,'notes.txt'));assert.equal(stashed.state.stash.length,0);
 const snapshot=git.runGitScript(untracked,'edit .env "DEMO_ONLY"\nedit notes.txt "N"\ngit stash push -u');
 assert(snapshot.ok);assert(!Object.hasOwn(snapshot.state.stash[0].working,'.env'));assert.equal(snapshot.state.working['.env'],'DEMO_ONLY');assert.equal(snapshot.state.working['notes.txt'],undefined);
});

test('Git: first-parent depth and second merge parent differ; already-based rebase keeps IDs',()=>{
 const input=git.generateInput('git-merge','parent-order'),merged=git.runGitCommand(input.initial,'git merge feature');assert(merged.ok);
 const first=git.runGitCommand(merged.state,'git branch first HEAD^1'),second=git.runGitCommand(first.state,'git branch second HEAD^2'),depth=git.runGitCommand(second.state,'git branch older HEAD~2');
 assert(first.ok&&second.ok&&depth.ok);assert.equal(depth.state.branches.first,'c1');assert.equal(depth.state.branches.second,'c2');assert.equal(depth.state.branches.older,'c0');assert(!git.runGitCommand(depth.state,'git branch missing HEAD^3').ok);
 const feature=git.gradeGitScript('git-feature',git.generateInput('git-feature','same-base'),git.referenceScripts['git-feature']);assert(feature.passed);
 const already=git.runGitCommand(feature.state,'git rebase main');assert(already.ok);assert.equal(headId(already.state),headId(feature.state));assert.deepEqual(already.state.commits,feature.state.commits);
 const based=git.gradeGitScript('git-rebase',git.generateInput('git-rebase','new-base'),git.referenceScripts['git-rebase']);assert(based.passed);assert(based.state.reflog.includes('c1'),'original feature tip is still visible in this fixture reflog');
 const log=git.runGitCommand(based.state,'git log --all --oneline');assert(log.ok);assert(!log.output.split('\n').some(line=>line.startsWith('c1 ')),'unreachable predecessor is retained for recovery but is not a log --all ref');assert(log.output.includes('c3 '));
});

test('Git: UTF-8 input and 2MB aggregate output bounds return a result and stop before overflow command',()=>{
 const initial=git.createGitState(),lines=[...Array.from({length:7},(_,i)=>'edit f'+i+'.txt "'+String(i).repeat(6000)+'"'),...Array.from({length:105},(_,i)=>'edit counter.txt "'+i+'"')];
 assert(Buffer.byteLength(lines.join('\n'))<GIT_SIM_LIMITS.scriptBytes);
 const limited=git.runGitScript(initial,lines);assert.equal(limited.ok,false);assert.match(limited.errors[0].error,/2 MB/);assert(Buffer.byteLength(JSON.stringify(limited))<=GIT_SIM_LIMITS.outputBytes);assert.equal(limited.frames.length,limited.steps.length+1);
 const blocked=limited.errors[0].line;assert.equal(limited.state.working['counter.txt'],String(blocked-9));assert.notEqual(limited.state.working['counter.txt'],String(blocked-8));assert.deepEqual(initial,git.createGitState(),'input repository remains untouched');
 assert(!git.runGitCommand(initial,'edit README.md "'+'💎'.repeat(2100)+'"').ok);
 const oversized=git.runGitScript(initial,Array(20).fill('# '+'💎'.repeat(1000)));assert(!oversized.ok);assert.equal(oversized.errors[0].line,0);assert.deepEqual(oversized.state,initial);
});

test('Git: 200 seeds for every lesson lab and trace, no answer leakage in public lab',()=>{
 for(const lesson of git.lessons)for(let seed=0;seed<200;seed++){
  const lab=git.createLab(lesson,seed),pub=git.publicLab(lab);assert.equal(lab.questions.length,8);
  for(const q of lab.questions){assert(git.checkLab(q,q.answer),lesson.id+' '+q.id);assert(!git.checkLab(q,{bad:true}));}
  assert(pub.questions.every(q=>!Object.hasOwn(q,'answer')&&!Object.hasOwn(q,'explanation')));
  const q=git.traceQuestion(lesson.problemIds[0],seed);assert(!Object.hasOwn(q.input,'goal'));assert(!Object.hasOwn(q.input,'answer'));
  const result=git.runGitScript(q.input.initial,q.input.commands),f=git.gitFrame(result.state);assert.deepEqual(q.answer,{branch:f.branch,stagedFiles:f.files.filter(x=>x.index!==x.committed).length,commits:Object.keys(result.state.commits).length,conflicts:result.state.conflicts.length});assert(q.wrongAnswers.every(x=>JSON.stringify(x)!==JSON.stringify(q.answer)));
 }
});

test('Git: capstone boundaries, three gates and custom tests reject arbitrary repo injection',()=>{
 const a=git.createCapstone();a.codesPassed=[...git.capstoneProblems];for(const q of a.questions)a.answers[q.id]=q.answerId;for(const f of git.essayFields)a.essay[f.id]='Phân tích có đủ phần.';
 const full=git.gradeCapstone(a);assert.equal(full.score,90);assert(full.passed);a.codesPassed.pop();assert(!git.gradeCapstone(a).passed);a.codesPassed=[...git.capstoneProblems];a.essay.problem=' ';assert(!git.gradeCapstone(a).passed);a.essay.problem='Đầy đủ';
 // Three correct trace questions (15), one concept (5), all workflows (60) => exactly 80.
 a.answers=Object.fromEntries([a.questions[0],...a.questions.slice(2,5)].map(q=>[q.id,q.answerId]));assert.equal(git.gradeCapstone(a).score,80);assert(git.gradeCapstone(a).passed);delete a.answers[a.questions[4].id];assert.equal(git.gradeCapstone(a).score,75);assert(!git.gradeCapstone(a).passed);
 const tests=git.capstoneProblems.map(problemId=>({problemId,input:{seed:'boundary'},expected:git.oracle(problemId,git.generateInput(problemId,'boundary'))}));const grade=git.customTestScore(tests);assert.equal(grade.score,10);assert.equal(grade.valid,3);assert.equal(grade.killed.length,6);
 assert(!git.validCustomInput('git-feature',{seed:'x',initial:{remotes:{host:'secret'}}}));assert.equal(git.customTestScore([{...tests[0],expected:{branch:'wrong'}}]).valid,0);
});
