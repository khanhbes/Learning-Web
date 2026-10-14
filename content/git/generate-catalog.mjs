import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { knowledgeInterviewRows } from './knowledge.mjs';
const directory = fileURLToPath(new URL('../../study documents/Git Github/', import.meta.url));
const pages = {
 '814498804': [1,'Git và GitHub, repository, commit, branch, khởi đầu',[1,2,3]],
 '814034494': [2,'Chuỗi work–stage–commit–remote; lệnh cơ bản, branching và cộng tác',[2,3,5,7,8,13,15,16,23]],
 '813923075': [3,'Index, .git, feature workflow, hoàn tác, .gitignore và GitHub',[2,3,5,8,11,17,20,21,29]],
 '813583093': [4,'Local/remote, trạng thái file, merge/rebase, conflict',[2,4,7,9,10,13,14,15,26]],
 '813672265': [5,'Remote, stash, tag, cherry-pick, viết lại lịch sử và aliases',[13,14,15,16,19,20,22,25,26]],
 '814971288': [6,'Hoàn tác, workflow cộng tác, PR, CI và sai lầm thường gặp',[11,17,19,20,21,23,29,30]],
 '814584732': [7,'Branching, .git, reflog, merge/rebase và mẹo phỏng vấn',[7,8,9,17,20,23,26,27]],
 '799972477': [8,'Lệnh nâng cao, gitignore, workflow, tính năng GitHub và commit message',[4,5,17,23,25,27,28,29,30]],
 '814585089': [9,'Ba vùng, trạng thái file, hoàn tác, PR, hooks và config',[2,3,4,11,17,20,21,29]],
 '814428256': [10,'Reset/revert/restore, bảo mật, PR, branch naming và Actions',[5,11,17,20,21,23,24,29,30]],
};
const rows = readdirSync(directory).filter(file => /\.jpg$/i.test(file)).map(file => {
 const prefix = file.split('_')[0], [page,topic,lessonIds] = pages[prefix] ?? [];
 if (!page) throw new Error('Ảnh chưa được đọc/ánh xạ: '+file);
 return { id:'GIT-'+prefix,prefix,file,sha256:createHash('sha256').update(readFileSync(join(directory,file))).digest('hex'),sourceDirectory:'Git Github',collection:'Git & GitHub — Cẩm nang toàn diện (Quick2Knowledge)',pack:'git-handbook',page,topic,lessonIds,review:'Ôn sơ đồ và lệnh trong buổi '+lessonIds.join(', '),interviewIds:knowledgeInterviewRows.filter(r=>r[8]===prefix).map(r=>r[0]),url:'/sources/git/'+encodeURIComponent(file),note:'Đã đọc trực tiếp toàn trang; nội dung lặp được gom thành bài. Lệnh/nhận định giản lược được hiệu đính theo tài liệu chính thức.' };
}).sort((a,b)=>a.page-b.page);
if(rows.length!==10 || new Set(rows.map(x=>x.sha256)).size!==10)throw new Error('Catalog cần đúng 10 ảnh riêng biệt.');
writeFileSync(new URL('./sources.json',import.meta.url),JSON.stringify(rows,null,2)+'\n');
console.log(JSON.stringify({course:'git',images:rows.length,pages:rows.map(x=>x.page)}));
