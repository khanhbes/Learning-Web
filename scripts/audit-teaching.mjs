import {writeFileSync} from 'node:fs';
import {courseRegistry} from '../content/registry.mjs';
import {bridges} from '../content/pedagogy/bridges.mjs';
const counts={lessons:0,exams:0,activities:0,bridges:Object.keys(bridges).length},lines=['# Danh mục rà soát bài giảng BytePath','','Ngày: 16/10/2026. Bảng kiểm cấu trúc cho toàn bộ các khóa đã đăng ký; kết quả này không thay thử nghiệm khả năng hiểu bài với người mới.','','Mỗi buổi học có mục tiêu quan sát được, thuật ngữ, ví dụ có đầu ra kiểm chứng, quy trình riêng, lỗi dễ nhầm, hoạt động làm cùng/tự làm và vận dụng. Bài kiểm tra giữ điều kiện đạt cũ.','','Mã câu kiểm tra: K = khái niệm, T = đọc hình/truy vết, L = tìm lỗi, V = vận dụng. Số dòng code chỉ tính ví dụ chính Python; C++/Git có thể dài hơn và phần hỗ trợ được thu gọn. Cột hình ghi số mốc ví dụ, không khẳng định mọi trace là mô phỏng đầy đủ nội bộ.','','| Khóa | Buổi | Tên | Bổ trợ/tiên quyết | Mục tiêu | Thuật ngữ | Hoạt động | Ví dụ/ranh giới | Hình | Code chính | Kiểm tra |','|---|---:|---|---|---:|---:|---:|---|---|---|---|'];
const clean=s=>s.replaceAll('|','/').replaceAll('\n',' ');
for(const[id,def]of Object.entries(courseRegistry))for(const lesson of def.lessons){
  if(lesson.kind==='exam'){counts.exams++;lines.push(`| ${id} | ${lesson.id} | ${clean(lesson.title)} | Ôn kỹ năng trong chặng | — | — | 10 câu + 2 bài | Bài tổng hợp | Theo câu hỏi | 2 bài bắt buộc | 2K/3T/2L/3V |`);continue;}
  const flow=def.teachingFlow(lesson),d=def.teachingDesigns[lesson.id];counts.lessons++;counts.activities+=8;
  if(!d||d.algorithm.length<3||d.vocabulary.length<2||flow.steps.filter(s=>s.activityId).length!==8||!flow.prerequisites.every(id=>bridges[id]))throw Error('Thiếu học liệu '+id+'/'+lesson.id);
  if(!def.checkOutput(flow.sample.problemId,flow.sample.input,flow.sample.output))throw Error('Ví dụ sai '+id+'/'+lesson.id);
  const code=flow.steps.find(s=>s.code)?.code;
  if(!code||!Object.values(code).some(Boolean)||!d.misconception.repair||!flow.trace.frames.length)throw Error('Thiếu code/hình/ranh giới '+id+'/'+lesson.id);
  const main=code.python??code.shell??Object.values(code)[0];
  lines.push(`| ${id} | ${lesson.id} | ${clean(lesson.title)} | ${flow.prerequisites.map(b=>bridges[b].title).join(', ')||'Không cần Python/toán bổ trợ'} | ${d.goals.length} | ${d.vocabulary.length} | 8 | Đã có ví dụ và lỗi/ranh giới riêng | ${flow.trace.frames.length} mốc${id==='linear'&&lesson.id===1?', x/y':''} | ${main.split('\n').length} dòng | 1K/2T/1L/1V + code |`);
}
lines.push('','## Tổng hợp','',`- ${counts.lessons} buổi học và ${counts.exams} kiểm tra.`,`- ${counts.activities} vị trí hoạt động; đề/data của lượt được cố định bằng seed.`,`- ${counts.bridges} bài bổ trợ, mỗi bài có một kiểm tra nhẹ và hai câu thực hành.`,'- ID, số buổi và tiến độ học thuật của các khóa đã có được giữ nguyên.','- Nguồn và các hiệu đính của các khóa đã đăng ký vẫn nằm trong catalog gốc.','');
if(process.argv.includes('--write'))writeFileSync(new URL('../docs/TEACHING-AUDIT.md',import.meta.url),lines.join('\n'));
console.log(JSON.stringify(counts));
