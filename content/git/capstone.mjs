import { randomUUID } from 'node:crypto';
import { random, shuffle } from '../../shared/random.mjs';
import { generateInput, gradeGitScript, checkOutput, oracle, traceQuestion, VERSION } from './problems.mjs';
export const capstoneProblems=['git-feature','git-conflict','git-collaborate'];
export const essayFields=[
 {id:'problem',title:'1. Dự án và mục tiêu workflow',placeholder:'Mô tả dự án giả lập, thay đổi cần làm và ai đang làm việc trên nhánh nào.'},
 {id:'approach',title:'2. Các bước và lựa chọn',placeholder:'Giải thích working tree/index/commit, base của feature, cách merge và tích hợp remote ảo.'},
 {id:'edges',title:'3. Trường hợp biên và an toàn',placeholder:'Phân biệt conflict, non-fast-forward, file chưa track và secret; nêu phần Git thật chưa được mô phỏng.'},
 {id:'validation',title:'4. Kiểm tra bằng trạng thái và đồ thị',placeholder:'Trình bày status/diff, nội dung file, ancestry và refs trước/sau; tạo test tìm thao tác sai.'},
 {id:'reflection',title:'5. Tự đánh giá và review',placeholder:'Viết một mô tả PR ngắn có vấn đề, thay đổi, bằng chứng kiểm tra và giới hạn chưa kiểm chứng.'},
];
const choice=(id,prompt,correct,wrong,rng,skill,input)=>({id,kind:'choice',skill,prompt,input,options:shuffle([correct,...wrong].map((text,i)=>({id:id+'-o'+i,text})),rng),answerId:id+'-o0',explanation:correct});
export function capstoneQuestions(seed){const rng=random(seed+':git-capstone');return [
 choice('git-cap-c0','Sau add rồi sửa tiếp file, commit đọc vùng nào?','Snapshot trong index',['Mọi file working tree','Remote tự chọn nội dung'],rng,'index'),
 choice('git-cap-c1','Remote và local đã phân kỳ, thao tác phù hợp trước push bình thường?','Fetch, kiểm tra và tích hợp thay đổi',['Force push mặc định','Xóa remote-tracking ref'],rng,'collaboration'),
 ...['git-stage','git-conflict','git-fetch','git-revert'].map((pid,i)=>{const q=traceQuestion(pid,seed+':cap-trace:'+i);return {...choice('git-cap-t'+i,q.prompt,JSON.stringify(q.answer),q.wrongAnswers.slice(0,2).map(JSON.stringify),rng,pid,q.input),explanation:q.explanation};}),
];}
export function createCapstone(now=Date.now()){const id=randomUUID(),seed=randomUUID();return {id,courseId:'git',lessonId:24,mode:'capstone',status:'active',seed,version:VERSION,createdAt:now,updatedAt:now,questions:capstoneQuestions(seed),requiredProblems:capstoneProblems,answers:{},codesPassed:[],submissions:[],drafts:{shell:''},codeDrafts:{},jobIds:[],result:null,tasks:Object.fromEntries(capstoneProblems.map(p=>[p,generateInput(p,seed+':'+p)])),dataset:{name:'Repository nhóm giả lập',notice:'Ba kho ảo độc lập: feature riêng, conflict và cộng tác remote. Không truy cập kho ứng dụng/GitHub thật, không nhập token hoặc key.',workflows:['Tạo feature và giữ main','Merge và giải quyết xung đột','Tích hợp cập nhật remote rồi chia sẻ']},essay:Object.fromEntries(essayFields.map(f=>[f.id,''])),customTests:[],feedback:null,lab:null};}
// Learner custom tests choose a reproducible scenario seed, then predict its goal.
// Arbitrary repository object injection is rejected; the backend reconstructs the fixture.
export function validCustomInput(id,input){return capstoneProblems.includes(id)&&input&&typeof input==='object'&&!Array.isArray(input)&&typeof input.seed==='string'&&input.seed.length>0&&input.seed.length<=100&&Object.keys(input).every(k=>k==='seed');}
export function customTestScore(tests=[]){const killed=new Set(),errors=[];let valid=0;const mutants={
 'git-feature':['git switch -c feature\nedit feature.txt "feature-ready"\ngit commit -m "Forgot add"','edit feature.txt "feature-ready"\ngit add feature.txt\ngit commit -m "Wrong branch"'],
 'git-conflict':['git merge feature\nedit README.md "resolved"\ngit commit -m "Forgot add"','edit README.md "resolved"\ngit add README.md\ngit commit -m "Content only"'],
 'git-collaborate':['git fetch origin\ngit push origin main','git fetch origin'],
};
 tests.slice(0,30).forEach((t,i)=>{if(!validCustomInput(t.problemId,t.input)){errors.push('Test '+(i+1)+': dùng input {"seed":"tên-test"} cho một workflow bắt buộc.');return;}const fixture=generateInput(t.problemId,t.input.seed);if(!checkOutput(t.problemId,fixture,t.expected)){errors.push('Test '+(i+1)+': trạng thái mục tiêu dự đoán chưa đúng.');return;}valid++;mutants[t.problemId].forEach((script,j)=>{if(!gradeGitScript(t.problemId,fixture,script).passed)killed.add(t.problemId+':'+j);});});
 return {score:Math.min(10,killed.size*10/6),valid,killed:[...killed],errors};
}
export function gradeCapstone(a){const code=capstoneProblems.filter(p=>(a.codesPassed??[]).includes(p)).length*20,questions=a.questions??[],answers=a.answers??{},concept=questions.slice(0,2).filter(q=>answers[q.id]===q.answerId).length*5,trace=questions.slice(2).filter(q=>answers[q.id]===q.answerId).length*5,tests=customTestScore(a.customTests??[]),essayComplete=essayFields.every(f=>a.essay?.[f.id]?.trim()),score=code+concept+trace+tests.score;return {score,code,trace,concept,tests,essayComplete:!!essayComplete,passed:score>=80&&code===60&&!!essayComplete,details:questions.map(q=>({id:q.id,correct:answers[q.id]===q.answerId,answerId:q.answerId,explanation:q.explanation})),note:'Điểm xác nhận thao tác trên mô hình Git, truy vết và test theo đặc tả. Bài luận nhận góp ý; AI không quyết định điểm chính thức.'};}
export const capstoneDescription={title:'Cộng tác xây một dự án nhỏ',dataset:'Ba repository ảo độc lập với dữ liệu được cố định theo seed.',problemIds:capstoneProblems,rubric:[{label:'Ba workflow Git',points:60},{label:'Đọc và truy vết trạng thái',points:20},{label:'Điều kiện áp dụng',points:10},{label:'Test phát hiện lỗi mẫu',points:10}],requiredAlgorithm:'Feature riêng giữ main; merge conflict có hai parent; tích hợp lịch sử remote trước push. Terminal chỉ dùng Git allowlist.',customTestContract:'Mỗi custom test: {problemId,input:{seed:"ten-test"},expected:<mục tiêu dự đoán>}. Backend dựng kho theo seed; không nhận đối tượng repository tùy ý.'};
